import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const validVisitorId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hashVisitorId(visitorId) {
  if (typeof visitorId !== 'string' || !validVisitorId.test(visitorId)) throw Object.assign(new Error('Invalid visitor ID'), { status: 400 });
  return createHash('sha256').update(visitorId.toLowerCase()).digest('hex');
}

export function createVisitStore(filename) {
  let queue = Promise.resolve();
  const read = async () => {
    try {
      const state = JSON.parse(await readFile(filename, 'utf8'));
      if (state.version !== 1 || !Array.isArray(state.visitors) || state.visitors.some(visitor => typeof visitor.key !== 'string' || !/^[a-f0-9]{64}$/.test(visitor.key))) {
        throw new Error('Invalid visit store');
      }
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') return { version: 1, visitors: [] };
      throw error;
    }
  };
  const summarize = state => ({
    total: state.visitors.length,
    avatars: state.visitors.slice(-4).reverse().map(visitor => visitor.key.slice(0, 8)),
  });
  return {
    async snapshot() { await queue; return summarize(await read()); },
    record(visitorId) {
      let key;
      try { key = hashVisitorId(visitorId); } catch (error) { return Promise.reject(error); }
      const operation = queue.then(async () => {
        const state = await read();
        if (!state.visitors.some(visitor => visitor.key === key)) {
          state.visitors.push({ key });
          await mkdir(path.dirname(filename), { recursive: true });
          const temporary = `${filename}.tmp`;
          await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
          await rename(temporary, filename);
        }
        return summarize(state);
      });
      queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
}

export function createVisitsHandler(store, { onError = () => {} } = {}) {
  return async (request, response) => {
    const reply = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(data));
    };
    if (request.method === 'GET') {
      try { reply(200, await store.snapshot()); } catch (error) { onError(error); reply(503, { error: 'Visit counter unavailable' }); }
      return;
    }
    if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST'); reply(405, { error: 'Method not allowed' }); return; }
    if (request.headers['sec-fetch-site'] === 'cross-site' || (request.headers.origin && request.headers.origin !== `http://${request.headers.host}` && request.headers.origin !== `https://${request.headers.host}`)) {
      reply(403, { error: 'Origin not allowed' }); return;
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) { reply(415, { error: 'JSON required' }); return; }
    try {
      if (Number(request.headers['content-length']) > 1024) { reply(413, { error: 'Request too large' }); return; }
      let payload;
      // Vercel's Node request helpers may already have parsed the JSON body.
      if (request.body !== undefined) {
        const body = typeof request.body === 'string' || Buffer.isBuffer(request.body) ? String(request.body) : JSON.stringify(request.body);
        if (Buffer.byteLength(body) > 1024) { reply(413, { error: 'Request too large' }); return; }
        try { payload = JSON.parse(body); } catch { reply(400, { error: 'Invalid JSON' }); return; }
      } else {
        const chunks = [];
        let bytes = 0;
        for await (const chunk of request) {
          bytes += Buffer.byteLength(chunk);
          if (bytes > 1024) { reply(413, { error: 'Request too large' }); return; }
          chunks.push(Buffer.from(chunk));
        }
        try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { reply(400, { error: 'Invalid JSON' }); return; }
      }
      reply(200, await store.record(payload?.visitorId));
    } catch (error) {
      if (error.status !== 400) onError(error);
      reply(error.status === 400 ? 400 : 503, { error: error.status === 400 ? 'Invalid visitor ID' : 'Visit counter unavailable' });
    }
  };
}
