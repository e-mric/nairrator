import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { randomBytes, timingSafeEqual } from 'node:crypto';
const token = randomBytes(32).toString('hex');
export const handle: Handle = async ({ event, resolve }) => {
  const host = event.url.hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host))
    return new Response('Loopback access only', { status: 403 });
  const origin = event.request.headers.get('origin');
  if (
    (origin && origin !== event.url.origin) ||
    event.request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return new Response('Cross-origin requests are blocked', { status: 403 });
  if (event.url.pathname.startsWith('/api/')) {
    const isRenewal = event.url.pathname === '/api/session';
    const trustedRenewal =
      isRenewal &&
      event.request.method === 'POST' &&
      origin === event.url.origin &&
      event.request.headers.get('sec-fetch-site') === 'same-origin';
    if (isRenewal && !trustedRenewal)
      return new Response('Session renewal requires a same-origin local page', { status: 403 });
    const candidate = event.request.headers.get('x-nairrator-token') || '';
    const candidateBytes = Buffer.from(candidate);
    const expectedBytes = Buffer.from(token);
    if (
      !trustedRenewal &&
      (candidateBytes.length !== expectedBytes.length ||
        !timingSafeEqual(candidateBytes, expectedBytes))
    ) {
      const expired = /^[a-f0-9]{64}$/.test(candidate);
      return json(
        {
          code: expired ? 'session_expired' : 'unauthorized',
          error: expired
            ? 'The local server restarted. Renew this page session.'
            : 'Open Nairrator locally to authorize this session',
        },
        { status: expired ? 401 : 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (event.request.method !== 'POST') return new Response('POST required', { status: 405 });
    if (Number(event.request.headers.get('content-length') || 0) > 16_000)
      return new Response('Request too large', { status: 413 });
  }
  event.locals.token = token;
  const response = await resolve(event);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:* ws://localhost:*; frame-ancestors 'none'",
  );
  return response;
};
