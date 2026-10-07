import { hashVisitorId } from './visits.mjs';

function validateSnapshot(data) {
  if (!Number.isSafeInteger(data?.total) || data.total < 0 || !Array.isArray(data.avatars) || data.avatars.length > 4 || data.avatars.some(seed => typeof seed !== 'string' || !/^[a-f0-9]{8}$/.test(seed))) {
    throw new Error('Invalid visit database response');
  }
  return { total: data.total, avatars: data.avatars };
}

export function createSupabaseVisitStore({ url, secretKey, fetchImpl = fetch }) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error('Invalid Supabase URL');
  if (typeof secretKey !== 'string' || !secretKey || secretKey.startsWith('sb_publishable_')) throw new Error('Missing Supabase server key');
  const rpc = async (name, parameters) => {
    const headers = { apikey: secretKey, 'Content-Type': 'application/json' };
    // Modern secret keys are not JWTs and must not be sent as bearer tokens.
    if (!secretKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${secretKey}`;
    const response = await fetchImpl(new URL(`/rest/v1/rpc/${name}`, endpoint), {
      method: 'POST', headers, body: JSON.stringify(parameters), signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Visit database request failed (${response.status})`);
    return validateSnapshot(await response.json());
  };
  return {
    snapshot: () => rpc('kimportflowrio_visit_snapshot', {}),
    record: visitorId => {
      let key;
      try { key = hashVisitorId(visitorId); } catch (error) { return Promise.reject(error); }
      return rpc('kimportflowrio_record_visit', { visitor_key: key });
    },
  };
}
