import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const required = [
  'dist/index.html',
  'dist/admin/index.html',
  'dist/admin/assets',
  'dist/brand/lavaflash-logo.png',
  'dist/admin/lavaflash-logo.png',
  'server/index.mjs',
]

const missing = required.filter((item) => !existsSync(resolve(item)))
if (missing.length) {
  console.error('Build incompleto. Faltan:')
  for (const item of missing) console.error(`- ${item}`)
  process.exit(1)
}

console.log('Build verificado: portal, /admin/ y servidor propio listos.')
