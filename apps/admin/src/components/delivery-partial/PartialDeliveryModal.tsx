import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Order, PaymentMethod } from '../../types';
import { SignaturePad } from '../common/SignaturePad';
import { 
  X, Check, AlertCircle, DollarSign, PackageCheck, 
  ShieldCheck, ArrowRight, Printer, AlertTriangle 
} from 'lucide-react';

interface PartialDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export const PartialDeliveryModal: React.FC<PartialDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !order) return null;

  // Selected item IDs for delivery today
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    // By default, select all pending items that haven't been delivered
    return order.items.filter(i => !i.isDelivered).map(i => i.id);
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [customerNotes, setCustomerNotes] = useState('');
  const [signatureData, setSignatureData] = useState<string>('');

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Undelivered items
  const pendingItemsInOrder = order.items.filter(i => !i.isDelivered);

  // Value of items being delivered in THIS transaction
  const valueOfDeliveredNow = useMemo(() => {
    return order.items
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.subtotal, 0);
  }, [order, selectedItemIds]);

  // Total value of ALL items already delivered prior to this transaction
  const valueAlreadyDelivered = useMemo(() => {
    return order.items
      .filter(item => item.isDelivered)
      .reduce((sum, item) => sum + item.subtotal, 0);
  }, [order]);

  // Total cumulative value of items delivered including this batch
  const cumulativeDeliveredValue = valueAlreadyDelivered + valueOfDeliveredNow;

  // Mandatory amount required right now:
  // Must cover at least the delivered goods up to this point minus what the customer already paid.
  // If customer is taking everything, must pay the entire pending balance.
  const isTakingAllRemaining = selectedItemIds.length === pendingItemsInOrder.length;

  const requiredPaymentNow = useMemo(() => {
    if (isTakingAllRemaining) {
      return order.pendingBalance;
    }
    // Partial: Customer must pay enough so that totalPaid >= cumulativeDeliveredValue
    const shortage = Math.max(0, cumulativeDeliveredValue - order.totalPaid);
    // Cannot exceed order's total pending balance
    return Math.min(shortage, order.pendingBalance);
  }, [isTakingAllRemaining, order.pendingBalance, order.totalPaid, cumulativeDeliveredValue]);

  // Remaining balance that will stay unpaid after this delivery
  const remainingBalanceAfterThis = Math.max(0, Number((order.pendingBalance - requiredPaymentNow).toFixed(2)));

  // Items remaining in laundry after this
  const itemsStayingInStore = order.items.filter(
    item => !item.isDelivered && !selectedItemIds.includes(item.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItemIds.length === 0) {
      alert('Debe seleccionar al menos una prenda para entregar.');
      return;
    }

    const result = db.executePartialDelivery(
      order.id,
      selectedItemIds,
      requiredPaymentNow,
      paymentMethod,
      customerNotes.trim() || undefined,
      signatureData || undefined
    );

    if (result.success && result.order) {
      onSuccess(result.order);
      onClose();
    } else {
      alert(result.error || 'Error al procesar la entrega.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded font-bold border border-teal-500/30">
                {order.code}
              </span>
              <h2 className="text-base font-bold">Despacho y Control de Entregas Parciales</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <strong className="text-slate-200">{order.customerName}</strong> ({order.customerDocument})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Instructions Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <PackageCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Regla de Entrega Parcial y Cobro Proporcional:</span>
              <p className="text-blue-800 mt-0.5">
                Marque únicamente las prendas que el cliente retira hoy. El sistema calcula y exige obligatoriamente el cobro de los artículos retirados garantizando que ninguna prenda salga sin haber sido abonada.
              </p>
            </div>
          </div>

          {/* Garments Checklist */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase text-slate-700">
                Seleccione las prendas a entregar en este acto:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemIds(pendingItemsInOrder.map(i => i.id))}
                  className="text-[11px] text-teal-600 hover:underline font-semibold"
                >
                  Entregar Todo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedItemIds([])}
                  className="text-[11px] text-slate-500 hover:underline font-semibold"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-56 overflow-y-auto">
              {order.items.map((item, idx) => {
                const isAlreadyDelivered = item.isDelivered;
                const isSelectedForNow = selectedItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isAlreadyDelivered) toggleItem(item.id);
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      isAlreadyDelivered
                        ? 'bg-slate-200/60 border-slate-300 text-slate-500 cursor-not-allowed'
                        : isSelectedForNow
                          ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        isAlreadyDelivered
                          ? 'bg-slate-400 text-white'
                          : isSelectedForNow
                            ? 'bg-teal-600 text-white'
                            : 'border border-slate-300 bg-white'
                      }`}>
                        {(isAlreadyDelivered || isSelectedForNow) && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isAlreadyDelivered ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {idx + 1}. {item.serviceName}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {item.quantity} {item.category === 'AL_PESO' ? 'kg' : 'pza'}
                          </span>
                          {isAlreadyDelivered && (
                            <span className="text-[9px] bg-slate-300 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                              ENTREGADO PREVIAMENTE
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-rose-600 italic mt-0.5">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Mathematical Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-100 p-4 rounded-xl text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Prendas entregadas hoy:</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                S/ {valueOfDeliveredNow.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({selectedItemIds.length} ítem(s) seleccionados)
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Adelanto previo abonado:</span>
              <span className="text-lg font-black text-teal-600 font-mono">
                S/ {order.totalPaid.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Total pedido: S/ {order.total.toFixed(2)}
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${
              requiredPaymentNow > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <span className="font-bold block mb-0.5">Cobro exigido en este acto:</span>
              <span className="text-xl font-black font-mono">
                S/ {requiredPaymentNow.toFixed(2)}
              </span>
              <span className="text-[10px] block mt-0.5">
                {requiredPaymentNow > 0 ? 'Exigir antes de entregar' : 'Cubierto por adelanto'}
              </span>
            </div>
          </div>

          {/* Items Remaining in Store Warning */}
          {itemsStayingInStore.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex justify-between items-center">
              <div>
                <span className="font-bold">Quedan en custodia de lavandería:</span>
                <span className="ml-1 text-amber-800">
                  {itemsStayingInStore.map(i => i.serviceName).join(', ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 block">Saldo pendiente futuro:</span>
                <strong className="font-mono text-sm">S/ {remainingBalanceAfterThis.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Payment Method Selector if collecting money */}
          {requiredPaymentNow > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Medio de Cobro para los S/ {requiredPaymentNow.toFixed(2)}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA', 'TRANSFERENCIA'] as PaymentMethod[]).map(pm => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      paymentMethod === pm
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Digital Signature Pad for Customer Conformity */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Firma Digital de Conformidad del Cliente (Opcional / Táctil):
            </span>
            <SignaturePad
              onSave={(base64) => setSignatureData(base64)}
              onClear={() => setSignatureData('')}
            />
          </div>

          {/* Conformity Notes */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Notas u observaciones de conformidad:
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Ej. Cliente retira únicamente el terno; edredón queda para el fin de semana"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedItemIds.length === 0}
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              Confirmar Entrega y Registrar Cobro
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
