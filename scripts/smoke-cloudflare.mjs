const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const apiUrl = option('--api-url', process.env.CLOUDFLARE_API_URL ?? 'http://127.0.0.1:8787/api/v1').replace(
  /\/$/,
  '',
);
const webUrl = option('--web-url', process.env.CLOUDFLARE_WEB_URL ?? 'http://127.0.0.1:8789').replace(
  /\/$/,
  '',
);
const username = process.env.SMOKE_USERNAME;
const password = process.env.SMOKE_PASSWORD;

async function fetchChecked(label, url, expectedStatus, init) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== expectedStatus) {
    const body = (await response.text()).slice(0, 500);
    throw new Error(`${label}: esperaba ${expectedStatus}, recibio ${response.status}: ${body}`);
  }
  console.log(`OK ${label} (${response.status})`);
  return response;
}

async function main() {
  const health = await fetchChecked('API health', `${apiUrl}/health`, 200);
  const healthBody = await health.json();
  if (healthBody?.data?.database !== 'ok') throw new Error('API health no confirmo database=ok');

  await fetchChecked('JWT requerido', `${apiUrl}/auth/profile`, 401);
  await fetchChecked('Login invalido', `${apiUrl}/auth/login`, 401, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: '__cloudflare_smoke_invalid__', password: 'invalid-password' }),
  });
  await fetchChecked(
    'Captura publica inexistente',
    `${apiUrl}/documents/capture-sessions/__cloudflare_smoke_missing__`,
    404,
  );
  await fetchChecked('Web login', `${webUrl}/login`, 200);
  await fetchChecked('Web asset', `${webUrl}/icons/icon-192.png`, 200);
  await fetchChecked('Web mobile URL', `${webUrl}/api/mobile-base-url`, 200);

  if (username && password) {
    const login = await fetchChecked('Login real', `${apiUrl}/auth/login`, 201, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const token = (await login.json())?.data?.accessToken;
    if (!token) throw new Error('Login real no devolvio accessToken');
    const authenticated = { headers: { authorization: `Bearer ${token}` } };
    await fetchChecked('Perfil autenticado', `${apiUrl}/auth/profile`, 200, authenticated);
    await fetchChecked('Panel agregado', `${apiUrl}/reports/overview`, 200, authenticated);
    await fetchChecked(
      'Prestamos ordenados',
      `${apiUrl}/loans?take=1&sort=amount_desc`,
      200,
      authenticated,
    );
    await fetchChecked('Clientes autenticados', `${apiUrl}/clients?take=1`, 200, authenticated);
    await fetchChecked('Documentos autenticados', `${apiUrl}/documents?take=1`, 200, authenticated);
  } else {
    console.log('OMITIDO flujo autenticado: define SMOKE_USERNAME y SMOKE_PASSWORD para staging.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
