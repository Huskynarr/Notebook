import { readFileSync } from 'node:fs';

const hosting = JSON.parse(readFileSync('.openai/hosting.json', 'utf8'));
if (!hosting.project_id || hosting.d1 !== 'DB' || hosting.r2 !== 'BUCKET') {
  throw new Error('Sites needs its project ID plus DB and BUCKET bindings');
}
const worker = readFileSync('dist/server/index.js', 'utf8');
const page = readFileSync('dist/client/index.html', 'utf8');
const config = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
if (
  !worker.includes('fetch(') ||
  config.assets?.binding !== 'ASSETS' ||
  config.d1_databases?.[0]?.binding !== 'DB' ||
  config.r2_buckets?.[0]?.binding !== 'BUCKET'
) {
  throw new Error('Sites Worker or asset/storage bindings missing');
}
if (!page.includes('/assets/') || /node:(sqlite|fs|net|stream)|process\.env/.test(worker)) {
  throw new Error('Sites build is incomplete or contains Node-only runtime code');
}
for (const forbidden of ['AUTH_SECRET', 'LLM_API_KEY', 'test-secret-server-only']) {
  for (const asset of [page]) {
    if (asset.includes(forbidden)) throw new Error('A secret pattern reached public HTML');
  }
}
console.log('Sites Worker, storage bindings and public HTML verified.');
