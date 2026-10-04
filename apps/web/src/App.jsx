import React, { useEffect, useMemo, useState } from 'react'
import { ensureSharedData, getCurrentCustomer, getCustomerOrders, getSharedPromotions, loginCustomer, loginAdminFromWeb, logoutCustomer, registerCustomer, savePublicClaim, createWebOrder, findOrderForTracking, restoreCustomerSession, refreshCustomerOrders, refreshSharedPromotions } from './sharedStore'
import { legalCopy } from './content/legalContent'
import { GOOGLE_REVIEWS, promos, servicePromoSlides, services } from './content/siteContent'
import { DRY_CLEAN_CATEGORIES, DRY_CLEAN_PRICES } from './content/priceCatalog'
import { getAdminUrl, SITE } from './config/site'

const ADMIN_URL = getAdminUrl()

const Icon = ({ name, size = 22, strokeWidth = 2 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    truck: <><path d="M3 5h11v11H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    hanger: <><path d="M12 7a2 2 0 1 0-2-2"/><path d="m12 7-9 7a2 2 0 0 0 1.2 3.6h15.6A2 2 0 0 0 21 14z"/></>,
    washer: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h.01M11 6h6"/><circle cx="12" cy="14" r="5"/></>,
    droplet: <path d="M12 2s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11z"/>,
    rug: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 9h10M7 13h10M7 17h10"/></>,
    sofa: <><path d="M5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 1 2-2 2 2 0 0 1 2 2v4h10v-4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v6H3z"/><path d="M5 18v2M19 18v2"/></>,
    sparkle: <><path d="M12 3l1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></>,
    facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1z"/>,
    whatsapp: <><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5z"/><path d="M8.5 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .7.5 1 1.4 1.8 2.4 2.4.3.2.5.2.7 0l.8-.9c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .5-.2 1.4-.8 1.9-.6.5-1.5.8-2.5.5-1.4-.4-3.2-1.3-4.8-2.9-1.4-1.4-2.4-3.2-2.7-4.5-.3-1 .1-1.8.5-2.3z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    calculator: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h10v4H7zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    book: <><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 0-4 2z"/><path d="M4 4v16a4 4 0 0 1 4-4h12"/></>,
    receipt: <><path d="M5 3v18l2-1 2 1 3-1 3 1 2-1 2 1V3l-2 1-2-1-3 1-3-1-2 1z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    cookie: <><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="11" cy="16" r="1"/><path d="M17 5a3 3 0 0 0 2 4"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/><path d="M12 8H8.5A2.5 2.5 0 1 1 11 5.5V8Zm0 0h3.5A2.5 2.5 0 1 0 13 5.5V8Z"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
  }
  return <svg {...common}>{paths[name]}</svg>
}


const BrandLogo = ({ compact = false }) => (
  <div className={`brand-logo brand-logo-image-wrap ${compact ? 'compact' : ''}`} aria-label="LavaFlash Lavanderías - Dry Cleaner">
    <img className="brand-logo-image" src={SITE.logo} alt="LavaFlash Lavanderías - Dry Cleaner" />
  </div>
)



const maskEmail = (value = '') => {
  const email = String(value || '').trim()
  if (!email || !email.includes('@')) return email
  const [user, domain] = email.split('@')
  const safeUser = user.length <= 3 ? `${user.slice(0,1)}***` : `${user.slice(0,3)}***${user.slice(-1)}`
  return `${safeUser}@${domain}`
}

const maskPhone = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 4) return `${digits.slice(0,2)}**`
  return `${digits.slice(0,3)}***${digits.slice(-3)}`
}

const maskDocument = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 4) return `${digits.slice(0,1)}***`
  return `${digits.slice(0,2)}****${digits.slice(-2)}`
}

const maskAddress = (value = '') => {
  const text = String(value || '').trim()
  if (!text) return 'Dirección protegida'
  const parts = text.split(',').map(s => s.trim()).filter(Boolean)
  const main = parts[0] || text
  const visible = main.length <= 12 ? `${main.slice(0,6)}...` : `${main.slice(0,12)}...`
  return parts.length > 1 ? `${visible}, ${parts.slice(1).join(', ')}` : `${visible}`
}

