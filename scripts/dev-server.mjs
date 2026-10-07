import http from 'node:http';
import { createServer as createViteServer } from 'vite';
import { createVisitsHandler } from '../server/visits.mjs';
import { createConfiguredVisitStore, loadLocalEnvironment } from '../server/visit-runtime.mjs';

loadLocalEnvironment();
const port = Number(process.env.PORT || 5173);
const visits = createVisitsHandler(createConfiguredVisitStore(), { onError: error => console.error('Visit counter failed:', error.message) });
let vite;
const server = http.createServer((request, response) => {
  if (new URL(request.url, 'http://localhost').pathname === '/api/visits') {
    void visits(request, response);
    return;
  }
  vite.middlewares(request, response);
});
vite = await createViteServer({ server: { middlewareMode: true, ws: { server } }, appType: 'spa' });
server.listen(port, '127.0.0.1', () => console.log(`Portfolio preview: http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); void vite.close(); process.exitCode = 1; });
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (closing) return;
  closing = true;
  await vite.close();
  server.close();
});
