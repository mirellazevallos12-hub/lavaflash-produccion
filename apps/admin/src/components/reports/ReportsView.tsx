import React, { useMemo } from 'react';
import { db } from '../../services/db';
import { 
  BarChart3, TrendingUp, Clock, Calendar, 
  DollarSign, PieChart, Users, Sparkles, Shirt, Scale, ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const orders = db.getOrders();
  const expenses = db.getExpenses();
  const customers = db.getCustomers();

  // Financial KPIs
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const totalCollected = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalPaid, 0);
  }, [orders]);

  const totalPendingReceivable = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.pendingBalance, 0);
  }, [orders]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netOperatingProfit = totalCollected - totalExpenses;
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Category Profitability Analysis
  const categoryStats = useMemo(() => {
    const stats: Record<string, { label: string; count: number; totalRevenue: number }> = {
      AL_SECO: { label: 'Lavado al Seco (Ternos, Vestidos)', count: 0, totalRevenue: 0 },
      AL_PESO: { label: 'Ropa al Peso & Edredones (kg)', count: 0, totalRevenue: 0 },
      ALFOMBRAS: { label: 'Alfombras Sintéticas y Lana', count: 0, totalRevenue: 0 },
      TENIDO: { label: 'Teñido Textil (Jeans, Casacas)', count: 0, totalRevenue: 0 },
      PLANCHADO: { label: 'Planchado a Vapor Camisas', count: 0, totalRevenue: 0 },
      ADICIONALES: { label: 'Desmanchado & Empaque al Vacío', count: 0, totalRevenue: 0 },
      MUEBLES: { label: 'Lavado de Muebles & Colchones', count: 0, totalRevenue: 0 },
    };

    orders.forEach(order => {
      order.items.forEach(item => {
        if (stats[item.category]) {
          stats[item.category].count += 1;
          stats[item.category].totalRevenue += item.subtotal;
        }
      });
    });

    return Object.entries(stats)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders]);

  // Peak Hours Analysis (8am to 8pm)
  const peakHours = useMemo(() => {
    const hoursCount: Record<number, number> = {};
    for (let h = 8; h <= 20; h++) hoursCount[h] = 0;

    orders.forEach(o => {
      const h = new Date(o.receivedAt).getHours();
      if (hoursCount[h] !== undefined) {
        hoursCount[h] += 1;
      }
    });

    const maxCount = Math.max(...Object.values(hoursCount), 1);

    return Object.entries(hoursCount).map(([h, count]) => ({
      hour: parseInt(h),
      hourLabel: `${h}:00`,
      count,
      percentage: Math.round((count / maxCount) * 100)
    }));
  }, [orders]);

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {
      EFECTIVO: 0,
      YAPE: 0,
      PLIN: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0
    };

    orders.forEach(o => {
      o.payments.forEach(p => {
        if (methods[p.paymentMethod] !== undefined) {
          methods[p.paymentMethod] += p.amount;
        }
      });
    });

    const sum = Object.values(methods).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(methods).map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / sum) * 100)
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Reportes Analíticos & Inteligencia de Negocio
        </h1>
        <p className="text-xs text-slate-500">
          Métricas de rentabilidad por servicio, horarios punta de recepción y balance financiero operativo.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Ventas Totales Generadas</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            S/ {totalRevenue.toFixed(2)}
          </span>
          <span className="text-[10px] text-teal-600 font-bold block mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            {orders.length} órdenes registradas
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Ticket Promedio por Cliente</span>
          <span className="text-2xl font-black text-teal-600 font-mono">
            S/ {averageTicket.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Por recepción de prendas</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Saldos por Cobrar (Fiado/Pendiente)</span>
          <span className="text-2xl font-black text-amber-600 font-mono">
            S/ {totalPendingReceivable.toFixed(2)}
          </span>
          <span className="text-[10px] text-amber-700 block mt-1">A cobrar al momento del recojo</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Utilidad Operativa Neta</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            S/ {netOperatingProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Cobrado - Egresos (S/ {totalExpenses.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Servicios Más Rentables (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Servicios Más Rentables (Ranking por Ingresos)</h3>
                <p className="text-xs text-slate-500">Categorías que más aportan a la facturación de la lavandería</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.map((item, idx) => {
              const maxCatRevenue = categoryStats[0]?.totalRevenue || 1;
              const barWidth = Math.round((item.totalRevenue / maxCatRevenue) * 100);

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">
                      {idx + 1}. {item.label}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      S/ {item.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-teal-500' : idx === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, barWidth)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Horarios de Mayor Demanda (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Horarios de Mayor Demanda (Pico)</h3>
              <p className="text-xs text-slate-500">Distribución de horas de recepción en mostrador</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 pt-2 items-end h-48 border-b border-slate-200 pb-2">
            {peakHours.slice(0, 12).map((ph) => (
              <div key={ph.hour} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-700 font-mono">
                  {ph.count > 0 ? ph.count : ''}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    ph.percentage > 70 
                      ? 'bg-amber-500' 
                      : ph.percentage > 30 
                        ? 'bg-teal-500' 
                        : 'bg-slate-200'
                  }`}
                  style={{ height: `${Math.max(10, ph.percentage)}%` }}
                />
                <span className="text-[9px] text-slate-400 font-mono">{ph.hourLabel}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Horas Punta Detectadas:</span>
            <p>• <strong>09:00 AM - 11:30 AM:</strong> Pico de clientes antes de ir al trabajo o entrega matutina.</p>
            <p>• <strong>17:00 PM - 19:30 PM:</strong> Pico de recojos y recepciones de camino a casa.</p>
          </div>
        </div>

      </div>

      {/* Payment Methods Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Distribución de Medios de Pago</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {paymentBreakdown.map((pm) => (
            <div key={pm.name} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-xs font-bold text-slate-700 block">{pm.name}</span>
              <span className="text-base font-black text-slate-900 font-mono block mt-1">
                S/ {pm.amount.toFixed(2)}
              </span>
              <span className="text-[10px] text-teal-600 font-bold block mt-0.5">
                {pm.percentage}% del total
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
