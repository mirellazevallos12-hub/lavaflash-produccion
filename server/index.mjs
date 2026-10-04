import http from 'node:http';
import crypto from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  databaseInfo, getAllState, getState, setState, setManyState, setStateIfRevision, mutateState,
  getCustomerPasswordHash, setCustomerPasswordHash,
  getHistoryRows, importHistory, importHistoryFileIfEmpty,
} from './database.mjs';

const VERSION = '8.31.0';
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const API_ONLY = process.env.LAVAFLASH_API_ONLY === '1';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function loadEnvFile() {
  if (IS_PRODUCTION) return;
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const PORT = Number(process.env.PORT || (API_ONLY ? 8787 : 8080));
const ADMIN_COOKIE = 'lavaflash_admin_session';
const CUSTOMER_COOKIE = 'lavaflash_customer_session';
const SESSION_SECONDS = 60 * 60 * 8;
const CUSTOMER_SESSION_SECONDS = 60 * 60 * 24 * 30;
const adminUserName = String(process.env.LAVAFLASH_ADMIN_USER || 'admin').trim();
const adminPassword = String(process.env.LAVAFLASH_ADMIN_PASSWORD || (IS_PRODUCTION ? '' : '2026'));
const sessionSecret = String(process.env.LAVAFLASH_SESSION_SECRET || (IS_PRODUCTION ? '' : 'lavaflash-local-development-secret-change-me'));

if (IS_PRODUCTION && (adminPassword.length < 12 || sessionSecret.length < 32)) {
  console.error('[LavaFlash] Producción requiere LAVAFLASH_ADMIN_PASSWORD (mín. 12 caracteres) y LAVAFLASH_SESSION_SECRET (mín. 32 caracteres).');
  process.exit(1);
}

const BUSINESS_KEYS = [
  'lavanderiapro_customers','lavanderiapro_services','lavanderiapro_orders','lavanderiapro_expenses',
  'lavanderiapro_fixed_expenses','lavanderiapro_shifts','lavanderiapro_inventory','lavanderiapro_inventory_movs',
  'lavanderiapro_promotions','lavanderiapro_claims','lavanderiapro_audit_logs','lavanderiapro_reviews',
];
const BUSINESS_KEY_SET = new Set(BUSINESS_KEYS);

const userPayload = () => ({
  id: 'usr-admin', username: adminUserName,
  name: process.env.LAVAFLASH_ADMIN_NAME || 'Administrador LavaFlash',
  role: 'ADMIN', branch: process.env.LAVAFLASH_ADMIN_BRANCH || 'LavaFlash', avatar: '👤',
});

const safeEqual = (a = '', b = '') => {
  const left = Buffer.from(String(a)); const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};
const b64 = (value) => Buffer.from(value).toString('base64url');
const unb64 = (value) => Buffer.from(value, 'base64url').toString('utf8');
const sign = (payload) => crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
const makeToken = (sub, seconds) => {
  const payload = b64(JSON.stringify({ sub, exp: Math.floor(Date.now()/1000)+seconds }));
  return `${payload}.${sign(payload)}`;
};
const verifyToken = (token = '', expectedPrefix = '') => {
  if (!token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(unb64(payload));
    if (Number(data.exp) <= Math.floor(Date.now()/1000)) return null;
    if (expectedPrefix && !String(data.sub || '').startsWith(expectedPrefix)) return null;
    return data;
  } catch { return null; }
};
const cookieValue = (req, name, token, maxAge) => {
  const forwarded = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  const secure = IS_PRODUCTION || forwarded === 'https' || Boolean(req.socket.encrypted);
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
};
const readCookie = (req, name) => {
  const match = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
};
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN', ...headers,
  });
  res.end(JSON.stringify(body));
};
const readBody = (req, maxBytes = 1024*1024) => new Promise((resolveBody, rejectBody) => {
  let data=''; let bytes=0; let rejected=false;
  req.on('data', (chunk) => {
    if (rejected) return; bytes += chunk.length;
    if (bytes > maxBytes) { rejected=true; rejectBody(new Error('payload-too-large')); return; }
    data += chunk;
  });
  req.on('end',()=>{ if(!rejected) resolveBody(data); }); req.on('error',rejectBody);
});
async function readJson(req, maxBytes) { return JSON.parse((await readBody(req,maxBytes)) || '{}'); }

function clientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(); }
const loginAttempts = new Map();
function checkLoginRate(req) {
  const ip=clientIp(req); const now=Date.now(); const windowMs=15*60*1000; const current=loginAttempts.get(ip);
  if (!current || current.resetAt <= now) { loginAttempts.set(ip,{count:0,resetAt:now+windowMs}); return {ok:true,ip}; }
  if (current.count >= 5) return {ok:false,ip,retryAfter:Math.ceil((current.resetAt-now)/1000)};
  return {ok:true,ip};
}
function recordLoginFailure(ip){ const current=loginAttempts.get(ip) || {count:0,resetAt:Date.now()+15*60*1000}; current.count += 1; loginAttempts.set(ip,current); }
function clearLoginFailures(ip){ loginAttempts.delete(ip); }
const publicRateBuckets = new Map();
function checkPublicRate(req, bucket, limit, windowMs) {
  const key=`${bucket}:${clientIp(req)}`; const now=Date.now(); const current=publicRateBuckets.get(key);
  if(!current || current.resetAt<=now){ publicRateBuckets.set(key,{count:1,resetAt:now+windowMs}); return {ok:true}; }
  if(current.count>=limit) return {ok:false,retryAfter:Math.ceil((current.resetAt-now)/1000)};
  current.count+=1; publicRateBuckets.set(key,current); return {ok:true};
}
function enforcePublicRate(req,res,bucket,limit,windowMs){ const r=checkPublicRate(req,bucket,limit,windowMs); if(r.ok)return true; json(res,429,{error:'Demasiadas solicitudes. Intenta nuevamente más tarde.'},{'Retry-After':String(r.retryAfter)}); return false; }
function requireAdmin(req,res){ const data=verifyToken(readCookie(req,ADMIN_COOKIE),'admin'); if(!data){json(res,401,{error:'Sesión administrativa requerida'});return null;} return data; }
function requireCustomer(req,res){ const data=verifyToken(readCookie(req,CUSTOMER_COOKIE),'customer:'); if(!data){json(res,401,{error:'Inicia sesión como cliente'});return null;} return String(data.sub).slice('customer:'.length); }
function sameOrigin(req){
  const origin=String(req.headers.origin||''); if(!origin) return true;
  try {
    const url=new URL(origin);
    if(!IS_PRODUCTION && ['127.0.0.1','localhost','::1'].includes(url.hostname)) return true;
    const forwardedHost=String(req.headers['x-forwarded-host']||'').split(',')[0].trim();
    const expectedHost=forwardedHost || String(req.headers.host||'');
    return url.host === expectedHost;
  } catch { return false; }
}
function requireSameOrigin(req,res){ if(['GET','HEAD','OPTIONS'].includes(req.method||'')) return true; if(sameOrigin(req)) return true; json(res,403,{error:'Origen no autorizado'}); return false; }

