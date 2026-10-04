import { rmSync } from 'node:fs';
for (const path of ['dist','apps/web/node_modules/.vite','apps/admin/node_modules/.vite']) rmSync(path,{recursive:true,force:true});
console.log('Limpieza completada.');
