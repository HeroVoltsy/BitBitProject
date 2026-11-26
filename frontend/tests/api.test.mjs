import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/apiClient.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { createApiClient, ApiError, tokenExpiry } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const result = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('JSON requests use configured API URL and real bearer token', async () => {
  const request = createApiClient({ baseUrl: 'https://api.example.test/', getToken: () => 'real-token', onUnauthorized: () => {},
    fetcher: async (url, options) => {
      assert.equal(url, 'https://api.example.test/users/me');
      assert.equal(options.headers.get('authorization'), 'Bearer real-token');
      assert.equal(options.headers.get('content-type'), 'application/json');
      assert.equal(options.cache, 'no-store');
      return result({ id: 1 });
    },
  });
  assert.deepEqual(await request('/users/me', { method: 'PATCH', body: JSON.stringify({ account_type: 'host' }) }), { id: 1 });
});

test('login bypasses old token; multipart leaves boundary to the browser', async () => {
  const request = createApiClient({ baseUrl: '', getToken: () => 'old-token', onUnauthorized: () => {},
    fetcher: async (_, options) => {
      if (options.body instanceof FormData) {
        assert.equal(options.headers.get('content-type'), null);
        assert.equal(options.headers.get('authorization'), 'Bearer old-token');
      } else assert.equal(options.headers.get('authorization'), null);
      return result({ ok: true });
    },
  });
  await request('/auth/login', { token: null, method: 'POST', body: '{}' });
  await request('/api/v1/kyc/documents/front', { method: 'POST', body: new FormData() });
});

test('unauthorized requests expire only their token and retain server error', async () => {
  const expired = [];
  const request = createApiClient({ baseUrl: '', getToken: () => 'expired-token', onUnauthorized: (token) => expired.push(token),
    fetcher: async () => result({ detail: 'Invalid or expired authentication token' }, 401),
  });
  await assert.rejects(request('/users/me'), (error) => error instanceof ApiError && error.status === 401);
  assert.deepEqual(expired, ['expired-token']);
  await assert.rejects(request('/auth/login', { token: null }));
  assert.equal(expired.length, 1);
});

test('network/validation errors are readable; cancellation remains cancellation', async () => {
  const client = (fetcher) => createApiClient({ baseUrl: '', getToken: () => null, onUnauthorized: () => {}, fetcher });
  await assert.rejects(client(async () => { throw new TypeError('fetch failed'); })('/test'), (e) => e.status === 0 && /connection/i.test(e.message));
  await assert.rejects(client(async () => result({ detail: [{ loc: ['body', 'password'], msg: 'too short' }] }, 422))('/test'), (e) => e.status === 422 && /entries/.test(e.message));
  await assert.rejects(client(async () => { throw new DOMException('Cancelled', 'AbortError'); })('/test'), (e) => e.name === 'AbortError');
  await assert.rejects(client(async () => new Response('not json'))('/test'), /unexpected response/);
});

test('token expiry uses JWT expiration and rejects invalid values', () => {
  const token = 'header.' + btoa(JSON.stringify({ exp: 1234567890 })) + '.signature';
  assert.equal(tokenExpiry(token), 1234567890000);
  for (const invalid of ['', 'garbage', 'h.' + btoa('{}') + '.s']) assert.equal(tokenExpiry(invalid), 0);
});


test('deployment CSP explicitly permits the backend without wildcard connections', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const csp = config.headers.flatMap((rule) => rule.headers).find((header) => header.key === 'Content-Security-Policy').value;
  const connections = csp.split(';').map((value) => value.trim()).find((value) => value.startsWith('connect-src '));
  assert.equal(connections, "connect-src 'self' https://bit-bit-project.vercel.app");
  for (const directive of ["script-src 'self'", "object-src 'none'", "frame-ancestors 'none'"]) assert.ok(csp.includes(directive));
});
