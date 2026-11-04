/** Test-only, loopback-bound HTTP façade. No startup script or deploy entry point. */
import { createServer } from 'node:http';
import { BoundaryError } from './authority.mjs';

const routes = new Map([
  ['/poc/step-up/challenge', 'challenge'],
  ['/poc/step-up/verify', 'verifyFreshTotp'],
]);
const operations = new Map([
  ['/poc/credentials/password', 'password_change'],
  ['/poc/credentials/email', 'email_change'],
  ['/poc/sessions/remote-logout', 'remote_logout'],
]);

async function bodyJson(request) {
  let content = '';
  for await (const part of request) {
    content += part.toString('utf8');
    if (content.length > 8192) throw new BoundaryError('BODY_TOO_LARGE', 413);
  }
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error();
    return parsed;
  } catch { throw new BoundaryError('INVALID_JSON', 400); }
}

function respond(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(body));
}

export function createLocalPoCServer(authority) {
  return createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://127.0.0.1').pathname;
      if (req.method === 'GET' && path === '/poc/jwks')
        return respond(res, 200, authority.jwksForTest());
      // Any other path (including native /auth/v1/user and /auth/v1/logout) is absent.
      if (req.method !== 'POST' || !(routes.has(path) || operations.has(path)))
        return respond(res, 404, { error: 'NOT_FOUND' });
      const bearer = /^Bearer ([A-Za-z0-9_-]+)$/.exec(req.headers.authorization ?? '')?.[1] ?? '';
      const body = await bodyJson(req);
      let result;
      if (routes.has(path)) {
        if (path.endsWith('/challenge'))
          result = authority.challenge({ bearer, operation: body.operation, payload: body.payload });
        else result = authority.verifyFreshTotp({ bearer, challengeId: body.challengeId, code: body.code });
      } else {
        result = authority.execute({ bearer, grantId: body.grantId,
          operation: operations.get(path), payload: body.payload });
      }
      respond(res, 200, result);
    } catch (e) {
      respond(res, e instanceof BoundaryError ? e.status : 500,
        { error: e instanceof BoundaryError ? e.code : 'INTERNAL_ERROR' });
    }
  });
}
