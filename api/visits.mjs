import { createVisitsHandler } from '../server/visits.mjs';
import { createConfiguredVisitStore } from '../server/visit-runtime.mjs';

let handler;
export default async function visits(request, response) {
  try {
    handler ||= createVisitsHandler(createConfiguredVisitStore(), {
      onError: error => console.error('Visit counter failed:', error.message),
    });
    await handler(request, response);
  } catch {
    console.error('Visit counter configuration is missing or invalid');
    response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ error: 'Visit counter unavailable' }));
  }
}
