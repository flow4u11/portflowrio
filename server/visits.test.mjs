import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createVisitStore, createVisitsHandler, hashVisitorId } from './visits.mjs';
import { createSupabaseVisitStore } from './supabase-visits.mjs';
import { createConfiguredVisitStore } from './visit-runtime.mjs';

async function temporaryStore(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'portfolio-visits-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'visits.json');
  return { filename, store: createVisitStore(filename) };
}
test('reloads and repeated renders count an anonymous browser only once', async t => {
  const { filename, store } = await temporaryStore(t);
  const id = randomUUID();
  assert.equal((await store.record(id)).total, 1);
  assert.equal((await store.record(id)).total, 1);
  assert.equal((await createVisitStore(filename).record(id)).total, 1);
  assert.ok(!(await readFile(filename, 'utf8')).includes(id), 'raw browser identifier is not retained');
});
test('simultaneous arrivals do not lose visits and return a bounded avatar list', async t => {
  const { filename, store } = await temporaryStore(t);
  const ids = Array.from({ length: 20 }, () => randomUUID());
  await Promise.all(ids.flatMap(id => [store.record(id), store.record(id)]));
  const persisted = await createVisitStore(filename).snapshot();
  assert.equal(persisted.total, 20);
  assert.equal(persisted.avatars.length, 4);
  assert.equal(new Set(persisted.avatars).size, 4);
});
test('invalid identifiers and corrupt data never silently reset the counter', async t => {
  const { filename, store } = await temporaryStore(t);
  await assert.rejects(store.record('not-an-id'), { status: 400 });
  await store.record(randomUUID());
  await writeFile(filename, 'broken-data');
  await assert.rejects(store.record(randomUUID()));
  assert.equal(await readFile(filename, 'utf8'), 'broken-data');
});

test('Supabase records only a hash and keeps modern secret keys in server headers', async () => {
  const id = randomUUID();
  const requests = [];
  const store = createSupabaseVisitStore({
    url: 'https://project.supabase.co', secretKey: 'sb_secret_server_test_only',
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), ...options });
      return { ok: true, json: async () => ({ total: 1, avatars: ['01234567'] }) };
    },
  });
  assert.equal((await store.record(id.toUpperCase())).total, 1);
  assert.deepEqual(JSON.parse(requests[0].body), { visitor_key: hashVisitorId(id) });
  assert.ok(!requests[0].body.includes(id));
  assert.equal(requests[0].headers.apikey, 'sb_secret_server_test_only');
  assert.equal(requests[0].headers.Authorization, undefined);
  await store.snapshot();
  assert.equal(requests[1].url, 'https://project.supabase.co/rest/v1/rpc/kimportflowrio_visit_snapshot');
  await assert.rejects(store.record('invalid-id'), { status: 400 });
  assert.equal(requests.length, 2, 'invalid UUIDs never reach Supabase');
});

test('Supabase outages and malformed snapshots fail instead of fabricating real visits', async () => {
  const options = { url: 'https://project.supabase.co', secretKey: 'sb_secret_server_test_only' };
  const unavailable = createSupabaseVisitStore({ ...options, fetchImpl: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(unavailable.snapshot(), /failed \(503\)/);
  const malformed = createSupabaseVisitStore({ ...options, fetchImpl: async () => ({ ok: true, json: async () => ({ total: 1, avatars: ['invalid'] }) }) });
  await assert.rejects(malformed.snapshot(), /Invalid visit database response/);
  assert.throws(() => createConfiguredVisitStore({ VERCEL: '1' }), /server-only/);
  assert.throws(() => createConfiguredVisitStore({ SUPABASE_URL: options.url }), /server-only/);
  assert.throws(() => createSupabaseVisitStore({ ...options, secretKey: 'sb_publishable_public_test' }), /server key/);
});

async function requestHandler(handler, { method = 'POST', body, parsed = false, headers = {} } = {}) {
  const request = Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]);
  request.method = method;
  request.headers = { host: 'portfolio.test', 'content-type': 'application/json', ...headers };
  if (parsed) request.body = body;
  const result = { headers: {} };
  const response = {
    setHeader: (name, value) => { result.headers[name] = value; },
    writeHead: (status, values) => { result.status = status; Object.assign(result.headers, values); },
    end: data => { result.data = JSON.parse(data); },
  };
  await handler(request, response);
  return result;
}

test('the same HTTP handler accepts streamed local JSON and Vercel parsed bodies', async () => {
  const ids = [];
  const handler = createVisitsHandler({ snapshot: async () => ({ total: ids.length, avatars: [] }), record: async id => { hashVisitorId(id); ids.push(id); return { total: ids.length, avatars: [] }; } });
  const id = randomUUID();
  const local = await requestHandler(handler, { body: { visitorId: id }, headers: { origin: 'https://portfolio.test' } });
  assert.equal(local.status, 200);
  const vercel = await requestHandler(handler, { body: { visitorId: id }, parsed: true });
  assert.equal(vercel.status, 200);
  assert.equal(vercel.headers['Cache-Control'], 'no-store');
  assert.deepEqual(ids, [id, id]);
});

test('HTTP validation rejects hostile origins, large bodies, invalid JSON and unsupported methods', async () => {
  let records = 0;
  const handler = createVisitsHandler({ snapshot: async () => ({ total: 0, avatars: [] }), record: async id => { hashVisitorId(id); records++; return { total: 1, avatars: [] }; } });
  const cases = [
    [{ body: {}, headers: { origin: 'https://other.test' } }, 403],
    [{ body: {}, headers: { 'sec-fetch-site': 'cross-site' } }, 403],
    [{ body: {}, headers: { 'content-type': 'application/json-invalid' } }, 415],
    [{ body: 'not JSON' }, 400],
    [{ body: { visitorId: 'invalid' }, parsed: true }, 400],
    [{ body: { large: 'x'.repeat(1024) }, parsed: true }, 413],
    [{ body: 'x'.repeat(1025) }, 413],
    [{ method: 'DELETE', body: {} }, 405],
  ];
  for (const [options, expected] of cases) assert.equal((await requestHandler(handler, options)).status, expected);
  assert.equal(records, 0);
});
