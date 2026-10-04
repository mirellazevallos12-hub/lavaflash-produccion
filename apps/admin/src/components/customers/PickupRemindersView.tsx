import React, { useState, useEffect, useMemo } from 'react';
import { Order, Customer } from '../../types';
import { db } from '../../services/db';
import { 
  BellRing, 
  Clock, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingBag, 
  Copy, 
  Check, 
  DollarSign, 
  Filter, 
  Search, 
  Receipt, 
  Shirt, 
  Edit3, 
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { EditCustomerModal } from './EditCustomerModal';
import { BUSINESS } from '../../config/business';

interface PickupRemindersViewProps {
  onOpenReceipt?: (order: Order) => void;
  onOpenPartialDelivery?: (order: Order) => void;
}

export const PickupRemindersView: React.FC<PickupRemindersViewProps> = ({
  onOpenReceipt,
  onOpenPartialDelivery,
}) => {
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'RECENT' | 'WITH_BALANCE'>('ALL');
  
  // Follow-up note modal
  const [contactOrder, setContactOrder] = useState<Order | null>(null);
  const [contactChannel, setContactChannel] = useState<'WHATSAPP' | 'LLAMADA' | 'SMS'>('WHATSAPP');
  const [contactNotes, setContactNotes] = useState('');
  
  // Edit customer modal from reminder view
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setOrders(db.getOrders());
      setCustomers(db.getCustomers());
    });
    return () => unsub();
  }, []);

  // Filter orders that have uncollected garments:
  // 1. Order status is LISTO_PARA_ENTREGA
  // 2. Or Order status is ENTREGA_PARCIAL and has undelivered items
  const uncollectedOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.status === 'LISTO_PARA_ENTREGA') return true;
      if (order.status === 'ENTREGA_PARCIAL') {
        const hasUndelivered = order.items.some(item => !item.isDelivered);
        return hasUndelivered;
      }
      return false;
    });
  }, [orders]);

  // Enrich orders with waiting days and urgency
  const enrichedOrders = useMemo(() => {
    const now = new Date().getTime();

    return uncollectedOrders.map(order => {
      // Find customer record to get current phone number
      const customer = customers.find(c => c.id === order.customerId);
      const activePhone = customer?.phone || order.customerPhone;

      // Base date: promisedDeliveryAt or qualityApprovedAt or receivedAt
      const promisedTime = new Date(order.promisedDeliveryAt).getTime();
      const diffMs = now - promisedTime;
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let urgency: 'CRITICAL' | 'MODERATE' | 'RECENT' = 'RECENT';
      if (daysOverdue >= 7) {
        urgency = 'CRITICAL';
      } else if (daysOverdue >= 3) {
        urgency = 'MODERATE';
      }

      // Pending items in shop
      const pendingItems = order.items.filter(item => !item.isDelivered);
      const totalPendingPieces = pendingItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

      // Last reminder sent
      const lastReminder = [...(order.statusHistory || [])]
        .reverse()
        .find(h => h.note && (h.note.includes('WhatsApp') || h.note.includes('Recordatorio') || h.note.includes('llamada') || h.note.includes('aviso')));

      return {
        ...order,
        activePhone,
        customer,
        daysOverdue,
        urgency,
        pendingItems,
        totalPendingPieces,
        lastReminder,
      };
    });
  }, [uncollectedOrders, customers]);

  // Filter and Search logic
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return enrichedOrders.filter(item => {
      // Search
      const matchesSearch = !query || (
        item.customerName.toLowerCase().includes(query) ||
        item.activePhone.includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.voucherNumber.toLowerCase().includes(query) ||
        item.pendingItems.some(it => it.serviceName.toLowerCase().includes(query))
      );

      if (!matchesSearch) return false;

      // Urgency filter
      if (urgencyFilter === 'CRITICAL') return item.urgency === 'CRITICAL';
      if (urgencyFilter === 'MODERATE') return item.urgency === 'MODERATE';
      if (urgencyFilter === 'RECENT') return item.urgency === 'RECENT';
      if (urgencyFilter === 'WITH_BALANCE') return item.pendingBalance > 0;

      return true;
    });
  }, [enrichedOrders, searchQuery, urgencyFilter]);

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    const totalOrders = enrichedOrders.length;
    const totalPieces = enrichedOrders.reduce((sum, o) => sum + o.totalPendingPieces, 0);
    const totalBalance = enrichedOrders.reduce((sum, o) => sum + o.pendingBalance, 0);
    const criticalCount = enrichedOrders.filter(o => o.urgency === 'CRITICAL').length;
    const moderateCount = enrichedOrders.filter(o => o.urgency === 'MODERATE').length;

    return { totalOrders, totalPieces, totalBalance, criticalCount, moderateCount };
  }, [enrichedOrders]);

  // Build Personalized WhatsApp Reminder Text
  const buildWhatsAppMessage = (order: typeof enrichedOrders[0]) => {
    const garmentsSummary = order.pendingItems.map(it => `${it.quantity}x ${it.serviceName}`).join(', ');
    const balanceText = order.pendingBalance > 0 
      ? `💰 Saldo pendiente por cancelar: *S/ ${order.pendingBalance.toFixed(2)}*.` 
      : `✅ Su servicio se encuentra *100% CANCELADO*. Solo requiere acercarse a retirarlo.`;

    const overdueGreeting = order.daysOverdue >= 5 
      ? `Notamos que sus prendas llevan algunos días listas en nuestro almacén.` 
      : `Le recordamos amablemente que sus prendas ya están listas.`;

    return `👋 ¡Hola ${order.customerName}! Le saludamos cordialmente de *Lavandería Lavaflash* 🧺.

${overdueGreeting}
Sus prendas del Ticket *#${order.code}* (${order.voucherNumber}):
👕 *Prendas en mostrador*: ${garmentsSummary}
${balanceText}

📍 *Lugar de recojo*: Nuestro local comercial (${BUSINESS.addressShort})
🕒 *Horario de atención*: Lunes a Sábado de 8:00 AM a 8:00 PM.

¡Con mucho gusto le esperamos para entregarle sus prendas impecables!`;
  };

  const handleCopyMessage = (order: typeof enrichedOrders[0]) => {
    const text = buildWhatsAppMessage(order);
    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);

    // Auto-record reminder log
    db.recordPickupReminder(order.id, 'WHATSAPP', 'Mensaje de recordatorio copiado al portapapeles para envío.');
    setToastMessage(`¡Mensaje de recordatorio para ${order.customerName} copiado al portapapeles!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenWhatsApp = (order: typeof enrichedOrders[0]) => {
    const cleanPhone = order.activePhone.replace(/\D/g, '');
    const text = buildWhatsAppMessage(order);
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/51${cleanPhone}?text=${encoded}`;

    // Auto-record reminder log in database
    db.recordPickupReminder(order.id, 'WHATSAPP', 'Recordatorio de recojo enviado al cliente por WhatsApp.');
    setToastMessage(`Abriendo WhatsApp para avisar a ${order.customerName}...`);
    setTimeout(() => setToastMessage(null), 3000);

    window.open(url, '_blank');
  };

  const handleSaveContactLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactOrder) return;

    db.recordPickupReminder(contactOrder.id, contactChannel, contactNotes.trim() || undefined);
    setToastMessage(`Gestión de recordatorio registrada para ${contactOrder.customerName}.`);
    setTimeout(() => setToastMessage(null), 3000);
    setContactOrder(null);
    setContactNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-teal-500/40 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Recordatorios de Recojo de Prendas</h1>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full border border-amber-300">
                {enrichedOrders.length} tickets pendientes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione a los clientes con prendas listas o entregas parciales que aún no vienen a recoger a tienda. Envíe recordatorios por WhatsApp o llamadas.
            </p>
          </div>
        </div>

        {/* Quick Rule Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-600">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span><strong>Regla de Custodia:</strong> Prendas en almacén hasta 30 días. Envíe recordatorios preventivos a los 3 y 7 días.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xl shrink-0">
            {metrics.totalOrders}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Clientes sin Recoger</span>
            <span className="text-sm font-black text-slate-900">Prendas en Mostrador</span>
          </div>
        </div>

        {/* Total Garments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xl shrink-0">
            {metrics.totalPieces}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Prendas Físicas</span>
            <span className="text-sm font-black text-teal-900">Ocupando Estantes</span>
          </div>
        </div>

        {/* Total Balance to Collect */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-base shrink-0 font-mono">
            S/
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Saldo por Cobrar</span>
            <span className="text-sm font-black text-emerald-700 font-mono">
              S/ {metrics.totalBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Critical (+7 days) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black text-xl shrink-0">
            {metrics.criticalCount}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Críticos (+7 Días)</span>
            <span className="text-sm font-black text-rose-900">Requieren Llamada</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, número de celular, ticket o prendas en almacén..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto shrink-0 pb-1 md:pb-0">
            <button
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                urgencyFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({enrichedOrders.length})
            </button>

            <button
              onClick={() => setUrgencyFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                urgencyFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>🚨 Críticos (+7 días) ({metrics.criticalCount})</span>
            </button>

            <button
              onClick={() => setUrgencyFilter('MODERATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                urgencyFilter === 'MODERATE'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              ⚠ 3 a 6 días ({metrics.moderateCount})
            </button>

            <button
              onClick={() => setUrgencyFilter('RECENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                urgencyFilter === 'RECENT'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              🟢 Recientes (1 a 2 días)
            </button>

            <button
              onClick={() => setUrgencyFilter('WITH_BALANCE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                urgencyFilter === 'WITH_BALANCE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Con Saldo Pendiente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">¡Almacén de Mostrador al Día!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery 
              ? `No hay órdenes pendientes que coincidan con "${searchQuery}".`
              : 'No hay prendas rezagadas con el filtro seleccionado. Todos los clientes han recogido sus pedidos puntualmente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCritical = order.urgency === 'CRITICAL';
            const isModerate = order.urgency === 'MODERATE';

            return (
              <div 
                key={order.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-4 ${
                  isCritical 
                    ? 'border-rose-300 ring-2 ring-rose-100 hover:border-rose-400' 
                    : isModerate
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                {/* Header row: Ticket Code, Customer & Overdue badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {order.code}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {order.voucherType}: {order.voucherNumber}
                    </span>

                    {/* Urgency Badge */}
                    {isCritical && (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        🚨 {order.daysOverdue} DÍAS SIN RECOGER (CRÍTICO)
                      </span>
                    )}

                    {isModerate && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        ⚠ {order.daysOverdue} Días de Retraso
                      </span>
                    )}

                    {!isCritical && !isModerate && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🟢 Listo recientemente ({order.daysOverdue === 0 ? 'Hoy' : `${order.daysOverdue} día`})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Fecha prometida:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(order.promisedDeliveryAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Middle row: Customer Details + Phone + Editable Button */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cliente Titular
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {order.customerName}
                    </h4>
                    <span className="text-xs text-slate-500 block">
                      Doc: {order.customerDocument}
                    </span>
                  </div>

                  {/* Phone / Celular with Quick Edit Button */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Celular / WhatsApp
                    </span>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-mono font-black text-sm text-slate-900 tracking-wide">
                        {order.activePhone}
                      </span>
                      
                      {/* Edit Phone Button */}
                      {order.customer && (
                        <button
                          onClick={() => setEditingCustomer(order.customer!)}
                          title="¿El cliente cambió de celular? Modifíquelo aquí"
                          className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Haga clic en el lápiz si el cliente cambió de número
                    </span>
                  </div>

                  {/* Payment Status & Balance */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estado de Pago en Tienda
                    </span>
                    {order.pendingBalance > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-md">
                          PENDIENTE DE PAGO
                        </span>
                        <span className="font-mono font-black text-sm text-rose-700">
                          S/ {order.pendingBalance.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                          PAGADO AL 100%
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">(Solo entregar)</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 block">
                      Total del servicio: S/ {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Garments in Shop Storage */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prendas físicas listas esperando recojo en mostrador:</span>
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {order.pendingItems.map((item) => (
                      <span 
                        key={item.id}
                        className="bg-teal-50 border border-teal-200 text-teal-900 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="font-bold text-teal-700">{item.quantity}x</span>
                        <span>{item.serviceName}</span>
                        {item.brand && <span className="text-[10px] text-teal-600">({item.brand})</span>}
                      </span>
                    ))}
                  </div>

                  {order.observations && (
                    <p className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 italic mt-1">
                      <strong>Observación interna:</strong> {order.observations}
                    </p>
                  )}
                </div>

                {/* Last reminder info */}
                {order.lastReminder && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Último contacto registrado: <strong>{new Date(order.lastReminder.timestamp).toLocaleDateString()} ({order.lastReminder.userName})</strong>: "{order.lastReminder.note}"</span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: Communication Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Primary WhatsApp Button */}
                    <button
                      onClick={() => handleOpenWhatsApp(order)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                      title="Abrir WhatsApp con mensaje personalizado de recordatorio"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Recordatorio WhatsApp</span>
                    </button>

                    {/* Copy text button */}
                    <button
                      onClick={() => handleCopyMessage(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Copiar texto de recordatorio para pegar en WhatsApp o SMS"
                    >
                      {copiedOrderId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Mensaje</span>
                        </>
                      )}
                    </button>

                    {/* Direct Call */}
                    <a
                      href={`tel:${order.activePhone}`}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Llamar por Celular</span>
                    </a>

                    {/* Register Contact note */}
                    <button
                      onClick={() => setContactOrder(order)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>📝 Registrar Seguimiento</span>
                    </button>
                  </div>

                  {/* Right: Deliver or View Ticket */}
                  <div className="flex items-center gap-2">
                    {onOpenReceipt && (
                      <button
                        onClick={() => onOpenReceipt(order)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-teal-600" />
                        <span>Ver Ticket</span>
                      </button>
                    )}

                    {onOpenPartialDelivery && (
                      <button
                        onClick={() => onOpenPartialDelivery(order)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Entregar / Despachar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register Contact / Follow up note */}
      {contactOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Gestión de Recordatorio</h3>
              <button onClick={() => setContactOrder(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Registre el resultado del contacto con <strong>{contactOrder.customerName}</strong> ({contactOrder.code}):
            </p>

            <form onSubmit={handleSaveContactLog} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal de Contacto</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                >
                  <option value="WHATSAPP">WhatsApp Mensaje Directo</option>
                  <option value="LLAMADA">Llamada Telefónica</option>
                  <option value="SMS">Mensaje SMS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nota o Respuesta del Cliente</label>
                <textarea
                  rows={3}
                  required
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Ej. Cliente respondió que se encuentra fuera de Lima y vendrá este sábado a cancelar y retirar..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactOrder(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Gestión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer details (if phone was wrong) */}
      {editingCustomer && (
        <EditCustomerModal
          isOpen={!!editingCustomer}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onCustomerUpdated={(updated) => {
            setToastMessage(`¡Celular de ${updated.fullName} actualizado a ${updated.phone}!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}
    </div>
  );
};
