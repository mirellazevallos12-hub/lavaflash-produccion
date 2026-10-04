export const SITE = {
  name: 'LavaFlash',
  tradeName: 'LAVA FLASH',
  legalName: 'LAVA FLASH DRY CLEANER E.I.R.L.',
  ruc: '20551511309',
  logo: '/brand/lavaflash-logo.png',
  phone: '+51 942 279 627',
  phoneHref: 'tel:+51942279627',
  whatsappNumber: '51942279627',
  whatsappUrl: 'https://wa.me/51942279627',
  email: 'lavaflashlava@gmail.com',
  emailHref: 'mailto:lavaflashlava@gmail.com',
  address: 'Jr. Pablo Usandizaga 533, San Borja, Lima, Perú',
  addressShort: 'Jr. Pablo Usandizaga 533, San Borja',
  city: 'Lima, Perú',
  hours: 'Lun–Sáb · 8:00 a.m. a 8:00 p.m.',
  mapsUrl: 'https://maps.app.goo.gl/d6E5cEbinEouLTXX6',
  mapsEmbedUrl: 'https://www.google.com/maps?q=-12.1082563,-76.9932251&z=17&output=embed',
}

export const getAdminUrl = () => {
  const configured = String(import.meta.env.VITE_ADMIN_URL || '').trim()
  if (configured) return configured
  return '/admin/'
}
