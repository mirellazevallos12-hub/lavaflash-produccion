import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { backup } from 'node:sqlite';
import { sql } from '../server/database.mjs';

const dir = resolve(process.env.LAVAFLASH_BACKUP_DIR || './backups');
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = resolve(dir, `lavaflash-${stamp}.sqlite`);
await backup(sql, target);
console.log(`Backup creado: ${target}`);
