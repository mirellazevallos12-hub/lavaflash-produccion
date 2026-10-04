import { 
  User, Customer, CatalogService, Order, Expense, 
  CashRegisterShift, InventoryItem, InventoryMovement, 
  Promotion, Claim, AuditLog, OrderStatus, PaymentTransaction, 
  PartialDeliveryRecord, PaymentMethod, PaymentStatus, CustomerReview,
  MonthlyFixedExpense, FixedExpenseCategory
} from '../types';
import { writeLocalAndSync } from './cloudState';

const STORAGE_KEYS = {
  USERS: 'lavanderiapro_users',
  CURRENT_USER: 'lavanderiapro_current_user',
  CUSTOMERS: 'lavanderiapro_customers',
  SERVICES: 'lavanderiapro_services',
  ORDERS: 'lavanderiapro_orders',
  EXPENSES: 'lavanderiapro_expenses',
  FIXED_EXPENSES: 'lavanderiapro_fixed_expenses',
  SHIFTS: 'lavanderiapro_shifts',
  INVENTORY: 'lavanderiapro_inventory',
  INVENTORY_MOVEMENTS: 'lavanderiapro_inventory_movs',
  PROMOTIONS: 'lavanderiapro_promotions',
  CLAIMS: 'lavanderiapro_claims',
  AUDIT_LOGS: 'lavanderiapro_audit_logs',
  REVIEWS: 'lavanderiapro_reviews',
};


const LEGACY_DEMO_IDS: Partial<Record<keyof typeof STORAGE_KEYS, Set<string>>> = {
  CUSTOMERS: new Set(['cust-1', 'cust-2', 'cust-3', 'cust-4']),
  ORDERS: new Set(['ord-101', 'ord-102', 'ord-103', 'ord-104', 'ord-105', 'ord-106']),
  EXPENSES: new Set(['exp-1', 'exp-2']),
  FIXED_EXPENSES: new Set(['fix-1', 'fix-2', 'fix-3', 'fix-4', 'fix-5', 'fix-6', 'fix-7', 'fix-8', 'fix-9', 'fix-prev-1', 'fix-prev-2', 'fix-prev-3']),
  SHIFTS: new Set(['shift-today']),
  INVENTORY: new Set(['inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6']),
  INVENTORY_MOVEMENTS: new Set(['mov-1', 'mov-2']),
  CLAIMS: new Set(['clm-1']),
  AUDIT_LOGS: new Set(['aud-1', 'aud-2']),
  PROMOTIONS: new Set(['promo-1', 'promo-2']),
};

// Seed Users
const DEFAULT_USERS: User[] = [
  { id: 'usr-admin', username: 'admin', name: 'Administrador LavaFlash', role: 'ADMIN', branch: 'LavaFlash', avatar: '👤' },
];

