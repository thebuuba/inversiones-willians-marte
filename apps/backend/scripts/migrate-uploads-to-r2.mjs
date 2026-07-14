import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseArguments(argv) {
  const valueAfter = (flag) => {
    const index = argv.indexOf(flag);
    return index === -1 ? undefined : argv[index + 1];
  };

  const bucket = valueAfter('--bucket');
  if (!bucket) throw new Error('Falta --bucket <nombre-del-bucket>');
  const keyPrefix = (valueAfter('--key-prefix') ?? '').replace(/^\/+|\/+$/g, '');
  const filenamePrefix = valueAfter('--filename-prefix') ?? '';
  const filenameSuffix = valueAfter('--filename-suffix') ?? '';
  const contentTypeOverride = valueAfter('--content-type');

  const excludedKeys = new Set(
    argv.flatMap((argument, index) =>
      argument === '--exclude' && argv[index + 1] ? [argv[index + 1]] : [],
    ),
  );

  return {
    bucket,
    sourceDirectory: resolve(valueAfter('--source-dir') ?? 'uploads'),
    execute: argv.includes('--execute'),
    overwrite: argv.includes('--overwrite'),
    excludedKeys,
    keyPrefix,
    filenamePrefix,
    filenameSuffix,
    contentTypeOverride,
  };
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const pathname = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(pathname)));
    else if (entry.isFile()) files.push(pathname);
    else if (entry.isSymbolicLink()) {
      throw new Error(`No se migran enlaces simbolicos: ${pathname}`);
    }
  }

  return files.sort();
}

function contentType(pathname) {
  const types = new Map([
    ['.gif', 'image/gif'],
    ['.heic', 'image/heic'],
    ['.jpeg', 'image/jpeg'],
    ['.jpg', 'image/jpeg'],
    ['.pdf', 'application/pdf'],
    ['.png', 'image/png'],
    ['.webp', 'image/webp'],
  ]);
  return types.get(extname(pathname).toLowerCase()) ?? 'application/octet-stream';
}

async function sha256(pathname) {
  return createHash('sha256')
    .update(await readFile(pathname))
    .digest('hex');
}

async function runWrangler(args, allowFailure = false) {
  try {
    return await execFileAsync('wrangler', args, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    if (allowFailure) return undefined;
    const details = error?.stderr || error?.stdout || error?.message;
    throw new Error(`Wrangler fallo: ${String(details).trim()}`);
  }
}

async function download(bucket, key, destination) {
  const result = await runWrangler(
    ['r2', 'object', 'get', `${bucket}/${key}`, '--file', destination, '--remote'],
    true,
  );
  return Boolean(result);
}

async function downloadEventually(bucket, key, destination) {
  for (const delayMs of [250, 500, 1_000, 2_000, 4_000]) {
    await rm(destination, { force: true });
    if (await download(bucket, key, destination)) return true;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, delayMs));
  }
  return false;
}

async function migrateFile({
  bucket,
  file,
  key,
  sha256: sourceHash,
  overwrite,
  temporaryFile,
  contentTypeOverride,
}) {
  const exists = await download(bucket, key, temporaryFile);
  if (exists) {
    const remoteHash = await sha256(temporaryFile);
    if (remoteHash === sourceHash) return 'skipped';
    if (!overwrite) {
      throw new Error(
        `Conflicto en ${key}: R2 contiene datos distintos. Revisa el objeto o usa --overwrite.`,
      );
    }
  }

  await runWrangler([
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--file',
    file,
    '--content-type',
    contentTypeOverride ?? contentType(file),
    '--remote',
  ]);
  await rm(temporaryFile, { force: true });
  if (!(await downloadEventually(bucket, key, temporaryFile))) {
    throw new Error(`R2 no devolvio ${key} despues de cargarlo`);
  }
  const remoteHash = await sha256(temporaryFile);
  if (remoteHash !== sourceHash) throw new Error(`Checksum SHA-256 distinto para ${key}`);
  return 'uploaded';
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const sourceStats = await lstat(options.sourceDirectory);
  if (!sourceStats.isDirectory()) {
    throw new Error(`La fuente no es un directorio: ${options.sourceDirectory}`);
  }

  const files = (await listFiles(options.sourceDirectory)).filter((file) => {
    const key = relative(options.sourceDirectory, file).split(sep).join('/');
    return !options.excludedKeys.has(key);
  });
  const manifest = await Promise.all(
    files.map(async (file) => {
      const sourceKey = relative(options.sourceDirectory, file).split(sep).join('/');
      return {
        file,
        key: [options.keyPrefix, `${options.filenamePrefix}${sourceKey}${options.filenameSuffix}`]
          .filter(Boolean)
          .join('/'),
        sha256: await sha256(file),
      };
    }),
  );

  console.log(
    JSON.stringify(
      {
        mode: options.execute ? 'execute' : 'dry-run',
        bucket: options.bucket,
        sourceDirectory: options.sourceDirectory,
        objects: manifest.map(({ key, sha256: checksum }) => ({ key, sha256: checksum })),
      },
      null,
      2,
    ),
  );

  if (!options.execute) {
    console.log('Simulacion terminada. Agrega --execute para cargar y verificar los objetos.');
    return;
  }

  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'inversiones-r2-migration-'));
  let uploaded = 0;
  let skipped = 0;
  try {
    for (const [index, item] of manifest.entries()) {
      const result = await migrateFile({
        ...options,
        ...item,
        temporaryFile: join(temporaryDirectory, String(index)),
      });
      if (result === 'uploaded') uploaded += 1;
      else skipped += 1;
      console.log(`${result === 'uploaded' ? 'CARGADO' : 'SIN CAMBIOS'} ${item.key}`);
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }

  console.log(`Migracion verificada: ${uploaded} cargados, ${skipped} ya identicos.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
