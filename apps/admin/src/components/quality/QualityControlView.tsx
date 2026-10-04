import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { BUSINESS } from '../../config/business';
import { 
  CheckCircle2, Sparkles, MessageSquare, Phone, 
  ExternalLink, Send, ShieldCheck, Clock, AlertTriangle, 
  Search, Check, Shirt, Filter, RefreshCw, X
} from 'lucide-react';

export const QualityControlView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState('');
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');

  const loadOrders = () => {
    // Orders in washing, drying or in quality control
    const all = db.getOrders();
    setOrders(all.filter(o => 
      o.status === 'EN_CONTROL_CALIDAD' || 
      o.status === 'EN_SECADO' || 
      o.status === 'EN_LAVADO' ||
      (o.status === 'LISTO_PARA_ENTREGA' && !o.whatsappNotificationSent)
    ));
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = db.subscribe(loadOrders);
    return () => unsubscribe();
  }, []);

  // When an order is selected, initialize checked items checklist
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    const initialChecked: Record<string, boolean> = {};
    order.items.forEach(item => {
      initialChecked[item.id] = false;
    });
    setCheckedItems(initialChecked);
  };

  const toggleCheckItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const allItemsChecked = selectedOrder 
    ? selectedOrder.items.every(i => checkedItems[i.id])
    : false;

  // Prepare and execute "Listo" with WhatsApp Automation
  const handleApproveQuality = (order: Order) => {
    const updated = db.approveQualityAndNotify(order.id);
    if (!updated) return;

    // Generate WhatsApp text
    const garmentsList = order.items.map(i => `• ${i.quantity}x ${i.serviceName}`).join('%0A');
    const saldoText = order.pendingBalance > 0 
      ? `*Saldo pendiente:* S/ ${order.pendingBalance.toFixed(2)} (Aceptamos Yape/Plin, Tarjetas o Efectivo)` 
      : `*Estado de pago:* CANCELADO (S/ 0 pendiente)`;

    const rawMessage = `¡Hola *${order.customerName}*! 👋 Tu ropa ya está limpia, planchada y lista para recoger en *Lavaflash Lavandería* (Sede San Borja).%0A%0A📦 *Orden:* ${order.code}%0A🧾 *Comprobante:* ${order.voucherType} ${order.voucherNumber}%0A👚 *Prendas listas:*%0A${garmentsList}%0A%0A💰 ${saldoText}%0A%0A📍 *Dirección:* ${BUSINESS.addressShort}%0A📞 *WhatsApp:* ${BUSINESS.phoneCompact}%0A⏰ *Horario:* ${BUSINESS.hours}%0A%0A¡Muchas gracias por su preferencia! ✨`;

    setWhatsappTemplate(decodeURIComponent(rawMessage));
    setSelectedOrder(updated);
    setShowWhatsappModal(true);
  };

  const getWhatsappUrl = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  const filteredOrders = orders.filter(o => 
    o.code.toLowerCase().includes(filterQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    o.customerPhone.includes(filterQuery)
  );

  return (
    <div className="space-y-6">
      {/* Station Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Estación Exclusiva de Empaque e Inspección
          </div>
          <h1 className="text-2xl font-black tracking-tight">Control de Calidad y Notificaciones</h1>
          <p className="text-sm text-slate-300 mt-1">
            Verificación física de prendas completas, planchado impecable y disparo automático de WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-center">
            <span className="text-2xl font-black text-teal-400">{orders.length}</span>
            <span className="text-[11px] text-slate-400 block uppercase font-bold">Por Inspeccionar</span>
          </div>
          <button
            onClick={loadOrders}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
            title="Refrescar lista"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Grid: Order Queue + Inspection Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Orders in Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Cola de Pedidos Terminados ({filteredOrders.length})
            </h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por cliente, orden o teléfono..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">¡Al día! No hay prendas pendientes de control de calidad.</p>
                <p className="text-[11px] text-slate-400 mt-1">Los pedidos aparecerán aquí cuando pasen de lavado/secado.</p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => handleSelectOrder(ord)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 shadow-sm ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{ord.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === 'EN_CONTROL_CALIDAD' 
                              ? 'bg-amber-100 text-amber-800' 
                              : ord.status === 'LISTO_PARA_ENTREGA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 mt-1">{ord.customerName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {ord.customerPhone}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block font-mono">
                          S/ {ord.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ord.items.length} prenda(s)
                        </span>
                      </div>
                    </div>

                    {ord.observations && (
                      <div className="mt-2 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 p-1.5 rounded text-left">
                        <span className="font-semibold">Obs:</span> {ord.observations}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inspection Table & Action (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Inspección de {selectedOrder.code}</h2>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {selectedOrder.voucherType}: {selectedOrder.voucherNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cliente: <strong className="text-slate-700">{selectedOrder.customerName}</strong> • Tel: {selectedOrder.customerPhone}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Promesa de Entrega:</span>
                  <span className="text-xs font-bold text-teal-800">
                    {new Date(selectedOrder.promisedDeliveryAt).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Inspection Garment Checklist */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Lista de Verificación de Prendas
                  </h3>
                  <span className="text-xs text-slate-500">
                    Marque cada prenda confirmando limpieza y planchado
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedOrder.items.map((item, idx) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCheckItem(item.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked 
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              {idx + 1}. {item.serviceName}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2 font-mono">
                              ({item.quantity} {item.category === 'AL_PESO' ? 'kg' : 'pza'})
                            </span>
                            {item.notes && (
                              <p className="text-[11px] text-rose-600 italic">
                                Alerta original: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-700 font-mono">
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Packaging Notes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800 block">Estándar de Empaque:</span>
                  <p>• Ropa al seco en percha con funda transparente y etiqueta térmica visible.</p>
                  <p>• Ropa por kilo doblada compacta en bolsa sellada con aroma fresco.</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <span>Prendas verificadas: </span>
                  <strong className="text-slate-900">
                    {Object.values(checkedItems).filter(Boolean).length} de {selectedOrder.items.length}
                  </strong>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleApproveQuality(selectedOrder)}
                    disabled={!allItemsChecked}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Marcar "LISTO" y Disparar WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Shirt className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">Seleccione un pedido de la lista</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Revise cada prenda física en la mesa de control de calidad para habilitar el botón "Listo" y notificar automáticamente al cliente.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Automated WhatsApp Modal & Launcher */}
      {showWhatsappModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#075E54] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">Notificación Automatizada WhatsApp</h3>
                  <p className="text-[11px] text-emerald-100">Estado actualizado a: LISTO PARA ENTREGA</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vista previa del mensaje */}
            <div className="p-6 bg-[#ECE5DD] space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-2 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans relative">
                <div className="whitespace-pre-line">
                  {whatsappTemplate}
                </div>
                <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1 mt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-teal-600 font-bold">✓✓</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  El sistema registró el cambio de estado y la auditoría en el almacenamiento operativo de este navegador. Puedes abrir WhatsApp para enviar el mensaje real directamente al cliente.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <a
                href={getWhatsappUrl(selectedOrder.customerPhone, whatsappTemplate)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowWhatsappModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir WhatsApp Web / App
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
