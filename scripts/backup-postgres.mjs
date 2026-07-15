import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

let databaseUrl;
try {
  databaseUrl = new URL(connectionString);
} catch {
  console.error('DATABASE_URL must be a valid PostgreSQL connection URL');
  process.exit(1);
}

if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
  console.error('DATABASE_URL must use the postgres or postgresql protocol');
  process.exit(1);
}

const backupDir = resolve(
  process.env.BACKUP_DIR ?? join(homedir(), '.inversiones-willians-marte', 'backups'),
);
const timestamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const destination = join(backupDir, `inversiones-${timestamp}.dump`);
const temporary = `${destination}.tmp`;

process.umask(0o077);
mkdirSync(backupDir, { recursive: true });

const postgresEnvironment = { ...process.env };
delete postgresEnvironment.DATABASE_URL;
Object.assign(postgresEnvironment, {
  PGHOST: databaseUrl.hostname,
  PGPORT: databaseUrl.port || '5432',
  PGDATABASE: databaseUrl.pathname.replace(/^\//, ''),
  PGUSER: decodeURIComponent(databaseUrl.username),
  PGPASSWORD: decodeURIComponent(databaseUrl.password),
  PGSSLMODE: databaseUrl.searchParams.get('sslmode') ?? 'require',
});

function resolvePostgresTool(name, override) {
  if (override) return override;
  const candidates = [
    `/usr/local/opt/postgresql@17/bin/${name}`,
    `/opt/homebrew/opt/postgresql@17/bin/${name}`,
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? name;
}

const pgDump = resolvePostgresTool('pg_dump', process.env.PG_DUMP_BIN);
const pgRestore = resolvePostgresTool('pg_restore', process.env.PG_RESTORE_BIN);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env: postgresEnvironment,
    encoding: 'utf8',
  });
  if (!options.quiet && result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error?.code === 'ENOENT') {
    throw new Error(`${command} is required`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

try {
  run(pgDump, [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    `--file=${temporary}`,
  ]);
  run(pgRestore, ['--list', temporary], { quiet: true });
  renameSync(temporary, destination);
  console.log(`Backup created and verified: ${destination}`);
} catch (error) {
  rmSync(temporary, { force: true });
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
