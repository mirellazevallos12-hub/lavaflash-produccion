export type UserRole = 'ADMIN' | 'MOSTRADOR' | 'CALIDAD' | 'MOTORIZADO';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  accessCode?: string;
  avatar?: string;
  branch: string;
}

export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
export type ClientCategory = 'NATURAL' | 'EMPRESA';

export interface Customer {
  id: string;
  clientType?: ClientCategory; // 'NATURAL' (Persona Natural) or 'EMPRESA'
  documentType: DocumentType;
  documentNumber: string;
  fullName: string; // Combined name or Razón Social
  
  // Structured Persona Natural fields
  firstName?: string; // Nombre (ej. Juan)
  paternalLastName?: string; // Apellido paterno (ej. Pérez)
  maternalLastName?: string; // Apellido materno (ej. López)

  // Structured Empresa fields
  businessName?: string; // Razón social
  tradeName?: string; // Nombre comercial
  fiscalAddress?: string; // Dirección fiscal
  taxStatus?: string; // Estado del contribuyente (ACTIVO - HABIDO)

  phone: string;
  email?: string;
  address?: string;
  reference?: string;
  observations?: string; // Notas especiales sobre el cliente
  authProvider?: 'LOCAL' | 'GOOGLE';
  avatarUrl?: string;

  totalServicesCount: number; // accumulated services for loyalty
  activeLoyaltyStamps: number; // 0 to 9, on 10 resets or applies coupon
  hasPendingVoucher: boolean; // S/ 15 discount available
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory = 
  | 'AL_SECO' 
  | 'AL_PESO' 
  | 'ALFOMBRAS' 
  | 'TENIDO' 
  | 'PLANCHADO' 
  | 'ADICIONALES' 
  | 'MUEBLES';

export type ServiceUnit = 'prenda' | 'kg' | 'm2' | 'pieza' | 'servicio' | 'par' | 'conjunto';

export interface CatalogService {
  id: string;
  name: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  unitPrice: number;
  minPrice?: number;
  estimatedHours: number;
  iconName?: string;
  description?: string;
  isActive?: boolean;
  pricingFormula?: 'STANDARD' | 'DIMENSIONS_M2' | 'WEIGHT_KG';
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 
  | 'RECIBIDO' 
  | 'EN_LAVADO' 
  | 'EN_SECADO' 
  | 'EN_CONTROL_CALIDAD' 
  | 'LISTO_PARA_ENTREGA' 
  | 'ENTREGADO' 
  | 'ENTREGA_PARCIAL';

export type PaymentStatus = 'PAGADO' | 'ADELANTO_PARCIAL' | 'PENDIENTE_FIADO';

export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA';

export type VoucherType = 'TICKET_RECOJO' | 'BOLETA' | 'FACTURA';

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  quantity: number; // e.g. 1 garment or 3.5 kg or 4.5 m2
  unitPrice: number;
  subtotal: number;
  brand?: string; // Marca (ej. Zara, Massimo Dutti, etc.)
  color?: string; // Color de la prenda
  itemCondition?: string; // Estado o condición de la prenda (ej. Desgaste, falta botón)
  notes?: string; // Observaciones adicionales
  weightKg?: number; // Peso exacto en kilos para servicios al peso
  isDelivered: boolean; // for partial delivery tracking
  deliveredAt?: string;
  deliveredBy?: string;
  carpetDimensions?: {
    heightMeters: number;
    widthMeters: number;
    areaM2: number;
  };
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: 'ADELANTO' | 'LIQUIDACION' | 'PAGO_TOTAL' | 'COBRO_ENTREGA_PARCIAL';
  referenceCode?: string;
  createdAt: string;
  cashierName: string;
  shiftId: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  note?: string;
}

export interface PartialDeliveryRecord {
  id: string;
  orderId: string;
  timestamp: string;
  deliveredItems: {
    itemId: string;
    serviceName: string;
    quantity: number;
    subtotal: number;
  }[];
  amountCharged: number;
  paymentMethod: PaymentMethod;
  deliveredBy: string;
  customerSignature?: string; // base64 canvas signature
  conformityNotes?: string;
}

export interface Order {
  id: string;
  code: string; // e.g. "ORD-2026-0042"
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  voucherType: VoucherType;
  voucherNumber: string; // e.g. "B001-001239" or "T-0042"
  
  // Timing
  receivedAt: string; // ISO String
  promisedDeliveryAt: string; // ISO String
  actualDeliveredAt?: string;

  // Items
  items: OrderItem[];

  // Pricing, Tax & Discounts
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  loyaltyDiscountApplied: boolean; // S/ 15 applied
  applyIgv?: boolean; // Whether IGV 18% is applied
  igvRate?: number; // 0.18
  taxableBase?: number; // Base imponible / Op. Gravada
  igvAmount?: number; // Monto de IGV 18%
  igvMode?: 'ADD' | 'INCLUDED'; // '+18% Adicional' or 'Incluido en tarifa'
  total: number;

