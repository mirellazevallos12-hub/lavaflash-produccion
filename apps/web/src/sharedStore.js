const KEYS = {
  currentCustomer: 'lavaflash_client_session',
  orders: 'lavaflash_customer_orders_cache',
  promotions: 'lavaflash_public_promotions_cache',
}

const PROMO_SEED = [
  { id:'promo-web-4x3', code:'SECO4X3', name:'4x3 en ropa al seco', description:'Lleva 4 prendas y paga solo 3.', discountType:'PORCENTAJE', discountValue:25, applicableCategory:'AL_SECO', active:true, validUntil:'2026-12-31T23:59:59Z', timesUsed:0 },
  { id:'promo-web-3x2', code:'EDREDON3X2', name:'3x2 en edredones', description:'Lleva 3 edredones y paga solo 2.', discountType:'PORCENTAJE', discountValue:33.33, applicableCategory:'AL_PESO', active:true, validUntil:'2026-12-31T23:59:59Z', timesUsed:0 },
  { id:'promo-web-bienvenida', code:'BIENVENIDO10', name:'10% en tu primer servicio', description:'Beneficio de bienvenida para clientes nuevos.', discountType:'PORCENTAJE', discountValue:10, applicableCategory:'TODOS', active:true, validUntil:'2026-12-31T23:59:59Z', timesUsed:0 },
  { id:'promo-web-15', code:'LAVA15', name:'15 años de LavaFlash', description:'Promoción especial por nuestro mes de aniversario.', discountType:'PORCENTAJE', discountValue:15, applicableCategory:'TODOS', active:true, validUntil:'2026-11-28T23:59:59Z', timesUsed:0 },
]

const safeParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback } catch { return fallback }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials:'same-origin',
    cache:'no-store',
    ...options,
    headers:{'Content-Type':'application/json', ...(options.headers || {})},
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(payload?.error || `HTTP ${response.status}`))
  return payload
}

export function ensureSharedData() {
  const currentPromos = safeParse(localStorage.getItem(KEYS.promotions), [])
  if (!currentPromos.length) localStorage.setItem(KEYS.promotions, JSON.stringify(PROMO_SEED))
}

export function getCurrentCustomer() {
  return safeParse(localStorage.getItem(KEYS.currentCustomer), null)
}

export async function restoreCustomerSession() {
  try {
    const payload = await api('/api/customer/session')
    if (payload?.customer) {
      localStorage.setItem(KEYS.currentCustomer, JSON.stringify(payload.customer))
      return payload.customer
    }
  } catch {}
  localStorage.removeItem(KEYS.currentCustomer)
  return null
}

export async function loginCustomer(identifier, password) {
  try {
    const payload = await api('/api/customer/login', {
      method:'POST', body:JSON.stringify({identifier:String(identifier || ''), password:String(password || '')})
    })
    localStorage.setItem(KEYS.currentCustomer, JSON.stringify(payload.customer))
    return { success:true, customer:payload.customer }
  } catch (error) {
    return { success:false, error:String(error?.message || error) }
  }
}

export async function loginAdminFromWeb(username, code) {
  try {
    const payload = await api('/api/admin/login', {
      method:'POST',
      body:JSON.stringify({ username:String(username || '').trim(), code:String(code || '') })
    })
    return { success:true, user:payload.user }
  } catch (error) {
    return { success:false, error:String(error?.message || error) }
  }
}

export async function logoutCustomer() {
  try { await api('/api/customer/logout', {method:'POST'}) } catch {}
  localStorage.removeItem(KEYS.currentCustomer)
  localStorage.removeItem(KEYS.orders)
}

export async function registerCustomer(data) {
  try {
    const payload = await api('/api/customer/register', {
      method:'POST',
      body:JSON.stringify({fullName:data.fullName, email:data.email, phone:data.phone, dni:data.dni, password:data.password})
    })
    localStorage.setItem(KEYS.currentCustomer, JSON.stringify(payload.customer))
    return { success:true, customer:payload.customer }
  } catch (error) {
    return { success:false, error:String(error?.message || error) }
  }
}

export function getCustomerOrders(customer) {
  if (!customer) return []
  return safeParse(localStorage.getItem(KEYS.orders), [])
}

export async function refreshCustomerOrders(customer) {
  if (!customer) { localStorage.removeItem(KEYS.orders); return [] }
  try {
    const payload = await api('/api/customer/orders')
    const orders = Array.isArray(payload?.orders) ? payload.orders : []
    localStorage.setItem(KEYS.orders, JSON.stringify(orders))
    window.dispatchEvent(new Event('lavaflash-data-changed'))
    return orders
  } catch { return getCustomerOrders(customer) }
}

export function getSharedPromotions() {
  ensureSharedData()
  return safeParse(localStorage.getItem(KEYS.promotions), PROMO_SEED).filter(p => p.active !== false)
}

export async function refreshSharedPromotions() {
  try {
    const payload = await api('/api/public/promotions')
    const remote = Array.isArray(payload?.promotions) && payload.promotions.length ? payload.promotions : PROMO_SEED
    localStorage.setItem(KEYS.promotions, JSON.stringify(remote))
    return remote.filter(p => p.active !== false)
  } catch { return getSharedPromotions() }
}

export async function savePublicClaim({ customer, detail, request, type='ATENCION' }) {
  try {
    const payload = await api('/api/customer/claims', {
      method:'POST',
      body:JSON.stringify({customerName:customer?.fullName || '', customerPhone:customer?.phone || '', detail, request, type})
    })
    return payload.claim
  } catch (error) {
    throw new Error(String(error?.message || error))
  }
}

export async function createWebOrder({ customer, service, quantity=1, weightKg=0, total=0, pickup=false, address='', reference='', district='', preferredTime='', paymentMethod='EFECTIVO', couponCode='', discountAmount=0 }) {
  if (!customer) return { success:false, error:'Debes iniciar sesión para registrar un pedido.' }
  try {
    const payload = await api('/api/customer/orders', {
      method:'POST',
      body:JSON.stringify({service, quantity, weightKg, total, pickup, address, reference, district, preferredTime, paymentMethod, couponCode, discountAmount})
    })
    const cached = getCustomerOrders(customer)
    localStorage.setItem(KEYS.orders, JSON.stringify([...cached.filter(o => o.id !== payload.order.id), payload.order]))
    window.dispatchEvent(new Event('lavaflash-data-changed'))
    return { success:true, order:payload.order }
  } catch (error) {
    return { success:false, error:String(error?.message || error) }
  }
}

export async function findOrderForTracking(code, identifier='') {
  try {
    const payload = await api('/api/public/track-order', {
      method:'POST', body:JSON.stringify({code:String(code || ''), identifier:String(identifier || '')})
    })
    return payload.order || null
  } catch { return null }
}
