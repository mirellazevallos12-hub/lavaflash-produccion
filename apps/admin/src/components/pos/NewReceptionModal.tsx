import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { 
  Customer, CatalogService, ServiceCategory, VoucherType, 
  PaymentMethod, PaymentStatus, OrderItem, Order 
} from '../../types';
import { NewCustomerModal } from '../customers/NewCustomerModal';
import { CarpetDimensionsModal } from './CarpetDimensionsModal';
import { BUSINESS } from '../../config/business';
import { 
  X, Search, UserCheck, Plus, Trash2, Calendar, 
  Clock, AlertCircle, Sparkles, Gift, Check, 
  MapPin, ShieldAlert, ArrowRight, DollarSign, 
  Receipt, Shirt, Scale, Layers, Grid, Palette, Flame, Scissors, Armchair,
  UserPlus, Building2, Ruler, Calculator
} from 'lucide-react';

interface NewReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const NewReceptionModal: React.FC<NewReceptionModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  // Database states
  const [services, setServices] = useState<CatalogService[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Customer form state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [documentType, setDocumentType] = useState<'DNI' | 'RUC'>('DNI');
  const [customerDocument, setCustomerDocument] = useState('');

  // Quick Register Customer state
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickDoc, setQuickDoc] = useState('');
  const [quickAddress, setQuickAddress] = useState('');

  // Order configuration
  const [voucherType, setVoucherType] = useState<VoucherType>('BOLETA');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('AL_SECO');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [observations, setObservations] = useState('');
  
  // Timing
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Default 48h
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Home delivery option
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [deliveryReference, setDeliveryReference] = useState('');

  // Payment configuration
  const [paymentChoice, setPaymentChoice] = useState<'ADELANTO' | 'PAGADO' | 'PENDIENTE'>('ADELANTO');
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [paymentReference, setPaymentReference] = useState('');

  // Loyalty discount
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);

  // IGV obligatorio: todos los precios del sistema ya incluyen el 18%.
  const applyIgv = true;
  const igvMode: 'INCLUDED' = 'INCLUDED';

  // Carpet Dimensions Modal State
  const [carpetModalService, setCarpetModalService] = useState<CatalogService | null>(null);
  const [editingCarpetItem, setEditingCarpetItem] = useState<OrderItem | null>(null);

  // Al Peso Dedicated Calculator State
  const [pesoOption, setPesoOption] = useState<'ROPA_DIARIA' | 'SABANAS_TOALLAS'>('ROPA_DIARIA');
  const [pesoKgInput, setPesoKgInput] = useState<string>(''); // Cuadrante en blanco inicial por requerimiento

  useEffect(() => {
    if (isOpen) {
      setServices(db.getServices());
      setCustomers(db.getCustomers());
    }
  }, [isOpen]);

  // Autocomplete Suggestions for Customer
  const filteredCustomerSuggestions = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.documentNumber.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [customerSearchQuery, customers]);

  // Select a customer directly
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.fullName);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address || '');
    setDocumentType(c.documentType as 'DNI' | 'RUC');
    setCustomerDocument(c.documentNumber);
    setCustomerSearchQuery('');
    setShowQuickRegister(false);
    if (c.documentType === 'RUC') setVoucherType('FACTURA');
    if (c.activeLoyaltyStamps === 9 || c.hasPendingVoucher) {
      setApplyLoyaltyDiscount(true);
    } else {
      setApplyLoyaltyDiscount(false);
    }
  };

  const handleDeselectCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerDocument('');
    setCustomerSearchQuery('');
    setApplyLoyaltyDiscount(false);
  };

  // Quick Register Customer handler
  const handleQuickRegisterCustomer = () => {
    if (!quickName.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    if (!quickPhone.trim()) {
      alert('Por favor ingrese el número de celular del cliente');
      return;
    }

    const docClean = quickDoc.trim() || `DNI-${Date.now().toString().slice(-6)}`;
    const isRuc = docClean.length === 11 && /^\d+$/.test(docClean);

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      clientType: isRuc ? 'EMPRESA' : 'NATURAL',
      documentType: isRuc ? 'RUC' : 'DNI',
      documentNumber: docClean,
      fullName: quickName.trim(),
      phone: quickPhone.trim(),
      address: quickAddress.trim(),
      totalServicesCount: 0,
      activeLoyaltyStamps: 0,
      hasPendingVoucher: false,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveCustomer(newCust);
    setCustomers(db.getCustomers());
    handleSelectCustomer(newCust);
    setShowQuickRegister(false);
    setQuickName('');
    setQuickPhone('');
    setQuickDoc('');
    setQuickAddress('');
  };

  // Live Calculated Price for Al Peso
  const calculatedPesoTotal = useMemo(() => {
    const kg = parseFloat(pesoKgInput) || 0;
    if (kg <= 0) return 0;
    if (pesoOption === 'ROPA_DIARIA') {
      return kg < 3 ? 12.00 : Number((kg * 4.50).toFixed(2));
    } else {
      return Number((kg * 6.00).toFixed(2));
    }
  }, [pesoOption, pesoKgInput]);

  // Add Al Peso with calculated price directly to order
  const handleAddPesoCalculated = () => {
    const kg = parseFloat(pesoKgInput);
    if (!kg || kg <= 0) {
      alert('Por favor ingrese el peso en kilos en el cuadrante en blanco.');
      return;
    }

    const serviceId = pesoOption === 'ROPA_DIARIA' ? 'srv-peso-1' : 'srv-peso-2';
    const srv = services.find(s => s.id === serviceId) || {
      id: serviceId,
      name: pesoOption === 'ROPA_DIARIA' ? 'Ropa Diaria al Peso' : 'Lavado por kilo de Toallas y Sábanas',
      category: 'AL_PESO' as ServiceCategory,
      unit: 'kg' as const,
      unitPrice: pesoOption === 'ROPA_DIARIA' ? 4.50 : 6.00,
      estimatedHours: 48
    };

    let notesText = '';
    if (pesoOption === 'ROPA_DIARIA') {
      notesText = kg < 3 
        ? `${kg} kg (Tarifa plana S/ 12.00 por ser menor a 3 kg)` 
        : `${kg} kg a S/ 4.50/kg`;
    } else {
      notesText = `${kg} kg toallas y sábanas a S/ 6.00/kg`;
    }

    const newItem: OrderItem = {
      id: `itm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceId: srv.id,
      serviceName: srv.name,
      category: 'AL_PESO',
      quantity: kg,
      weightKg: kg,
      unitPrice: pesoOption === 'ROPA_DIARIA' ? 4.50 : 6.00,
      subtotal: calculatedPesoTotal,
      notes: notesText,
      isDelivered: false
    };

    setOrderItems(prev => [...prev, newItem]);
    setPesoKgInput(''); // Deja el cuadrante en blanco listo para el siguiente pesado
  };

  // Handlers for garment Brand, Color, Condition
  const handleUpdateItemBrand = (itemId: string, brand: string) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, brand } : item));
  };

  const handleUpdateItemColor = (itemId: string, color: string) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, color } : item));
  };

  const handleUpdateItemCondition = (itemId: string, itemCondition: string) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, itemCondition } : item));
  };

  // Add item from catalog
  const handleAddItem = (service: CatalogService, customQty?: number) => {
    // If alfombra or unit is m2 or has DIMENSIONS_M2 formula: open the carpet dimensions modal!
    if (service.category === 'ALFOMBRAS' || service.unit === 'm2' || service.pricingFormula === 'DIMENSIONS_M2') {
      setEditingCarpetItem(null);
      setCarpetModalService(service);
      return;
    }

    const qty = customQty || 1;
    const subtotal = Number((qty * service.unitPrice).toFixed(2));
    
    const newItem: OrderItem = {
      id: `itm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      quantity: qty,
      unitPrice: service.unitPrice,
      subtotal: subtotal,
      notes: '',
      brand: '',
      color: '',
      itemCondition: '',
      isDelivered: false
    };

    setOrderItems(prev => [...prev, newItem]);
  };

  // Handle confirmation from Carpet Dimensions Modal
  const handleConfirmCarpet = (data: {
    service: CatalogService;
    heightMeters: number;
    widthMeters: number;
    areaM2: number;
    subtotal: number;
    notes: string;
  }) => {
    if (editingCarpetItem) {
      setOrderItems(prev => prev.map(item => {
        if (item.id === editingCarpetItem.id) {
          return {
            ...item,
            serviceId: data.service.id,
            serviceName: data.service.name,
            quantity: data.areaM2,
            unitPrice: data.service.unitPrice,
            subtotal: data.subtotal,
            notes: data.notes,
            carpetDimensions: {
              heightMeters: data.heightMeters,
              widthMeters: data.widthMeters,
              areaM2: data.areaM2
            }
          };
        }
        return item;
      }));
      setEditingCarpetItem(null);
    } else {
      const newItem: OrderItem = {
        id: `itm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        serviceId: data.service.id,
        serviceName: data.service.name,
        category: data.service.category,
        quantity: data.areaM2,
        unitPrice: data.service.unitPrice,
        subtotal: data.subtotal,
        notes: data.notes,
        isDelivered: false,
        carpetDimensions: {
          heightMeters: data.heightMeters,
          widthMeters: data.widthMeters,
          areaM2: data.areaM2
        }
      };
      setOrderItems(prev => [...prev, newItem]);
    }
    setCarpetModalService(null);
  };

  // Re-open dimensions calculator for existing carpet in cart
  const handleEditCarpetItem = (item: OrderItem) => {
    const matchingSrv = services.find(s => s.id === item.serviceId) || {
      id: item.serviceId,
      name: item.serviceName,
      category: item.category,
      unit: 'm2' as const,
      unitPrice: item.unitPrice,
      estimatedHours: 72
    };
    setEditingCarpetItem(item);
    setCarpetModalService(matchingSrv);
  };

  // Update item notes or quantity
  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, notes } : item));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [orderItems]);

  const discountAmount = useMemo(() => {
    if (applyLoyaltyDiscount && subtotal > 15) {
      return 15.00; // S/ 15 off for 10th service milestone
    }
    return 0;
  }, [applyLoyaltyDiscount, subtotal]);

  // Base after discounts
  const netAmount = Math.max(0, subtotal - discountAmount);

  // IGV obligatorio (18%) incluido dentro del precio final.
  const { taxableBase, igvAmount, total } = useMemo(() => {
    const finalTotal = Number(netAmount.toFixed(2));
    if (finalTotal <= 0) {
      return { taxableBase: 0, igvAmount: 0, total: 0 };
    }
    const base = Number((finalTotal / 1.18).toFixed(2));
    const igv = Number((finalTotal - base).toFixed(2));
    return {
      taxableBase: base,
      igvAmount: igv,
      total: finalTotal
    };
  }, [netAmount]);

  // Adjust advance if choice changes
  useEffect(() => {
    if (paymentChoice === 'PAGADO') {
      setAdvanceAmount(total);
    } else if (paymentChoice === 'PENDIENTE') {
      setAdvanceAmount(0);
    } else if (paymentChoice === 'ADELANTO' && advanceAmount === 0 && total > 0) {
      setAdvanceAmount(Math.round(total / 2)); // default 50%
    }
  }, [paymentChoice, total]);

  const pendingBalance = Math.max(0, Number((total - advanceAmount).toFixed(2)));

  // Delivery preset helper
  const handleSetPresetHours = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    d.setHours(18, 0, 0, 0);
    setDeliveryDate(d.toISOString().slice(0, 16));
  };

  // Auto-calculate suggested delivery time whenever orderItems change
  useEffect(() => {
    if (orderItems.length === 0) return;
    let maxHours = 48; // default al peso: 48h (dejando 1 día)
    const hasEdredon = orderItems.some(i => 
      i.serviceName.toLowerCase().includes('edredón') || 
      i.serviceName.toLowerCase().includes('edredon') || 
      i.serviceName.toLowerCase().includes('frazada') ||
      i.serviceName.toLowerCase().includes('cobertor')
    );
    const hasAlfombra = orderItems.some(i => i.category === 'ALFOMBRAS');
    const hasAlSeco = orderItems.some(i => i.category === 'AL_SECO' && !hasEdredon);

    if (hasEdredon) {
      maxHours = 168; // 1 semana para edredones y frazadas
    } else if (hasAlfombra) {
      maxHours = 96; // 4 días para alfombras
    } else if (hasAlSeco) {
      maxHours = 72; // 3 a 4 días para ropa al seco según material
    } else {
      maxHours = 48; // Al peso: cada 48 horas (dejando 1 día)
    }

    const d = new Date();
    d.setHours(d.getHours() + maxHours);
    d.setHours(18, 0, 0, 0);
    setDeliveryDate(d.toISOString().slice(0, 16));
  }, [orderItems]);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Por favor seleccione o ingrese el nombre del cliente.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Por favor ingrese el número de celular del cliente.');
      return;
    }

    if (orderItems.length === 0) {
      alert('Debe agregar al menos un servicio o prenda a la orden.');
      return;
    }

    const finalDoc = customerDocument.trim() || `CLI-${customerPhone.trim().slice(-6)}`;

    // 1. Save or update customer permanently
    const savedCustomer = db.saveCustomer({
      documentType,
      documentNumber: finalDoc,
      fullName: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim(),
      reference: deliveryReference.trim()
    });

    // 2. Prepare payments
    const paymentsList = [];
    if (advanceAmount > 0) {
      paymentsList.push({
        id: `pay-${Date.now()}`,
        orderId: '', // populated in db service
        amount: advanceAmount,
        paymentMethod: paymentMethod,
        paymentType: (advanceAmount >= total ? 'PAGO_TOTAL' : 'ADELANTO') as any,
        referenceCode: paymentReference || undefined,
        createdAt: new Date().toISOString(),
        cashierName: db.getStaffUserOrFallback().name,
        shiftId: db.getActiveShift()?.id || 'shift-today'
      });
    }

    // Determine payment status
    let paymentStatus: PaymentStatus = 'PENDIENTE_FIADO';
    if (advanceAmount >= total && total > 0) {
      paymentStatus = 'PAGADO';
    } else if (advanceAmount > 0) {
      paymentStatus = 'ADELANTO_PARCIAL';
    }

    // Voucher serial sequence generator
    const serialSuffix = Math.floor(1000 + Math.random() * 9000);
    const voucherNumber = voucherType === 'TICKET_RECOJO' 
      ? `T-${serialSuffix}` 
      : voucherType === 'BOLETA' 
        ? `B001-00${serialSuffix}` 
        : `F001-00${serialSuffix}`;

    // 3. Create Order
    const newOrder = db.createOrder({
      customerId: savedCustomer.id,
      customerName: savedCustomer.fullName,
      customerDocument: savedCustomer.documentNumber,
      customerPhone: savedCustomer.phone,
      voucherType: voucherType,
      voucherNumber: voucherNumber,
      receivedAt: new Date(receivedDate).toISOString(),
      promisedDeliveryAt: new Date(deliveryDate).toISOString(),
      items: orderItems,
      subtotal: subtotal,
      discountAmount: discountAmount,
      discountReason: discountAmount > 0 ? 'Vale Fidelización 10° Servicio (S/ 15.00)' : undefined,
      loyaltyDiscountApplied: discountAmount > 0,
      applyIgv: applyIgv,
      igvRate: 0.18,
      taxableBase: taxableBase,
      igvAmount: igvAmount,
      igvMode: igvMode,
      total: total,
      paymentStatus: paymentStatus,
      totalPaid: advanceAmount,
      pendingBalance: pendingBalance,
      payments: paymentsList,
      status: 'RECIBIDO',
      observations: observations.trim() || undefined,
      whatsappNotificationSent: false,
      isDeliveryToHome: isHomeDelivery,
      deliveryAddress: isHomeDelivery ? customerAddress : undefined,
      deliveryReference: isHomeDelivery ? deliveryReference : undefined,
      deliveryStatus: isHomeDelivery ? 'PENDIENTE' : undefined,
    });

    onOrderCreated(newOrder);
    onClose();
  };

  if (!isOpen) return null;

  const categoryIcons: Record<ServiceCategory, any> = {
    AL_SECO: Shirt,
    AL_PESO: Scale,
    ALFOMBRAS: Grid,
    TENIDO: Palette,
    PLANCHADO: Flame,
    ADICIONALES: Scissors,
    MUEBLES: Armchair
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nueva Recepción de Prendas</h2>
              <p className="text-xs text-slate-400">Punto de Venta Mostrador • Registro operativo local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with 2-Column Responsive Layout */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Customer, Comprobante & Delivery Schedule (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Customer Identification Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  1. Datos del Cliente (Búsqueda Automática)
                </span>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={handleDeselectCustomer}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    Cambiar Cliente
                  </button>
                )}
              </div>

              {/* UNIFIED AUTOMATIC SEARCH BOX: Only automatic search, autocompletes registered or new customer */}
              {!selectedCustomer && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Búsqueda Automática de Cliente:</span>
                      <span className="text-[10px] text-teal-700 font-semibold">Autocompleta con Nombre, DNI o Celular</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerSearchQuery(val);
                          // Auto pre-populate fields for quick registration if customer is new
                          if (/^\d{9}$/.test(val.trim())) {
                            setQuickPhone(val.trim());
                          } else if (/^\d{8}$/.test(val.trim())) {
                            setQuickDoc(val.trim());
                          } else if (val.trim().length >= 2 && !/^\d+$/.test(val.trim())) {
                            setQuickName(val.trim());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredCustomerSuggestions.length > 0) {
                              handleSelectCustomer(filteredCustomerSuggestions[0]);
                            }
                          }
                        }}
                        placeholder="Escriba Nombre, DNI o Celular para autocompletar..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border-2 border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium placeholder:text-slate-400 shadow-2xs"
                        autoFocus
                      />
                      <Search className="w-4 h-4 text-teal-600 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Autocomplete Suggestions if matching registered customers */}
                  {filteredCustomerSuggestions.length > 0 && (
                    <div className="bg-white border-2 border-teal-400 rounded-xl p-1.5 shadow-lg space-y-1 max-h-48 overflow-y-auto animate-in fade-in">
                      <div className="px-2 py-0.5 text-[10px] text-teal-700 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Clientes registrados encontrados ({filteredCustomerSuggestions.length}):</span>
                        <span className="text-[9px] text-slate-400">Clic o [Enter] para autocompletar</span>
                      </div>
                      {filteredCustomerSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-2.5 py-2 text-xs hover:bg-teal-50 rounded-lg flex justify-between items-center transition-colors cursor-pointer border border-transparent hover:border-teal-200"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{c.fullName}</span>
                            <span className="text-[11px] text-slate-500">📱 {c.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-700 font-mono text-[11px] font-bold block">{c.documentType}: {c.documentNumber}</span>
                            <span className="text-[10px] text-amber-700 font-semibold">★ {c.activeLoyaltyStamps}/10 sellos</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* If searched and not registered in database: Instant Inline Customer Creation */}
                  {customerSearchQuery.trim().length >= 2 && filteredCustomerSuggestions.length === 0 && (
                    <div className="p-3 bg-teal-50/80 border border-teal-300 rounded-xl space-y-2 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-1 border-b border-teal-200">
                        <span className="font-bold text-teal-950 flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-teal-700" />
                          <span>Cliente Nuevo • Complete para autocompletar:</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Nombre Completo: *</label>
                        <input
                          type="text"
                          required
                          value={quickName || (isNaN(Number(customerSearchQuery)) ? customerSearchQuery : '')}
                          onChange={(e) => setQuickName(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Celular WhatsApp: *</label>
                          <input
                            type="tel"
                            required
                            value={quickPhone || (/^\d+$/.test(customerSearchQuery) && customerSearchQuery.length === 9 ? customerSearchQuery : '')}
                            onChange={(e) => setQuickPhone(e.target.value)}
                            placeholder="Ej. 999 888 777"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">DNI / RUC (opcional):</label>
                          <input
                            type="text"
                            value={quickDoc || (/^\d+$/.test(customerSearchQuery) && customerSearchQuery.length === 8 ? customerSearchQuery : '')}
                            onChange={(e) => setQuickDoc(e.target.value)}
                            placeholder="Ej. 45892104"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Dirección (opcional):</label>
                        <input
                          type="text"
                          value={quickAddress}
                          onChange={(e) => setQuickAddress(e.target.value)}
                          placeholder={BUSINESS.addressShort}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickRegisterCustomer}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar y Autocompletar Cliente</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CARD OF SELECTED / AUTOCOMPLETED CUSTOMER */}
              {selectedCustomer && (
                <div className="bg-white border-2 border-teal-500 rounded-xl p-3 space-y-2 shadow-sm animate-in fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                        ✓ Cliente Autocompletado
                      </span>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {customerName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                          {documentType}: {selectedCustomer.documentNumber}
                        </span>
                        <span className="font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          📱 {customerPhone}
                        </span>
                      </div>
                      {customerAddress && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{customerAddress}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleDeselectCustomer}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold underline shrink-0 cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Loyalty Milestone & Badge */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        Fidelización: {selectedCustomer.activeLoyaltyStamps}/10 Sellos
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold">
                        {selectedCustomer.totalServicesCount} servicios anteriores
                      </span>
                    </div>

                    <div className="flex gap-1 justify-between pt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            i < selectedCustomer.activeLoyaltyStamps
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : i === 9 && (selectedCustomer.activeLoyaltyStamps === 9 || selectedCustomer.hasPendingVoucher)
                                ? 'bg-emerald-500 text-white animate-pulse'
                                : 'bg-amber-100 text-amber-400 border border-amber-200'
                          }`}
                        >
                          {i === 9 ? '★' : i + 1}
                        </div>
                      ))}
                    </div>

                    {(selectedCustomer.activeLoyaltyStamps === 9 || selectedCustomer.hasPendingVoucher) && (
                      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-amber-200 text-[11px] text-emerald-800 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡Premio 10° Servicio! Descuento S/ 15 automático.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Voucher Type Selection (Ticket de Recojo / Boleta / Factura) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Tipo de Comprobante
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['TICKET_RECOJO', 'BOLETA', 'FACTURA'] as VoucherType[]).map((vType) => (
                  <button
                    key={vType}
                    type="button"
                    onClick={() => setVoucherType(vType)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                      voucherType === vType
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {vType === 'TICKET_RECOJO' ? 'Ticket Recojo' : vType === 'BOLETA' ? 'Boleta' : 'Factura'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Reception & Promised Delivery Times */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                3. Programación de Entrega
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Fecha Recepción:</label>
                  <input
                    type="datetime-local"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-teal-800 font-bold block mb-1">Fecha Entrega Programada:</label>
                  <input
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-teal-500 rounded text-xs font-semibold text-teal-900"
                    required
                  />
                </div>
              </div>

              {/* Rapid preset buttons matching business rules */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ajustar Plazo Oficial:</span>
                  <span className="text-[10px] text-teal-700 font-medium">Auto-sugerido según prendas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetPresetHours(48)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] hover:bg-indigo-50 hover:border-indigo-400 text-indigo-900 font-bold text-center transition-colors"
                  >
                    48h (Al Peso)
                    <span className="block text-[9px] text-slate-500 font-normal">Dejando 1 día</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetHours(72)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] hover:bg-sky-50 hover:border-sky-400 text-sky-900 font-bold text-center transition-colors"
                  >
                    72h (Al Seco)
                    <span className="block text-[9px] text-slate-500 font-normal">3 días</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetHours(96)}
                    className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] hover:bg-sky-50 hover:border-sky-400 text-sky-900 font-bold text-center transition-colors"
                  >
                    96h (Al Seco)
                    <span className="block text-[9px] text-slate-500 font-normal">4 días delicado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetHours(168)}
                    className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-[11px] hover:bg-amber-50 hover:border-amber-500 text-amber-950 font-bold text-center transition-colors"
                  >
                    1 Sem. (Edredón)
                    <span className="block text-[9px] text-amber-700 font-normal">7 días térmico</span>
                  </button>
                </div>

                <div className="bg-slate-100/80 rounded-lg p-2 text-[10px] text-slate-600 leading-tight border border-slate-200">
                  <strong className="text-slate-800">Reglas de Entrega:</strong> Al Peso 48h (dejando 1 día) • Al Seco 3-4 días (según material) • Edredones y Frazadas 1 semana.
                </div>
              </div>

              {/* Delivery to Home Checkbox */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isHomeDelivery}
                    onChange={(e) => setIsHomeDelivery(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Requiere Servicio de Delivery a Domicilio</span>
                </label>
                {isHomeDelivery && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={deliveryReference}
                      onChange={(e) => setDeliveryReference(e.target.value)}
                      placeholder="Referencia de entrega (Ej. Casa blanca con rejas negras, timbre 2)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Observations / Warnings for garment damages or specific care */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 space-y-1.5">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Observaciones / Alertas de Prenda:
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ej. Mancha antigua en solapa de terno, botón roto en saco, descosido en basta posterior..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

          </div>

          {/* RIGHT COLUMN: Service Selector Catalog & Order Cart (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Category Selector Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1">
              {(['AL_SECO', 'AL_PESO', 'ALFOMBRAS', 'TENIDO', 'PLANCHADO', 'ADICIONALES', 'MUEBLES'] as ServiceCategory[]).map((cat) => {
                const IconComponent = categoryIcons[cat];
                const labels: Record<ServiceCategory, string> = {
                  AL_SECO: 'Al Seco',
                  AL_PESO: 'Al Peso (kg)',
                  ALFOMBRAS: 'Alfombras',
                  TENIDO: 'Teñido',
                  PLANCHADO: 'Planchado',
                  ADICIONALES: 'Adicionales',
                  MUEBLES: 'Muebles'
                };
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-white text-teal-700 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{labels[cat]}</span>
                  </button>
                );
              })}
            </div>

            {/* ================= DEDICATED AL PESO CALCULATOR ================= */}
            {selectedCategory === 'AL_PESO' && (
              <div className="bg-teal-50 border-2 border-teal-400 rounded-2xl p-3.5 space-y-3 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-teal-200">
                  <span className="text-xs font-black text-teal-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>⚖️ Balanza y Cálculo Automático de Ropa al Peso</span>
                  </span>
                  <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                    Entrega cada 48h (dejando 1 día)
                  </span>
                </div>

                {/* 1. Option selection: Ropa Diaria (4.50) vs Sábanas y Toallas (6.00) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                    1. Seleccione la Opción de Lavado al Peso:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPesoOption('ROPA_DIARIA')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        pesoOption === 'ROPA_DIARIA'
                          ? 'border-teal-600 bg-white text-teal-950 ring-2 ring-teal-500 shadow-sm'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs">Ropa Diaria al Peso</span>
                        <span className="text-xs font-black text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          S/ 4.50 / kg
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                        • <strong>A partir de 3 kg:</strong> S/ 4.50 por kilo.<br />
                        • <strong>Menor a 3 kg:</strong> Precio fijo de <strong>S/ 12.00</strong> pese lo que pese.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPesoOption('SABANAS_TOALLAS')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        pesoOption === 'SABANAS_TOALLAS'
                          ? 'border-teal-600 bg-white text-teal-950 ring-2 ring-teal-500 shadow-sm'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs">Sábanas y Toallas</span>
                        <span className="text-xs font-black text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          S/ 6.00 / kg
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                        • <strong>Lavado por kilo:</strong> S/ 6.00 soles por cada kilo.<br />
                        • Carga exclusiva desinfectada y secada a temperatura controlada.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Cuadrante en blanco para poner los kilos & Cálculo automático */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3.5 rounded-xl border-2 border-teal-300 shadow-xs">
                  
                  {/* Cuadrante en blanco para poner los kilos */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                      2. Cuadrante en Blanco: Ingrese Kilos:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="0.0 kg (Escriba los kilos aquí)"
                        value={pesoKgInput}
                        onChange={(e) => setPesoKgInput(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 text-base font-black text-center text-teal-950 bg-white border-2 border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono shadow-inner"
                      />
                      <span className="absolute right-3 top-3 text-xs font-black text-teal-800">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Cálculo automático del precio en tiempo real */}
                  <div className="sm:col-span-4 text-center sm:text-right space-y-0.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Precio Calculado Automático:
                    </span>
                    <div className="text-2xl font-black text-teal-700 font-mono">
                      S/ {calculatedPesoTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium block">
                      {pesoOption === 'ROPA_DIARIA'
                        ? (parseFloat(pesoKgInput) > 0 && parseFloat(pesoKgInput) < 3 
                            ? 'Menor a 3 kg: Tarifa plana fija S/ 12.00' 
                            : `${pesoKgInput || 0} kg × S/ 4.50`)
                        : `${pesoKgInput || 0} kg × S/ 6.00`}
                    </span>
                  </div>

                  {/* Botón agregar a la recepción */}
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddPesoCalculated}
                      className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Agregar</span>
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 leading-tight">
                  ⚠️ <strong>Regla del peso:</strong> A partir de 3 kg el kilo está a S/ 4.50. Si es menor a 3 kg el precio es de S/ 12.00 soles pese lo que pese. El lavado por kilo de sábanas/toallas es de S/ 6.00. Los edredones y frazadas se registran por pieza en <strong>"Al Seco"</strong>.
                </div>
              </div>
            )}

            {/* Helper notice for AL_SECO */}
            {selectedCategory === 'AL_SECO' && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 text-xs text-sky-950 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏷️</span>
                  <span><strong>Prendas al Seco:</strong> Al agregar una prenda, complete sus cuadrantes de <strong>Marca</strong>, <strong>Color</strong> y <strong>Estado / Observaciones</strong>.</span>
                </div>
                <span className="text-[10px] bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                  Plazo: 3 a 4 días
                </span>
              </div>
            )}

            {/* Catalog Grid for selected category */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {services
                .filter(s => s.category === selectedCategory)
                .map((srv) => {
                  const isCarpet = srv.category === 'ALFOMBRAS' || srv.unit === 'm2' || srv.pricingFormula === 'DIMENSIONS_M2';
                  
                  let displayPrice = srv.unitPrice;
                  let displaySubtitle = `Por ${srv.unit}`;

                  if (srv.category === 'AL_PESO' && srv.unit === 'kg') {
                    const isSheetsTowels = srv.name.toLowerCase().includes('sábanas') || srv.name.toLowerCase().includes('sabanas') || srv.unitPrice === 6;
                    displaySubtitle = isSheetsTowels ? 'S/ 6.00 por kilo' : 'S/ 4.50 / kg (<3kg: S/ 12)';
                  } else if (isCarpet) {
                    displaySubtitle = '📐 Alto × Ancho (m²)';
                  }

                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleAddItem(srv)}
                      className={`bg-white border hover:border-teal-400 hover:shadow-xs p-2.5 rounded-xl text-left transition-all flex flex-col justify-between group ${
                        isCarpet ? 'border-teal-300/80 bg-teal-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-teal-700">
                            {srv.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          {displaySubtitle}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-xs font-black text-slate-900 block font-mono">
                            S/ {displayPrice.toFixed(2)}
                          </span>
                          {isCarpet && (
                            <span className="text-[9px] text-teal-700 font-bold block">
                              por m²
                            </span>
                          )}
                        </div>
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isCarpet 
                            ? 'bg-teal-100 text-teal-800 group-hover:bg-teal-600 group-hover:text-white' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-teal-600 group-hover:text-white'
                        }`}>
                          {isCarpet ? <Calculator className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Order Items Cart Table */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white min-h-[160px]">
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Prendas y Servicios Ingresados ({orderItems.length})</span>
                <span>Subtotal: S/ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-56">
                {orderItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 text-xs">
                    <Shirt className="w-8 h-8 text-slate-300 mb-1" />
                    <span>Haga clic en los servicios de arriba para agregarlos a la orden</span>
                  </div>
                ) : (
                  orderItems.map((item, idx) => {
                    const isCarpetItem = item.category === 'ALFOMBRAS' || !!item.carpetDimensions;
                    const isDryCleanOrGarment = item.category === 'AL_SECO' || item.category === 'PLANCHADO';

                    return (
                      <div key={item.id} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50/50 flex flex-col gap-2">
                        {/* Header: Name, quantity badge, price and delete */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">
                              {idx + 1}. {item.serviceName}
                            </span>
                            
                            {item.carpetDimensions ? (
                              <button
                                type="button"
                                onClick={() => handleEditCarpetItem(item)}
                                className="inline-flex items-center gap-1 text-[10px] bg-teal-100 hover:bg-teal-200 text-teal-900 border border-teal-300 px-2 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer"
                                title="Clic para modificar medidas de la alfombra"
                              >
                                <Ruler className="w-2.5 h-2.5 text-teal-700" />
                                <span>{item.carpetDimensions.heightMeters.toFixed(2)}m × {item.carpetDimensions.widthMeters.toFixed(2)}m ({item.carpetDimensions.areaM2.toFixed(2)} m²)</span>
                              </button>
                            ) : (
                              <span className="text-[10px] bg-teal-100 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-full font-mono font-bold">
                                {item.quantity} {item.category === 'AL_PESO' ? 'kg' : item.category === 'ALFOMBRAS' ? 'm²' : 'prenda(s)'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 font-mono text-sm">
                              S/ {item.subtotal.toFixed(2)}
                            </span>
                            {isCarpetItem && (
                              <button
                                type="button"
                                onClick={() => handleEditCarpetItem(item)}
                                className="text-teal-600 hover:text-teal-800 p-1 cursor-pointer"
                                title="Modificar medidas"
                              >
                                <Ruler className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Eliminar prenda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* CUADRANTES DE MARCA, COLOR Y ESTADO/OBSERVACIONES DE LA PRENDA (AL SECO Y PRENDAS) */}
                        <div className="bg-white p-2.5 rounded-xl border-2 border-teal-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between border-b border-teal-100 pb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-900 flex items-center gap-1">
                              <span>📋 CUADRANTES DE LA PRENDA (AL SECO):</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              Marca • Color • Estado / Observaciones
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Cuadrante 1: Marca */}
                            <div className="space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
                              <label className="text-[10px] font-black text-slate-800 flex items-center gap-1 uppercase tracking-wide">
                                <span>🏷️ MARCA:</span>
                              </label>
                              <input
                                type="text"
                                value={item.brand || ''}
                                onChange={(e) => handleUpdateItemBrand(item.id, e.target.value)}
                                placeholder="Escribir marca..."
                                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
                              />
                            </div>

                            {/* Cuadrante 2: Color */}
                            <div className="space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
                              <label className="text-[10px] font-black text-slate-800 flex items-center gap-1 uppercase tracking-wide">
                                <span>🎨 COLOR:</span>
                              </label>
                              <input
                                type="text"
                                value={item.color || ''}
                                onChange={(e) => handleUpdateItemColor(item.id, e.target.value)}
                                placeholder="Ej. Azul Marino, Negro..."
                                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
                              />
                            </div>

                            {/* Cuadrante 3: Observaciones o Estado de la prenda */}
                            <div className="space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
                              <label className="text-[10px] font-black text-slate-800 flex items-center gap-1 uppercase tracking-wide">
                                <span>⚠️ OBSERVACIONES O ESTADO DE LA PRENDA:</span>
                              </label>
                              <input
                                type="text"
                                value={item.itemCondition || item.notes || ''}
                                onChange={(e) => handleUpdateItemCondition(item.id, e.target.value)}
                                placeholder="Ej. Buen estado, falta botón, mancha solapa..."
                                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none font-medium"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Financial Summary & Payment Box */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
              {/* IGV obligatorio incluido dentro de las tarifas. */}
              {/* Detailed Financial Breakdown with IGV */}
              <div className="space-y-1.5 text-xs py-1 border-b border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Servicios ({orderItems.length} prendas/ítems):</span>
                  <span className="font-mono text-slate-200">S/ {subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Vale Fidelización (10° Servicio):
                    </span>
                    <span className="font-mono">-S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 pt-0.5">
                  <span>Base Imponible (Op. Gravada):</span>
                  <span className="font-mono text-slate-200">S/ {taxableBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-teal-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-teal-400" />
                    <span>I.G.V. (18%) incluido:</span>
                  </span>
                  <span className="font-mono font-bold">S/ {igvAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">TOTAL A PAGAR:</span>
                    <span className="block text-[10px] text-teal-400 font-mono">(IGV 18% incluido en tarifa)</span>
                  </div>
                  <span className="text-xl font-black text-teal-400 font-mono tracking-tight">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Choice Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Modalidad de Cobro:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('ADELANTO')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        paymentChoice === 'ADELANTO' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Adelanto Parcial
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('PAGADO')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        paymentChoice === 'PAGADO' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Pagado Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('PENDIENTE')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        paymentChoice === 'PENDIENTE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Pendiente / Fiado
                    </button>
                  </div>
                </div>

                {/* Payment Amount & Method Row */}
                {paymentChoice !== 'PENDIENTE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Monto que Deja Hoy:</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">S/</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={total}
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-bold"
                          disabled={paymentChoice === 'PAGADO'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Medio de Pago:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                        <option value="TARJETA">Tarjeta Débito/Crédito</option>
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">N° Operación (Opcional):</label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Ej. YAPE-901823"
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Pending Balance Warning */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Saldo que quedará pendiente al recojo:</span>
                  <span className={`font-black text-sm px-2 py-0.5 rounded ${
                    pendingBalance > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    S/ {pendingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className="px-6 py-2 text-xs font-black text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                >
                  <Receipt className="w-4 h-4" />
                  Emitir Comprobante y Guardar Orden
                </button>
              </div>

            </div>

          </div>

        </form>

      </div>

      {/* NEW CUSTOMER MODAL */}
      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          initialDoc={customerSearchQuery}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerSaved={(saved) => {
            const freshCustomers = db.getCustomers();
            setCustomers(freshCustomers);
            handleSelectCustomer(saved);
            setShowNewCustomerModal(false);
          }}
        />
      )}

      {/* CARPET DIMENSIONS MODAL */}
      {carpetModalService && (
        <CarpetDimensionsModal
          isOpen={!!carpetModalService}
          service={carpetModalService}
          availableCarpetServices={services.filter(s => s.category === 'ALFOMBRAS' || s.unit === 'm2')}
          initialHeight={editingCarpetItem?.carpetDimensions?.heightMeters || 2.5}
          initialWidth={editingCarpetItem?.carpetDimensions?.widthMeters || 1.8}
          initialNotes={editingCarpetItem?.notes || ''}
          onClose={() => {
            setCarpetModalService(null);
            setEditingCarpetItem(null);
          }}
          onConfirm={handleConfirmCarpet}
        />
      )}
    </div>
  );
};
