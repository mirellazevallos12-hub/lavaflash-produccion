export const services = [
  {
    title: 'Lavado al seco', short: 'Cuidado especializado para tus prendas más delicadas.', tag:'Prendas delicadas', icon:'hanger',
    image: '/clean/service-dryclean.svg',
    subtitle: 'Cuidado especializado para prendas delicadas',
    description: 'Tratamos ternos, sacos, vestidos y prendas que requieren un proceso especial, cuidando fibras, acabados y forma para prolongar su vida útil.',
    bullets: ['Evaluación previa de la prenda', 'Limpieza especializada', 'Revisión de manchas y acabados', 'Entrega protegida y lista para usar'],
    pricing: 'Carta de precios por prenda', minimum: 'Tarifa según prenda y acabado', delivery: 'Entrega: 48 horas a 4 días según prenda', unit: 'prenda', unitPrice: 15, minQty: 1
  },
  {
    title: 'Lavado por peso', short: 'Ideal para tu ropa diaria, rápido y de alta calidad.', tag:'Por kilo', icon:'washer',
    image: '/clean/service-weight.svg', detailImage: '/clean/service-weight.svg',
    subtitle: 'Ideal para ropa diaria, hogar y negocios',
    description: 'Nuestro servicio de lavado por peso es una solución práctica para mantener tu ropa limpia, fresca y bien cuidada. Ideal para prendas del día a día, ropa de hogar y negocios con lavado constante.',
    bullets: ['Desde 3 kg: S/ 4.50 por kg', 'Menos de 3 kg: tarifa fija de S/ 12.00', 'Lavado, secado y doblado', 'Toallas y sábanas: S/ 6.00 por kg'],
    pricing: 'S/ 4.50 por kg desde 3 kg', minimum: 'Menos de 3 kg: S/ 12.00 tarifa fija', delivery: 'Entrega cada 48 horas (dejando 1 día)', unit: 'kg', unitPrice: 4.5, minQty: 0.5
  },
  {
    title: 'Teñido', short: 'Renueva el color de tus prendas favoritas.', tag:'100% algodón recomendado', icon:'droplet',
    image: '/clean/service-dye.svg',
    subtitle: 'Renueva el color de tus prendas',
    description: 'Servicio de teñido para recuperar intensidad y uniformidad. Trabajamos de preferencia con prendas 100% algodón; otras fibras o mezclas se revisan antes de confirmar el servicio.',
    bullets: ['Evaluación de tela y color', 'Colores disponibles: negro y azul', 'Teñido controlado', 'Revisión final del acabado'],
    pricing: 'Desde S/ 25.00 por prenda', minimum: 'Preferencia: prendas 100% algodón', delivery: 'Entrega: 10 días', unit: 'prenda', unitPrice: 25, minQty: 1
  },
  {
    title: 'Alfombras', short: 'Limpieza profunda para un hogar más saludable.', tag:'Precio por m²', icon:'rug',
    image: '/clean/service-rug.svg',
    subtitle: 'Limpieza profunda para tus espacios',
    description: 'Realizamos limpieza profunda de alfombras para retirar polvo, suciedad y olores acumulados, aplicando el tratamiento según material, tamaño y nivel de uso.',
    bullets: ['Inspección del material', 'Aspirado y pretratamiento', 'Lavado profundo', 'Secado y revisión final'],
    pricing: 'Desde S/ 18.00 por m²', minimum: 'Precio sujeto a medidas y material', delivery: 'Entrega: 15 a 20 días', unit: 'm²', unitPrice: 18, minQty: 1
  },
  {
    title: 'Muebles', short: 'Higiene y frescura para tus espacios.', tag:'Limpieza a domicilio', icon:'sofa',
    image: '/clean/service-sofa.svg',
    subtitle: 'Limpieza de muebles a domicilio',
    description: 'Limpiamos sofás, sillones y colchones en tu hogar o negocio con equipos de extracción y productos adecuados para tapicería.',
    bullets: ['Servicio a domicilio', 'Tratamiento de manchas', 'Extracción de suciedad', 'Orientación para el secado'],
    pricing: 'Desde S/ 25.00 por asiento', minimum: 'Cotización según tamaño', delivery: 'Servicio previa coordinación', unit: 'asiento', unitPrice: 25, minQty: 1
  },
  {
    title: 'Delivery', short: 'Recogemos y entregamos en la puerta de tu casa.', tag:'Recojo y entrega', icon:'truck',
    image: '/clean/service-delivery.svg',
    subtitle: 'Recojo y entrega coordinados',
    description: 'Coordinamos el recojo de tus prendas y la entrega una vez terminado el servicio. La cobertura, horarios y costo se confirman antes de aceptar el pedido.',
    bullets: ['Coordinación por WhatsApp o llamada', 'Confirmación de dirección y horario', 'Seguimiento del pedido', 'Entrega coordinada'],
    pricing: 'Recojo a domicilio desde S/ 40.00 en servicios', minimum: 'Pedido mínimo para recojo: S/ 40.00', delivery: 'Horario sujeto a disponibilidad y cobertura', unit: 'pedido', unitPrice: 40, minQty: 1
  }
]

export const promos = [
  { badge: '10%', category: 'Clientes nuevos', title: '10% en tu primer servicio', text: 'Beneficio de bienvenida para tu primer pedido en LavaFlash.', code: 'BIENVENIDO10', image: '/services/towels-clean.webp', valid: 'Válido para nuevos clientes.' },
  { badge: '3x2', category: 'Edredones', title: '3x2 en edredones', text: 'Lleva 3 edredones y paga solo 2.', code: 'EDREDON3X2', image: '/services/comforters-clean.webp', valid: 'Sujeto a evaluación del edredón.' },
  { badge: '4x3', category: 'Lavado al seco', title: '4x3 en ropa al seco', text: 'Lleva 4 prendas y paga solo 3.', code: 'SECO4X3', image: '/services/dryclean-clean.webp', valid: 'No acumulable con otras promociones.' },
  { badge: '15%', category: 'Aniversario', title: '15 años de LavaFlash', text: 'Descuento especial por nuestro mes de aniversario.', code: 'LAVA15', image: '/banners/anniversary-clean.webp', valid: 'Campaña especial por tiempo limitado.' }
]

export const GOOGLE_REVIEWS = {
  rating: 3.3,
  count: 7,
  placeId: 'ChIJ0xIpgunHBZER9sjxsRwkkXI',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=LAVA+FLASH+LAVANDER%C3%8DAS&query_place_id=ChIJ0xIpgunHBZER9sjxsRwkkXI',
  writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ0xIpgunHBZER9sjxsRwkkXI',
  verifiedAt: '27/09/2026'
}

export const servicePromoSlides = [
  {
    id:'aniversario', image:'/promos/aniversario-carousel-ultrawide.webp', mobileImage:'/promos/aniversario-carousel-mobile.webp',
    alt:'Mes de aniversario LavaFlash con promociones especiales del 14 al 28 de noviembre',
    action:'promotions'
  },
  {
    id:'edredones-3x2', image:'/promos/edredones-3x2-carousel-ultrawide.webp', mobileImage:'/promos/edredones-3x2-carousel-mobile.webp',
    alt:'Promoción 3x2 en edredones pagando por adelantado',
    action:'service', serviceIndex:1
  },
  {
    id:'ropa-al-seco-4x3', image:'/promos/ropa-al-seco-4x3-carousel-ultrawide.webp', mobileImage:'/promos/ropa-al-seco-4x3-carousel-mobile.webp',
    alt:'Promoción 4x3 en ropa al seco pagando por adelantado',
    action:'service', serviceIndex:0
  }
]
