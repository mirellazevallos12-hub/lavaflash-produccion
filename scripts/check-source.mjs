import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
};
const allFiles = walk(ROOT);
for (const file of allFiles.filter((p) => extname(p) === '.json')) {
  try { JSON.parse(readFileSync(file, 'utf8')); } catch (error) { failures.push(`JSON inválido: ${file} -> ${error.message}`); }
}
const sourceFiles = allFiles.filter((p) => /\.(?:js|jsx|mjs|ts|tsx)$/.test(p));
const importRegex = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g;
const extensions = ['', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.json'];
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8'); let match;
  while ((match = importRegex.exec(text))) {
    const base = resolve(dirname(file), match[1]);
    const candidates = extensions.map((suffix) => `${base}${suffix}`).concat(extensions.slice(1).map((suffix) => join(base, `index${suffix}`)));
    if (!candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile())) failures.push(`Import relativo no encontrado: ${file} -> ${match[1]}`);
  }
}
const required = [
  'apps/web/index.html','apps/web/src/main.jsx','apps/web/src/App.jsx','apps/web/src/sharedStore.js',
  'apps/web/public/brand/lavaflash-logo.png','apps/web/public/about/about-mission.webp','apps/web/public/about/about-vision.webp',
  'apps/admin/index.html','apps/admin/src/main.tsx','apps/admin/src/App.tsx','apps/admin/src/services/cloudState.ts',
  'apps/admin/src/components/auth/AdminLoginView.tsx','server/index.mjs','server/database.mjs','.env.example','Dockerfile',
  'data-import/historial_lavaflash.json'
];
for (const item of required) if (!existsSync(join(ROOT,item))) failures.push(`Falta archivo requerido: ${item}`);
if (existsSync(join(ROOT,'.env'))) failures.push('El paquete contiene .env; no debe publicarse con secretos.');
for (const file of allFiles) {
  if (/\.sqlite(?:-wal|-shm)?$/.test(file)) failures.push(`Base de ejecución incluida por error: ${file}`);
}
for (const file of allFiles.filter((p) => /\.(?:js|jsx|mjs|ts|tsx|json|md|html|css)$/.test(p))) {
  const text = readFileSync(file,'utf8');
  if (file !== join(ROOT,'scripts/check-source.mjs') && new RegExp(['net','lify'].join(''),'i').test(text)) failures.push(`Referencia antigua de hosting encontrada: ${file}`);
}
const serverSource = readFileSync(join(ROOT,'server/index.mjs'),'utf8');
const databaseSource = readFileSync(join(ROOT,'server/database.mjs'),'utf8');
if (!serverSource.includes("const VERSION = '8.31.0'")) failures.push('La API no está versionada como 8.31.0.');
if (!databaseSource.includes('LAVAFLASH_DATABASE_FILE')) failures.push('La API no expone configuración de base persistente.');
if (!serverSource.includes('adminPassword.length < 12')) failures.push('Producción no exige una contraseña administrativa suficientemente larga.');
if (!serverSource.includes('Content-Security-Policy')) failures.push('Falta la política CSP de producción.');
const authSource = readFileSync(join(ROOT,'apps/admin/src/services/auth.ts'),'utf8');
if (/localCredentialsAreValid|code === ['"]2026['"]/.test(authSource)) failures.push('El frontend contiene una credencial administrativa fija.');
const webStore = readFileSync(join(ROOT,'apps/web/src/sharedStore.js'),'utf8');
if (webStore.includes('lavanderiapro_customers')) failures.push('La web pública todavía usa la lista completa de clientes en localStorage.');
if (failures.length) {
  console.error(`Se encontraron ${failures.length} problema(s):`); for (const failure of failures) console.error(`- ${failure}`); process.exit(1);
}
console.log(`OK: ${sourceFiles.length} archivos de código revisados. Paquete sin .env, rutas válidas y almacenamiento central configurado.`);