function App() {
  const [page, setPage] = useState('home')
  const [selectedService, setSelectedService] = useState(1)
  const [quantity, setQuantity] = useState(5)
  const [weight, setWeight] = useState(2.5)
  const [pickup, setPickup] = useState(false)
  const [legalModal, setLegalModal] = useState(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimCode, setClaimCode] = useState('')
  const [customer, setCustomer] = useState(() => getCurrentCustomer())
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getCurrentCustomer()))
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [promoFilter, setPromoFilter] = useState('Todos')
  const [profileTab, setProfileTab] = useState('perfil')
  const [clock, setClock] = useState(new Date())
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [servicePromoIndex, setServicePromoIndex] = useState(0)
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [trackingResult, setTrackingResult] = useState(null)
  const [trackingError, setTrackingError] = useState('')
  const [sharedPromos, setSharedPromos] = useState(() => getSharedPromotions())
  const [priceCategory, setPriceCategory] = useState('AL_SECO')
  const [priceSearch, setPriceSearch] = useState('')
  const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem('lavaflash_cookie_consent') || '')
  const onlyDigits = (value, max) => value.replace(/\D/g, '').slice(0, max)

  useEffect(() => {
    ensureSharedData()
    const clockTimer = setInterval(() => setClock(new Date()), 1000)
    const carouselTimer = setInterval(() => setCarouselIndex(i => (i + 1) % 3), 6500)
    const servicePromoTimer = setInterval(() => setServicePromoIndex(i => (i + 1) % 3), 5600)
    const promoSyncTimer = setInterval(() => { void refreshSharedPromotions().then(setSharedPromos) }, 30000)
    const sync = () => { const c = getCurrentCustomer(); setCustomer(c); setIsLoggedIn(Boolean(c)); setSharedPromos(getSharedPromotions()) }
    window.addEventListener('storage', sync)
    window.addEventListener('lavaflash-data-changed', sync)
    void restoreCustomerSession().then((c) => { setCustomer(c); setIsLoggedIn(Boolean(c)); if (c) void refreshCustomerOrders(c).then(() => window.dispatchEvent(new Event('lavaflash-data-changed'))) })
    void refreshSharedPromotions().then(setSharedPromos)
    return () => { clearInterval(clockTimer); clearInterval(carouselTimer); clearInterval(servicePromoTimer); clearInterval(promoSyncTimer); window.removeEventListener('storage', sync); window.removeEventListener('lavaflash-data-changed', sync) }
  }, [])

  const profileData = useMemo(() => customer ? ({
    nombre: customer.fullName || 'Cliente LavaFlash',
    correo: maskEmail(customer.email || ''),
    celular: maskPhone(customer.phone || ''),
    dni: maskDocument(customer.documentNumber || ''),
    direccion: maskAddress(customer.address || 'Lima, Perú')
  }) : ({ nombre:'Cliente LavaFlash', correo:'', celular:'', dni:'', direccion:'Dirección protegida' }), [customer])
  const customerOrders = useMemo(() => getCustomerOrders(customer), [customer, page, profileTab])
  useEffect(() => { if (customer) void refreshCustomerOrders(customer).then(() => window.dispatchEvent(new Event('lavaflash-data-changed'))) }, [customer?.id, page, profileTab])
  const limaTime = useMemo(() => new Intl.DateTimeFormat('es-PE', { timeZone:'America/Lima', hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(clock), [clock])
  const limaDate = useMemo(() => new Intl.DateTimeFormat('es-PE', { timeZone:'America/Lima', weekday:'short', day:'2-digit', month:'short', year:'numeric' }).format(clock), [clock])

  const current = services[selectedService]
  const isDryClean = current.title === 'Lavado al seco'
  const isDye = current.title === 'Teñido'
  const isWeightService = current.title === 'Lavado por peso'
  const isAreaService = current.title === 'Alfombras'
  const isSeatService = current.title === 'Muebles'
  const isDeliveryService = current.title === 'Delivery'
  const quantityMax = isAreaService ? 30 : isSeatService ? 8 : isDeliveryService ? 5 : 12
  const estimatorAmount = isWeightService ? weight : quantity
  const weightServiceCost = isWeightService ? (Number(weight) < 3 ? 12 : Number(weight) * 4.5) : 0
  const baseCost = Number((isDryClean ? 0 : isWeightService ? weightServiceCost : isDye ? quantity * current.unitPrice : isDeliveryService ? 40 : estimatorAmount * current.unitPrice).toFixed(2))
  const pickupCost = (pickup && !isDeliveryService) ? 5 : 0
  const total = Number((baseCost + pickupCost).toFixed(2))
  const priceRows = useMemo(() => {
    const q = priceSearch.trim().toLocaleLowerCase('es-PE')
    return DRY_CLEAN_PRICES.filter((item) => item.category === priceCategory && (!q || item.name.toLocaleLowerCase('es-PE').includes(q)))
  }, [priceCategory, priceSearch])
  const functionalConsent = cookieConsent === 'functional'
  const saveCookieConsent = (value) => { localStorage.setItem('lavaflash_cookie_consent', value); setCookieConsent(value) }
  const linkedPromos = useMemo(() => promos.map(p => {
    const linked = sharedPromos.find(x => x.code === p.code)
    return linked ? { ...p, title: linked.name || p.title, text: linked.description || p.text, active: linked.active !== false } : { ...p, active: true }
  }).filter(p => p.active), [sharedPromos])
  const featuredPromos = [linkedPromos.find(p => p.code === 'SECO4X3'), linkedPromos.find(p => p.code === 'EDREDON3X2'), linkedPromos.find(p => p.code === 'LAVA15')].filter(Boolean)
  const filteredPromos = promoFilter === 'Todos' ? featuredPromos : featuredPromos.filter((p) => p.category === promoFilter)



  const money = useMemo(() => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }), [])

  const scrollToId = (id) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)

  const navigate = (target) => {
    const pages = { nosotros: 'about', about: 'about', servicios: 'services', services: 'services', promociones: 'promotions', promotions: 'promotions', login: 'login', registro: 'register', register: 'register', perfil: 'profile', profile: 'profile' }
    if (pages[target]) {
      setAuthError('')
      setPage(pages[target])
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setPage('home')
    scrollToId(target)
  }

  const openService = (index) => {
    setSelectedService(index)
    setQuantity(services[index].minQty || 1)
    setWeight(index === 1 ? 5 : 1)
    setPage('services')
    scrollToId('detalle-servicio')
  }

  const submitClaim = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const code = `LF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const record = Object.fromEntries(form.entries())
    try { await savePublicClaim({ customer, detail: String(record.detalle || ''), request: String(record.solicitud || ''), type: 'ATENCION' }); setClaimCode(code) } catch { setClaimCode('ERROR') }
    e.currentTarget.reset()
  }

  const handleCustomerLogin = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const identifier = String(fd.get('correo') || '').trim()
    const password = String(fd.get('password') || '')

    const adminResult = await loginAdminFromWeb(identifier, password)
    if (adminResult.success) {
      setAuthError('')
      window.location.href = ADMIN_URL
      return
    }

    const result = await loginCustomer(identifier, password)
    if (!result.success) {
      const adminError = String(adminResult.error || '')
      const useAdminMessage = adminError && !adminError.includes('incorrecto') && !adminError.includes('incorrectos')
      setAuthError(useAdminMessage ? adminError : (result.error || 'Correo, DNI, celular o contraseña incorrectos.'))
      return
    }
    const found = result.customer
    setAuthError(''); setCustomer(found); setIsLoggedIn(true); setPage('profile'); setProfileTab('perfil'); window.scrollTo({top:0})
  }

  const handleCustomerRegister = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const result = await registerCustomer({
      fullName:String(fd.get('nombre') || ''), email:String(fd.get('correo') || ''), phone:String(fd.get('celular') || ''),
      dni:String(fd.get('dni') || ''), password:String(fd.get('password') || '')
    })
    if (!result.success) { setAuthError(result.error || 'No se pudo crear la cuenta.'); return }
    setAuthError(''); setCustomer(result.customer); setIsLoggedIn(true); setPage('profile'); setProfileTab('perfil'); window.scrollTo({top:0})
  }

  const openOrderRequest = () => {
    if (!customer) { setAuthError('Inicia sesión para solicitar un servicio y hacer seguimiento.'); navigate('login'); return }
    setOrderResult(null)
    setOrderOpen(true)
  }

  const handleServicePromoAction = (slide) => {
    if (slide.action === 'promotions') { navigate('promociones'); return }
    const index = Number(slide.serviceIndex ?? 0)
    setSelectedService(index)
    setQuantity(services[index].minQty || 1)
    setWeight(index === 1 ? 5 : 1)
    setPickup(false)
    setTimeout(() => openOrderRequest(), 40)
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const method = String(fd.get('paymentMethod') || 'EFECTIVO')
    const address = String(fd.get('address') || customer?.address || '')
    const reference = String(fd.get('reference') || '')
    const district = String(fd.get('district') || '')
    const preferredTime = String(fd.get('preferredTime') || '')
    const coupon = appliedCoupon || ''
    let discount = 0
    if (coupon === 'LAVA15') discount = total * 0.15
    if (coupon === 'SECO4X3' && current.title === 'Lavado al seco' && quantity >= 4) discount = current.unitPrice
    const finalTotal = Math.max(0, Number((total - discount).toFixed(2)))
    const result = await createWebOrder({
      customer,
      service: current,
      quantity: isWeightService ? Number(weight) : Number(quantity),
      weightKg: isWeightService ? Number(weight) : 0,
      total: finalTotal,
      pickup: isDeliveryService ? true : pickup,
      address,
      reference,
      district,
      preferredTime,
      paymentMethod: method,
      couponCode: coupon,
      discountAmount: Number(discount.toFixed(2))
    })
    if (!result.success) { setAuthError(result.error || 'No se pudo registrar el pedido.'); return }
    setOrderResult(result.order)
  }

  const handleTrack = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const found = await findOrderForTracking(fd.get('code'), fd.get('identifier'))
    if (!found) { setTrackingResult(null); setTrackingError('No encontramos un pedido con ese código y DNI/celular. Revisa los datos e inténtalo otra vez.'); return }
    setTrackingError('')
    setTrackingResult(found)
  }

  const orderSteps = ['RECIBIDO','EN_LAVADO','EN_SECADO','EN_CONTROL_CALIDAD','LISTO_PARA_ENTREGA','ENTREGADO']
  const statusLabel = (status) => ({
    RECIBIDO:'Pedido recibido', EN_LAVADO:'En lavado', EN_SECADO:'En secado', EN_CONTROL_CALIDAD:'Control de calidad',
    LISTO_PARA_ENTREGA:'Listo para entrega', ENTREGADO:'Entregado', ENTREGA_PARCIAL:'Entrega parcial'
  }[status] || String(status || 'RECIBIDO').replaceAll('_',' '))


  const carouselSlides = [
    {
      image:'/banners/anniversary-right-clean.webp', eyebrow:'15 AÑOS JUNTO A TI', title:'Celebramos 15 años', accent:'cuidando cada prenda',
      text:'Mes de aniversario con beneficios especiales, promociones exclusivas y el mismo cuidado profesional de siempre.',
      cta:'Ver promociones', target:'promociones', secondaryLabel:'Conocer servicios', secondaryTarget:'servicios', tone:'anniversary'
    },
    {
      image:'/services/dryclean-clean.webp', eyebrow:'SERVICIOS LAVAFLASH', title:'Tu ropa limpia, fresca', accent:'y lista a tiempo',
      text:'Lavado por peso, al seco, teñido, alfombras y muebles con atención especializada y simulador de costo.',
      cta:'Ver servicios', target:'servicios', secondaryLabel:'Calcular pedido', secondaryTarget:'servicios', tone:'service'
    },
    {
      image:'/services/delivery-clean.webp', eyebrow:'SEGUIMIENTO Y COMODIDAD', title:'Haz tu pedido online', accent:'y sigue su estado',
      text:'Solicita tu servicio, elige método de pago preferido y consulta el estado del pedido con tu código y DNI o celular.',
      cta:'Solicitar servicio', target:'servicios', secondaryLabel:'Rastrear pedido', secondaryTarget:'seguimiento', tone:'delivery'
    }
  ]
  const activeSlide = carouselSlides[carouselIndex]

  const aboutValues = [
    { icon:'shield', title:'Confianza', text:'Construimos relaciones duraderas, siendo honestos, transparentes y fieles a nuestra palabra.' },
    { icon:'sparkle', title:'Calidad', text:'Cuidamos cada detalle en nuestros procesos para brindar resultados impecables.' },
    { icon:'check', title:'Responsabilidad', text:'Trabajamos de forma comprometida con nuestros clientes, nuestro equipo y el entorno.' },
    { icon:'clock', title:'Puntualidad', text:'Respetamos tu tiempo y trabajamos para cumplir los plazos de entrega acordados.' },
    { icon:'user', title:'Atención personalizada', text:'Escuchamos tus necesidades y ofrecemos soluciones a tu medida, con un trato cercano y amable.' }
  ]

  const trustedBrands = [
    { name:'Nutrilis S.A.C.', logo:'/about/partners/nutrilis-sac.png' },
    { name:'Casa del Leñador', logo:'/about/partners/casa-del-lenador.png' },
    { name:'GEPA Construcciones', logo:'/about/partners/gepa-construcciones.png' },
    { name:'Comisión Intercambio', logo:'/about/partners/comision-intercambio.png' }
  ]

  return (
    <div className={`site page-${page} ${page === 'services' ? 'service-view' : page === 'home' ? 'home-view' : ''}`}>
      <div className="topbar pro-topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span><Icon name="clock" size={14}/> <b>{limaTime}</b> · {limaDate}</span>
            <span><Icon name="pin" size={14}/> Lima, Perú</span>
            <span className="desktop-only"><Icon name="phone" size={14}/> {SITE.phone}</span>
          </div>
          <a className="topbar-admin-link" href={ADMIN_URL} title="Acceso para personal autorizado"><Icon name="lock" size={13}/> Acceso administrativo</a>
        </div>
      </div>

      <header className="header">
        <div className="container nav-wrap">
          <button className="logo-button" onClick={() => navigate('inicio')} aria-label="Ir al inicio">
            <BrandLogo compact/>
          </button>
          <nav className="nav">
            <button className={page === 'home' ? 'active' : ''} onClick={() => navigate('inicio')}>Inicio</button>
            <button className={page === 'about' ? 'active' : ''} onClick={() => navigate('nosotros')}>Nosotros</button>
            <button className={page === 'services' ? 'active' : ''} onClick={() => navigate('servicios')}>Servicios</button>
            <button className={page === 'promotions' ? 'active' : ''} onClick={() => navigate('promociones')}>Promociones</button>
            <button onClick={() => navigate('contacto')}>Contacto</button>
          </nav>
          <div className="header-actions">
            <button className="track-button" onClick={() => { setTrackingResult(null); setTrackingError(''); setTrackingOpen(true) }} aria-label="Consultar estado de pedido" title="Consultar pedido"><Icon name="search" size={18}/><span>Seguimiento</span></button>
            <button className="account-button" onClick={() => navigate(isLoggedIn ? 'perfil' : 'login')}><Icon name="user" size={18}/><span>{isLoggedIn ? 'Mi perfil' : 'Ingresar'}</span></button>
            <button className="primary small header-cta-clean" onClick={() => { setPage('services'); setTimeout(openOrderRequest, 60) }}>Solicitar servicio</button>
          </div>
        </div>
      </header>

      {page === 'home' ? (
        <main>
          <section id="inicio" className={`hero pro-carousel ${activeSlide.tone}`}>
            <div className="carousel-media" style={{backgroundImage:`url('${activeSlide.image}')`}} aria-hidden="true"/>
            <div className="hero-overlay"/>
            <div className="container hero-inner">
              <div className="hero-copy carousel-copy">
                <p className="eyebrow">{activeSlide.eyebrow}</p>
                <h1>{activeSlide.title}<br/><span>{activeSlide.accent}</span></h1>
                <p className="hero-text">{activeSlide.text}</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => navigate(activeSlide.target)}>{activeSlide.cta} <Icon name="arrow" size={18}/></button>
                  <button className="secondary" onClick={() => navigate(activeSlide.secondaryTarget)}>{activeSlide.secondaryLabel}</button>
                </div>
              </div>
            </div>
          </section>

          <section id="servicios" className="section services-section">
            <div className="container">
              <div className="section-head row-head">
                <div><p className="eyebrow teal">NUESTROS SERVICIOS</p><h2>Soluciones de limpieza para todo lo que importa</h2></div>
                <button className="link-button" onClick={() => navigate('servicios')}>Ver todos los servicios <Icon name="arrow" size={17}/></button>
              </div>
              <div className="service-grid">
                {services.map((s, i) => (
                  <article className="service-card" key={s.title}>
                    <img src={s.image} alt={s.title}/>
                    <div className="service-body">
                      <div className="service-card-topline"><div className="service-icon"><Icon name={s.icon} size={22}/></div><span className="service-card-tag">{s.tag}</span></div>
                      <h3>{s.title}</h3><p>{s.short}</p>
                      <button className="service-more" onClick={() => openService(i)}>Ver más <Icon name="arrow" size={15}/></button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="promociones" className="home-promo-strip-section" aria-label="Promociones destacadas">
            <div className="home-promo-strip-carousel">
              <div className="home-promo-strip-track" style={{'--promo-index': servicePromoIndex}}>
                {servicePromoSlides.map((slide) => (
                  <button
                    type="button"
                    key={slide.id}
                    className="home-promo-strip-card"
                    aria-label={slide.alt}
                    onClick={() => handleServicePromoAction(slide)}
                  >
                    <picture>
                      <source media="(max-width: 700px)" srcSet={slide.mobileImage}/>
                      <img src={slide.image} alt={slide.alt}/>
                    </picture>
                  </button>
                ))}
              </div>
            </div>
            <div className="home-promo-strip-dots" aria-label="Cambiar promoción">
              {servicePromoSlides.map((slide, i) => (
                <button
                  type="button"
                  key={slide.id}
                  className={servicePromoIndex === i ? 'active' : ''}
                  aria-label={`Ver promoción ${i + 1}`}
                  onClick={() => setServicePromoIndex(i)}
                />
              ))}
            </div>
          </section>

          <section id="como-funciona" className="section steps-section"><div className="container">
            <p className="eyebrow teal">ASÍ DE FÁCIL</p><h2>Cómo funciona</h2>
            <div className="steps">
              <div className="step"><span className="number">1</span><div className="step-icon"><Icon name="message" size={30}/></div><div><h3>Solicita tu servicio</h3><p>Por teléfono, WhatsApp o desde nuestro formulario.</p></div></div>
              <div className="arrow"><Icon name="arrow" size={30}/></div>
              <div className="step"><span className="number">2</span><div className="step-icon"><Icon name="truck" size={32}/></div><div><h3>Recogemos tus prendas</h3><p>Vamos a tu domicilio en el horario que prefieras.</p></div></div>
              <div className="arrow"><Icon name="arrow" size={30}/></div>
              <div className="step"><span className="number">3</span><div className="step-icon"><Icon name="sparkle" size={32}/></div><div><h3>Lavamos y entregamos</h3><p>Cuidamos cada detalle y te las devolvemos como nuevas.</p></div></div>
            </div>
          </div></section>

          <section className="home-values-showcase" aria-labelledby="home-values-title">
            <div className="container">
              <div className="home-showcase-head">
                <div>
                  <p className="eyebrow teal">LO QUE NOS REPRESENTA</p>
                  <h2 id="home-values-title">Nuestros Valores</h2>
                  <p>La forma en que cuidamos cada prenda también refleja la forma en que cuidamos a nuestros clientes.</p>
                </div>
                <button className="home-showcase-link" onClick={() => navigate('nosotros')}>Conoce más de nosotros <Icon name="arrow" size={16}/></button>
              </div>
              <div className="home-values-grid">
                {aboutValues.map((value) => (
                  <article className="home-value-card" key={`home-${value.title}`}>
                    <span className="home-value-icon"><Icon name={value.icon} size={24}/></span>
                    <div><h3>{value.title}</h3><p>{value.text}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="home-brands-showcase" aria-labelledby="home-brands-title">
            <div className="container home-brands-shell">
              <div className="home-brands-copy">
                <p className="eyebrow teal">CONFIANZA EMPRESARIAL</p>
                <h2 id="home-brands-title">Marcas que trabajan con nosotros</h2>
                <p>Atendemos a empresas e instituciones que confían en LAVA FLASH para el cuidado profesional de sus prendas y textiles.</p>
                <div className="home-brands-mini-trust">
                  <span><Icon name="shield" size={17}/> 15 años de experiencia</span>
                  <span><Icon name="check" size={17}/> Atención responsable</span>
                </div>
              </div>
              <div className="home-brands-grid">
                {trustedBrands.map((brand) => (
                  <article className="home-brand-card" key={`home-${brand.name}`}>
                    <img src={brand.logo} alt={`Logo de ${brand.name}`}/>
                    <span>{brand.name}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="opiniones" className="section reviews-section reviews-v86"><div className="container">
            <div className="reviews-v86-shell">
              <div className="reviews-v86-copy">
                <p className="eyebrow teal">OPINIONES REALES EN GOOGLE</p>
                <h2>La experiencia de nuestros clientes también cuenta.</h2>
                <p>Consulta directamente en Google las opiniones públicas de LavaFlash, con su fecha y valoración original.</p>
                <div className="reviews-v86-scoreline">
                  <div className="reviews-v86-rating"><strong>{GOOGLE_REVIEWS.rating.toFixed(1)}</strong><span>de 5</span></div>
                  <div><div className="google-stars" aria-label={`${GOOGLE_REVIEWS.rating} de 5 estrellas`}><span>★★★★★</span><span style={{width:`${(GOOGLE_REVIEWS.rating/5)*100}%`}}>★★★★★</span></div><small>{GOOGLE_REVIEWS.count} reseñas públicas en Google</small></div>
                </div>
                <div className="reviews-v86-actions">
                  <a className="primary" href={GOOGLE_REVIEWS.mapsUrl} target="_blank" rel="noreferrer">Leer opiniones reales <Icon name="arrow" size={16}/></a>
                  <a className="secondary" href={GOOGLE_REVIEWS.writeReviewUrl} target="_blank" rel="noreferrer">Escribir una opinión</a>
                </div>
                <small className="reviews-v86-verified"><Icon name="shield" size={14}/> Información pública verificada el {GOOGLE_REVIEWS.verifiedAt}. La puntuación puede variar con nuevas reseñas.</small>
              </div>
              <div className="reviews-v86-visual">
                <img src="/services/towels-clean.webp" alt="Prendas limpias LavaFlash"/>
                <div className="reviews-v86-google-card">
                  <span className="reviews-v86-google-g">G</span>
                  <div><b>Google Reviews</b><small>Opiniones públicas y verificables</small></div>
                </div>
                <div className="reviews-v86-badge"><Icon name="check" size={18}/><span><b>Reseñas reales</b><small>Consulta el contenido original en Google</small></span></div>
              </div>
            </div>
          </div></section>

          <section id="contacto" className="section contact-section"><div className="container contact-pro-layout">
            <div className="contact-pro-card">
              <p className="eyebrow teal">CONTÁCTANOS</p>
              <h2>Estamos aquí para ti</h2>
              <p className="muted">Coordina tu servicio, resuelve una consulta o revisa nuestra ubicación oficial antes de visitarnos.</p>
              <div className="contact-pro-actions">
                <a className="contact-action primary-contact" href={SITE.whatsappUrl} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={19}/><span><b>Escríbenos por WhatsApp</b><small>Atención directa para consultas y recojo</small></span></a>
                <a className="contact-action" href={SITE.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={19}/><span><b>{SITE.addressShort}</b><small>San Borja, Lima · Sede de atención</small></span></a>
                <a className="contact-action" href={SITE.phoneHref}><Icon name="phone" size={19}/><span><b>{SITE.phone}</b><small>{SITE.hours}</small></span></a>
              </div>
              <div className="location-note"><Icon name="clock" size={20}/><div><b>Horario de atención</b><span>Lunes a sábado · 8:00 a.m. a 8:00 p.m.</span></div></div>
              <a className="maps-link" href={SITE.mapsUrl} target="_blank" rel="noreferrer">Abrir ubicación en Google Maps <Icon name="arrow" size={16}/></a>
            </div>
            <div className="map-live-card">
              <div className="map-card-head"><div><p className="eyebrow teal">UBICACIÓN</p><h3>Encuéntranos en el mapa</h3></div><a href={SITE.mapsUrl} target="_blank" rel="noreferrer">Ver mapa completo</a></div>
              <div className="map-frame-wrap">{functionalConsent ? <iframe title="Ubicación LavaFlash" src={SITE.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen></iframe> : <div className="map-consent-placeholder"><Icon name="pin" size={30}/><b>Mapa externo desactivado</b><p>Activa las funciones externas para cargar Google Maps dentro de la página.</p><div><button type="button" onClick={() => saveCookieConsent('functional')}>Activar mapa</button><a href={SITE.mapsUrl} target="_blank" rel="noreferrer">Abrir Google Maps</a></div></div>}</div>
              <div className="map-meta"><span><Icon name="pin" size={17}/> Coordenadas: -12.1082563, -76.9932251</span><span>Ubicación vinculada a Google Maps</span></div>
            </div>
          </div></section>
        </main>
      ) : page === 'about' ? (
        <main className="about-page">
          <section className="about-hero" aria-labelledby="about-title">
            <img className="about-hero-image" src="/about/about-hero.webp" alt="Equipo de lavandería profesional preparando prendas limpias"/>
            <div className="about-hero-shade"/>
            <div className="container about-hero-content">
              <p className="eyebrow about-eyebrow">NOSOTROS</p>
              <h1 id="about-title">15 años cuidando tus prendas con dedicación</h1>
              <p>En <b>LAVA FLASH</b> creemos que cada prenda cuenta una historia. Por eso brindamos un servicio de lavandería profesional que combina experiencia, cuidado y una atención cercana para proteger lo que más valoras.</p>
              <div className="about-hero-actions">
                <button className="primary" onClick={() => navigate('servicios')}>Conocer servicios <Icon name="arrow" size={17}/></button>
                <button className="about-outline-button" onClick={() => navigate('contacto')}>Contáctanos</button>
              </div>
            </div>
          </section>

          <section className="about-highlights" aria-label="Datos destacados de LavaFlash">
            <div className="container about-highlights-grid">
              <article><strong>15</strong><div><b>Años de experiencia</b><span>Cuidando prendas con dedicación y procesos profesionales.</span></div></article>
              <article><span className="about-highlight-icon"><Icon name="shield" size={24}/></span><div><b>Cuidado responsable</b><span>Revisamos cada servicio con atención en cada etapa.</span></div></article>
              <article><span className="about-highlight-icon"><Icon name="user" size={24}/></span><div><b>Atención cercana</b><span>Servicio para hogares, empresas e instituciones.</span></div></article>
            </div>
          </section>

          <section className="about-purpose-section" aria-labelledby="about-purpose-title">
            <div className="container">
              <div className="about-purpose-heading">
                <p className="eyebrow teal">NUESTRA IDENTIDAD</p>
                <h2 id="about-purpose-title">Lo que hacemos hoy y lo que queremos construir</h2>
                <p>Misión y visión presentadas de forma clara, con imágenes limpias que representan el cuidado profesional de las prendas.</p>
              </div>
              <div className="about-purpose-grid">
                <article className="about-purpose-card mission-card">
                  <div className="about-purpose-media">
                    <img src="/about/mission-clean.webp" alt="Toallas limpias y ordenadas después de un servicio profesional de lavandería"/>
                  </div>
                  <div className="about-purpose-content">
                    <span className="about-purpose-icon"><Icon name="shield" size={27}/></span>
                    <div className="about-purpose-copy">
                      <p className="eyebrow teal">NUESTRA ESENCIA</p>
                      <h2>Misión</h2>
                      <p>Brindar un servicio de lavandería profesional y confiable, cuidando cada prenda con responsabilidad, procesos adecuados y una atención que genere confianza en nuestros clientes.</p>
                      <div className="about-purpose-points"><span><Icon name="check" size={14}/> Cuidado responsable</span><span><Icon name="check" size={14}/> Atención confiable</span></div>
                    </div>
                  </div>
                </article>
                <article className="about-purpose-card vision-card">
                  <div className="about-purpose-media">
                    <img src="/about/vision-clean.webp" alt="Prendas cuidadas y organizadas en una lavandería moderna"/>
                  </div>
                  <div className="about-purpose-content">
                    <span className="about-purpose-icon"><Icon name="eye" size={28}/></span>
                    <div className="about-purpose-copy">
                      <p className="eyebrow teal">HACIA DÓNDE VAMOS</p>
                      <h2>Visión</h2>
                      <p>Ser una empresa referente en servicios de lavandería, reconocida por la calidad, la innovación, la cercanía con el cliente y la mejora continua de nuestros procesos.</p>
                      <div className="about-purpose-points"><span><Icon name="sparkle" size={14}/> Innovación continua</span><span><Icon name="check" size={14}/> Calidad constante</span></div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className="about-values-section">
            <img className="about-values-bg" src="/about/about-values.webp" alt="" aria-hidden="true"/>
            <div className="container about-values-content">
              <div className="about-section-title"><p className="eyebrow teal">LO QUE NOS DEFINE</p><h2>Nuestros Valores</h2><p>Son la base de nuestro trabajo y nos impulsan a brindar una mejor experiencia en cada servicio.</p></div>
              <div className="about-values-grid">
                {aboutValues.map((value) => <article className="about-value-card" key={value.title}><span><Icon name={value.icon} size={27}/></span><h3>{value.title}</h3><p>{value.text}</p></article>)}
              </div>
            </div>
          </section>

          <section className="about-brands-section">
            <div className="container">
              <div className="about-section-title compact"><p className="eyebrow teal">CLIENTES EMPRESARIALES</p><h2>Marcas que confían en nosotros</h2><p>Empresas e instituciones que trabajan con LAVA FLASH.</p></div>
              <div className="about-brands-grid">
                {trustedBrands.map((brand) => <article className="about-brand-card" key={brand.name}><img src={brand.logo} alt={`Logo de ${brand.name}`}/><span>{brand.name}</span></article>)}
              </div>
              <div className="about-trust-strip">
                <div><Icon name="shield" size={22}/><span><b>Experiencia</b><small>15 años dedicados al cuidado profesional</small></span></div>
                <div><Icon name="sparkle" size={22}/><span><b>Cuidado</b><small>Procesos pensados para cada tipo de prenda</small></span></div>
                <div><Icon name="user" size={22}/><span><b>Cercanía</b><small>Atención personalizada para hogares y empresas</small></span></div>
              </div>
            </div>
          </section>
        </main>
      ) : page === 'services' ? (
        <main className="services-page">
          <section className="services-page-hero">
            <div className="container">
              <div className="services-title-row">
                <div><p className="eyebrow teal">NUESTROS SERVICIOS</p><h1>Soluciones de limpieza para todo lo que importa</h1></div>
                <button className="link-button" onClick={() => scrollToId('todos-servicios')}>Ver todos los servicios <Icon name="arrow" size={17}/></button>
              </div>

              <div id="todos-servicios" className="service-grid service-grid-page">
                {services.map((s, i) => (
                  <article className={`service-card service-card-page ${selectedService === i ? 'selected' : ''}`} key={s.title}>
                    <img src={s.image} alt={s.title}/>
                    <div className="service-body">
                      <div className="service-icon"><Icon name={s.icon} size={22}/></div>
                      <h3>{s.title}</h3><p>{s.short}</p>
                      <button className="service-more" onClick={() => openService(i)}>Ver más <Icon name="arrow" size={15}/></button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="detalle-servicio" className="service-detail-section">
            <div className="container service-detail-layout">
              <div className="service-detail-photo">
                <img src={current.detailImage || current.image} alt={current.title}/>
              </div>

              <div className="service-detail-copy">
                <span className="detail-kicker">SERVICIO DESTACADO</span>
                <h2>{current.title}</h2>
                <h3>{current.subtitle}</h3>
                <p>{current.description}</p>
                <div className="detail-info-grid">
                  <ul>{current.bullets.map((b) => <li key={b}><span><Icon name="check" size={14}/></span>{b}</li>)}</ul>
                  <div className="detail-price-box"><div><Icon name="receipt" size={18}/><span>{current.pricing}</span></div><div><Icon name="file" size={18}/><span>{current.minimum}</span></div><div><Icon name="clock" size={18}/><span>{current.delivery}</span></div></div>
                </div>
                <div className="detail-actions"><button className="primary" onClick={openOrderRequest}>Solicitar servicio <Icon name="arrow" size={17}/></button><a className="secondary" href={SITE.whatsappUrl} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={19}/> Consultar por WhatsApp</a></div>
              </div>

              {isDryClean ? (
                <aside className="service-price-catalog dryclean-price-catalog">
                  <div className="catalog-head">
                    <span className="catalog-head-icon"><Icon name="receipt" size={23}/></span>
                    <div><p className="eyebrow teal">PRECIOS VIGENTES</p><h3>Carta de precios</h3><p>Consulta lavado al seco, edredones y planchado. Busca por nombre de prenda para encontrarla más rápido.</p></div>
                  </div>
                  <div className="catalog-tabs">
                    {Object.entries(DRY_CLEAN_CATEGORIES).map(([key, label]) => <button type="button" className={priceCategory === key ? 'active' : ''} onClick={() => setPriceCategory(key)} key={key}>{label}</button>)}
                  </div>
                  <label className="catalog-search"><Icon name="search" size={17}/><input value={priceSearch} onChange={(e) => setPriceSearch(e.target.value)} placeholder="Buscar: abrigo, blusa, edredón, camisa..."/></label>
                  <div className="catalog-table" role="table" aria-label="Carta de precios LavaFlash">
                    <div className="catalog-row catalog-row-head" role="row"><span>Prenda / servicio</span><span>Entrega</span><span>Precio</span></div>
                    <div className="catalog-scroll">
                      {priceRows.length ? priceRows.map((item) => <div className="catalog-row" role="row" key={item.id}><span><b>{item.name}</b><small>Por {item.unit}</small></span><span>{item.deliveryTime}</span><strong>{money.format(item.price)}</strong></div>) : <div className="catalog-empty">No encontramos una prenda con ese nombre.</div>}
                    </div>
                  </div>
                  <div className="catalog-note"><Icon name="file" size={17}/><span><b>Importante:</b> el estado, material, aplicaciones y condiciones particulares de la prenda se revisan al recibirla. Las condiciones generales del servicio forman parte de la atención.</span></div>
                </aside>
              ) : isDye ? (
                <aside className="service-price-menu dye-price-menu">
                  <div className="price-menu-head"><span><Icon name="droplet" size={22}/></span><div><h3>Carta de precios de teñido</h3><p>Precios por tipo de prenda y colores disponibles.</p></div></div>
                  <div className="fabric-priority"><Icon name="check" size={17}/><div><b>Recomendado: 100% algodón</b><small>Las mezclas y otras fibras están sujetas a evaluación previa.</small></div></div>
                  <div className="dye-colors"><span>Colores disponibles</span><div><b className="dye-swatch black"></b><small>Negro</small><b className="dye-swatch navy"></b><small>Azul</small></div></div>
                  <div className="price-menu-list">
                    <div><span><b>Pantalón Jean / Dril</b><small>Negro o azul</small></span><strong>S/ 25.00</strong></div>
                    <div><span><b>Casaca / Polerón</b><small>Según composición de la tela</small></span><strong>S/ 32.00</strong></div>
                    <div><span><b>Otras prendas</b><small>Se revisan antes de aceptar el teñido</small></span><em>Evaluación</em></div>
                  </div>
                  <div className="price-menu-delivery"><Icon name="clock" size={18}/><span><b>Entrega en 10 días</b><small>El resultado final depende de la fibra, color original y estado de la prenda.</small></span></div>
                </aside>
              ) : (
                <aside className="cost-simulator elegant-estimator">
                  <div className="sim-head"><span><Icon name="calculator" size={22}/></span><div><h3>Simulador de precio</h3><p>{isDeliveryService ? 'El recojo a domicilio está disponible para pedidos desde S/ 40.00.' : 'Arrastra el control para indicar una cantidad o peso aproximado.'}</p></div></div>

                  {isDeliveryService ? <div className="delivery-minimum-card">
                    <span><Icon name="truck" size={22}/></span>
                    <div><small>MÍNIMO PARA RECOJO A DOMICILIO</small><strong>S/ 40.00</strong><p>El valor de los servicios solicitados debe ser de S/ 40.00 a más. Cobertura y horario sujetos a coordinación.</p></div>
                  </div> : isWeightService ? <div className="range-control-card">
                    <div className="range-label-row"><div><b>Peso aproximado</b><small>Desliza para elegir el peso de tus prendas.</small></div><strong>{Number(weight).toFixed(1)} kg</strong></div>
                    <input className="price-range" type="range" min="0.5" max="20" step="0.5" value={weight} onChange={(e) => setWeight(Number(e.target.value))}/>
                    <div className="range-marks"><span>0.5 kg</span><span>20 kg</span></div>
                  </div> : <div className="range-control-card">
                    <div className="range-label-row"><div><b>{isAreaService ? 'Metros cuadrados aprox.' : isSeatService ? 'Cantidad de asientos' : 'Cantidad de prendas'}</b><small>Desliza para ajustar la referencia.</small></div><strong>{quantity} {current.unit}</strong></div>
                    <input className="price-range" type="range" min={current.minQty || 1} max={quantityMax} step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}/>
                    <div className="range-marks"><span>{current.minQty || 1} {current.unit}</span><span>{quantityMax} {current.unit}</span></div>
                  </div>}

                  <div className="estimate-price-hero">
                    <span>{isDeliveryService ? 'Pedido mínimo' : 'Precio aproximado'}</span>
                    <strong>{money.format(baseCost)}</strong>
                    <small>{isDeliveryService ? 'Mínimo requerido para solicitar recojo a domicilio' : isWeightService ? (Number(weight) < 3 ? `${Number(weight).toFixed(1)} kg · tarifa mínima S/ 12.00` : `${Number(weight).toFixed(1)} kg × S/ 4.50`) : `${quantity} ${current.unit} × ${money.format(current.unitPrice)}`}</small>
                  </div>

                  {!isDeliveryService && <label className="pickup-line">
                    <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)}/>
                    <span><b>Recojo a domicilio</b><small>Opcional, sujeto a cobertura.</small></span>
                    <strong>+ S/ 5.00</strong>
                  </label>}

                  <div className="cost-summary slim-summary">
                    <div className="cost-total"><span>{isDeliveryService ? 'Mínimo requerido' : 'Total aprox.'}</span><strong>{money.format(total)}</strong></div>
                  </div>
                  <p className="sim-note">{isDeliveryService ? 'El recojo se coordina según zona de cobertura y disponibilidad.' : 'Precio referencial. El monto final se confirma al evaluar la prenda, material, medidas, nivel de suciedad y zona.'}</p>

                  {(isAreaService || isSeatService) && <div className="carpet-price-menu">
                    <div className="carpet-price-head"><span><Icon name="rug" size={19}/></span><div><b>Carta de precios de alfombras</b><small>Entrega de 15 a 20 días</small></div></div>
                    <div className="carpet-price-row"><span><b>Sintética / convencional</b><small>Lavado por m²</small></span><strong>S/ 18.00 <small>/ m²</small></strong></div>
                    <div className="carpet-price-row"><span><b>Persa / lana natural</b><small>Lavado artesanal y secado controlado</small></span><strong>S/ 30.00 <small>/ m²</small></strong></div>
                    <p>El precio final se confirma según medidas, material y estado de la alfombra.</p>
                  </div>}
                </aside>
              )}
            </div>
          </section>

          <section className="data-policy-section"><div className="container data-policy-card">
            <div className="policy-intro"><span className="policy-shield"><Icon name="file" size={26}/></span><div><h2>Condiciones Generales · texto original 2023</h2><p>Consulta el texto original de las Condiciones Generales de LAVA FLASH, documento 2023, sin resúmenes ni reinterpretaciones.</p></div></div>
            <div className="policy-points"><div><span><Icon name="check" size={20}/></span><b>Revisa tus prendas al recogerlas</b><p>Las condiciones indican que después del retiro no se aceptan reclamos posteriores.</p></div><div><span><Icon name="droplet" size={20}/></span><b>Informa las manchas al entregar</b><p>Sangre, orina, maquillaje, tinta u otras manchas deben anotarse en la orden de trabajo.</p></div><div><span><Icon name="washer" size={20}/></span><b>Servicio por peso</b><p>Incluye lavado, secado y doblado; no incluye planchado ni desmanchado.</p></div></div>
            <button className="policy-button" onClick={() => setLegalModal('terms')}>Ver condiciones completas <Icon name="arrow" size={15}/></button>
          </div></section>
        </main>
      ) : page === 'promotions' ? (
        <main className="promotions-page promotions-v86-page">
          <section className="promotions-v86-hero">
            <div className="container promotions-v86-hero-grid">
              <div className="promotions-v86-message">
                <span className="promotions-v86-pill"><Icon name="gift" size={16}/> BENEFICIOS LAVAFLASH</span>
                <h1>Promociones para cuidar más y pagar mejor.</h1>
                <p>Descubre campañas pensadas para tu ropa, tu hogar y nuestros clientes frecuentes. Elige la promoción que te conviene y reclámala desde tu cuenta.</p>
                <div className="promotions-v86-highlights"><span><Icon name="check" size={15}/> Beneficios claros</span><span><Icon name="check" size={15}/> Imágenes limpias</span><span><Icon name="check" size={15}/> Condiciones visibles</span></div>
                <button className="primary" onClick={() => document.getElementById('cupones-disponibles')?.scrollIntoView({behavior:'smooth'})}>Ver promociones <Icon name="arrow" size={17}/></button>
              </div>
              <div className="promotions-v86-hero-photo"><img src="/services/comforters-clean.webp" alt="Edredones limpios LavaFlash"/></div>
            </div>
          </section>
          <section id="cupones-disponibles" className="container coupons-section promotions-v86-coupons">
            <div className="promotions-v86-heading"><div><p className="eyebrow teal">PROMOCIONES DISPONIBLES</p><h2>Elige tu beneficio</h2></div><p>Una sola acción por promoción: revisa las condiciones y reclama la que quieras usar.</p></div>
            <div className="coupon-filters editorial-filters promotions-v86-filters">
              {['Todos','Lavado al seco','Edredones','Aniversario'].map((x) => <button className={promoFilter === x ? 'active' : ''} onClick={() => setPromoFilter(x)} key={x}>{x}</button>)}
            </div>
            <div className="promotions-v86-grid">
              {filteredPromos.map((p) => <article className={`promotions-v86-card ${appliedCoupon === p.code ? 'applied' : ''}`} key={p.code}>
                <div className="promotions-v86-card-image"><img src={p.image} alt={p.title}/><span>{p.category === 'Aniversario' ? 'Mes de aniversario' : p.category}</span></div>
                <div className="promotions-v86-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  <small>{p.valid}</small>
                  <button onClick={() => setAppliedCoupon(p.code)}>{appliedCoupon === p.code ? 'Promoción reclamada ✓' : 'Reclamar promoción'} <Icon name="arrow" size={16}/></button>
                </div>
              </article>)}
            </div>
            <div className="promo-terms editorial-terms"><Icon name="file" size={19}/><p><b>Condiciones de promociones:</b> los beneficios están sujetos a vigencia, disponibilidad y condiciones de cada campaña. Consulta la promoción vigente al momento de solicitar el servicio.</p></div>
          </section>
        </main>
      ) : page === 'login' ? (
        <main className="auth-page login-page">
          <section className="auth-shell container login-shell">
            <div className="auth-visual login-visual">
              <div className="login-visual-shade"></div>
              <div className="auth-overlay login-overlay">
                <span className="login-kicker">TU CUENTA LAVAFLASH</span>
                <h2>Tu ropa en buenas manos y tu cuenta siempre protegida.</h2>
                <p>Ingresa de forma simple para revisar pedidos, promociones y tu información personal.</p>
              </div>
            </div>

            <div className="auth-card login-card">
              <button className="login-back" type="button" onClick={() => navigate('inicio')}><Icon name="chevronLeft" size={16}/> Volver al inicio</button>
              <div className="login-card-head">
                <p className="eyebrow teal">MI CUENTA</p>
                <h1>Hola de nuevo</h1>
                <p className="auth-subtitle">Ingresa con tu correo, DNI o celular para gestionar tus servicios LavaFlash. Si eres administrador, también puedes entrar aquí con tus credenciales.</p>
              </div>

              <form className="login-form" onSubmit={handleCustomerLogin}>
                <label>Correo, DNI, celular o usuario
                  <div className="input-with-icon login-input"><Icon name="user" size={18}/><input name="correo" type="text" placeholder="Ej. 45892104, tu correo o admin" autoComplete="username" required/></div>
                </label>
                <label>Contraseña
                  <div className="input-with-icon login-input"><Icon name="lock" size={18}/><input name="password" type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu contraseña" autoComplete="current-password" required/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name="eye" size={18}/></button></div>
                </label>
                {authError && <p className="auth-error" role="alert">{authError}</p>}
                <button className="primary auth-submit login-submit" type="submit">Ingresar <Icon name="arrow" size={17}/></button>
              </form>

              <div className="login-security"><Icon name="shield" size={17}/><span>Acceso protegido para consultar información de tus pedidos y servicios.</span></div>

              <div className="login-register-row">
                <span>¿Aún no tienes cuenta?</span>
                <button type="button" onClick={() => { setAuthError(''); navigate('register') }}>Crear cuenta</button>
              </div>

              <div className="login-admin-row">
                <span><Icon name="lock" size={16}/> ¿Trabajas en LavaFlash?</span>
                <a href={ADMIN_URL}>Ir al panel directo <Icon name="arrow" size={14}/></a>
              </div>
            </div>
          </section>
        </main>
      ) : page === 'register' ? (
        <main className="register-page-clean">
          <section className="container register-clean-shell">
            <div className="register-clean-top">
              <button className="register-back-link" type="button" onClick={() => navigate('login')}><Icon name="chevronLeft" size={16}/> Volver a iniciar sesión</button>
              <BrandLogo compact/>
            </div>

            <div className="register-clean-layout">
              <aside className="register-clean-intro">
                <p className="eyebrow teal">NUEVA CUENTA</p>
                <h1>Crea tu cuenta LavaFlash</h1>
                <p>Regístrate una sola vez para consultar pedidos, reclamar promociones y acceder a tu información de cliente.</p>
                <div className="register-privacy-note"><Icon name="shield" size={20}/><span><b>Tus datos se muestran protegidos.</b><small>En tu perfil ocultamos parcialmente DNI, celular, correo y dirección.</small></span></div>
              </aside>

              <div className="register-clean-card">
                <div className="register-clean-heading">
                  <h2>Datos de tu cuenta</h2>
                  <p>Completa la información solicitada. Al terminar ingresarás automáticamente a tu perfil.</p>
                </div>

                <form className="register-clean-form" onSubmit={handleCustomerRegister}>
                  <label className="register-field register-field-full">Nombres y apellidos
                    <div className="input-with-icon"><Icon name="user" size={18}/><input name="nombre" type="text" autoComplete="name" placeholder="Tu nombre completo" required/></div>
                  </label>

                  <label className="register-field register-field-full">Correo electrónico
                    <div className="input-with-icon"><Icon name="mail" size={18}/><input name="correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" required/></div>
                  </label>

                  <label className="register-field">Celular
                    <div className="input-with-icon"><Icon name="phone" size={18}/><input name="celular" type="tel" inputMode="numeric" autoComplete="tel" maxLength="9" pattern="[0-9]{9}" title="Ingresa un celular peruano de 9 dígitos" placeholder="987654321" onInput={(e) => { e.currentTarget.value = onlyDigits(e.currentTarget.value, 9) }} required/></div>
                    <small className="field-help">9 dígitos.</small>
                  </label>

                  <label className="register-field">DNI
                    <div className="input-with-icon"><Icon name="file" size={18}/><input name="dni" type="text" inputMode="numeric" maxLength="8" pattern="[0-9]{8}" title="El DNI debe tener 8 dígitos" placeholder="12345678" onInput={(e) => { e.currentTarget.value = onlyDigits(e.currentTarget.value, 8) }} required/></div>
                    <small className="field-help">8 dígitos.</small>
                  </label>

                  <label className="register-field register-field-full">Contraseña
                    <div className="input-with-icon"><Icon name="lock" size={18}/><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength="8" required/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name="eye" size={18}/></button></div>
                  </label>

                  {authError && <p className="auth-error register-field-full" role="alert">{authError}</p>}

                  <label className="terms-check register-field-full"><input type="checkbox" required/><span>He leído las <button type="button" onClick={() => setLegalModal('terms')}>Condiciones Generales originales</button> y el <button type="button" onClick={() => setLegalModal('privacy')}>aviso de privacidad del portal</button>.</span></label>

                  <button className="primary register-submit-clean register-field-full" type="submit">Crear mi cuenta <Icon name="arrow" size={17}/></button>
                </form>

                <p className="register-login-note">¿Ya tienes una cuenta? <button type="button" onClick={() => { setAuthError(''); navigate('login') }}>Inicia sesión</button></p>
              </div>
            </div>
          </section>
        </main>
      ) : page === 'profile' ? (
        <main className="profile-page">
          <section className="container profile-layout">
            <aside className="profile-sidebar"><div className="profile-avatar"><Icon name="user" size={32}/></div><h2>Mi cuenta</h2><p>{customer?.fullName || 'Cliente LavaFlash'}</p><nav><button className={profileTab === 'perfil' ? 'active' : ''} onClick={() => setProfileTab('perfil')}><Icon name="user" size={18}/> Mi perfil</button><button className={profileTab === 'pedidos' ? 'active' : ''} onClick={() => setProfileTab('pedidos')}><Icon name="receipt" size={18}/> Mis pedidos <span>{customerOrders.length}</span></button><button className={profileTab === 'cupones' ? 'active' : ''} onClick={() => setProfileTab('cupones')}><Icon name="gift" size={18}/> Mis cupones</button><button className={profileTab === 'direcciones' ? 'active' : ''} onClick={() => setProfileTab('direcciones')}><Icon name="pin" size={18}/> Direcciones</button><button className={profileTab === 'pagos' ? 'active' : ''} onClick={() => setProfileTab('pagos')}><Icon name="receipt" size={18}/> Métodos de pago</button><button className={profileTab === 'seguridad' ? 'active' : ''} onClick={() => setProfileTab('seguridad')}><Icon name="lock" size={18}/> Seguridad</button></nav><button className="logout-button" onClick={async () => { await logoutCustomer(); setCustomer(null); setIsLoggedIn(false); navigate('inicio') }}><Icon name="logout" size={18}/> Cerrar sesión</button></aside>
            <div className="profile-content">
              <div className="profile-head"><div><p className="eyebrow teal">MI CUENTA</p><h1>{profileTab === 'perfil' ? `Mi perfil · ${customer?.fullName?.split(' ')[0] || 'Cliente'}` : profileTab === 'pedidos' ? 'Mis pedidos' : profileTab === 'cupones' ? 'Mis cupones' : profileTab === 'direcciones' ? 'Mis direcciones' : profileTab === 'pagos' ? 'Métodos de pago' : 'Seguridad'}</h1><p>{profileTab === 'perfil' ? `Administra tu información, ${customer?.fullName || 'cliente LavaFlash'}.` : 'Consulta la información relacionada con tu cuenta LavaFlash.'}</p></div></div>
              {profileTab === 'perfil' && <>
                <div className="profile-stats"><div><Icon name="receipt" size={24}/><span><b>{customerOrders.filter(o => o.status !== 'ENTREGADO_TOTAL').length}</b><small>Pedidos activos</small></span></div><div><Icon name="gift" size={24}/><span><b>{linkedPromos.slice(0,4).length}</b><small>Cupones disponibles</small></span></div><div><Icon name="truck" size={24}/><span><b>{customerOrders.filter(o => o.isDeliveryToHome).length}</b><small>Entregas a domicilio</small></span></div></div>
                <section className="profile-card profile-personal-card profile-readonly-card">
                  <div className="profile-card-head"><div><h2>Información personal</h2><p>Estos datos corresponden a tu registro y se mantienen protegidos.</p></div><span className="verified-data-badge"><Icon name="shield" size={16}/> Datos verificados</span></div>
                  <div className="profile-info-grid"><div><small>Nombre completo</small><b>{profileData.nombre}</b></div><div><small>Correo electrónico</small><b>{profileData.correo}</b></div><div><small>Celular</small><b>+51 {profileData.celular}</b></div><div><small>DNI</small><b>{profileData.dni}</b></div><div className="profile-info-wide"><small>Dirección principal</small><b>{profileData.direccion}</b></div></div>
                  <div className="readonly-note"><Icon name="lock" size={17}/><span>Para cambiar nombre, DNI o celular, comunícate con atención al cliente para validar tu identidad.</span></div>
                </section>
              </>}
              {profileTab === 'pedidos' && <section className="profile-card"><div className="profile-card-head"><h2>Mis pedidos</h2><button onClick={() => navigate('servicios')}>Nuevo servicio</button></div>{customerOrders.length ? <div className="order-list">{customerOrders.slice().reverse().map(o => <article key={o.id}><span className="order-icon"><Icon name="washer" size={21}/></span><div><b>{o.code || 'Pedido LavaFlash'}</b><small>{(o.items || []).map(i => i.serviceName).slice(0,2).join(' · ') || 'Servicio registrado'}</small></div><span className={`status ${o.status === 'LISTO_PARA_ENTREGA' ? 'ready' : 'in-process'}`}>{String(o.status || 'EN PROCESO').replaceAll('_',' ')}</span><strong>{Number(o.total || 0) > 0 ? money.format(Number(o.total || 0)) : 'Por confirmar'}</strong></article>)}</div> : <div className="empty-state"><Icon name="receipt" size={28}/><b>Aún no tienes pedidos registrados</b><p>Cuando solicites o registren un servicio con tu cuenta, aparecerá aquí automáticamente.</p></div>}</section>}
              {profileTab === 'cupones' && <section className="profile-card"><div className="profile-card-head"><h2>Cupones disponibles</h2><button onClick={() => navigate('promociones')}>Ver promociones</button></div><div className="profile-coupon-list">{linkedPromos.slice(0,4).map((p) => <article key={p.code}><span className="mini-coupon-icon"><Icon name="gift" size={20}/></span><div><b>Reclama cupón</b><small>{p.title} · {p.text}</small></div><button onClick={() => setAppliedCoupon(p.code)}>{appliedCoupon === p.code ? 'Reclamado' : 'Reclamar'}</button></article>)}</div></section>}
              {profileTab === 'direcciones' && <section className="profile-card"><div className="profile-card-head"><h2>Direcciones guardadas</h2><button>Agregar</button></div><div className="saved-items"><article><Icon name="home" size={22}/><div><b>Casa</b><small>Lima Metropolitana, Perú · Referencia: cobertura coordinada según distrito</small></div><button>Editar</button></article></div></section>}
              {profileTab === 'pagos' && <section className="profile-card"><div className="profile-card-head"><h2>Métodos de pago</h2></div><div className="empty-state"><Icon name="card" size={28}/><b>No tienes métodos de pago guardados</b><p>Por seguridad, este portal no almacena números de tarjeta ni credenciales bancarias. El método de pago se confirma al registrar cada pedido.</p></div></section>}
              {profileTab === 'seguridad' && <section className="profile-card security-card"><div className="profile-card-head"><h2>Seguridad de la cuenta</h2></div><label>Contraseña actual<input type="password" placeholder="••••••••"/></label><label>Nueva contraseña<input type="password" placeholder="Mínimo 8 caracteres"/></label><button className="primary">Actualizar contraseña</button></section>}
              <div className="profile-cta"><div><Icon name="gift" size={30}/><span><b>Promociones disponibles</b><small>Revisa tus cupones antes de solicitar tu próximo servicio.</small></span></div><button className="primary" onClick={() => navigate('promociones')}>Ver promociones <Icon name="arrow" size={16}/></button></div>
            </div>
          </section>
        </main>
      ) : null}

      <footer className="footer footer-dark-pro">
        <div className="container footer-dark-grid">
          <div className="footer-dark-brand">
            <div className="footer-dark-logo"><BrandLogo/></div>
            <p>Cuidamos tus prendas y artículos del hogar con atención profesional, procesos claros y seguimiento de principio a fin.</p><p className="footer-company-id"><b>{SITE.legalName}</b><span>RUC {SITE.ruc}</span></p>
            <a className="footer-admin-pill" href={ADMIN_URL}><Icon name="lock" size={15}/> Acceso administrativo</a>
          </div>

          <div className="footer-dark-col">
            <h3>Servicios</h3>
            <button onClick={() => openService(0)}>Lavado al seco</button>
            <button onClick={() => openService(1)}>Lavado por peso</button>
            <button onClick={() => openService(2)}>Teñido</button>
            <button onClick={() => openService(3)}>Alfombras</button>
            <button onClick={() => openService(4)}>Muebles</button>
            <button onClick={() => openService(5)}>Delivery</button>
          </div>

          <div className="footer-dark-col">
            <h3>Ayuda</h3>
            <button onClick={() => { setTrackingResult(null); setTrackingError(''); setTrackingOpen(true) }}>Seguimiento de pedido</button>
            <button onClick={() => navigate('nosotros')}>Nosotros</button>
            <button onClick={() => navigate('como-funciona')}>Cómo funciona</button>
            <button onClick={() => navigate('promociones')}>Promociones</button>
            <button onClick={() => navigate('opiniones')}>Reseñas</button>
            <button onClick={() => navigate('contacto')}>Contáctanos</button>
          </div>

          <div className="footer-dark-col footer-legal-col">
            <h3>Legal</h3>
            <button onClick={() => setLegalModal('terms')}>Condiciones Generales (original)</button>
            <button onClick={() => setLegalModal('privacy')}>Aviso de privacidad</button>
            <button onClick={() => setLegalModal('data')}>Aviso de datos</button>
            <button onClick={() => setLegalModal('cookies')}>Cookies</button>
            <button className="footer-claim-accent" onClick={() => { setClaimCode(''); setClaimOpen(true) }}><Icon name="book" size={16}/> Libro de Reclamaciones</button>
          </div>

          <div className="footer-dark-col footer-dark-contact">
            <h3>Contacto</h3>
            <a href={SITE.phoneHref}><Icon name="phone" size={16}/> {SITE.phone}</a>
            <a href={SITE.whatsappUrl} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16}/> WhatsApp</a><a href={SITE.emailHref}><Icon name="mail" size={16}/> {SITE.email}</a>
            <a href={SITE.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={16}/> {SITE.addressShort}</a>
            <span><Icon name="clock" size={16}/> {SITE.hours}</span>
          </div>
        </div>
        <div className="container footer-dark-bottom">
          <span>© 2026 {SITE.legalName} · RUC {SITE.ruc}. Todos los derechos reservados.</span>
          <div><button onClick={() => setLegalModal('privacy')}>Aviso privacidad</button><span>•</span><button onClick={() => setLegalModal('cookies')}>Cookies</button><span>•</span><a href={ADMIN_URL}>Admin</a></div>
        </div>
      </footer>

      {orderOpen && <div className="modal-backdrop order-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOrderOpen(false)}><div className="modal-card order-modal" role="dialog" aria-modal="true" aria-label="Solicitar servicio"><button className="modal-close" onClick={() => setOrderOpen(false)}>×</button>{orderResult ? <div className="order-success"><span className="success-ring"><Icon name="check" size={32}/></span><p className="eyebrow teal">PEDIDO REGISTRADO</p><h2>Tu solicitud quedó registrada</h2><p>Guarda este código para consultar el estado de tu pedido.</p><div className="order-code-box"><small>Código de seguimiento</small><strong>{orderResult.code}</strong></div><div className="order-success-meta"><span><b>{statusLabel(orderResult.status)}</b><small>Estado inicial</small></span><span><b>{Number(orderResult.total || 0) > 0 ? money.format(orderResult.total) : 'Por confirmar'}</b><small>Total aproximado</small></span><span><b>{String(orderResult.preferredPaymentMethod || '').replaceAll('_',' ')}</b><small>Método preferido</small></span></div><div className="order-modal-actions"><button className="secondary" onClick={() => { setOrderOpen(false); setTrackingResult(orderResult); setTrackingError(''); setTrackingOpen(true) }}><Icon name="search" size={18}/> Ver seguimiento</button><button className="primary" onClick={() => { setOrderOpen(false); setProfileTab('pedidos'); navigate('perfil') }}>Ir a mis pedidos</button></div><p className="secure-note"><Icon name="shield" size={16}/> El precio y el pago se confirman con LavaFlash antes de procesar las prendas.</p></div> : <><div className="order-modal-head"><span><Icon name={current.icon} size={26}/></span><div><p className="eyebrow teal">SOLICITAR SERVICIO</p><h2>{current.title}</h2><p>Confirma el servicio, el método de pago preferido y los datos de recojo.</p></div></div><form className="order-form" onSubmit={handleCreateOrder}><div className="order-summary-card"><div><small>Servicio</small><b>{current.title}</b></div><div><small>{isDryClean ? 'Tarifa' : isWeightService ? 'Peso aprox.' : isDye ? 'Cantidad aprox.' : isDeliveryService ? 'Mínimo del servicio' : 'Cantidad aprox.'}</small><b>{isDryClean ? 'Según prenda de la carta' : isWeightService ? `${Number(weight).toFixed(1)} kg` : isDye ? `${quantity} ${quantity === 1 ? 'prenda' : 'prendas'}` : isDeliveryService ? 'S/ 40.00' : `${quantity} ${current.unit}`}</b></div><div><small>{isDryClean ? 'Precio' : isDeliveryService ? 'Mínimo' : 'Estimado'}</small><b>{isDryClean ? 'Por confirmar' : money.format(total)}</b></div>{appliedCoupon && <div><small>Cupón</small><b>{appliedCoupon}</b></div>}</div><fieldset className="payment-fieldset"><legend><Icon name="card" size={18}/> Método de pago preferido</legend><p>Selecciona cómo prefieres pagar. El cobro no se realiza desde esta pantalla; el personal confirma el importe final.</p><div className="payment-options">{['YAPE','PLIN','EFECTIVO','TRANSFERENCIA','TARJETA'].map(m => <label key={m}><input type="radio" name="paymentMethod" value={m} defaultChecked={m==='YAPE'}/><span>{m === 'YAPE' ? 'Yape' : m === 'PLIN' ? 'Plin' : m === 'EFECTIVO' ? 'Efectivo' : m === 'TRANSFERENCIA' ? 'Transferencia' : 'Tarjeta'}</span></label>)}</div></fieldset>{(pickup || isDeliveryService) && <div className="delivery-fields delivery-fields-pro"><label>Distrito<input name="district" placeholder="Ej. San Juan de Miraflores" required/></label><label>Dirección de recojo<input name="address" defaultValue={customer?.address || ''} placeholder="Calle, avenida, número" required/></label><label>Referencia<input name="reference" placeholder="Ej. portón negro, piso 2"/></label><label>Horario preferido<select name="preferredTime" defaultValue="09:00-12:00" required><option value="09:00-12:00">9:00 a.m. – 12:00 p.m.</option><option value="12:00-15:00">12:00 p.m. – 3:00 p.m.</option><option value="15:00-18:00">3:00 p.m. – 6:00 p.m.</option><option value="18:00-20:00">6:00 p.m. – 8:00 p.m.</option></select></label><div className="delivery-form-note"><Icon name="truck" size={17}/><span><b>Recojo y entrega a domicilio</b><small>Pedido mínimo S/ 40.00. La cobertura y cualquier costo adicional se confirman según distrito y horario.</small></span></div></div>}<div className="order-terms-link"><Icon name="file" size={17}/><span>Antes de registrar tu pedido, revisa las <button type="button" onClick={() => setLegalModal('terms')}>Condiciones Generales originales</button>.</span></div><label className="order-consent"><input type="checkbox" required/><span>Acepto que este monto es referencial y que LavaFlash confirmará el precio, disponibilidad, recojo y condiciones del servicio antes de procesarlo.</span></label><button className="primary order-submit" type="submit">Registrar pedido <Icon name="arrow" size={17}/></button></form></>}</div></div>}

      {trackingOpen && <div className="modal-backdrop tracking-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setTrackingOpen(false)}><div className="modal-card tracking-modal" role="dialog" aria-modal="true" aria-label="Seguimiento de pedido"><button className="modal-close" onClick={() => setTrackingOpen(false)}>×</button><div className="tracking-head"><span><Icon name="search" size={26}/></span><div><p className="eyebrow teal">SEGUIMIENTO</p><h2>Consulta tu pedido</h2><p>Ingresa el código del pedido y tu DNI o celular para proteger la información del servicio.</p></div></div>{!trackingResult && <form className="tracking-form" onSubmit={handleTrack}><label>Código del pedido<input name="code" placeholder="Ej. ORD-2026-0001" required autoComplete="off"/></label><label>DNI o celular<input name="identifier" placeholder="8 dígitos de DNI o 9 de celular" required inputMode="numeric" autoComplete="off"/></label>{trackingError && <p className="tracking-error">{trackingError}</p>}<button className="primary" type="submit"><Icon name="search" size={18}/> Buscar pedido</button></form>}{trackingResult && <div className="tracking-result"><div className="tracking-order-top"><div><small>Pedido</small><strong>{trackingResult.code}</strong></div><span className="tracking-status">{statusLabel(trackingResult.status)}</span><div className="tracking-total"><small>Total</small><b>{Number(trackingResult.total || 0) > 0 ? money.format(Number(trackingResult.total || 0)) : 'Por confirmar'}</b></div></div><div className="tracking-service"><Icon name="washer" size={22}/><span><b>{(trackingResult.items || []).map(i => i.serviceName).join(' · ') || 'Servicio LavaFlash'}</b><small>Recepción: {new Date(trackingResult.receivedAt || trackingResult.createdAt).toLocaleString('es-PE')}</small></span></div><div className="tracking-timeline">{orderSteps.map((st, idx) => { const currentIdx = Math.max(0, orderSteps.indexOf(trackingResult.status)); const done = idx <= currentIdx || trackingResult.status === 'ENTREGADO'; return <div className={done ? 'done' : ''} key={st}><span>{done ? <Icon name="check" size={14}/> : idx+1}</span><small>{statusLabel(st)}</small></div> })}</div><div className="tracking-foot"><span><Icon name="card" size={18}/><b>{String(trackingResult.preferredPaymentMethod || trackingResult.paymentStatus || 'PENDIENTE').replaceAll('_',' ')}</b><small>Método/estado de pago</small></span><span><Icon name="truck" size={18}/><b>{trackingResult.isDeliveryToHome ? 'Delivery solicitado' : 'Recojo en local'}</b><small>Modalidad de entrega</small></span></div><button className="secondary tracking-new" onClick={() => { setTrackingResult(null); setTrackingError('') }}>Consultar otro pedido</button></div>}</div></div>}

      {legalModal && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setLegalModal(null)}><div className="modal-card legal-modal legal-modal-structured" role="dialog" aria-modal="true" aria-label={legalCopy[legalModal].title}><button className="modal-close" onClick={() => setLegalModal(null)}>×</button><span className="modal-icon"><Icon name={legalModal === 'terms' ? 'file' : legalModal === 'cookies' ? 'cookie' : 'shield'} size={26}/></span><h2>{legalCopy[legalModal].title}</h2><p className="legal-subtitle">{legalCopy[legalModal].subtitle}</p><div className="legal-sections">{legalCopy[legalModal].sections.map((section) => <section className="legal-section" key={section.heading}><h3>{section.heading}</h3>{section.items.map((item) => <p key={item}>{item}</p>)}</section>)}</div>{legalModal === 'cookies' && <div className="cookie-modal-actions"><button className="secondary" onClick={() => { saveCookieConsent('necessary'); setLegalModal(null) }}>Usar solo necesarias</button><button className="primary" onClick={() => { saveCookieConsent('functional'); setLegalModal(null) }}>Aceptar funcionales</button></div>}</div></div>}

      {!cookieConsent && <aside className="cookie-banner" role="dialog" aria-label="Preferencias de privacidad y cookies">
        <div className="cookie-banner-icon"><Icon name="cookie" size={24}/></div>
        <div className="cookie-banner-copy"><b>Tu privacidad y las funciones externas</b><p>Usamos almacenamiento local necesario para que funcionen cuenta, pedidos y preferencias. Google Maps solo se carga si aceptas funciones externas.</p><button type="button" onClick={() => setLegalModal('cookies')}>Ver aviso de cookies</button></div>
        <div className="cookie-banner-actions"><button type="button" className="secondary" onClick={() => saveCookieConsent('necessary')}>Solo necesarias</button><button type="button" className="primary" onClick={() => saveCookieConsent('functional')}>Aceptar funcionales</button></div>
      </aside>}

      {claimOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setClaimOpen(false)}><div className="modal-card claim-modal" role="dialog" aria-modal="true" aria-label="Libro de reclamaciones"><button className="modal-close" onClick={() => setClaimOpen(false)}>×</button><div className="claim-title"><span className="modal-icon"><Icon name="book" size={26}/></span><div><p className="eyebrow teal">ATENCIÓN AL CONSUMIDOR</p><h2>Libro de reclamaciones</h2></div></div>{claimCode ? <div className="claim-success"><Icon name="check" size={34}/><h3>Reclamo registrado correctamente</h3><p>Código: <b>{claimCode}</b></p><p>Nuestro equipo revisará tu registro y se comunicará contigo mediante los canales de atención de LavaFlash.</p><button className="primary" onClick={() => setClaimOpen(false)}>Cerrar</button></div> : <form className="claim-form" onSubmit={submitClaim}><div className="form-grid"><div className="provider-note"><b>{SITE.legalName}</b><span>RUC {SITE.ruc} · {SITE.address} · {SITE.email} · {SITE.phone}</span></div><label>Nombres y apellidos<input name="nombre" required/></label><label>DNI / CE<input name="documento" required/></label><label>Correo electrónico<input name="email" type="email" required/></label><label>Teléfono<input name="telefono" required/></label><label className="full">Domicilio<input name="domicilio" required/></label><label>Tipo de registro<select name="tipo" required><option value="Reclamo">Reclamo</option><option value="Queja">Queja</option></select></label><label>Bien contratado<select name="bien" required><option value="Servicio">Servicio</option><option value="Producto">Producto</option></select></label><label>N.º de pedido / servicio<input name="pedido"/></label><label>Monto reclamado (S/)<input name="monto" type="number" min="0" step="0.01"/></label><div className="claim-types-note full"><b>Reclamo:</b> disconformidad relacionada con el servicio contratado. <b>Queja:</b> malestar relacionado con la atención u otro aspecto distinto al servicio en sí.</div><label className="full">Detalle<textarea name="detalle" rows="4" required/></label><label className="full">Pedido del consumidor<textarea name="solicitud" rows="3" required/></label></div><label className="consent"><input type="checkbox" name="acepta_datos" required/> Autorizo el uso de los datos ingresados exclusivamente para registrar, atender y dar seguimiento a este reclamo o queja.</label><p className="claim-note">Tu registro será utilizado para dar seguimiento a este reclamo o queja dentro del portal.</p><button className="primary claim-submit" type="submit">Registrar reclamo <Icon name="arrow" size={16}/></button></form>}</div></div>}
    </div>
  )
}

export default App