  // Payment Tracking
  paymentStatus: PaymentStatus;
  totalPaid: number;
  pendingBalance: number;
  payments: PaymentTransaction[];

  // Flow & State
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  observations?: string; // Global warnings: "Prenda delicada de seda / no usar cloro"

  // Quality check metadata
  qualityApprovedAt?: string;
  qualityApprovedBy?: string;
  whatsappNotificationSent: boolean;
  whatsappSentAt?: string;

  // Delivery & Dispatch
  isDeliveryToHome: boolean;
  deliveryAddress?: string;
  deliveryReference?: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  deliveryStatus?: 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO_DOMICILIO';

  // Partial deliveries
  partialDeliveries: PartialDeliveryRecord[];

  // Conformity & Signature
  customerSignature?: string;
  deliveredBy?: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type ExpenseCategory = 
  | 'INSUMOS_LIMPIEZA' 
  | 'REFRIGERIO_PERSONAL' 
  | 'DELIVERY_COMBUSTIBLE' 
  | 'SERVICIOS_LUZ_AGUA' 
  | 'MANTENIMIENTO_MAQUINAS' 
  | 'OTROS';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  responsibleName: string;
  receiptNumber?: string;
  shiftId: string;
  createdAt: string;
}

export type FixedExpenseCategory = 
  | 'ALQUILER_LOCAL'
  | 'LUZ_ELECTRICA'
  | 'AGUA_SEDAPAL'
  | 'PLANILLA_SUELDOS'
  | 'INTERNET_TELEFONIA'
  | 'MANTENIMIENTO_MAQUINARIA'
  | 'CONTABILIDAD_ASESORIA'
  | 'ARBITRIOS_MUNICIPALES'
  | 'ALQUILER_POS_SISTEMA'
  | 'PUBLICIDAD_MARKETING'
  | 'OTROS_FIJOS';

export interface MonthlyFixedExpense {
  id: string;
  concept: string;
  category: FixedExpenseCategory;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  amount: number;
  dueDate?: string; // YYYY-MM-DD
  status: 'PAGADO' | 'PENDIENTE';
  paidAt?: string;
  paymentMethod?: 'TRANSFERENCIA' | 'EFECTIVO' | 'DEBITO_AUTOMATICO' | 'YAPE' | 'PLIN' | 'CHEQUE';
  paidBy?: string;
  receiptNumber?: string;
  supplierName?: string;
  isRecurring: boolean;
  notes?: string;
  createdAt?: string;
}

export interface CashRegisterShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  status: 'ABIERTA' | 'CERRADA';
  
  initialCash: number; // fondo de caja
  
  // Real registered amounts during shift
  totalCashSales: number;
  totalYapeSales: number;
  totalPlinSales: number;
  totalCardSales: number;
  totalTransferSales: number;
  totalExpenses: number;

  expectedCash: number; // initialCash + totalCashSales - totalExpenses
  
  // Blind audit results (Arqueo ciego)
  blindCount?: {
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
  };
  declaredCash?: number;
  discrepancy?: number; // declared - expected (positive = sobrante, negative = faltante)
  auditNotes?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'DETERGENTE' | 'SUAVIZANTE' | 'QUITAMANCHAS' | 'EMPAQUE' | 'ACCESORIO';
  unit: 'Litros' | 'Kilos' | 'Unidades' | 'Galones' | 'Rollos';
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  lastRestockedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  movementType: 'ENTRADA_COMPRA' | 'SALIDA_CONSUMO' | 'AJUSTE_MERMA';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string;
  responsibleName: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'PORCENTAJE' | 'MONTO_FIJO';
  discountValue: number;
  minOrderValue?: number;
  applicableCategory?: ServiceCategory | 'TODOS';
  active: boolean;
  validUntil: string;
  timesUsed: number;
}

export type ClaimType = 'RE_LAVADO' | 'DANO_PRENDA' | 'EXTRAVIO' | 'DEMORA' | 'ATENCION';
export type ClaimStatus = 'REGISTRADO' | 'EN_REVISION' | 'APROBADO_RELAVADO' | 'NOTA_CREDITO_EMITIDA' | 'RESUELTO_RECHAZADO';

export interface Claim {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  claimType: ClaimType;
  description: string;
  status: ClaimStatus;
  resolutionNotes?: string;
  creditNoteAmount?: number;
  registeredBy: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'ORDER' | 'PAYMENT' | 'PARTIAL_DELIVERY' | 'CASH_SHIFT' | 'EXPENSE' | 'FIXED_EXPENSE' | 'INVENTORY' | 'CLAIM' | 'CUSTOMER' | 'CATALOG_SERVICE';
  entityId: string;
  details: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  serviceType: string;
  date: string;
  verified: boolean;
  avatar?: string;
  source: 'GOOGLE' | 'WEB';
}

