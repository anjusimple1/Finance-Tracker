#!/usr/bin/env node
/**
 * ENSURE: install deps, syntax-check backend JS, build frontend.
 * Run from repo root: npm run ensure
 */
import { spawnSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backend = join(root, 'backend');
const frontend = join(root, 'frontend');

function run(label, cmd, cwd) {
  console.log(`\n━━ ${label} ━━\n> ${cmd}\n`);
  const r = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nENSURE failed at: ${label}`);
    process.exit(r.status ?? 1);
  }
}

function checkJsFile(filePath) {
  const r = spawnSync(process.execPath, ['--check', filePath], {
    stdio: 'pipe',
  });
  if (r.status !== 0) {
    console.error(`\nSyntax error: ${filePath}`);
    if (r.stderr?.length) console.error(r.stderr.toString());
    process.exit(1);
  }
}

function walkJs(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJs(p);
    else if (name.endsWith('.js')) checkJsFile(p);
  }
}

console.log('Personal Finance Tracker — ENSURE\n');

for (const [label, path] of [
  ['backend/package.json', join(backend, 'package.json')],
  ['frontend/package.json', join(frontend, 'package.json')],
  ['backend/.env.example', join(backend, '.env.example')],
  ['frontend/.env.example', join(frontend, '.env.example')],
]) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path}`);
    process.exit(1);
  }
}

run('npm install (backend)', 'npm install', backend);
run('npm install (frontend)', 'npm install', frontend);

console.log('\n━━ Node syntax check (backend/src) ━━\n');
walkJs(join(backend, 'src'));

run('Production build (frontend)', 'npm run build', frontend);

console.log('\n✓ ENSURE completed successfully.\n');
console.log('Next: copy backend/.env.example to backend/.env, start MongoDB, then:');
console.log('  npm run dev   (from repo root, or run backend + frontend dev in two terminals)\n');
