import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
const PORT = 8799;
const baseUrl = `http://127.0.0.1:${PORT}`;
const dbFile = resolve('data/test-v831.sqlite');
for (const suffix of ['', '-shm', '-wal']) rmSync(`${dbFile}${suffix}`, { force: true });
const child = spawn(process.execPath, ['server/index.mjs'], {
  env: { ...process.env, LAVAFLASH_API_ONLY:'1', PORT:String(PORT), NODE_ENV:'development', LAVAFLASH_DATABASE_FILE:'./data/test-v831.sqlite', LAVAFLASH_ADMIN_USER:'admin', LAVAFLASH_ADMIN_PASSWORD:'2026', LAVAFLASH_SESSION_SECRET:'test-secret-abcdefghijklmnopqrstuvwxyz-1234567890' },
  stdio: ['ignore','pipe','pipe'],
});
let stderr=''; child.stderr.on('data',(c)=>{stderr+=c.toString();});
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
async function waitForHealth(){for(let i=0;i<80;i++){try{const r=await fetch(`${baseUrl}/api/health`);const d=await r.json();if(r.ok&&d?.ok)return d;}catch{}await wait(100);}throw new Error(`La API no inició. ${stderr}`);}
try {
  const health=await waitForHealth(); if(health.version!=='8.31.0')throw new Error(`Versión inesperada ${health.version}`);
  const invalid=await fetch(`${baseUrl}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:5173'},body:JSON.stringify({username:'admin',code:'mal'})}); if(invalid.status!==401)throw new Error(`Login inválido devolvió ${invalid.status}`);
  const login=await fetch(`${baseUrl}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:5173'},body:JSON.stringify({username:'admin',code:'2026'})}); if(!login.ok)throw new Error(`Login ${login.status}: ${await login.text()}`); const cookie=login.headers.get('set-cookie')?.split(';')[0]; if(!cookie)throw new Error('Sin cookie admin');
  const headers={Cookie:cookie,'Content-Type':'application/json'};
  const seed=await fetch(`${baseUrl}/api/admin/state/bulk`,{method:'POST',headers,body:JSON.stringify({state:{lavanderiapro_customers:[{id:'c1',fullName:'Prueba',documentNumber:'12345678',phone:'999999999',password:'secreto123'}],lavanderiapro_orders:[]}})}); if(!seed.ok)throw new Error(`State seed ${seed.status}: ${await seed.text()}`);
  const state=await fetch(`${baseUrl}/api/admin/state`,{headers:{Cookie:cookie}}); const stateData=await state.json(); if(stateData.state.lavanderiapro_customers?.[0]?.password)throw new Error('La contraseña de cliente quedó expuesta en state');

  const customerLogin=await fetch(`${baseUrl}/api/customer/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'12345678',password:'secreto123'})});
  if(!customerLogin.ok)throw new Error(`Login cliente migrado ${customerLogin.status}: ${await customerLogin.text()}`);
  const customerCookie=customerLogin.headers.get('set-cookie')?.split(';')[0]; if(!customerCookie)throw new Error('Sin cookie cliente');
  const staleOrdersRevision=Number(stateData.revisions?.lavanderiapro_orders || 0);
  const orderCreate=await fetch(`${baseUrl}/api/customer/orders`,{method:'POST',headers:{Cookie:customerCookie,'Content-Type':'application/json'},body:JSON.stringify({service:{title:'Lavado por peso',unitPrice:4.5},quantity:3,weightKg:3,total:13.5,paymentMethod:'YAPE'})});
  if(!orderCreate.ok)throw new Error(`Pedido cliente ${orderCreate.status}: ${await orderCreate.text()}`); const orderData=await orderCreate.json();
  const track=await fetch(`${baseUrl}/api/public/track-order`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:orderData.order.code,identifier:'12345678'})}); if(!track.ok)throw new Error(`Tracking ${track.status}`);
  const staleWrite=await fetch(`${baseUrl}/api/admin/state/lavanderiapro_orders`,{method:'PUT',headers,body:JSON.stringify({value:[],revision:staleOrdersRevision})});
  if(staleWrite.status!==409)throw new Error(`Una escritura administrativa obsoleta debía devolver 409 y devolvió ${staleWrite.status}`);
  const stateAfterOrder=await fetch(`${baseUrl}/api/admin/state`,{headers:{Cookie:cookie}}); const afterData=await stateAfterOrder.json(); if(!(afterData.state.lavanderiapro_orders||[]).some(o=>o.id===orderData.order.id))throw new Error('El pedido web no apareció en la base administrativa central');

  const historyPayload={version:1,rows:[["h1","v1","2026-01-01","t1",1,5,5,"u","Servicio","Cliente","c1"]]};
  const hi=await fetch(`${baseUrl}/api/admin/history/import`,{method:'POST',headers,body:JSON.stringify(historyPayload)}); if(!hi.ok)throw new Error(`History import ${hi.status}`);
  const hg=await fetch(`${baseUrl}/api/admin/history`,{headers:{Cookie:cookie}}); const hd=await hg.json(); if(hd.rows?.length<1)throw new Error('Historial no persistió');
  const logout=await fetch(`${baseUrl}/api/admin/logout`,{method:'POST',headers:{Cookie:cookie}}); if(!logout.ok)throw new Error('Logout falló');
  console.log('OK: API 8.31, admin, cliente, cookies, base central SQLite, pedido web→admin, control de conflictos, tracking, historial y logout.');
} finally {
  child.kill('SIGTERM'); await wait(150); for (const suffix of ['', '-shm', '-wal']) rmSync(`${dbFile}${suffix}`, { force: true });
}
