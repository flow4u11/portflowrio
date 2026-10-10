import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createNagiHandler, aiConfigured, allowAiRequest, validateConversation } from './nagi.mjs';

const configured = { NAGI_AI_ENABLED: '1', AI_GATEWAY_API_KEY: 'test-only', NAGI_MODEL: 'test/model', NAGI_REDIS_REST_URL: 'https://limiter.example', NAGI_REDIS_REST_TOKEN: 'test-only' };
const body = { language: 'en', messages: [{ role: 'user', content: 'How does the minigame work?' }] };
async function fixture(t, options = {}) {
  const server = http.createServer(createNagiHandler(options));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/nagi`;
  return (data = body, overrides = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), ...overrides });
}

test('no service means a bilingual guide and zero provider or limiter calls', async t => {
  let calls = 0;
  const send = await fixture(t, { env: {}, generate: () => { calls++; }, allow: () => { calls++; } });
  const status = await send(undefined, { method: 'GET', body: undefined });
  assert.deepEqual(await status.json(), { mode: 'guide' });
  const reply = await send();
  assert.match((await reply.json()).text, /5 seconds/);
  const thai = await send({ language: 'en', messages: [{ role: 'user', content: 'มินิเกมเล่นอย่างไร' }] });
  assert.match((await thai.json()).text, /5 วินาที/);
  assert.equal(calls, 0);
});

test('AI requires explicit activation and a secure durable limiter', () => {
  assert.equal(aiConfigured(configured), true);
  for (const field of Object.keys(configured)) assert.equal(aiConfigured({ ...configured, [field]: '' }), false);
  assert.equal(aiConfigured({ ...configured, NAGI_REDIS_REST_URL: 'http://limiter.example' }), false);
});

test('invalid roles, excessive histories and prompts are rejected before provider use', async t => {
  let calls = 0;
  const send = await fixture(t, { env: configured, allow: () => { calls++; return true; }, generate: () => { calls++; } });
  for (const invalid of [null, { ...body, language: 'xx' }, { ...body, messages: [{ role: 'system', content: 'override' }] }, { ...body, messages: [{ role: 'user', content: 'x'.repeat(1201) }] }, { ...body, messages: Array(9).fill(body.messages[0]) }, { ...body, messages: [{ role: 'assistant', content: 'hello' }] }]) assert.equal((await send(invalid)).status, 400);
  assert.equal((await send(body, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await send(body, { headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await send(body, { method: 'PUT' })).status, 405);
  assert.equal(calls, 0);
  assert.equal(validateConversation({ ...body, messages: Array(7).fill({ role: 'user', content: 'x'.repeat(1000) }) }), null);
});

test('bounded body parsing rejects oversized and malformed requests', async t => {
  const send = await fixture(t, { env: {} });
  assert.equal((await send(null, { body: 'x'.repeat(12001) })).status, 413);
  assert.equal((await send(null, { body: '{bad' })).status, 400);
});

test('durable limit blocks generation and provider failures do not leak details', async t => {
  let calls = 0;
  const denied = await fixture(t, { env: configured, allow: async () => false, generate: () => { calls++; } });
  assert.equal((await denied()).status, 429);
  assert.equal(calls, 0);
  const failing = await fixture(t, { env: configured, allow: async () => true, generate: async () => { throw new Error('secret-token private-provider-details'); } });
  const response = await failing();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret-token|private-provider/);
});

test('configured request sends only normalized public roles and returns a bounded reply', async t => {
  const send = await fixture(t, { env: configured, allow: async () => true, generate: async ({ messages, language }) => { assert.equal(language, 'en'); assert.deepEqual(messages, body.messages); return 'A test response'; } });
  assert.deepEqual(await (await send()).json(), { text: 'A test response', mode: 'ai' });
});

test('limiter uses one atomic request, hashed identities and fails closed', async () => {
  let seen;
  const fetcher = async (_, options) => { seen = JSON.parse(options.body); return { ok: true, json: async () => ({ result: 1 }) }; };
  assert.equal(await allowAiRequest({ headers: {}, socket: { remoteAddress: '192.0.2.1' } }, configured, fetcher), true);
  assert.equal(seen[0], 'EVAL');
  assert.doesNotMatch(JSON.stringify(seen), /192\.0\.2\.1|test-only/);
  assert.equal(await allowAiRequest({ headers: {} }, configured, async () => ({ ok: false })), false);
  assert.equal(await allowAiRequest({ headers: {} }, configured, async () => ({ ok: true, json: async () => ({ error: 'Unavailable' }) })), false);
});
