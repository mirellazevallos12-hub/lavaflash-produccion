import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const VERSION = '8.31.0';
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const WEB_DIR = resolve(ROOT, 'apps/web');
const webVite = resolve(WEB_DIR, 'node_modules/vite/bin/vite.js');
const adminVite = resolve(ROOT, 'apps/admin/node_modules/vite/bin/vite.js');

const missing = [webVite, adminVite].filter((item) => !existsSync(item));
if (missing.length) {
  console.error(`\n[LavaFlash ${VERSION}] Faltan dependencias.`);
  console.error('Ejecuta una sola vez desde esta carpeta: npm install');
  console.error('Luego vuelve a ejecutar: npm run dev\n');
  process.exit(1);
}

const portAvailable = (port) => new Promise((done) => {
  const server = net.createServer();
  server.unref();
  server.once('error', () => done(false));
  server.listen({ host: '127.0.0.1', port }, () => server.close(() => done(true)));
});

if (!(await portAvailable(5173))) {
  console.error(`\n[LavaFlash ${VERSION}] El puerto 5173 ya está ocupado.`);
  console.error('Cierra la terminal donde tengas otra versión de LavaFlash y vuelve a ejecutar npm run dev.\n');
  process.exit(1);
}

console.log(`\n[LavaFlash ${VERSION}] Iniciando en un único acceso público...`);
console.log('  Página:         http://127.0.0.1:5173/');
console.log('  Administrador:  http://127.0.0.1:5173/admin/');
console.log('  Usuario: admin');
console.log('  Código:  2026\n');
console.log('[LavaFlash] El servidor de la página iniciará automáticamente el panel y la API interna.');

const child = spawn(process.execPath, [webVite, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
  cwd: WEB_DIR,
  stdio: 'inherit',
  env: { ...process.env, LAVAFLASH_ROOT: ROOT },
});

child.on('error', (error) => {
  console.error('[LavaFlash] No se pudo iniciar la página:', error.message);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exitCode = code ?? 0;
});

const stop = () => {
  if (!child.killed) child.kill('SIGTERM');
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
