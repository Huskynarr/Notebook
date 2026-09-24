import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const [command, args] of [
  ['pnpm', ['--filter', '@notebook/web', 'build']],
  [
    'node',
    ['apps/web/node_modules/vite/bin/vite.js', 'build', '--config', 'tools/sites.vite.config.mjs'],
  ],
]) {
  const run =
    command === 'pnpm' && process.env.npm_execpath
      ? [process.execPath, [process.env.npm_execpath, ...args]]
      : [command, args];
  const result = spawnSync(run[0], run[1], {
    stdio: 'inherit',
    env: { ...process.env, VITE_API_BASE_URL: '', VITE_BASE_PATH: '/', VITE_DEMO: 'false' },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
mkdirSync('dist/client', { recursive: true });
cpSync('apps/web/dist', 'dist/client', { recursive: true, force: true });
writeFileSync(
  'dist/server/wrangler.json',
  JSON.stringify(
    {
      main: 'index.js',
      compatibility_date: '2026-09-01',
      assets: {
        directory: '../client',
        binding: 'ASSETS',
        not_found_handling: 'single-page-application',
      },
      d1_databases: [
        {
          binding: 'DB',
          database_name: 'notebook-sites-local',
          database_id: '00000000-0000-4000-8000-000000000000',
        },
      ],
      r2_buckets: [{ binding: 'BUCKET', bucket_name: 'notebook-sites-local' }],
      compatibility_flags: [],
    },
    null,
    2,
  ),
);
