import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createVisitsHandler } from './visits.mjs';
import { createConfiguredVisitStore, loadLocalEnvironment } from './visit-runtime.mjs';

loadLocalEnvironment();
const root = path.resolve('dist');
const port = Number(process.env.PORT || 4173);
const visits = createVisitsHandler(createConfiguredVisitStore(), { onError: error => console.error('Visit counter failed:', error.message) });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/vnd.microsoft.icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/api/visits') { await visits(request, response); return; }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  try {
    const file = path.resolve(root, `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`);
    if (!file.startsWith(`${root}${path.sep}`) || !types[path.extname(file)] || !(await stat(file)).isFile()) throw new Error('Not found');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': path.extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Production preview: http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
