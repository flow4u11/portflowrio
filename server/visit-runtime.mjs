import path from 'node:path';
import { createVisitStore } from './visits.mjs';
import { createSupabaseVisitStore } from './supabase-visits.mjs';

export function loadLocalEnvironment() {
  for (const filename of ['.env.local', '.env']) {
    try { process.loadEnvFile(filename); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export function createConfiguredVisitStore(env = process.env) {
  const url = env.SUPABASE_URL;
  const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && secretKey) return createSupabaseVisitStore({ url, secretKey });
  if (env.VERCEL || url || secretKey) {
    throw new Error('Visits require SUPABASE_URL and a server-only SUPABASE_SECRET_KEY');
  }
  return createVisitStore(env.VISITS_DATA_FILE || path.resolve('.data/visits.json'));
}
