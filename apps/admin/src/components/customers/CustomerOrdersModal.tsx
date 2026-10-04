import React from 'react';
import { Customer, Order } from '../../types';
import { db } from '../../services/db';
import { 
  X, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Phone,
  Sparkles
} from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onOpenReceipt?: (order: Order) => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  customer,
  onClose,
  onOpenReceipt,
}) => {
  if (!isOpen || !customer) return null;

  const orders = db.getOrdersByCustomer(customer.id);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'RECIBIDO':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Recibido</span>;
      case 'EN_LAVADO':
      case 'EN_SECADO':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">En Proceso</span>;
      case 'EN_CONTROL_CALIDAD':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Control Calidad</span>;
      case 'LISTO_PARA_ENTREGA':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">LISTO PARA RECOJO</span>;
      case 'ENTREGA_PARCIAL':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">ENTREGA PARCIAL</span>;
      case 'ENTREGADO':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Entregado</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Historial de Servicios del Cliente</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {customer.fullName} • {customer.documentType}: {customer.documentNumber} • Cel: {customer.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500 block">Total Órdenes</span>
              <span className="text-lg font-black text-slate-800">{orders.length}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Total Invertido</span>
              <span className="text-lg font-black text-teal-700 font-mono">
                S/ {orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Saldo por Cobrar</span>
              <span className={`text-lg font-black font-mono ${
                orders.reduce((sum, o) => sum + o.pendingBalance, 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                S/ {orders.reduce((sum, o) => sum + o.pendingBalance, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">Este cliente aún no registra órdenes de servicio.</p>
              <p className="text-xs text-slate-400 mt-1">Cree una nueva orden desde el módulo de Mostrador.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-4 shadow-2xs transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {order.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {order.voucherType}: {order.voucherNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Total: <strong>S/ {order.total.toFixed(2)}</strong></span>
                        {order.pendingBalance > 0 ? (
                          <span className="text-[11px] font-bold text-rose-600">Saldo: S/ {order.pendingBalance.toFixed(2)}</span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">PAGADO TOTAL</span>
                        )}
                      </div>

                      {onOpenReceipt && (
                        <button
                          onClick={() => onOpenReceipt(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-600" />
                          <span>Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dates & Items */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1">
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Recibido: {new Date(order.receivedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Entrega prometida: {new Date(order.promisedDeliveryAt).toLocaleDateString()} {new Date(order.promisedDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mt-1 font-medium text-slate-700">
                      <strong>Prendas: </strong>
                      {order.items.map(it => `${it.quantity}x ${it.serviceName}`).join(', ')}
                    </div>

                    {order.observations && (
                      <p className="text-[11px] text-amber-800 italic">
                        Nota: {order.observations}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
