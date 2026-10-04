import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '8.31.0'
const WEB_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)))
const ROOT = resolve(WEB_DIR, '../..')
const ADMIN_DIR = resolve(ROOT, 'apps/admin')
const ADMIN_VITE = resolve(ADMIN_DIR, 'node_modules/vite/bin/vite.js')
const API_ENTRY = resolve(ROOT, 'server/index.mjs')

const portAvailable = (port) => new Promise((done) => {
  const tester = net.createServer()
  tester.unref()
  tester.once('error', () => done(false))
  tester.listen({ host: '127.0.0.1', port }, () => tester.close(() => done(true)))
})

async function pickPort(candidates) {
  for (const port of candidates) {
    if (await portAvailable(port)) return port
  }
  throw new Error(`No hay un puerto interno disponible entre: ${candidates.join(', ')}`)
}

const adminUnavailableHtml = `<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LavaFlash - Iniciando administrador</title>
<style>body{margin:0;font-family:Arial,sans-serif;background:#f5f9fb;color:#102534;display:grid;place-items:center;min-height:100vh}.box{width:min(92vw,560px);background:#fff;border:1px solid #dbe7ed;border-radius:22px;padding:34px;box-shadow:0 20px 55px rgba(13,44,61,.12)}h1{margin:0 0 12px;font-size:24px}p{line-height:1.55;color:#4a6170}.tag{display:inline-block;margin-bottom:14px;color:#087f78;font-weight:800}.spinner{width:34px;height:34px;border:4px solid #dceff1;border-top-color:#0aa7b8;border-radius:50%;animation:r 1s linear infinite;margin:20px 0}@keyframes r{to{transform:rotate(360deg)}}.small{font-size:13px}</style></head>
<body><main class="box"><span class="tag">LAVA FLASH</span><h1>Iniciando el panel administrativo...</h1><div class="spinner"></div><p>La página ya está activa en el puerto <b>5173</b>. El administrador interno está terminando de iniciar.</p><p class="small">Esta pantalla se actualizará sola. No necesitas cambiar de puerto.</p></main>
<script>let n=0;const t=setInterval(async()=>{n++;try{const r=await fetch('/admin/@vite/client',{cache:'no-store'});if(r.ok){clearInterval(t);location.replace('/admin/')}}catch{}if(n>45){clearInterval(t)}},700)</script></body></html>`

function companionServices(adminPort, apiPort) {
  return {
    name: 'lavaflash-companion-services',
    configureServer(server) {
      const children = []
      const launch = (label, command, args, options) => {
        const child = spawn(command, args, { stdio: 'inherit', shell: false, ...options })
        children.push(child)
        child.on('error', (error) => console.error(`[LavaFlash] ${label} no pudo iniciar: ${error.message}`))
        child.on('exit', (code) => {
          if (code && code !== 0) console.error(`[LavaFlash] ${label} terminó con código ${code}.`)
        })
        return child
      }

      if (!existsSync(ADMIN_VITE)) {
        console.error('[LavaFlash] Faltan las dependencias del administrador. Ejecuta npm install desde la carpeta LAVAFLASH.')
      } else {
        launch('Administrador', process.execPath, [ADMIN_VITE, '--host', '127.0.0.1', '--port', String(adminPort), '--strictPort'], {
          cwd: ADMIN_DIR,
          env: { ...process.env, DISABLE_HMR: 'true' },
        })
      }

      if (!existsSync(API_ENTRY)) {
        console.error('[LavaFlash] No se encontró server/index.mjs.')
      } else {
        launch('API administrativa', process.execPath, [API_ENTRY], {
          cwd: ROOT,
          env: { ...process.env, LAVAFLASH_API_ONLY: '1', PORT: String(apiPort), NODE_ENV: 'development' },
        })
      }

      console.log(`\n[LavaFlash ${VERSION}] Acceso único:`)
      console.log('  Web:    http://127.0.0.1:5173/')
      console.log('  Admin:  http://127.0.0.1:5173/admin/')
      console.log(`  Admin interno: ${adminPort} | API interna: ${apiPort}\n`)

      const stopChildren = () => {
        for (const child of children) {
          if (!child.killed) child.kill('SIGTERM')
        }
      }
      server.httpServer?.once('close', stopChildren)
      process.once('SIGINT', stopChildren)
      process.once('SIGTERM', stopChildren)
    },
  }
}

export default defineConfig(async () => {
  const adminPort = await pickPort([5174, 5175, 5176, 5180, 5181])
  const apiPort = await pickPort([8787, 8788, 8789, 8790, 8791])

  return {
    plugins: [react(), companionServices(adminPort, apiPort)],
    build: {
      outDir: '../../dist',
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/admin': {
          target: `http://127.0.0.1:${adminPort}`,
          changeOrigin: true,
          ws: true,
          configure(proxy) {
            proxy.on('error', (_err, _req, res) => {
              if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
                res.end(adminUnavailableHtml)
              }
            })
          },
        },
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (_err, _req, res) => {
              if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
                res.end(JSON.stringify({ ok: false, error: 'API administrativa iniciándose' }))
              }
            })
          },
        },
      },
    },
  }
})