function hashPassword(password){ const salt=crypto.randomBytes(16).toString('hex'); const hash=crypto.scryptSync(String(password),salt,64).toString('hex'); return `${salt}:${hash}`; }
function verifyPassword(password, stored){ if(!stored || !stored.includes(':')) return false; const [salt,hash]=stored.split(':'); const calc=crypto.scryptSync(String(password),salt,64).toString('hex'); return safeEqual(calc,hash); }
function cleanCustomer(customer){ const { password:_password, accessCode:_accessCode, ...safe } = customer || {}; return safe; }
function normalizeCustomers(value){
  if(!Array.isArray(value)) return value;
  return value.map((customer)=>{
    if(customer?.id && customer?.password){ try { setCustomerPasswordHash(String(customer.id),hashPassword(String(customer.password))); } catch {} }
    return cleanCustomer(customer);
  });
}
function safeBusinessValue(key,value){ if(key==='lavanderiapro_customers') return normalizeCustomers(value); return value; }
function getCustomers(){ return getState('lavanderiapro_customers',[]); }
function findCustomer(identifier){ const value=String(identifier||'').trim().toLowerCase(); return getCustomers().find(c=>[c.email,c.fullName,c.phone,c.documentNumber].filter(Boolean).some(v=>String(v).trim().toLowerCase()===value)); }
function publicCustomer(c){ return cleanCustomer(c); }

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
function securityHeaders(req){
  const secure=IS_PRODUCTION || String(req.headers['x-forwarded-proto']||'').toLowerCase()==='https' || Boolean(req.socket.encrypted);
  return {
    'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'",
    ...(secure?{'Strict-Transport-Security':'max-age=31536000; includeSubDomains'}:{}),
  };
}
function sendFile(req,res,filePath,method='GET'){
  try{ const stat=statSync(filePath); if(!stat.isFile())return false; const ext=extname(filePath).toLowerCase(); const cache=ext==='.html'?'no-cache':'public, max-age=604800, immutable'; res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':cache,...securityHeaders(req)}); if(method==='HEAD'){res.end();return true;} res.end(readFileSync(filePath)); return true;}catch{return false;}
}

async function handleApi(req,res,pathname){
  if(!requireSameOrigin(req,res)) return;
  if(pathname==='/api/health' && req.method==='GET') return json(res,200,{ok:true,app:'LavaFlash',version:VERSION,mode:API_ONLY?'api':'full',database:{historyRows:databaseInfo().historyRows}});

  if(pathname==='/api/admin/login' && req.method==='POST'){
    const rate=checkLoginRate(req); if(!rate.ok) return json(res,429,{error:'Demasiados intentos. Intenta nuevamente más tarde.'},{'Retry-After':String(rate.retryAfter)});
    let payload; try{payload=await readJson(req,32768);}catch(e){return json(res,e?.message==='payload-too-large'?413:400,{error:'Solicitud inválida'});}
    const username=String(payload.username||'').trim(); const code=String(payload.code||'');
    if(!username||!code)return json(res,400,{error:'Completa usuario y código de acceso'});
    if(!safeEqual(username.toLowerCase(),adminUserName.toLowerCase())||!safeEqual(code,adminPassword)){recordLoginFailure(rate.ip);return json(res,401,{error:'Usuario o código incorrecto'});}
    clearLoginFailures(rate.ip); const token=makeToken('admin',SESSION_SECONDS);
    return json(res,200,{user:userPayload()},{'Set-Cookie':cookieValue(req,ADMIN_COOKIE,token,SESSION_SECONDS)});
  }
  if(pathname==='/api/admin/session' && req.method==='GET'){ if(!requireAdmin(req,res))return; return json(res,200,{user:userPayload()}); }
  if(pathname==='/api/admin/logout' && req.method==='POST') return json(res,200,{ok:true},{'Set-Cookie':cookieValue(req,ADMIN_COOKIE,'',0)});

  if(pathname==='/api/admin/state' && req.method==='GET'){
    if(!requireAdmin(req,res))return; const snapshot=getAllState(BUSINESS_KEYS); return json(res,200,{...snapshot,keys:BUSINESS_KEYS});
  }
  if(pathname==='/api/admin/state/bulk' && req.method==='POST'){
    if(!requireAdmin(req,res))return; let payload; try{payload=await readJson(req,12*1024*1024);}catch(e){return json(res,e?.message==='payload-too-large'?413:400,{error:'Datos inválidos'});}
    const incoming=payload?.state&&typeof payload.state==='object'?payload.state:{}; const safe={};
    for(const [key,value] of Object.entries(incoming)) if(BUSINESS_KEY_SET.has(key)) safe[key]=safeBusinessValue(key,value);
    const result=setManyState(safe); return json(res,200,{ok:true,updated:Object.keys(safe),revisions:result.revisions});
  }
  if(pathname.startsWith('/api/admin/state/') && req.method==='PUT'){
    if(!requireAdmin(req,res))return; const key=decodeURIComponent(pathname.slice('/api/admin/state/'.length)); if(!BUSINESS_KEY_SET.has(key))return json(res,400,{error:'Colección no permitida'});
    let payload; try{payload=await readJson(req,8*1024*1024);}catch(e){return json(res,e?.message==='payload-too-large'?413:400,{error:'Dato inválido'});}
    const value=safeBusinessValue(key,payload?.value);
    if(Number.isFinite(Number(payload?.revision))){
      const result=setStateIfRevision(key,value,Number(payload.revision));
      if(!result.ok) return json(res,409,{error:'Los datos cambiaron en otro dispositivo.',key,current:result.value,revision:result.revision});
      return json(res,200,{ok:true,key,revision:result.revision});
    }
    const result=setState(key,value); return json(res,200,{ok:true,key,revision:result.revision});
  }
  if(pathname==='/api/admin/history' && req.method==='GET'){ if(!requireAdmin(req,res))return; return json(res,200,{rows:getHistoryRows()}); }
  if(pathname==='/api/admin/history/import' && req.method==='POST'){
    if(!requireAdmin(req,res))return; let payload; try{payload=await readJson(req,20*1024*1024);}catch(e){return json(res,e?.message==='payload-too-large'?413:400,{error:'Archivo inválido'});}
    const rows=payload?.rows; if(payload?.version!==1||!Array.isArray(rows)||!rows.every(r=>Array.isArray(r)&&r.length===11)) return json(res,400,{error:'Formato de historial inválido'});
    const count=importHistory(rows); return json(res,200,{ok:true,count});
  }

  if(pathname==='/api/customer/register' && req.method==='POST'){
    if(!enforcePublicRate(req,res,'customer-register',5,60*60*1000))return;
    let p; try{p=await readJson(req,65536);}catch{return json(res,400,{error:'Solicitud inválida'});} const phone=String(p.phone||'').replace(/\D/g,''); const dni=String(p.dni||'').replace(/\D/g,''); const email=String(p.email||'').trim().toLowerCase().slice(0,180); const password=String(p.password||''); const fullName=String(p.fullName||'').trim().slice(0,120);
    if(!fullName||!/^\S+@\S+\.\S+$/.test(email)||!/^\d{9}$/.test(phone)||!/^\d{8}$/.test(dni)||password.length<8||password.length>128) return json(res,400,{error:'Revisa nombre, correo, celular, DNI y usa una contraseña de mínimo 8 caracteres.'});
    const now=new Date().toISOString(); const customer={id:`cust-web-${crypto.randomUUID()}`,documentType:'DNI',documentNumber:dni,fullName,phone,email,address:'Lima, Perú',reference:'Registro web LavaFlash',totalServicesCount:0,activeLoyaltyStamps:0,hasPendingVoucher:false,totalSpent:0,createdAt:now,updatedAt:now,authProvider:'LOCAL',clientType:'NATURAL'};
    try {
      mutateState('lavanderiapro_customers',[],(list)=>{ const next=Array.isArray(list)?list:[]; if(next.some(c=>String(c.email||'').toLowerCase()===email)) throw new Error('DUP_EMAIL'); if(next.some(c=>String(c.documentNumber||'')===dni)) throw new Error('DUP_DNI'); next.push(customer); return normalizeCustomers(next); });
    } catch (error) {
      if(error?.message==='DUP_EMAIL') return json(res,409,{error:'Ese correo ya está registrado.'});
      if(error?.message==='DUP_DNI') return json(res,409,{error:'Ese DNI ya está registrado.'});
      throw error;
    }
    setCustomerPasswordHash(customer.id,hashPassword(password)); const token=makeToken(`customer:${customer.id}`,CUSTOMER_SESSION_SECONDS); return json(res,201,{customer:publicCustomer(customer)},{'Set-Cookie':cookieValue(req,CUSTOMER_COOKIE,token,CUSTOMER_SESSION_SECONDS)});
  }
  if(pathname==='/api/customer/login' && req.method==='POST'){
    if(!enforcePublicRate(req,res,'customer-login',10,15*60*1000))return;
    let p; try{p=await readJson(req,32768);}catch{return json(res,400,{error:'Solicitud inválida'});} const customer=findCustomer(p.identifier); if(!customer||!verifyPassword(String(p.password||''),getCustomerPasswordHash(customer.id)))return json(res,401,{error:'Correo, DNI, celular o contraseña incorrectos.'}); const token=makeToken(`customer:${customer.id}`,CUSTOMER_SESSION_SECONDS); return json(res,200,{customer:publicCustomer(customer)},{'Set-Cookie':cookieValue(req,CUSTOMER_COOKIE,token,CUSTOMER_SESSION_SECONDS)});
  }
  if(pathname==='/api/customer/session' && req.method==='GET'){
    const data=verifyToken(readCookie(req,CUSTOMER_COOKIE),'customer:'); if(!data)return json(res,401,{error:'Sin sesión'}); const id=String(data.sub).slice('customer:'.length); const customer=getCustomers().find(c=>c.id===id); if(!customer)return json(res,401,{error:'Cliente no encontrado'}); return json(res,200,{customer:publicCustomer(customer)});
  }
  if(pathname==='/api/customer/logout' && req.method==='POST') return json(res,200,{ok:true},{'Set-Cookie':cookieValue(req,CUSTOMER_COOKIE,'',0)});
  if(pathname==='/api/customer/orders' && req.method==='GET'){
    const id=requireCustomer(req,res); if(!id)return; const customer=getCustomers().find(c=>c.id===id); if(!customer)return json(res,404,{error:'Cliente no encontrado'}); const orders=getState('lavanderiapro_orders',[]).filter(o=>o.customerId===id||o.customerDocument===customer.documentNumber||o.customerPhone===customer.phone); return json(res,200,{orders});
  }
  if(pathname==='/api/customer/orders' && req.method==='POST'){
    if(!enforcePublicRate(req,res,'customer-order',20,60*60*1000))return;
    const id=requireCustomer(req,res); if(!id)return;
    const customer=getCustomers().find(c=>c.id===id); if(!customer)return json(res,404,{error:'Cliente no encontrado'});
    let p; try{p=await readJson(req,262144);}catch{return json(res,400,{error:'Solicitud inválida'});}
    const now=new Date();
    const amount=Math.min(10000,Math.max(0,Number(p.total||0)));
    const qty=Math.min(100,Math.max(1,Number(p.quantity||1)));
    const item={
      id:`itm-web-${crypto.randomUUID()}`,
      serviceId:`web-${String(p.service?.title||'servicio').toLowerCase().replace(/\s+/g,'-')}`,
      serviceName:p.service?.title||'Servicio LavaFlash',
      category:p.service?.title==='Lavado por peso'?'AL_PESO':p.service?.title==='Teñido'?'TENIDO':p.service?.title==='Alfombras'?'ALFOMBRAS':'AL_SECO',
      quantity:qty,
      unitPrice:Number(p.service?.unitPrice||amount||0),
      subtotal:Math.max(0,Number((amount+Number(p.discountAmount||0)).toFixed(2))),
      weightKg:Number(p.weightKg||0)||undefined,
      notes:'Pedido registrado desde portal web',
      isDelivered:false,
    };
    const promised=new Date(now.getTime()+48*60*60*1000);
    let order;
    mutateState('lavanderiapro_orders',[],(list)=>{
      const next=Array.isArray(list)?list:[];
      let code;
      do {
        code=`ORD-${now.getFullYear()}-${crypto.randomInt(100000,999999)}`;
      } while(next.some(o=>o.code===code));
      order={
        id:`ord-web-${crypto.randomUUID()}`,code,
        customerId:customer.id,customerName:customer.fullName,customerDocument:customer.documentNumber||'',customerPhone:customer.phone||'',
        voucherType:'TICKET_RECOJO',voucherNumber:`WEB-${String(code).split('-').at(-1)}`,
        receivedAt:now.toISOString(),promisedDeliveryAt:promised.toISOString(),items:[item],subtotal:item.subtotal,
        discountAmount:Number(p.discountAmount||0),discountReason:p.couponCode?`Cupón ${p.couponCode}`:undefined,loyaltyDiscountApplied:false,
        total:amount,paymentStatus:'PENDIENTE_FIADO',totalPaid:0,pendingBalance:amount,payments:[],preferredPaymentMethod:p.paymentMethod||'EFECTIVO',
        status:'RECIBIDO',statusHistory:[{status:'RECIBIDO',timestamp:now.toISOString(),userName:'Portal web',userRole:'MOSTRADOR',note:'Solicitud web pendiente de confirmación operativa.'}],
        observations:'Solicitud creada por el cliente desde la web. Confirmar prendas, precio final y método de pago antes de procesar.',
        whatsappNotificationSent:false,isDeliveryToHome:Boolean(p.pickup),deliveryAddress:p.pickup?p.address:undefined,deliveryReference:p.pickup?p.reference:undefined,
        deliveryDistrict:p.pickup?p.district:undefined,deliveryPreferredTime:p.pickup?p.preferredTime:undefined,deliveryStatus:p.pickup?'PENDIENTE':undefined,
        partialDeliveries:[],createdAt:now.toISOString(),updatedAt:now.toISOString(),createdBy:'Portal web',
      };
      next.push(order); return next;
    });
    return json(res,201,{order});
  }
  if(pathname==='/api/customer/claims' && req.method==='POST'){
    if(!enforcePublicRate(req,res,'customer-claim',10,60*60*1000))return;
    let p; try{p=await readJson(req,65536);}catch{return json(res,400,{error:'Solicitud inválida'});} const data=verifyToken(readCookie(req,CUSTOMER_COOKIE),'customer:'); const id=data?String(data.sub).slice('customer:'.length):null; const customer=id?getCustomers().find(c=>c.id===id):null; const now=new Date().toISOString(); const claim={id:`clm-web-${crypto.randomUUID()}`,orderId:'WEB',orderCode:'WEB',customerName:customer?.fullName||String(p.customerName||'Cliente web'),customerPhone:customer?.phone||String(p.customerPhone||''),itemDescription:'Solicitud desde la web',claimType:String(p.type||'ATENCION'),description:`${String(p.detail||'').slice(0,3000)}${p.request?` | Solicitud: ${String(p.request).slice(0,1500)}`:''}`,status:'REGISTRADO',registeredBy:'Portal web',createdAt:now}; mutateState('lavanderiapro_claims',[],(list)=>{ const next=Array.isArray(list)?list:[]; next.push(claim); return next; }); return json(res,201,{claim});
  }
  if(pathname==='/api/public/promotions' && req.method==='GET') return json(res,200,{promotions:getState('lavanderiapro_promotions',[]).filter(p=>p?.active!==false)});
  if(pathname==='/api/public/track-order' && req.method==='POST'){
    if(!enforcePublicRate(req,res,'order-track',40,15*60*1000))return;
    let p; try{p=await readJson(req,32768);}catch{return json(res,400,{error:'Solicitud inválida'});} const code=String(p.code||'').trim().toUpperCase(); const identifier=String(p.identifier||'').trim().toLowerCase().replace(/\s+/g,''); if(!code||!identifier)return json(res,400,{error:'Completa código e identificación'}); const order=getState('lavanderiapro_orders',[]).find(o=>String(o.code||'').trim().toUpperCase()===code); if(!order)return json(res,404,{error:'Pedido no encontrado'}); const allowed=[order.customerDocument,order.customerPhone].filter(Boolean).map(v=>String(v).toLowerCase().replace(/\s+/g,'')); if(!allowed.includes(identifier))return json(res,404,{error:'Pedido no encontrado'}); const safe={id:order.id,code:order.code,status:order.status,receivedAt:order.receivedAt,promisedDeliveryAt:order.promisedDeliveryAt,total:order.total,paymentStatus:order.paymentStatus,preferredPaymentMethod:order.preferredPaymentMethod,deliveryStatus:order.deliveryStatus,isDeliveryToHome:Boolean(order.isDeliveryToHome),statusHistory:order.statusHistory,items:(order.items||[]).map(i=>({serviceName:i.serviceName,quantity:i.quantity,isDelivered:i.isDelivered}))}; return json(res,200,{order:safe});
  }

  return json(res,404,{error:'Ruta API no encontrada'});
}

function safePathname(rawUrl='/'){try{return decodeURIComponent(new URL(rawUrl,'http://localhost').pathname);}catch{return null;}}

// Importa el historial incluido una sola vez, desde una carpeta no pública.
try { const count=importHistoryFileIfEmpty(join(ROOT,'data-import','historial_lavaflash.json')); if(count) console.log(`[LavaFlash] Historial inicial importado: ${count} filas.`); } catch(error) { console.warn('[LavaFlash] No se pudo importar historial inicial:',error?.message||error); }

const server=http.createServer(async(req,res)=>{
  const pathname=safePathname(req.url||'/'); if(pathname===null)return json(res,400,{error:'URL inválida'});
  if(pathname.startsWith('/api/')) {
    try { return await handleApi(req,res,pathname); }
    catch (error) {
      console.error('[LavaFlash] Error API:', error);
      if (!res.headersSent) return json(res,500,{error:'Error interno del servidor'});
      res.destroy(); return;
    }
  }
  if(API_ONLY)return json(res,404,{error:'Servidor de API LavaFlash'});
  if(!existsSync(DIST))return json(res,503,{error:'No existe dist/. Ejecuta npm run build antes de npm start.'});
  if(!['GET','HEAD'].includes(req.method||''))return json(res,405,{error:'Método no permitido'});
  if(pathname==='/admin'){res.writeHead(308,{Location:'/admin/',...securityHeaders(req)});return res.end();}
  const relativePath=normalize(pathname).replace(/^([/\\])+/,''); const candidate=resolve(DIST,relativePath||'index.html'); const relToDist=relative(DIST,candidate); const insideDist=relToDist===''||(!relToDist.startsWith('..')&&!relToDist.startsWith(`..${process.platform==='win32'?'\\':'/'}`)); if(insideDist&&sendFile(req,res,candidate,req.method))return;
  const fallback=pathname.startsWith('/admin/')?join(DIST,'admin','index.html'):join(DIST,'index.html'); if(sendFile(req,res,fallback,req.method))return; return json(res,404,{error:'Página no encontrada'});
});
server.on('error',(error)=>{if(error?.code==='EADDRINUSE')console.error(`[LavaFlash] El puerto ${PORT} ya está en uso.`);else console.error('[LavaFlash] Error del servidor:',error);process.exitCode=1;});
server.listen(PORT,'0.0.0.0',()=>{console.log(`[LavaFlash ${VERSION}] ${API_ONLY?'API':'sitio + API'} en http://127.0.0.1:${PORT}`); console.log(`[LavaFlash] Base central: ${databaseInfo().file}`); if(!IS_PRODUCTION&&adminPassword==='2026')console.warn('[LavaFlash] Desarrollo local: admin / 2026. Cambia la contraseña antes de publicar.');});
