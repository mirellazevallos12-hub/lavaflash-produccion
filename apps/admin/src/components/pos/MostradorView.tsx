import { HistoricalModule } from '../reports/HistoricalModule';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order, OrderStatus } from '../../types';
import { 
  Plus, Search, Printer, PackageCheck, 
  Phone, Calendar, DollarSign, Filter, RefreshCw, 
  Shirt, ArrowRight, UserCheck, AlertCircle, UserPlus,
  Clock, Scale, Layers, Info, Sparkles, MessageSquare
} from 'lucide-react';
import { InformationBoardModal } from './InformationBoardModal';
import { BUSINESS } from '../../config/business';

interface MostradorViewProps {
  onOpenNewReception: () => void;
  onOpenNewCustomer?: () => void;
  onOpenReceipt: (order: Order) => void;
  onOpenPartialDelivery: (order: Order) => void;
}

export const MostradorView: React.FC<MostradorViewProps> = ({
  onOpenNewReception,
  onOpenNewCustomer,
  onOpenReceipt,
  onOpenPartialDelivery
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const loadData = () => {
    setOrders(db.getOrders());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerDocument.includes(searchQuery) ||
      o.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <HistoricalModule context="mostrador" />
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Módulo de Mostrador, Recepción &amp; Caja
            </h1>
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-800 px-2 py-0.5 rounded-full border border-teal-500/30">
              Lavaflash
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registro ágil de prendas, búsqueda instantánea de clientes por DNI/RUC y cobro de saldos pendientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowInfoModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:border-teal-400"
          >
            <Info className="w-4 h-4 text-teal-600" />
            <span>Panel de Tarifas &amp; Plazos</span>
          </button>

          {onOpenNewCustomer && (
            <button
              onClick={onOpenNewCustomer}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-teal-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>+ Nuevo Cliente (DNI/RUC)</span>
            </button>
          )}

          <button
            onClick={onOpenNewReception}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-600/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Recepción (F2)</span>
          </button>
        </div>
      </div>

      {/* Official Information Banner for Front Desk Cashiers */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-teal-300">
              Panel de Información Operativa • Sede San Borja ({BUSINESS.addressShort})
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a 
              href={BUSINESS.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              <span>WhatsApp: {BUSINESS.phoneCompact}</span>
            </a>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="text-teal-300 hover:text-white underline text-[11px] font-semibold"
            >
              Ver tarifario completo
            </button>
          </div>
        </div>

        {/* 3 Quick Rules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          {/* Rule 1: Al Peso */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>Al Peso: Cada 48 Horas</span>
                <span className="text-[10px] text-indigo-300 font-normal">(Dejando 1 día)</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Prendas diarias a <strong>S/ 4.50/kg</strong> (mín. 3 kg; si &lt; 3 kg: <strong>S/ 12.00 fijo</strong>). Máx. 1 juego sábanas o 1 toalla. Sábanas/toallas solas a <strong>S/ 6.00/kg</strong>.
              </p>
            </div>
          </div>

          {/* Rule 2: Al Seco */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 flex items-start gap-2.5">
            <Shirt className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>Al Seco: 3 a 4 Días</span>
                <span className="text-[10px] text-sky-300 font-normal">(Según material)</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ternos (S/ 35), Sacos (S/ 20), Pantalones (S/ 15), Vestidos (S/ 40). Tratamiento ecológico de telas finas.
              </p>
            </div>
          </div>

          {/* Rule 3: Edredones */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>Edredones: 1 Semana</span>
                <span className="text-[10px] text-amber-300 font-normal">(7 Días)</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                NO van al peso. 2 Plazas (S/ 28), King/Queen (S/ 35), Frazadas (S/ 20). Lavado al seco térmico y desinfección.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por DNI/RUC, nombre de cliente, teléfono o N° orden..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="EN_LAVADO">En Lavado</option>
            <option value="EN_SECADO">En Secado</option>
            <option value="EN_CONTROL_CALIDAD">En Control de Calidad</option>
            <option value="LISTO_PARA_ENTREGA">Listo para Entrega</option>
            <option value="ENTREGA_PARCIAL">Entrega Parcial</option>
            <option value="ENTREGADO">Entregado Total</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Orden / Comprobante</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Prendas y Servicios</th>
                <th className="py-3 px-4">Promesa de Entrega</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado Flujo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Shirt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron órdenes con los criterios especificados.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isOverdue = new Date(ord.promisedDeliveryAt) < new Date() && ord.status !== 'ENTREGADO';
                  const undeliveredCount = ord.items.filter(i => !i.isDelivered).length;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{ord.code}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ord.voucherType === 'TICKET_RECOJO' ? 'Ticket' : ord.voucherType}: {ord.voucherNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {ord.customerDocument} • {ord.customerPhone}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {ord.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="text-[11px] text-slate-700 flex items-center justify-between">
                              <span className={item.isDelivered ? 'line-through text-slate-400' : ''}>
                                • {item.quantity}x {item.serviceName}
                              </span>
                            </div>
                          ))}
                          {ord.items.length > 2 && (
                            <span className="text-[10px] text-teal-600 font-semibold">
                              +{ord.items.length - 2} ítem(s) más
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className={`text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          <span>
                            {new Date(ord.promisedDeliveryAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOverdue && <span className="block text-[9px] text-rose-500 uppercase font-black">Demorado</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          S/ {ord.total.toFixed(2)}
                        </span>
                        {ord.applyIgv !== false && (
                          <span className="text-[9px] text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-semibold font-mono inline-block">
                            {ord.igvAmount ? `IGV: S/ ${ord.igvAmount.toFixed(2)}` : 'Inc. IGV'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {ord.pendingBalance > 0 ? (
                          <div>
                            <span className="font-mono font-black text-rose-600 block">
                              S/ {ord.pendingBalance.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-rose-500 font-bold uppercase">POR COBRAR</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            PAGADO
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-block ${
                          ord.status === 'RECIBIDO' ? 'bg-slate-100 text-slate-800' :
                          ord.status === 'EN_LAVADO' ? 'bg-blue-100 text-blue-800' :
                          ord.status === 'EN_SECADO' ? 'bg-cyan-100 text-cyan-800' :
                          ord.status === 'EN_CONTROL_CALIDAD' ? 'bg-amber-100 text-amber-800' :
                          ord.status === 'LISTO_PARA_ENTREGA' ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-400' :
                          ord.status === 'ENTREGA_PARCIAL' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceipt(ord)}
                            title="Imprimir / Ver Comprobante"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          {ord.status !== 'ENTREGADO' && (
                            <button
                              onClick={() => onOpenPartialDelivery(ord)}
                              title="Despachar y Cobrar Saldo"
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 font-bold rounded-lg transition-colors text-[11px] flex items-center gap-1 shadow-2xs"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Entregar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Information & Rates Board Modal */}
      <InformationBoardModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};
