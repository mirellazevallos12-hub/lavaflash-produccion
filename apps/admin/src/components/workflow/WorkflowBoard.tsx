import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../services/db';
import { Order, OrderItem } from '../../types';
import { CheckCircle2, Search } from 'lucide-react';

interface WorkflowBoardProps {
  onOpenReceipt: (order: Order) => void;
  onOpenPartialDelivery: (order: Order) => void;
}

type DeliveredGarment = {
  key: string;
  order: Order;
  item: OrderItem;
  deliveredAt: string;
};

export const WorkflowBoard: React.FC<WorkflowBoardProps> = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => setOrders(db.getOrders());

  useEffect(() => {
    loadData();
    const unsubscribe = db.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const deliveredGarments = useMemo<DeliveredGarment[]>(() => {
    const rows: DeliveredGarment[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        const delivered = item.isDelivered || order.status === 'ENTREGADO';
        if (!delivered) continue;

        const partialRecord = order.partialDeliveries
          ?.slice()
          .reverse()
          .find((delivery) => delivery.deliveredItems.some((deliveredItem) => deliveredItem.itemId === item.id));

        const deliveredHistory = order.statusHistory
          ?.slice()
          .reverse()
          .find((entry) => entry.status === 'ENTREGADO');

        rows.push({
          key: `${order.id}-${item.id}`,
          order,
          item,
          deliveredAt:
            partialRecord?.timestamp ||
            order.actualDeliveredAt ||
            deliveredHistory?.timestamp ||
            order.updatedAt,
        });
      }
    }

    return rows.sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime());
  }, [orders]);

  const filteredGarments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return deliveredGarments;

    return deliveredGarments.filter(({ order, item }) =>
      order.code.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerDocument.toLowerCase().includes(query) ||
      order.customerPhone.includes(query) ||
      item.serviceName.toLowerCase().includes(query)
    );
  }, [deliveredGarments, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Prendas Entregadas</h1>
          <p className="text-xs text-slate-500">
            Información histórica de prendas que ya fueron entregadas al cliente.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar orden, cliente o prenda..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-800">Registro de entregas</p>
              <p className="text-[11px] text-slate-500">Solo se muestran prendas ya entregadas.</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
            {filteredGarments.length}
          </span>
        </div>

        {filteredGarments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No hay prendas entregadas para mostrar.</p>
            <p className="mt-1 text-xs text-slate-400">Cuando una prenda sea entregada aparecerá automáticamente aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">DNI / RUC</th>
                  <th className="px-4 py-3">Prenda / Servicio</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Fecha de entrega</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGarments.map(({ key, order, item, deliveredAt }) => (
                  <tr key={key} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{order.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{order.customerName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{order.customerDocument}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.serviceName}</div>
                      {(item.brand || item.color) && (
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {[item.brand, item.color].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.quantity}{item.category === 'AL_PESO' ? ' kg' : ''}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {new Date(deliveredAt).toLocaleString('es-PE', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Entregada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
