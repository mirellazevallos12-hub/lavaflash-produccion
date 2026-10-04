import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Order } from '../../types';
import { 
  Bike, MapPin, Phone, CheckCircle2, 
  ExternalLink, Navigation, Clock, UserCheck, MessageSquare 
} from 'lucide-react';

export const DeliveryRoutesView: React.FC = () => {
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [selectedRider, setSelectedRider] = useState('usr-4'); // Pedro Quispe

  const loadData = () => {
    const all = db.getOrders();
    // Orders marked as isDeliveryToHome or assigned
    setDeliveryOrders(all.filter(o => o.isDeliveryToHome || o.deliveryAddress));
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleMarkDelivered = (orderId: string) => {
    db.updateOrderStatus(orderId, 'ENTREGADO', 'Entrega a domicilio completada por motorizado Pedro Quispe.');
  };

  const pendingDeliveries = deliveryOrders.filter(o => o.status !== 'ENTREGADO');
  const completedDeliveries = deliveryOrders.filter(o => o.status === 'ENTREGADO');

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Módulo de Delivery, Rutas y Motorizados
          </h1>
          <p className="text-xs text-slate-500">
            Asignación de pedidos para entrega a domicilio, hojas de ruta y trazabilidad de motorizados.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold px-2">Motorizado asignado:</span>
          <span className="bg-white font-bold text-slate-900 px-3 py-1 rounded-lg shadow-2xs flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-teal-600" />
            Pedro Quispe (Moto 01 - Placa 4821-3A)
          </span>
        </div>
      </div>

      {/* Delivery Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-600" />
          Ruta Activa de Despacho ({pendingDeliveries.length} pedidos en camino o por entregar)
        </h2>

        {pendingDeliveries.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No hay entregas pendientes de delivery en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDeliveries.map((ord, idx) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900">{ord.code}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-2">{ord.customerName}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 font-mono block">
                      S/ {ord.total.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      ord.pendingBalance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {ord.pendingBalance <= 0 ? 'PAGADO' : `COBRAR: S/ ${ord.pendingBalance.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Address & Reference */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{ord.deliveryAddress || 'Dirección registrada en cliente'}</span>
                  </div>
                  {ord.deliveryReference && (
                    <p className="text-[11px] text-slate-500 pl-5 italic">
                      Ref: {ord.deliveryReference}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="text-xs text-slate-600">
                  <span className="font-semibold block mb-0.5 text-slate-700">Prendas a Entregar:</span>
                  <div className="flex flex-wrap gap-1">
                    {ord.items.map(i => (
                      <span key={i.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {i.quantity}x {i.serviceName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${ord.customerPhone}`}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar
                    </a>
                    <a
                      href={`https://wa.me/51${ord.customerPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
                  </div>

                  <button
                    onClick={() => handleMarkDelivered(ord.id)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar Entrega en Domicilio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Deliveries History */}
        {completedDeliveries.length > 0 && (
          <div className="pt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Entregas a Domicilio Completadas Hoy ({completedDeliveries.length})
            </h3>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {completedDeliveries.map(ord => (
                <div key={ord.id} className="p-3 flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-slate-800">{ord.code}</span>
                    <span>{ord.customerName}</span>
                    <span className="text-[10px] text-slate-400">({ord.deliveryAddress})</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">Entregado con éxito</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
