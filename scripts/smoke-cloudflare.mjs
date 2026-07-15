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
    const loginData = (await login.json())?.data;
    const token = loginData?.accessToken;
    const refreshToken = loginData?.refreshToken;
    if (!token || !refreshToken) throw new Error('Login real no devolvio la sesion completa');
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

    const webSessionLogin = await fetchChecked(
      'Sesion web persistente',
      `${webUrl}/api/auth/session/login`,
      201,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      },
    );
    const webLoginBody = await webSessionLogin.json();
    if (webLoginBody?.data?.refreshToken) {
      throw new Error('La sesion web expuso el refresh token al navegador');
    }
    const loginCookie = webSessionLogin.headers.get('set-cookie');
    if (
      !loginCookie ||
      !/HttpOnly/i.test(loginCookie) ||
      !/Secure/i.test(loginCookie) ||
      !/SameSite=Lax/i.test(loginCookie)
    ) {
      throw new Error('La cookie de sesion web no tiene todos los atributos de seguridad');
    }

    const webSessionRefresh = await fetchChecked(
      'Renovacion web automatica',
      `${webUrl}/api/auth/session/refresh`,
      200,
      { method: 'POST', headers: { cookie: loginCookie.split(';', 1)[0] } },
    );
    const rotatedCookie = webSessionRefresh.headers.get('set-cookie');
    if (!rotatedCookie) throw new Error('La renovacion web no roto la cookie de sesion');

    await fetchChecked('Cierre de sesion web', `${webUrl}/api/auth/session/logout`, 204, {
      method: 'POST',
      headers: { cookie: rotatedCookie.split(';', 1)[0] },
    });
    await fetchChecked('Revocacion de sesion API', `${apiUrl}/auth/logout`, 204, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } else {
    console.log('OMITIDO flujo autenticado: define SMOKE_USERNAME y SMOKE_PASSWORD para staging.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