// Seed Catalog Services (Lista Oficial Completa Lavaflash San Borja)
const DEFAULT_SERVICES: CatalogService[] = [
  // ================= 1. AL PESO =================
  { 
    id: 'srv-peso-1', 
    name: 'Ropa Diaria al Peso (mín. 3 kg)', 
    category: 'AL_PESO', 
    unit: 'kg', 
    unitPrice: 4.50, 
    minPrice: 12.00,
    estimatedHours: 48, 
    iconName: 'Scale', 
    description: 'A partir de 3 kilos el lavado por kilo está a S/ 4.50. Si es menor a 3 kilos el precio es de S/ 12.00 pese lo que pese. Entrega cada 48 horas (dejando 1 día). No incluye edredones ni frazadas.', 
    pricingFormula: 'WEIGHT_KG', 
    isActive: true 
  },
  { 
    id: 'srv-peso-2', 
    name: 'Lavado por kilo de Toallas y Sábanas', 
    category: 'AL_PESO', 
    unit: 'kg', 
    unitPrice: 6.00, 
    minPrice: 6.00,
    estimatedHours: 48, 
    iconName: 'Scale', 
    description: 'Carga exclusiva de solo sábanas y toallas limpias y desinfectadas. S/ 6.00 por kilo. Entrega cada 48 horas (dejando 1 día).', 
    pricingFormula: 'WEIGHT_KG', 
    isActive: true 
  },

  // ================= 2. ROPA Y PRENDAS AL SECO (Entrega en 3 a 4 días) =================
  { id: 'srv-sec-1', name: 'Abrigo corto liviano', category: 'AL_SECO', unit: 'prenda', unitPrice: 15.00, estimatedHours: 72, iconName: 'Shirt', description: 'Lavado en seco ecológico y desodorizado.' },
  { id: 'srv-sec-2', name: 'Abrigo corto pesado', category: 'AL_SECO', unit: 'prenda', unitPrice: 18.00, estimatedHours: 72, iconName: 'Shirt', description: 'Tratamiento profundo para paño grueso.' },
  { id: 'srv-sec-3', name: 'Abrigo de niño', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Prendas infantiles delicadas.' },
  { id: 'srv-sec-4', name: 'Abrigo largo liviano', category: 'AL_SECO', unit: 'prenda', unitPrice: 17.00, estimatedHours: 96, iconName: 'Shirt', description: 'Limpieza en seco para gabardinas y abrigos largos.' },
  { id: 'srv-sec-5', name: 'Abrigo largo pesado', category: 'AL_SECO', unit: 'prenda', unitPrice: 20.00, estimatedHours: 96, iconName: 'Shirt', description: 'Abrigo largo de lana pesada o paño.' },
  { id: 'srv-sec-6', name: 'Abrigo sin mangas (tipo chaleco)', category: 'AL_SECO', unit: 'prenda', unitPrice: 20.00, estimatedHours: 72, iconName: 'Shirt', description: 'Chaleco largo tipo abrigo.' },
  { id: 'srv-sec-7', name: 'Almohada estándar', category: 'AL_SECO', unit: 'pieza', unitPrice: 15.00, estimatedHours: 72, iconName: 'Layers', description: 'Desinfección térmica y antiácaros.' },
  { id: 'srv-sec-8', name: 'Almohada de cuna', category: 'AL_SECO', unit: 'pieza', unitPrice: 8.00, estimatedHours: 72, iconName: 'Layers', description: 'Tratamiento hipoalergénico para bebés.' },
  { id: 'srv-sec-9', name: 'Almohada de plumas', category: 'AL_SECO', unit: 'pieza', unitPrice: 20.00, estimatedHours: 96, iconName: 'Layers', description: 'Secado especial para plumón natural.' },
  { id: 'srv-sec-10', name: 'Artesanía / Peluche', category: 'AL_SECO', unit: 'pieza', unitPrice: 18.00, estimatedHours: 72, iconName: 'Sparkles', description: 'Limpieza cuidadosa sin dañar texturas.' },
  { id: 'srv-sec-11', name: 'Asiento de bebé (coche/auto)', category: 'AL_SECO', unit: 'pieza', unitPrice: 40.00, estimatedHours: 72, iconName: 'Layers', description: 'Desmanchado profundo y sanitización.' },
  { id: 'srv-sec-12', name: 'Babero', category: 'AL_SECO', unit: 'prenda', unitPrice: 6.00, estimatedHours: 48, iconName: 'Shirt', description: 'Desmanchado de papillas y alimentos.' },
  { id: 'srv-sec-13', name: 'Baby doll', category: 'AL_SECO', unit: 'prenda', unitPrice: 13.00, estimatedHours: 72, iconName: 'Sparkles', description: 'Prendas íntimas delicadas de seda o encaje.' },
  { id: 'srv-sec-14', name: 'Bandera chica', category: 'AL_SECO', unit: 'pieza', unitPrice: 13.00, estimatedHours: 48, iconName: 'Layers', description: 'Lavado y planchado al vapor.' },
  { id: 'srv-sec-15', name: 'Bandera mediana', category: 'AL_SECO', unit: 'pieza', unitPrice: 18.00, estimatedHours: 48, iconName: 'Layers', description: 'Cuidado de colores patrios e institucionales.' },
  { id: 'srv-sec-16', name: 'Bandera grande', category: 'AL_SECO', unit: 'pieza', unitPrice: 25.00, estimatedHours: 48, iconName: 'Layers', description: 'Banderas de gran formato.' },
  { id: 'srv-sec-17', name: 'Bota / Botín de niño', category: 'AL_SECO', unit: 'par', unitPrice: 6.00, estimatedHours: 72, iconName: 'Layers', description: 'Limpieza exterior y desinfección.' },
  { id: 'srv-sec-18', name: 'Bata delicada', category: 'AL_SECO', unit: 'prenda', unitPrice: 13.00, estimatedHours: 72, iconName: 'Shirt', description: 'Seda, satén o tejidos finos.' },
  { id: 'srv-sec-19', name: 'Bata de médico / laboratorio', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Blanqueamiento y planchado impecable.' },
  { id: 'srv-sec-20', name: 'Bata sencilla de casa', category: 'AL_SECO', unit: 'prenda', unitPrice: 14.00, estimatedHours: 72, iconName: 'Shirt', description: 'Batas de toalla o algodón.' },
  { id: 'srv-sec-21', name: 'Bermuda', category: 'AL_SECO', unit: 'prenda', unitPrice: 6.50, estimatedHours: 48, iconName: 'Shirt', description: 'Lavado y planchado.' },
  { id: 'srv-sec-22', name: 'BVD / DVD interior', category: 'AL_SECO', unit: 'prenda', unitPrice: 7.00, estimatedHours: 48, iconName: 'Shirt', description: 'Prendas de vestir ligeras.' },
  { id: 'srv-sec-23', name: 'Bikini (2 piezas)', category: 'AL_SECO', unit: 'conjunto', unitPrice: 12.00, estimatedHours: 48, iconName: 'Sparkles', description: 'Cuidado de lycra y colores vivos.' },
  { id: 'srv-sec-24', name: 'Bikini una pieza / enterizo', category: 'AL_SECO', unit: 'prenda', unitPrice: 6.00, estimatedHours: 48, iconName: 'Sparkles', description: 'Ropa de baño enteriza.' },
  { id: 'srv-sec-25', name: 'Blusa estándar', category: 'AL_SECO', unit: 'prenda', unitPrice: 9.00, estimatedHours: 72, iconName: 'Shirt', description: 'Blusa de vestir dama.' },
  { id: 'srv-sec-26', name: 'Blusa con pedrería', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 96, iconName: 'Sparkles', description: 'Cuidado artesanal de lentejuelas y pedrería.' },
  { id: 'srv-sec-27', name: 'Blusa de niña', category: 'AL_SECO', unit: 'prenda', unitPrice: 7.00, estimatedHours: 48, iconName: 'Shirt', description: 'Blusas infantiles.' },
  { id: 'srv-sec-28', name: 'Blusa delicada', category: 'AL_SECO', unit: 'prenda', unitPrice: 9.50, estimatedHours: 72, iconName: 'Sparkles', description: 'Gasa, seda o encaje fino.' },
  { id: 'srv-sec-29', name: 'Body', category: 'AL_SECO', unit: 'prenda', unitPrice: 8.00, estimatedHours: 48, iconName: 'Shirt', description: 'Body de dama o bebé.' },
  { id: 'srv-sec-30', name: 'Bolero', category: 'AL_SECO', unit: 'prenda', unitPrice: 7.00, estimatedHours: 48, iconName: 'Shirt', description: 'Bolero de hilo o tela.' },
  { id: 'srv-sec-31', name: 'Bolsa de dormir de plumas', category: 'AL_SECO', unit: 'pieza', unitPrice: 27.00, estimatedHours: 96, iconName: 'Layers', description: 'Sleeping bag de pluma natural.' },
  { id: 'srv-sec-32', name: 'Bolsa de dormir delgada', category: 'AL_SECO', unit: 'pieza', unitPrice: 18.00, estimatedHours: 72, iconName: 'Layers', description: 'Sleeping bag sintético liviano.' },
  { id: 'srv-sec-33', name: 'Bolsa de dormir pesada', category: 'AL_SECO', unit: 'pieza', unitPrice: 22.00, estimatedHours: 96, iconName: 'Layers', description: 'Sleeping bag térmico de alta montaña.' },
  { id: 'srv-sec-34', name: 'Bolsa de tela', category: 'AL_SECO', unit: 'pieza', unitPrice: 14.00, estimatedHours: 48, iconName: 'Layers', description: 'Tote bags y bolsas ecológicas.' },
  { id: 'srv-sec-35', name: 'Botas de adulto (par)', category: 'AL_SECO', unit: 'par', unitPrice: 20.00, estimatedHours: 72, iconName: 'Layers', description: 'Limpieza y acondicionamiento exterior.' },
  { id: 'srv-sec-36', name: 'Buzos (conjunto completo)', category: 'AL_SECO', unit: 'conjunto', unitPrice: 18.00, estimatedHours: 72, iconName: 'Shirt', description: 'Pantalón y polera / casaca de buzo.' },
  { id: 'srv-sec-37', name: 'Buzo de niño', category: 'AL_SECO', unit: 'conjunto', unitPrice: 14.00, estimatedHours: 72, iconName: 'Shirt', description: 'Conjunto deportivo infantil.' },
  { id: 'srv-sec-38', name: 'Buzo de vestir', category: 'AL_SECO', unit: 'prenda', unitPrice: 16.00, estimatedHours: 72, iconName: 'Shirt', description: 'Pantalón deportivo de vestir.' },
  { id: 'srv-sec-39', name: 'Cama de mascota chica', category: 'AL_SECO', unit: 'pieza', unitPrice: 30.00, estimatedHours: 72, iconName: 'Layers', description: 'Desinfección profunda y eliminación de pelos.' },
  { id: 'srv-sec-40', name: 'Cama de mascota mediana', category: 'AL_SECO', unit: 'pieza', unitPrice: 40.00, estimatedHours: 72, iconName: 'Layers', description: 'Lavado con bactericida e hipoalergénico.' },
  { id: 'srv-sec-41', name: 'Cama de mascota grande', category: 'AL_SECO', unit: 'pieza', unitPrice: 50.00, estimatedHours: 96, iconName: 'Layers', description: 'Tratamiento de gran volumen.' },
  { id: 'srv-sec-42', name: 'Camino de mesa', category: 'AL_SECO', unit: 'pieza', unitPrice: 12.00, estimatedHours: 48, iconName: 'Layers', description: 'Desmanchado puntual y almidonado suave.' },
  { id: 'srv-sec-43', name: 'Camisa de vestir', category: 'AL_SECO', unit: 'prenda', unitPrice: 9.00, estimatedHours: 72, iconName: 'Shirt', description: 'Lavado al seco y planchado impecable de cuello y puños.' },
  { id: 'srv-sec-44', name: 'Terno 2 Piezas (Saco y Pantalón)', category: 'AL_SECO', unit: 'prenda', unitPrice: 18.00, estimatedHours: 72, iconName: 'Shirt', description: 'Lavado en seco ecológico. Terno completo.' },
  { id: 'srv-sec-45', name: 'Capa estándar', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Capas de paño o tela.' },
  { id: 'srv-sec-46', name: 'Capa de alpaca', category: 'AL_SECO', unit: 'prenda', unitPrice: 16.00, estimatedHours: 96, iconName: 'Shirt', description: 'Fibra natural de alpaca con peinado suave.' },
  { id: 'srv-sec-47', name: 'Capa de cuero', category: 'AL_SECO', unit: 'prenda', unitPrice: 50.00, estimatedHours: 96, iconName: 'Shirt', description: 'Cuidado especializado y nutriciòn de cuero.' },
  { id: 'srv-sec-48', name: 'Camisón', category: 'AL_SECO', unit: 'prenda', unitPrice: 10.00, estimatedHours: 72, iconName: 'Shirt', description: 'Camisón de noche.' },
  { id: 'srv-sec-49', name: 'Cartera estándar', category: 'AL_SECO', unit: 'pieza', unitPrice: 20.00, estimatedHours: 72, iconName: 'Layers', description: 'Limpieza externa e interna.' },
  { id: 'srv-sec-50', name: 'Cartera de cuero', category: 'AL_SECO', unit: 'pieza', unitPrice: 30.00, estimatedHours: 96, iconName: 'Layers', description: 'Acondicionador de cuero y abrillantado.' },
  { id: 'srv-sec-51', name: 'Cartera de tela', category: 'AL_SECO', unit: 'pieza', unitPrice: 14.00, estimatedHours: 72, iconName: 'Layers', description: 'Desmanchado textil.' },
  { id: 'srv-sec-52', name: 'Cartera sintética pequeña', category: 'AL_SECO', unit: 'pieza', unitPrice: 12.00, estimatedHours: 72, iconName: 'Layers', description: 'Bolsos pequeños sintéticos.' },
  { id: 'srv-sec-53', name: 'Cartera sintética', category: 'AL_SECO', unit: 'pieza', unitPrice: 14.00, estimatedHours: 72, iconName: 'Layers', description: 'Cartera mediana o grande de cuerina.' },
  { id: 'srv-sec-54', name: 'Cartera de tela con cuero chico', category: 'AL_SECO', unit: 'pieza', unitPrice: 20.00, estimatedHours: 72, iconName: 'Layers', description: 'Material mixto tela y cuero.' },
  { id: 'srv-sec-55', name: 'Cartera chica', category: 'AL_SECO', unit: 'pieza', unitPrice: 8.00, estimatedHours: 72, iconName: 'Layers', description: 'Monederos y carteras mini.' },
  { id: 'srv-sec-56', name: 'Cartuchera chica', category: 'AL_SECO', unit: 'pieza', unitPrice: 5.00, estimatedHours: 48, iconName: 'Layers', description: 'Cartucheras escolares o cosméticas.' },
  { id: 'srv-sec-57', name: 'Casaca acolchada tres cuartos', category: 'AL_SECO', unit: 'prenda', unitPrice: 17.00, estimatedHours: 72, iconName: 'Shirt', description: 'Casaca acolchada larga.' },
  { id: 'srv-sec-58', name: 'Casaca con cuero', category: 'AL_SECO', unit: 'prenda', unitPrice: 30.00, estimatedHours: 96, iconName: 'Shirt', description: 'Casaca con apliques o mangas de cuero.' },
  { id: 'srv-sec-59', name: 'Casaca cuello de cuero', category: 'AL_SECO', unit: 'prenda', unitPrice: 15.00, estimatedHours: 72, iconName: 'Shirt', description: 'Detalle de cuero en solapa.' },
  { id: 'srv-sec-60', name: 'Casaca cuerina acolchada 3/4', category: 'AL_SECO', unit: 'prenda', unitPrice: 40.00, estimatedHours: 96, iconName: 'Shirt', description: 'Cuerina sintética tratada al seco.' },
  { id: 'srv-sec-61', name: 'Casaca estándar de abrigo', category: 'AL_SECO', unit: 'prenda', unitPrice: 35.00, estimatedHours: 72, iconName: 'Shirt', description: 'Casaca de paño o abrigo formal.' },
  { id: 'srv-sec-62', name: 'Casaca de cuero 100%', category: 'AL_SECO', unit: 'prenda', unitPrice: 50.00, estimatedHours: 96, iconName: 'Shirt', description: 'Tratamiento exclusivo con cera nutricia.' },
  { id: 'srv-sec-63', name: 'Casaca de plumas', category: 'AL_SECO', unit: 'prenda', unitPrice: 18.00, estimatedHours: 96, iconName: 'Wind', description: 'Esponjado térmico de plumas.' },
  { id: 'srv-sec-64', name: 'Casaca plumas tres cuartos', category: 'AL_SECO', unit: 'prenda', unitPrice: 20.00, estimatedHours: 96, iconName: 'Wind', description: 'Casaca larga rellena de plumón.' },
  { id: 'srv-sec-65', name: 'Casaca sencilla', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Cortaviento o casaca liviana.' },
  { id: 'srv-sec-66', name: 'Casaca sencilla tres cuartos', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.50, estimatedHours: 72, iconName: 'Shirt', description: 'Casaca liviana 3/4.' },
  { id: 'srv-sec-67', name: 'Casaca de niño sencilla', category: 'AL_SECO', unit: 'prenda', unitPrice: 9.00, estimatedHours: 48, iconName: 'Shirt', description: 'Casaca infantil corta.' },
  { id: 'srv-sec-68', name: 'Casaca de niño tres cuartos', category: 'AL_SECO', unit: 'prenda', unitPrice: 14.00, estimatedHours: 48, iconName: 'Shirt', description: 'Casaca infantil abrigadora.' },
  { id: 'srv-sec-69', name: 'Casacón', category: 'AL_SECO', unit: 'prenda', unitPrice: 18.00, estimatedHours: 72, iconName: 'Shirt', description: 'Casacón grueso de invierno.' },
  { id: 'srv-sec-70', name: 'Chal', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 48, iconName: 'Shirt', description: 'Chal de fiesta o lana.' },
  { id: 'srv-sec-71', name: 'Chaleco acolchado', category: 'AL_SECO', unit: 'prenda', unitPrice: 11.00, estimatedHours: 72, iconName: 'Shirt', description: 'Chaleco térmico.' },
  { id: 'srv-sec-72', name: 'Chaleco de paño', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Chaleco formal de paño.' },
  { id: 'srv-sec-73', name: 'Chaleco largo', category: 'AL_SECO', unit: 'prenda', unitPrice: 8.00, estimatedHours: 72, iconName: 'Shirt', description: 'Chaleco largo casual.' },
  { id: 'srv-sec-74', name: 'Chaleco de vestir / especial', category: 'AL_SECO', unit: 'prenda', unitPrice: 15.00, estimatedHours: 72, iconName: 'Shirt', description: 'Chaleco de sastre.' },
  { id: 'srv-sec-75', name: 'Chaleco de gala / cuero', category: 'AL_SECO', unit: 'prenda', unitPrice: 35.00, estimatedHours: 96, iconName: 'Shirt', description: 'Chaleco de cuero natural.' },
  { id: 'srv-sec-76', name: 'Chompa sencilla', category: 'AL_SECO', unit: 'prenda', unitPrice: 8.50, estimatedHours: 72, iconName: 'Shirt', description: 'Chompa de hilo o algodón.' },
  { id: 'srv-sec-77', name: 'Chompa delicada', category: 'AL_SECO', unit: 'prenda', unitPrice: 9.50, estimatedHours: 72, iconName: 'Shirt', description: 'Chompa de lana fina o bordada.' },
  { id: 'srv-sec-78', name: 'Chompa gruesa / champón', category: 'AL_SECO', unit: 'prenda', unitPrice: 10.00, estimatedHours: 72, iconName: 'Shirt', description: 'Champón grueso de invierno.' },
  { id: 'srv-sec-79', name: 'Champón especial', category: 'AL_SECO', unit: 'prenda', unitPrice: 12.00, estimatedHours: 72, iconName: 'Shirt', description: 'Tejido artesanal pesado.' },
  { id: 'srv-sec-80', name: 'Coche de bebé grande', category: 'AL_SECO', unit: 'pieza', unitPrice: 120.00, estimatedHours: 96, iconName: 'Layers', description: 'Desmontaje de tapices, sanitización completa y secado.' },

  // ================= 3. EDREDONES, COBERTORES Y FRAZADAS (Entrega en 1 semana / 7 días) =================
  { id: 'srv-edr-1', name: 'Cobertor plaza y media', category: 'AL_SECO', unit: 'pieza', unitPrice: 20.00, estimatedHours: 168, iconName: 'Layers', description: 'Lavado al seco térmico. Entrega en 1 semana (7 días).' },
  { id: 'srv-edr-2', name: 'Cobertor dos plazas', category: 'AL_SECO', unit: 'pieza', unitPrice: 22.00, estimatedHours: 168, iconName: 'Layers', description: 'Entrega en 1 semana (7 días).' },
  { id: 'srv-edr-3', name: 'Edredón plaza y media', category: 'AL_SECO', unit: 'pieza', unitPrice: 23.00, estimatedHours: 168, iconName: 'Layers', description: 'Entrega en 1 semana (7 días). NO va al peso.' },
  { id: 'srv-edr-4', name: 'Edredón dos plazas', category: 'AL_SECO', unit: 'pieza', unitPrice: 26.00, estimatedHours: 168, iconName: 'Layers', description: 'Entrega en 1 semana (7 días). NO va al peso.' },
  { id: 'srv-edr-5', name: 'Edredón Queen', category: 'AL_SECO', unit: 'pieza', unitPrice: 27.00, estimatedHours: 168, iconName: 'Layers', description: 'Entrega en 1 semana (7 días). NO va al peso.' },
  { id: 'srv-edr-6', name: 'Edredón King', category: 'AL_SECO', unit: 'pieza', unitPrice: 28.00, estimatedHours: 168, iconName: 'Layers', description: 'Entrega en 1 semana (7 días). NO va al peso.' },
  { id: 'srv-edr-7', name: 'Edredón de plumas plaza y media', category: 'AL_SECO', unit: 'pieza', unitPrice: 30.00, estimatedHours: 168, iconName: 'Layers', description: 'Plumón natural con esponjado térmico. Entrega en 1 semana.' },
  { id: 'srv-edr-8', name: 'Edredón de plumas dos plazas', category: 'AL_SECO', unit: 'pieza', unitPrice: 35.00, estimatedHours: 168, iconName: 'Layers', description: 'Plumón natural. Entrega en 1 semana (7 días).' },
  { id: 'srv-edr-9', name: 'Edredón de plumas Queen', category: 'AL_SECO', unit: 'pieza', unitPrice: 40.00, estimatedHours: 168, iconName: 'Layers', description: 'Plumón natural de gran formato. Entrega en 1 semana.' },
  { id: 'srv-edr-10', name: 'Edredón de plumas King', category: 'AL_SECO', unit: 'pieza', unitPrice: 45.00, estimatedHours: 168, iconName: 'Layers', description: 'King size de plumas. Entrega en 1 semana (7 días).' },
  { id: 'srv-edr-11', name: 'Colcha', category: 'AL_SECO', unit: 'pieza', unitPrice: 14.00, estimatedHours: 168, iconName: 'Layers', description: 'Colcha ligera de cama.' },
  { id: 'srv-edr-12', name: 'Frazada de dos plazas', category: 'AL_SECO', unit: 'pieza', unitPrice: 20.00, estimatedHours: 168, iconName: 'Layers', description: 'Frazada polar o tigre de 2 plazas. Entrega en 1 semana.' },
  { id: 'srv-edr-13', name: 'Frazada Queen', category: 'AL_SECO', unit: 'pieza', unitPrice: 22.00, estimatedHours: 168, iconName: 'Layers', description: 'Frazada Queen size. Entrega en 1 semana.' },
  { id: 'srv-edr-14', name: 'Frazada King', category: 'AL_SECO', unit: 'pieza', unitPrice: 23.00, estimatedHours: 168, iconName: 'Layers', description: 'Frazada King size. Entrega en 1 semana.' },

  // ================= 4. PLANCHADO A VAPOR =================
  { id: 'srv-pla-1', name: 'Planchado de Camisa a vapor', category: 'PLANCHADO', unit: 'prenda', unitPrice: 5.00, estimatedHours: 24, iconName: 'Flame', description: 'Camisa en prensa a vapor con acabado profesional.' },
  { id: 'srv-pla-2', name: 'Planchado de Pantalones', category: 'PLANCHADO', unit: 'prenda', unitPrice: 5.00, estimatedHours: 24, iconName: 'Flame', description: 'Pantalón de vestir con raya perfecta.' },
  { id: 'srv-pla-3', name: 'Planchado de Baby doll', category: 'PLANCHADO', unit: 'prenda', unitPrice: 10.00, estimatedHours: 24, iconName: 'Flame', description: 'Prendas delicadas con vapor suave.' },
  { id: 'srv-pla-4', name: 'Planchado de Bata sencilla', category: 'PLANCHADO', unit: 'prenda', unitPrice: 9.00, estimatedHours: 24, iconName: 'Flame', description: 'Batas de casa.' },
  { id: 'srv-pla-5', name: 'Planchado de Terno (saco y pantalón)', category: 'PLANCHADO', unit: 'conjunto', unitPrice: 11.00, estimatedHours: 24, iconName: 'Flame', description: 'Planchado artesanal de sastre para terno.' },
  { id: 'srv-pla-6', name: 'Planchado de Almohada', category: 'PLANCHADO', unit: 'pieza', unitPrice: 11.00, estimatedHours: 24, iconName: 'Flame', description: 'Funda y almohada al vapor.' },
  { id: 'srv-pla-7', name: 'Planchado de Bermuda', category: 'PLANCHADO', unit: 'prenda', unitPrice: 5.00, estimatedHours: 24, iconName: 'Flame', description: 'Bermuda o short de vestir.' },
  { id: 'srv-pla-8', name: 'Planchado Solo Saco', category: 'PLANCHADO', unit: 'prenda', unitPrice: 6.00, estimatedHours: 24, iconName: 'Flame', description: 'Saco o blazer independiente.' },
  { id: 'srv-pla-9', name: 'Planchado Sacón de cuero', category: 'PLANCHADO', unit: 'prenda', unitPrice: 15.00, estimatedHours: 48, iconName: 'Flame', description: 'Vaporizado controlado para cuero.' },
  { id: 'srv-pla-10', name: 'Planchado Casacón / Casaca', category: 'PLANCHADO', unit: 'prenda', unitPrice: 10.00, estimatedHours: 24, iconName: 'Flame', description: 'Casaca o casacón planchado a vapor.' },

  // ================= 5. TEÑIDO DE PRENDAS (Entrega en 10 DÍAS) =================
  { id: 'srv-ten-1', name: 'Teñido de Pantalón Jean / Dril (Azul/Negro)', category: 'TENIDO', unit: 'prenda', unitPrice: 25.00, estimatedHours: 240, iconName: 'Palette', description: 'Entrega en 10 días garantizados. Fijación industrial de color.' },
  { id: 'srv-ten-2', name: 'Teñido de Casaca / Polerón', category: 'TENIDO', unit: 'prenda', unitPrice: 32.00, estimatedHours: 240, iconName: 'Palette', description: 'Entrega en 10 días garantizados. Algodón y mezclas.' },

  // ================= 6. ALFOMBRAS (Entrega de 15 a 20 DÍAS) =================
  { id: 'srv-alf-1', name: 'Lavado de Alfombra Sintética (m²)', category: 'ALFOMBRAS', unit: 'm2', unitPrice: 18.00, estimatedHours: 360, iconName: 'Grid', description: 'Lavado especializado con inyección y extracción. Entrega entre 15 a 20 días.', pricingFormula: 'DIMENSIONS_M2', isActive: true },
  { id: 'srv-alf-2', name: 'Lavado de Alfombra Persa o Lana Natural (m²)', category: 'ALFOMBRAS', unit: 'm2', unitPrice: 30.00, estimatedHours: 480, iconName: 'Grid', description: 'Lavado artesanal con secado antiácaros. Entrega entre 15 a 20 días.', pricingFormula: 'DIMENSIONS_M2', isActive: true },

  // ================= 7. MUEBLES Y ADICIONALES =================
  { id: 'srv-mue-1', name: 'Lavado de Mueble 2 Cuerpos a Domicilio', category: 'MUEBLES', unit: 'pieza', unitPrice: 85.00, estimatedHours: 48, iconName: 'Armchair', description: 'Atención a domicilio en San Borja y distritos aledaños.' },
  { id: 'srv-mue-2', name: 'Lavado y Desinfección Colchón 2 Plazas', category: 'MUEBLES', unit: 'pieza', unitPrice: 75.00, estimatedHours: 48, iconName: 'Bed', description: 'Desinfección doble cara con secado rápido.' },
  { id: 'srv-adi-1', name: 'Desmanchado Profundo / Cuellos / Axilas', category: 'ADICIONALES', unit: 'prenda', unitPrice: 12.00, estimatedHours: 12, iconName: 'Sparkles', description: 'Quita manchas químico focalizado.' },
];

// Seed Customers with Loyalty Status
const DEFAULT_CUSTOMERS: Customer[] = [];

// Seed Initial Orders with various stages, payments and partial items
const DEFAULT_ORDERS: Order[] = [];

// Seed Daily Expenses (Egresos)
const DEFAULT_EXPENSES: Expense[] = [];

// Seed Monthly Fixed Expenses (Gastos Fijos Mensuales Estructurales)
const DEFAULT_FIXED_EXPENSES: MonthlyFixedExpense[] = [];

// Seed Current Cash Register Shift (Turno abierto)
const DEFAULT_SHIFTS: CashRegisterShift[] = [];

// Seed Inventory of Supplies
const DEFAULT_INVENTORY: InventoryItem[] = [];

const DEFAULT_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

// Seed Active Promotions
const DEFAULT_PROMOTIONS: Promotion[] = [
  { id: 'promo-web-4x3', code: 'SECO4X3', name: '4x3 en ropa al seco', description: 'Lleva 4 prendas y paga solo 3.', discountType: 'PORCENTAJE', discountValue: 25, applicableCategory: 'AL_SECO', active: true, validUntil: '2026-11-28T23:59:59Z', timesUsed: 0 },
  { id: 'promo-web-3x2', code: 'EDREDON3X2', name: '3x2 en edredones', description: 'Lleva 3 edredones y paga solo 2.', discountType: 'PORCENTAJE', discountValue: 33.33, applicableCategory: 'AL_SECO', active: true, validUntil: '2026-11-28T23:59:59Z', timesUsed: 0 },
  { id: 'promo-web-bienvenida', code: 'BIENVENIDO10', name: '10% en tu primer servicio', description: 'Beneficio de bienvenida para clientes nuevos.', discountType: 'PORCENTAJE', discountValue: 10, applicableCategory: 'TODOS', active: true, validUntil: '2026-12-31T23:59:59Z', timesUsed: 0 },
  { id: 'promo-web-15', code: 'LAVA15', name: '15 años de LavaFlash', description: 'Promoción especial por nuestro mes de aniversario.', discountType: 'PORCENTAJE', discountValue: 15, applicableCategory: 'TODOS', active: true, validUntil: '2026-11-28T23:59:59Z', timesUsed: 0 },
];

// Seed Claims & Warranties
const DEFAULT_CLAIMS: Claim[] = [];

// Seed Audit Logs for compliance & traceability
const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

// No se precargan testimonios ficticios. Las reseñas públicas se consultan en Google desde la web.
const DEFAULT_REVIEWS: CustomerReview[] = [];

// Reactive Database Class with local cache synchronized to the central server database
class DatabaseService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.initializeIfEmpty();
  }

  private removeLegacyDemoData() {
    for (const [keyName, demoIds] of Object.entries(LEGACY_DEMO_IDS)) {
      if (!demoIds) continue;
      const storageKey = STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS];
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) continue;
        const cleaned = list.filter((item) => !demoIds.has(String(item?.id || '')));
        if (cleaned.length !== list.length) writeLocalAndSync(storageKey, JSON.stringify(cleaned));
      } catch {
        // Si el dato legado está corrupto, la inicialización normal lo reemplazará cuando corresponda.
      }
    }
  }

  private initializeIfEmpty() {
    this.removeLegacyDemoData();
    // LavaFlash usa únicamente la cuenta administrativa en esta versión.
    // Se normaliza el almacenamiento para evitar credenciales antiguas o incompletas.
    writeLocalAndSync(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    try {
      const existingSession: User | null = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      if (existingSession && existingSession.role !== 'ADMIN') localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    // No se inicia sesión automáticamente; el panel exige autenticación explícita.

    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    }
    const existingServicesRaw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!existingServicesRaw) {
      writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    } else {
      try {
        const parsed: CatalogService[] = JSON.parse(existingServicesRaw);
        const needsUpdate = parsed.length < DEFAULT_SERVICES.length || 
          !parsed.some(x => x.id === 'srv-sec-1') ||
          !parsed.some(x => x.id === 'srv-pla-1') ||
          !parsed.some(x => x.id === 'srv-ten-1');
        if (needsUpdate) {
          writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        }
      } catch {
        writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      writeLocalAndSync(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FIXED_EXPENSES)) {
      writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(DEFAULT_FIXED_EXPENSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      writeLocalAndSync(STORAGE_KEYS.SHIFTS, JSON.stringify(DEFAULT_SHIFTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      writeLocalAndSync(STORAGE_KEYS.INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS)) {
      writeLocalAndSync(STORAGE_KEYS.INVENTORY_MOVEMENTS, JSON.stringify(DEFAULT_INVENTORY_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
      writeLocalAndSync(STORAGE_KEYS.PROMOTIONS, JSON.stringify(DEFAULT_PROMOTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) {
      writeLocalAndSync(STORAGE_KEYS.CLAIMS, JSON.stringify(DEFAULT_CLAIMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      writeLocalAndSync(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      writeLocalAndSync(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
    } else {
      // Elimina únicamente los testimonios de demostración de versiones anteriores.
      try {
        const storedReviews: CustomerReview[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]');
        const demoIds = new Set(['rev-1','rev-2','rev-3','rev-4','rev-5']);
        const cleaned = storedReviews.filter(review => !demoIds.has(review.id));
        if (cleaned.length !== storedReviews.length) {
          writeLocalAndSync(STORAGE_KEYS.REVIEWS, JSON.stringify(cleaned));
        }
      } catch {
        writeLocalAndSync(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
      }
    }
  }

  // Subscribe to updates
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public notifyExternalUpdate() {
    this.notify();
  }

  // ================= USERS & AUTH =================
  public getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  public getCurrentUser(): User | null {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  }

  public getStaffUserOrFallback(): User {
    const user = this.getCurrentUser();
    return user || DEFAULT_USERS[0];
  }

  public setCurrentUser(user: User, audit = true) {
    // La sesión no necesita conservar el código de acceso del usuario.
    const { accessCode: _accessCode, ...sessionUser } = user;
    writeLocalAndSync(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    if (audit) {
      this.logAudit({
        action: 'INICIO_SESION_ADMIN',
        entityType: 'CUSTOMER',
        entityId: user.id,
        details: `Sesión administrativa iniciada: ${user.name} (${user.role})`
      });
    }
    this.notify();
  }

  public logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  // ================= AUDIT LOG =================
  public getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp' | 'userName' | 'userRole'>) {
    const user = this.getStaffUserOrFallback();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
    };
    logs.unshift(newLog);
    writeLocalAndSync(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500))); // keep 500 logs
  }

  // ================= CUSTOMERS & LOYALTY =================
  public getCustomers(): Customer[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  }

  public getCustomerByDocument(docNumber: string): Customer | undefined {
    const customers = this.getCustomers();
    const cleanDoc = docNumber.trim();
    return customers.find(c => c.documentNumber === cleanDoc);
  }

  public saveCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalServicesCount' | 'activeLoyaltyStamps' | 'hasPendingVoucher' | 'totalSpent'>): Customer {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.documentNumber === customerData.documentNumber);

    if (existingIndex >= 0) {
      customers[existingIndex] = {
        ...customers[existingIndex],
        ...customerData,
        updatedAt: new Date().toISOString(),
      };
      writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      this.logAudit({
        action: 'ACTUALIZAR_CLIENTE',
        entityType: 'CUSTOMER',
        entityId: customers[existingIndex].id,
        details: `Actualizados datos de cliente: ${customerData.fullName} (${customerData.documentNumber})`
      });
      this.notify();
      return customers[existingIndex];
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        ...customerData,
        totalServicesCount: 0,
        activeLoyaltyStamps: 0,
        hasPendingVoucher: false,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      customers.push(newCustomer);
      writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      this.logAudit({
        action: 'CREAR_CLIENTE',
        entityType: 'CUSTOMER',
        entityId: newCustomer.id,
        details: `Nuevo cliente registrado: ${newCustomer.fullName} - ${newCustomer.documentType} ${newCustomer.documentNumber}`
      });
      this.notify();
      return newCustomer;
    }
  }

  // Update existing customer details (e.g. phone number, address, full name, notes) and sync to active orders
  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const previousPhone = customers[index].phone;
    const updatedCustomer: Customer = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    customers[index] = updatedCustomer;
    writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    // If phone number or name changed, propagate to all non-delivered or existing orders for this customer
    if (updates.phone || updates.fullName) {
      try {
        const orders = this.getOrders();
        let ordersModified = false;
        orders.forEach(o => {
          if (o.customerId === id) {
            if (updates.phone) o.customerPhone = updates.phone;
            if (updates.fullName) o.customerName = updates.fullName;
            ordersModified = true;
          }
        });
        if (ordersModified) {
          writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        }
      } catch (err) {
        console.error('Error synchronizing customer phone to orders:', err);
      }
    }

    this.logAudit({
      action: 'ACTUALIZAR_CLIENTE',
      entityType: 'CUSTOMER',
      entityId: id,
      details: `Cliente "${updatedCustomer.fullName}" actualizado. ${updates.phone && updates.phone !== previousPhone ? `Celular cambió de ${previousPhone} a ${updates.phone}.` : ''}`
    });

    this.notify();
    return updatedCustomer;
  }

  public deleteCustomer(id: string): boolean {
    let customers = this.getCustomers();
    const target = customers.find(c => c.id === id);
    if (!target) return false;

    customers = customers.filter(c => c.id !== id);
    writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    this.logAudit({
      action: 'ELIMINAR_CLIENTE',
      entityType: 'CUSTOMER',
      entityId: id,
      details: `Cliente eliminado del directorio: ${target.fullName} (${target.documentNumber})`
    });

    this.notify();
    return true;
  }

  // Record a pickup reminder sent to a customer for uncollected garments
  public recordPickupReminder(orderId: string, channel: 'WHATSAPP' | 'LLAMADA' | 'SMS', notes?: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    const user = this.getStaffUserOrFallback();

    order.whatsappNotificationSent = true;
    order.whatsappSentAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    const noteText = notes || `Recordatorio de recojo enviado vía ${channel} por ${user.name}.`;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      note: noteText
    });

    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.logAudit({
      action: 'RECORDATORIO_RECOJO_ENVIADO',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Recordatorio de recojo enviado a ${order.customerName} (${order.customerPhone}) para orden ${order.code}. Canal: ${channel}.`
    });

    this.notify();
    return order;
  }

  // Updates customer loyalty when an order is created or completed
  public incrementCustomerLoyalty(customerId: string, orderTotal: number, voucherUsed: boolean): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) return null;

    const customer = customers[index];
    const newTotalServices = customer.totalServicesCount + 1;
    let newStamps = customer.activeLoyaltyStamps + 1;
    let hasVoucher = customer.hasPendingVoucher;

    if (voucherUsed) {
      hasVoucher = false;
    }

    // Every 10th service grants S/ 15 discount voucher
    if (newStamps >= 10) {
      newStamps = 0; // resets card
      hasVoucher = true; // awarded S/ 15 discount!
    }

    customer.totalServicesCount = newTotalServices;
    customer.activeLoyaltyStamps = newStamps;
    customer.hasPendingVoucher = hasVoucher;
    customer.totalSpent += orderTotal;
    customer.updatedAt = new Date().toISOString();

    customers[index] = customer;
    writeLocalAndSync(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.notify();
    return customer;
  }

  // ================= CATALOG SERVICES CRUD =================
  public getServices(): CatalogService[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) return DEFAULT_SERVICES;
    try {
      const parsed = JSON.parse(raw);
      // Ensure defaults for alfombras have formula if legacy
      return parsed.map((s: CatalogService) => {
        if (s.category === 'ALFOMBRAS' || s.unit === 'm2') {
          return { ...s, pricingFormula: s.pricingFormula || 'DIMENSIONS_M2' };
        }
        return s;
      });
    } catch {
      return DEFAULT_SERVICES;
    }
  }

  public getServiceById(id: string): CatalogService | undefined {
    return this.getServices().find(s => s.id === id);
  }

  public saveService(serviceData: Partial<CatalogService> & { name: string; unitPrice: number; category: any; unit: any }): CatalogService {
    const services = this.getServices();
    const isNew = !serviceData.id;
    const currentUser = this.getStaffUserOrFallback();

    if (isNew) {
      const newService: CatalogService = {
        id: `srv-${Date.now()}`,
        name: serviceData.name.trim(),
        category: serviceData.category,
        unit: serviceData.unit,
        unitPrice: Number(serviceData.unitPrice) || 0,
        minPrice: serviceData.minPrice !== undefined ? Number(serviceData.minPrice) : undefined,
        estimatedHours: Number(serviceData.estimatedHours) || 24,
        iconName: serviceData.iconName || 'Shirt',
        description: serviceData.description || '',
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
        pricingFormula: serviceData.pricingFormula || (serviceData.category === 'ALFOMBRAS' || serviceData.unit === 'm2' ? 'DIMENSIONS_M2' : serviceData.category === 'AL_PESO' ? 'WEIGHT_KG' : 'STANDARD'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      services.push(newService);
      writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(services));

      this.logAudit({
        action: 'CREAR_SERVICIO',
        entityType: 'CATALOG_SERVICE',
        entityId: newService.id,
        details: `Nuevo servicio creado por ${currentUser?.name || 'Administrador'}: "${newService.name}" a S/ ${newService.unitPrice.toFixed(2)} por ${newService.unit} (${newService.category})`
      });

      this.notify();
      return newService;
    } else {
      const index = services.findIndex(s => s.id === serviceData.id);
      if (index === -1) {
        throw new Error('Servicio no encontrado para actualizar');
      }

      const prev = services[index];
      const updatedService: CatalogService = {
        ...prev,
        ...serviceData,
        name: serviceData.name ? serviceData.name.trim() : prev.name,
        unitPrice: serviceData.unitPrice !== undefined ? Number(serviceData.unitPrice) : prev.unitPrice,
        minPrice: serviceData.minPrice !== undefined ? Number(serviceData.minPrice) : prev.minPrice,
        estimatedHours: serviceData.estimatedHours !== undefined ? Number(serviceData.estimatedHours) : prev.estimatedHours,
        pricingFormula: serviceData.pricingFormula || (serviceData.category === 'ALFOMBRAS' || serviceData.unit === 'm2' ? 'DIMENSIONS_M2' : serviceData.category === 'AL_PESO' ? 'WEIGHT_KG' : (prev.pricingFormula || 'STANDARD')),
        updatedAt: new Date().toISOString(),
      };

      services[index] = updatedService;
      writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(services));

      const priceChanged = prev.unitPrice !== updatedService.unitPrice;
      this.logAudit({
        action: 'ACTUALIZAR_SERVICIO',
        entityType: 'CATALOG_SERVICE',
        entityId: updatedService.id,
        details: `Servicio modificado por ${currentUser?.name || 'Administrador'}: "${updatedService.name}". ${priceChanged ? `Precio cambió de S/ ${prev.unitPrice.toFixed(2)} a S/ ${updatedService.unitPrice.toFixed(2)}.` : ''}`
      });

      this.notify();
      return updatedService;
    }
  }

  public updateServicePrice(id: string, newPrice: number): boolean {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return false;

    const oldPrice = services[index].unitPrice;
    services[index].unitPrice = Number(newPrice) || 0;
    services[index].updatedAt = new Date().toISOString();

    writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(services));

    this.logAudit({
      action: 'ACTUALIZAR_PRECIO_SERVICIO',
      entityType: 'CATALOG_SERVICE',
      entityId: id,
      details: `Precio ajustado para "${services[index].name}": S/ ${oldPrice.toFixed(2)} ➔ S/ ${services[index].unitPrice.toFixed(2)}`
    });

    this.notify();
    return true;
  }

  public toggleServiceStatus(id: string): boolean {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return false;

    const currentStatus = services[index].isActive !== false;
    services[index].isActive = !currentStatus;
    services[index].updatedAt = new Date().toISOString();

    writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    this.notify();
    return true;
  }

  public deleteService(id: string): boolean {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return false;

    const removed = services[index];
    const updated = services.filter(s => s.id !== id);
    writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(updated));

    const currentUser = this.getStaffUserOrFallback();
    this.logAudit({
      action: 'ELIMINAR_SERVICIO',
      entityType: 'CATALOG_SERVICE',
      entityId: id,
      details: `Servicio eliminado por ${currentUser?.name || 'Administrador'}: "${removed.name}" (Cat: ${removed.category}, S/ ${removed.unitPrice.toFixed(2)})`
    });

    this.notify();
    return true;
  }

  public batchUpdatePrices(category?: string, percentIncrease?: number): void {
    const services = this.getServices();
    const pct = (percentIncrease || 0) / 100;
    let count = 0;

    const updated = services.map(s => {
      if (!category || category === 'ALL' || s.category === category) {
        const newPrice = Math.round((s.unitPrice * (1 + pct)) * 10) / 10;
        count++;
        return {
          ...s,
          unitPrice: newPrice,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });

    writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(updated));

    this.logAudit({
      action: 'AJUSTE_MASIVO_PRECIOS',
      entityType: 'CATALOG_SERVICE',
      entityId: 'BATCH',
      details: `Ajuste masivo de precios del ${percentIncrease}% aplicado a ${count} servicio(s)${category && category !== 'ALL' ? ` en categoría ${category}` : ''}.`
    });

    this.notify();
  }

  public resetServicesToDefault(): void {
    writeLocalAndSync(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    this.logAudit({
      action: 'RESTABLECER_SERVICIOS',
      entityType: 'CATALOG_SERVICE',
      entityId: 'ALL',
      details: 'El catálogo de tarifas y servicios fue restablecido a valores iniciales de fábrica.'
    });
    this.notify();
  }

  // ================= ORDERS & SALES =================
  public getOrders(): Order[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  }

  public getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  public getOrdersByCustomer(customerId: string): Order[] {
    return this.getOrders().filter(o => o.customerId === customerId);
  }

  public createOrder(orderData: Omit<Order, 'id' | 'code' | 'statusHistory' | 'partialDeliveries' | 'createdAt' | 'updatedAt' | 'createdBy'>): Order {
    const orders = this.getOrders();
    const user = this.getStaffUserOrFallback();
    const orderNumber = orders.length + 101;
    const orderCode = `ORD-${new Date().getFullYear()}-${orderNumber.toString().padStart(4, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: orderCode,
      ...orderData,
      statusHistory: [
        {
          status: orderData.status,
          timestamp: new Date().toISOString(),
          userName: user.name,
          userRole: user.role,
          note: `Recepción inicial de pedido. Comprobante: ${orderData.voucherType} ${orderData.voucherNumber}`
        }
      ],
      partialDeliveries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name,
    };

    orders.unshift(newOrder);
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Update customer stats and loyalty
    this.incrementCustomerLoyalty(orderData.customerId, orderData.total, orderData.loyaltyDiscountApplied);

    // Register initial payment into current active shift if any payment was made
    if (orderData.payments && orderData.payments.length > 0) {
      orderData.payments.forEach(p => {
        this.addPaymentToShift(p);
      });
    }

    this.logAudit({
      action: 'CREACION_ORDEN_VENTA',
      entityType: 'ORDER',
      entityId: newOrder.id,
      details: `Nueva orden ${newOrder.code} para ${newOrder.customerName}. Total: S/ ${newOrder.total.toFixed(2)}, Pagado: S/ ${newOrder.totalPaid.toFixed(2)}, Saldo: S/ ${newOrder.pendingBalance.toFixed(2)}`
    });

    this.notify();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    const user = this.getStaffUserOrFallback();

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      note: note || `Estado actualizado a ${newStatus}`
    });

    if (newStatus === 'ENTREGADO') {
      order.actualDeliveredAt = new Date().toISOString();
      order.deliveredBy = user.name;
      // Mark all items as delivered
      order.items = order.items.map(item => ({
        ...item,
        isDelivered: true,
        deliveredAt: item.deliveredAt || new Date().toISOString(),
        deliveredBy: item.deliveredBy || user.name
      }));
    }

    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.logAudit({
      action: 'CAMBIO_ESTADO_ORDEN',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Orden ${order.code} cambió a ${newStatus}. Operador: ${user.name} (${user.role})`
    });

    this.notify();
    return order;
  }

  // Control de Calidad: Operador revisa y marca "Listo"
  public approveQualityAndNotify(orderId: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    const user = this.getStaffUserOrFallback();

    order.status = 'LISTO_PARA_ENTREGA';
    order.qualityApprovedAt = new Date().toISOString();
    order.qualityApprovedBy = user.name;
    order.whatsappNotificationSent = true;
    order.whatsappSentAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    order.statusHistory.push({
      status: 'LISTO_PARA_ENTREGA',
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      note: 'Control de calidad aprobado. Prendas revisadas e integradas. Notificación automática WhatsApp disparada al cliente.'
    });

    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.logAudit({
      action: 'CONTROL_CALIDAD_APROBADO',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Control de Calidad: Pedido ${order.code} listo. WhatsApp preparado y enviado a ${order.customerPhone}`
    });

    this.notify();
    return order;
  }

  // Control de Entregas Parciales y Cobro Proporcional
  public executePartialDelivery(
    orderId: string,
    deliveredItemIds: string[],
    amountToCollect: number,
    paymentMethod: PaymentMethod,
    conformityNotes?: string,
    signatureBase64?: string
  ): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return { success: false, error: 'Orden no encontrada' };

    const order = orders[index];
    const user = this.getStaffUserOrFallback();
    const activeShift = this.getActiveShift();

    // Verify items
    const deliveredItemsInfo: { itemId: string; serviceName: string; quantity: number; subtotal: number }[] = [];
    let itemsValue = 0;

    order.items = order.items.map(item => {
      if (deliveredItemIds.includes(item.id)) {
        deliveredItemsInfo.push({
          itemId: item.id,
          serviceName: item.serviceName,
          quantity: item.quantity,
          subtotal: item.subtotal,
        });
        itemsValue += item.subtotal;
        return {
          ...item,
          isDelivered: true,
          deliveredAt: new Date().toISOString(),
          deliveredBy: user.name,
        };
      }
      return item;
    });

    // Register payment if amount was collected
    if (amountToCollect > 0) {
      const newPayment: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        orderId: order.id,
        amount: amountToCollect,
        paymentMethod: paymentMethod,
        paymentType: 'COBRO_ENTREGA_PARCIAL',
        createdAt: new Date().toISOString(),
        cashierName: user.name,
        shiftId: activeShift ? activeShift.id : 'shift-default'
      };

      order.payments.push(newPayment);
      order.totalPaid += amountToCollect;
      order.pendingBalance = Math.max(0, order.total - order.totalPaid);

      if (order.pendingBalance <= 0) {
        order.paymentStatus = 'PAGADO';
      } else {
        order.paymentStatus = 'ADELANTO_PARCIAL';
      }

      this.addPaymentToShift(newPayment);
    }

    // Check if ALL items in order are now delivered
    const allDelivered = order.items.every(i => i.isDelivered);

    const partialRecord: PartialDeliveryRecord = {
      id: `part-${Date.now()}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      deliveredItems: deliveredItemsInfo,
      amountCharged: amountToCollect,
      paymentMethod: paymentMethod,
      deliveredBy: user.name,
      customerSignature: signatureBase64,
      conformityNotes: conformityNotes
    };

    order.partialDeliveries.push(partialRecord);

    if (allDelivered) {
      order.status = 'ENTREGADO';
      order.actualDeliveredAt = new Date().toISOString();
      order.deliveredBy = user.name;
      if (signatureBase64) order.customerSignature = signatureBase64;
    } else {
      order.status = 'ENTREGA_PARCIAL';
    }

    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      note: allDelivered 
        ? `Entrega final completada de todas las prendas restantes. Cobrado: S/ ${amountToCollect.toFixed(2)}.`
        : `Entrega parcial de ${deliveredItemsInfo.length} prenda(s). Cobrado: S/ ${amountToCollect.toFixed(2)}. Saldo restante: S/ ${order.pendingBalance.toFixed(2)}.`
    });

    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.logAudit({
      action: 'ENTREGA_PARCIAL_REGISTRADA',
      entityType: 'PARTIAL_DELIVERY',
      entityId: order.id,
      details: `Entrega en orden ${order.code}. Artículos entregados: ${deliveredItemsInfo.map(i => i.serviceName).join(', ')}. Cobro realizado: S/ ${amountToCollect.toFixed(2)}. Saldo pendiente: S/ ${order.pendingBalance.toFixed(2)}`
    });

    this.notify();
    return { success: true, order };
  }

  // Cobro adicional o liquidación de saldo
  public addOrderPayment(orderId: string, amount: number, paymentMethod: PaymentMethod, referenceCode?: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    const user = this.getStaffUserOrFallback();
    const activeShift = this.getActiveShift();

    const payment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      orderId: order.id,
      amount: amount,
      paymentMethod: paymentMethod,
      paymentType: (order.totalPaid + amount >= order.total) ? 'LIQUIDACION' : 'ADELANTO',
      referenceCode: referenceCode,
      createdAt: new Date().toISOString(),
      cashierName: user.name,
      shiftId: activeShift ? activeShift.id : 'shift-default'
    };

    order.payments.push(payment);
    order.totalPaid += amount;
    order.pendingBalance = Math.max(0, order.total - order.totalPaid);

    if (order.pendingBalance <= 0) {
      order.paymentStatus = 'PAGADO';
    } else {
      order.paymentStatus = 'ADELANTO_PARCIAL';
    }

    order.updatedAt = new Date().toISOString();
    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.addPaymentToShift(payment);

    this.logAudit({
      action: 'PAGO_ORDEN_REGISTRADO',
      entityType: 'PAYMENT',
      entityId: order.id,
      details: `Abono de S/ ${amount.toFixed(2)} (${paymentMethod}) a orden ${order.code}. Saldo: S/ ${order.pendingBalance.toFixed(2)}`
    });

    this.notify();
    return order;
  }

  // ================= EXPENSES (EGRESOS) =================
  public getExpenses(): Expense[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
  }

  public registerExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'responsibleName' | 'shiftId'>): Expense {
    const expenses = this.getExpenses();
    const user = this.getStaffUserOrFallback();
    const activeShift = this.getActiveShift();

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...expenseData,
      responsibleName: user.name,
      shiftId: activeShift ? activeShift.id : 'shift-default',
      createdAt: new Date().toISOString(),
    };

    expenses.unshift(newExpense);
    writeLocalAndSync(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    // Update active shift expenses
    if (activeShift) {
      activeShift.totalExpenses += expenseData.amount;
      activeShift.expectedCash = activeShift.initialCash + activeShift.totalCashSales - activeShift.totalExpenses;
      this.updateShift(activeShift);
    }

    this.logAudit({
      action: 'REGISTRO_EGRESO',
      entityType: 'EXPENSE',
      entityId: newExpense.id,
      details: `Egreso de caja: S/ ${newExpense.amount.toFixed(2)} por "${newExpense.description}" (${newExpense.category})`
    });

    this.notify();
    return newExpense;
  }

  // ================= MONTHLY FIXED EXPENSES (GASTOS FIJOS MENSUALES) =================
  public getFixedExpenses(): MonthlyFixedExpense[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FIXED_EXPENSES) || '[]');
  }

  public saveFixedExpense(expenseData: Omit<MonthlyFixedExpense, 'id' | 'createdAt'> & { id?: string }): MonthlyFixedExpense {
    const list = this.getFixedExpenses();
    const user = this.getStaffUserOrFallback();

    if (expenseData.id) {
      // Edit existing
      const idx = list.findIndex(e => e.id === expenseData.id);
      if (idx !== -1) {
        const updated: MonthlyFixedExpense = {
          ...list[idx],
          ...expenseData,
          id: expenseData.id,
          amount: Number(expenseData.amount)
        };
        list[idx] = updated;
        writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(list));
        this.logAudit({
          action: 'ACTUALIZAR_GASTO_FIJO',
          entityType: 'FIXED_EXPENSE',
          entityId: updated.id,
          details: `Gasto fijo actualizado: "${updated.concept}" (S/ ${updated.amount.toFixed(2)}) para mes ${updated.month}/${updated.year}`
        });
        this.notify();
        return updated;
      }
    }

    // Create new
    const newFixed: MonthlyFixedExpense = {
      ...expenseData,
      id: `fix-${Date.now()}`,
      amount: Number(expenseData.amount),
      createdAt: new Date().toISOString()
    };

    list.unshift(newFixed);
    writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(list));

    this.logAudit({
      action: 'REGISTRO_GASTO_FIJO',
      entityType: 'FIXED_EXPENSE',
      entityId: newFixed.id,
      details: `Gasto fijo registrado por ${user.name}: "${newFixed.concept}" (S/ ${newFixed.amount.toFixed(2)}) para mes ${newFixed.month}/${newFixed.year}. Estado: ${newFixed.status}`
    });

    this.notify();
    return newFixed;
  }

  public deleteFixedExpense(id: string): boolean {
    const list = this.getFixedExpenses();
    const item = list.find(e => e.id === id);
    if (!item) return false;

    const filtered = list.filter(e => e.id !== id);
    writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(filtered));

    this.logAudit({
      action: 'ELIMINAR_GASTO_FIJO',
      entityType: 'FIXED_EXPENSE',
      entityId: id,
      details: `Gasto fijo eliminado: "${item.concept}" (S/ ${item.amount.toFixed(2)}) del mes ${item.month}/${item.year}`
    });

    this.notify();
    return true;
  }

  public toggleFixedExpensePayment(
    id: string, 
    paymentMethod: MonthlyFixedExpense['paymentMethod'] = 'TRANSFERENCIA', 
    receiptNumber?: string, 
    paidBy?: string
  ): MonthlyFixedExpense | null {
    const list = this.getFixedExpenses();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const current = list[idx];
    const user = this.getStaffUserOrFallback();

    if (current.status === 'PAGADO') {
      // Revert to pending
      current.status = 'PENDIENTE';
      delete current.paidAt;
      delete current.paymentMethod;
      delete current.paidBy;
      delete current.receiptNumber;
    } else {
      // Mark as paid
      current.status = 'PAGADO';
      current.paidAt = new Date().toISOString();
      current.paymentMethod = paymentMethod;
      current.paidBy = paidBy || user.name;
      if (receiptNumber) current.receiptNumber = receiptNumber;
    }

    list[idx] = current;
    writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(list));

    this.logAudit({
      action: current.status === 'PAGADO' ? 'PAGO_GASTO_FIJO' : 'REVERTIR_PAGO_GASTO_FIJO',
      entityType: 'FIXED_EXPENSE',
      entityId: current.id,
      details: `Gasto fijo "${current.concept}" (S/ ${current.amount.toFixed(2)}) marcado como ${current.status}. Operador: ${user.name}`
    });

    this.notify();
    return current;
  }

  public generateRecurringFixedExpenses(targetMonth: number, targetYear: number): { addedCount: number; expenses: MonthlyFixedExpense[] } {
    const list = this.getFixedExpenses();
    const user = this.getStaffUserOrFallback();

    // Find all unique recurring expense templates by concept or category
    const recurringMap = new Map<string, MonthlyFixedExpense>();
    list.forEach(item => {
      if (item.isRecurring) {
        if (!recurringMap.has(item.concept)) {
          recurringMap.set(item.concept, item);
        }
      }
    });

    let addedCount = 0;
    const now = new Date();

    recurringMap.forEach((template) => {
      // Check if this concept already exists for targetMonth and targetYear
      const exists = list.some(e => e.concept.toLowerCase().trim() === template.concept.toLowerCase().trim() && e.month === targetMonth && e.year === targetYear);
      if (!exists) {
        // Calculate due date for target month
        let dayStr = '28';
        if (template.dueDate) {
          const parts = template.dueDate.split('-');
          if (parts.length === 3) dayStr = parts[2];
        }
        const formattedMonth = targetMonth.toString().padStart(2, '0');
        const formattedDue = `${targetYear}-${formattedMonth}-${dayStr.padStart(2, '0')}`;

        const newRec: MonthlyFixedExpense = {
          id: `fix-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          concept: template.concept,
          category: template.category,
          month: targetMonth,
          year: targetYear,
          amount: template.amount,
          dueDate: formattedDue,
          status: 'PENDIENTE',
          supplierName: template.supplierName,
          isRecurring: true,
          notes: template.notes || `Gasto fijo recurrente mensual generado para ${targetMonth}/${targetYear}`,
          createdAt: now.toISOString()
        };

        list.unshift(newRec);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      writeLocalAndSync(STORAGE_KEYS.FIXED_EXPENSES, JSON.stringify(list));
      this.logAudit({
        action: 'GENERAR_GASTOS_FIJOS_MENSUALES',
        entityType: 'FIXED_EXPENSE',
        entityId: `gen-${targetYear}-${targetMonth}`,
        details: `Se generaron automáticamente ${addedCount} gastos fijos recurrentes para el mes ${targetMonth}/${targetYear} por ${user.name}`
      });
      this.notify();
    }

    return { addedCount, expenses: list };
  }

  // ================= CASH SHIFTS & BLIND AUDIT =================
  public getShifts(): CashRegisterShift[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
  }

  public getActiveShift(): CashRegisterShift | undefined {
    return this.getShifts().find(s => s.status === 'ABIERTA');
  }

  public openShift(initialCash: number): CashRegisterShift {
    const shifts = this.getShifts();
    const user = this.getStaffUserOrFallback();
    const shiftCode = `TURNO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(shifts.length + 1).toString().padStart(2, '0')}`;

    const newShift: CashRegisterShift = {
      id: `shift-${Date.now()}`,
      shiftNumber: shiftCode,
      cashierId: user.id,
      cashierName: user.name,
      openedAt: new Date().toISOString(),
      status: 'ABIERTA',
      initialCash: initialCash,
      totalCashSales: 0,
      totalYapeSales: 0,
      totalPlinSales: 0,
      totalCardSales: 0,
      totalTransferSales: 0,
      totalExpenses: 0,
      expectedCash: initialCash,
    };

    shifts.unshift(newShift);
    writeLocalAndSync(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));

    this.logAudit({
      action: 'APERTURA_TURNO',
      entityType: 'CASH_SHIFT',
      entityId: newShift.id,
      details: `Apertura de turno ${newShift.shiftNumber} por ${user.name}. Fondo inicial: S/ ${initialCash.toFixed(2)}`
    });

    this.notify();
    return newShift;
  }

  public updateShift(shift: CashRegisterShift) {
    const shifts = this.getShifts();
    const index = shifts.findIndex(s => s.id === shift.id);
    if (index >= 0) {
      shifts[index] = shift;
      writeLocalAndSync(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
      this.notify();
    }
  }

  private addPaymentToShift(payment: PaymentTransaction) {
    const activeShift = this.getActiveShift();
    if (!activeShift) return;

    switch (payment.paymentMethod) {
      case 'EFECTIVO':
        activeShift.totalCashSales += payment.amount;
        break;
      case 'YAPE':
        activeShift.totalYapeSales += payment.amount;
        break;
      case 'PLIN':
        activeShift.totalPlinSales += payment.amount;
        break;
      case 'TARJETA':
        activeShift.totalCardSales += payment.amount;
        break;
      case 'TRANSFERENCIA':
        activeShift.totalTransferSales += payment.amount;
        break;
    }

    activeShift.expectedCash = activeShift.initialCash + activeShift.totalCashSales - activeShift.totalExpenses;
    this.updateShift(activeShift);
  }

  // Corte de Turno - Arqueo Ciego y Cierre de Caja
  public executeBlindAuditAndCloseShift(
    shiftId: string,
    blindCount: {
      bills100: number;
      bills50: number;
      bills20: number;
      bills10: number;
      coins5: number;
      coins2: number;
      coins1: number;
      coins050: number;
      coins020: number;
      coins010: number;
      totalDeclared: number;
    },
    auditNotes?: string
  ): CashRegisterShift | null {
    const shifts = this.getShifts();
    const index = shifts.findIndex(s => s.id === shiftId);
    if (index === -1) return null;

    const shift = shifts[index];
    const user = this.getStaffUserOrFallback();

    shift.closedAt = new Date().toISOString();
    shift.status = 'CERRADA';
    shift.blindCount = blindCount;
    shift.declaredCash = blindCount.totalDeclared;
    shift.discrepancy = Number((blindCount.totalDeclared - shift.expectedCash).toFixed(2));
    shift.auditNotes = auditNotes;

    shifts[index] = shift;
    writeLocalAndSync(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));

    const discrepancyLabel = shift.discrepancy === 0 
      ? 'CUADRE EXACTO' 
      : shift.discrepancy > 0 
        ? `SOBRANTE de S/ ${shift.discrepancy.toFixed(2)}` 
        : `FALTANTE de S/ ${Math.abs(shift.discrepancy).toFixed(2)}`;

    this.logAudit({
      action: 'CIERRE_ARQUEO_CIEGO',
      entityType: 'CASH_SHIFT',
      entityId: shift.id,
      details: `Arqueo ciego y cierre de turno ${shift.shiftNumber}. Declarado: S/ ${shift.declaredCash.toFixed(2)}, Esperado: S/ ${shift.expectedCash.toFixed(2)}. Resultado: ${discrepancyLabel}. Operador: ${user.name}`
    });

    this.notify();
    return shift;
  }

  // ================= INVENTORY & KARDEX =================
  public getInventory(): InventoryItem[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
  }

  public getInventoryMovements(): InventoryMovement[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS) || '[]');
  }

  public recordInventoryMovement(
    itemId: string,
    movementType: 'ENTRADA_COMPRA' | 'SALIDA_CONSUMO' | 'AJUSTE_MERMA',
    quantity: number,
    notes: string
  ): InventoryItem | null {
    const items = this.getInventory();
    const index = items.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    const item = items[index];
    const user = this.getStaffUserOrFallback();
    const prevStock = item.currentStock;
    let newStock = prevStock;

    if (movementType === 'ENTRADA_COMPRA') {
      newStock += quantity;
      item.lastRestockedAt = new Date().toISOString();
    } else {
      newStock = Math.max(0, prevStock - quantity);
    }

    item.currentStock = newStock;
    items[index] = item;
    writeLocalAndSync(STORAGE_KEYS.INVENTORY, JSON.stringify(items));

    // Kardex record
    const movements = this.getInventoryMovements();
    const mov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      inventoryItemId: item.id,
      itemName: item.name,
      movementType,
      quantity,
      previousStock: prevStock,
      newStock,
      notes,
      responsibleName: user.name,
      createdAt: new Date().toISOString()
    };
    movements.unshift(mov);
    writeLocalAndSync(STORAGE_KEYS.INVENTORY_MOVEMENTS, JSON.stringify(movements));

    this.logAudit({
      action: 'MOVIMIENTO_INVENTARIO',
      entityType: 'INVENTORY',
      entityId: item.id,
      details: `Kardex: ${movementType} de ${quantity} ${item.unit} en "${item.name}". Stock resultante: ${newStock}`
    });

    this.notify();
    return item;
  }

  // ================= PROMOTIONS =================
  public getPromotions(): Promotion[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOTIONS) || '[]');
  }

  public savePromotion(promo: Promotion) {
    const promos = this.getPromotions();
    const index = promos.findIndex(p => p.id === promo.id);
    if (index >= 0) {
      promos[index] = promo;
    } else {
      promos.push(promo);
    }
    writeLocalAndSync(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promos));
    this.notify();
  }

  public togglePromotion(id: string) {
    const promos = this.getPromotions();
    const p = promos.find(item => item.id === id);
    if (p) {
      p.active = !p.active;
      writeLocalAndSync(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promos));
      this.notify();
    }
  }

  // ================= CLAIMS & WARRANTIES =================
  public getClaims(): Claim[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLAIMS) || '[]');
  }

  public registerClaim(claimData: Omit<Claim, 'id' | 'createdAt' | 'registeredBy'>): Claim {
    const claims = this.getClaims();
    const user = this.getStaffUserOrFallback();

    const newClaim: Claim = {
      id: `clm-${Date.now()}`,
      ...claimData,
      registeredBy: user.name,
      createdAt: new Date().toISOString()
    };

    claims.unshift(newClaim);
    writeLocalAndSync(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));

    this.logAudit({
      action: 'REGISTRO_RECLAMO',
      entityType: 'CLAIM',
      entityId: newClaim.id,
      details: `Reclamo registrado en orden ${newClaim.orderCode} (${newClaim.claimType}) para cliente ${newClaim.customerName}`
    });

    this.notify();
    return newClaim;
  }

  public resolveClaim(claimId: string, status: Claim['status'], notes: string, creditNoteAmount?: number): Claim | null {
    const claims = this.getClaims();
    const index = claims.findIndex(c => c.id === claimId);
    if (index === -1) return null;

    const claim = claims[index];
    claim.status = status;
    claim.resolutionNotes = notes;
    claim.resolvedAt = new Date().toISOString();
    if (creditNoteAmount) claim.creditNoteAmount = creditNoteAmount;

    claims[index] = claim;
    writeLocalAndSync(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));

    this.logAudit({
      action: 'RESOLUCION_RECLAMO',
      entityType: 'CLAIM',
      entityId: claim.id,
      details: `Reclamo ${claim.id} resuelto con estado: ${status}. Resolución: ${notes}`
    });

    this.notify();
    return claim;
  }

  // ================= DELIVERY DISPATCH =================
  public assignOrderToRider(orderId: string, riderId: string, riderName: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    order.isDeliveryToHome = true;
    order.assignedRiderId = riderId;
    order.assignedRiderName = riderName;
    order.deliveryStatus = 'EN_CAMINO';
    order.updatedAt = new Date().toISOString();

    orders[index] = order;
    writeLocalAndSync(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.logAudit({
      action: 'ASIGNACION_DELIVERY',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Orden ${order.code} asignada para delivery a motorizado ${riderName}`
    });

    this.notify();
    return order;
  }

  // ================= REVIEWS & FEEDBACK =================
  public getReviews(): CustomerReview[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return raw ? JSON.parse(raw) : DEFAULT_REVIEWS;
  }

  public addReview(reviewData: Omit<CustomerReview, 'id' | 'date'>): CustomerReview {
    const reviews = this.getReviews();
    const newReview: CustomerReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: 'Hoy',
    };
    reviews.unshift(newReview);
    writeLocalAndSync(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    this.notify();
    return newReview;
  }

  // ================= CLIENT TRACKING & ONLINE REQUESTS =================
  public trackOrder(query: string): Order[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const orders = this.getOrders();
    return orders.filter(o => 
      o.code.toLowerCase().includes(clean) ||
      o.customerDocument.includes(clean) ||
      o.customerPhone.includes(clean) ||
      o.voucherNumber.toLowerCase().includes(clean)
    );
  }

  public createOnlineRequest(data: {
    customerDocument: string;
    documentType: 'DNI' | 'RUC';
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: string;
    deliveryDistrict: string;
    deliveryReference?: string;
    serviceCategory: string;
    preferredDate: string;
    preferredTimeSlot: string; // 'MAÑANA' | 'TARDE'
    estimatedItemsDescription: string;
    observations?: string;
  }): { order: Order; customer: Customer } {
    // 1. Get or create customer
    let customer = this.getCustomers().find(c => c.documentNumber === data.customerDocument.trim());
    if (!customer) {
      customer = this.saveCustomer({
        documentType: data.documentType,
        documentNumber: data.customerDocument.trim(),
        fullName: data.customerName.trim(),
        phone: data.customerPhone.trim(),
        email: data.customerEmail?.trim(),
        address: `${data.deliveryAddress}, ${data.deliveryDistrict}`,
        reference: data.deliveryReference?.trim(),
        observations: data.observations,
        clientType: data.documentType === 'RUC' ? 'EMPRESA' : 'NATURAL',
      });
    }

    // 2. Generate items placeholder based on chosen service
    const services = this.getServices();
    const matchingService = services.find(s => s.category === data.serviceCategory) || services[0];

    const orderNumber = this.getOrders().length + 101;
    const voucherNumber = `WEB-${orderNumber.toString().padStart(4, '0')}`;

    const newOrder = this.createOrder({
      customerId: customer.id,
      customerName: customer.fullName,
      customerDocument: customer.documentNumber,
      customerPhone: customer.phone,
      voucherType: 'TICKET_RECOJO',
      voucherNumber,
      receivedAt: new Date().toISOString(),
      promisedDeliveryAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      items: [
        {
          id: `itm-${Date.now()}-1`,
          serviceId: matchingService.id,
          serviceName: matchingService.name,
          category: matchingService.category,
          quantity: 1,
          unitPrice: matchingService.unitPrice,
          subtotal: matchingService.unitPrice,
          notes: data.estimatedItemsDescription || 'Prendas a evaluar en recojo a domicilio',
          isDelivered: false
        }
      ],
      subtotal: matchingService.unitPrice,
      discountAmount: 0,
      loyaltyDiscountApplied: false,
      total: matchingService.unitPrice,
      paymentStatus: 'PENDIENTE_FIADO',
      totalPaid: 0,
      pendingBalance: matchingService.unitPrice,
      payments: [],
      status: 'RECIBIDO',
      observations: `[SOLICITUD WEB A DOMICILIO] Fecha pref: ${data.preferredDate} (${data.preferredTimeSlot}). Ref: ${data.deliveryReference || 'Sin ref'}. Notas: ${data.observations || 'Ninguna'}`,
      whatsappNotificationSent: false,
      isDeliveryToHome: true,
      deliveryAddress: `${data.deliveryAddress}, ${data.deliveryDistrict}`,
      deliveryReference: data.deliveryReference,
      deliveryStatus: 'PENDIENTE',
    });

    return { order: newOrder, customer };
  }

  // ================= BACKUP & EXPORT/IMPORT =================
  public exportFullDatabaseJSON(): string {
    const fullState = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      customers: this.getCustomers(),
      services: this.getServices(),
      orders: this.getOrders(),
      expenses: this.getExpenses(),
      fixedExpenses: this.getFixedExpenses(),
      shifts: this.getShifts(),
      inventory: this.getInventory(),
      inventoryMovements: this.getInventoryMovements(),
      promotions: this.getPromotions(),
      claims: this.getClaims(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(fullState, null, 2);
  }

  public resetToFactoryDefaults() {
    for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
    this.initializeIfEmpty();
    this.notify();
  }
}

export const db = new DatabaseService();
