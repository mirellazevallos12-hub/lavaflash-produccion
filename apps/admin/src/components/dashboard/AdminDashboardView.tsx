import { HistoricalModule } from '../reports/HistoricalModule';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { Order, Expense, Customer, PaymentMethod, ServiceCategory, OrderStatus, ExpenseCategory, MonthlyFixedExpense } from '../../types';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, 
  Filter, Clock, ArrowUpRight, ArrowDownRight, ArrowRightLeft, 
  Sparkles, CheckCircle2, AlertTriangle, Users, Shirt, Scale, 
  PieChart, RefreshCw, Printer, ShieldCheck, Tag, Layers, 
  Smartphone, Wallet, CreditCard, ChevronRight, UserCheck, Building
} from 'lucide-react';

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export const AdminDashboardView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<MonthlyFixedExpense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Temporal Date Filters
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [dayFrom, setDayFrom] = useState<string>('TODOS');
  const [dayTo, setDayTo] = useState<string>('TODOS');

  // Direct Date Range Pickers (YYYY-MM-DD)
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const loadData = () => {
    setOrders(db.getOrders());
    setExpenses(db.getExpenses());
    setFixedExpenses(db.getFixedExpenses());
    setCustomers(db.getCustomers());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  // Determine available years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());

    orders.forEach(o => {
      const y = new Date(o.receivedAt).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    expenses.forEach(e => {
      const y = new Date(e.createdAt).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders, expenses]);

  // Compute max days for selected month & year
  const daysInSelectedMonth = useMemo(() => {
    if (selectedMonth === 'TODOS') return 31;
    const y = selectedYear !== 'TODOS' ? parseInt(selectedYear, 10) : new Date().getFullYear();
    const m = parseInt(selectedMonth, 10);
    return new Date(y, m, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Date matcher function supporting Year, Month, Day Range (from day X to day Y) and Date Pickers
  const matchesDateFilter = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    // Direct Calendar range filter
    if (customStartDate && customEndDate) {
      const t = d.getTime();
      const start = new Date(`${customStartDate}T00:00:00`).getTime();
      const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
      return t >= start && t <= end;
    }

    const y = d.getFullYear().toString();
    const m = (d.getMonth() + 1).toString();
    const day = d.getDate();

    if (selectedYear !== 'TODOS' && y !== selectedYear) return false;
    if (selectedMonth !== 'TODOS' && m !== selectedMonth) return false;

    // Day Range evaluation (de qué día a qué día)
    if (dayFrom !== 'TODOS') {
      const fromVal = parseInt(dayFrom, 10);
      if (day < fromVal) return false;
    }
    if (dayTo !== 'TODOS') {
      const toVal = parseInt(dayTo, 10);
      if (day > toVal) return false;
    }

    return true;
  };

  // Base filtered orders and expenses
  const periodOrders = useMemo(() => {
    return orders.filter(o => matchesDateFilter(o.receivedAt));
  }, [orders, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => matchesDateFilter(e.createdAt));
  }, [expenses, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  // Extract all payments received in this period
  const periodPayments = useMemo(() => {
    const list: { amount: number; paymentMethod: PaymentMethod; createdAt: string; orderCode: string }[] = [];
    orders.forEach(o => {
      if (o.payments && Array.isArray(o.payments)) {
        o.payments.forEach(p => {
          if (matchesDateFilter(p.createdAt)) {
            list.push({
              amount: p.amount,
              paymentMethod: p.paymentMethod,
              createdAt: p.createdAt,
              orderCode: o.code
            });
          }
        });
      }
    });
    return list;
  }, [orders, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  // Financial KPIs
  const totalRevenue = useMemo(() => {
    return periodOrders.reduce((sum, o) => sum + o.total, 0);
  }, [periodOrders]);

  const totalCollected = useMemo(() => {
    return periodPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [periodPayments]);

  const totalPendingReceivable = useMemo(() => {
    return periodOrders.reduce((sum, o) => sum + o.pendingBalance, 0);
  }, [periodOrders]);

  const totalDailyExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [periodExpenses]);

  // Fixed expenses in period
  const periodFixedExpenses = useMemo(() => {
    return fixedExpenses.filter(fix => {
      if (selectedYear !== 'TODOS' && fix.year.toString() !== selectedYear) return false;
      if (selectedMonth !== 'TODOS' && fix.month.toString() !== selectedMonth) return false;
      return true;
    });
  }, [fixedExpenses, selectedYear, selectedMonth]);

  const totalFixedExpenses = useMemo(() => {
    return periodFixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  }, [periodFixedExpenses]);

  const totalFixedPaid = useMemo(() => {
    return periodFixedExpenses.filter(f => f.status === 'PAGADO').reduce((sum, f) => sum + f.amount, 0);
  }, [periodFixedExpenses]);

  const totalExpenses = totalDailyExpenses + totalFixedPaid;

  const netOperatingProfit = totalCollected - totalExpenses;
  const profitMarginPercent = totalCollected > 0 ? Math.round((netOperatingProfit / totalCollected) * 100) : 0;
  const averageTicket = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0;

  // Total items and kilos processed
  const totalItemsCount = useMemo(() => {
    return periodOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, itm) => s + (itm.category === 'AL_PESO' ? 1 : itm.quantity), 0);
    }, 0);
  }, [periodOrders]);

  const totalWeightKilos = useMemo(() => {
    return periodOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, itm) => s + (itm.weightKg || (itm.category === 'AL_PESO' ? itm.quantity : 0)), 0);
    }, 0);
  }, [periodOrders]);

  // Category Profitability Analysis
  const categoryStats = useMemo(() => {
    const stats: Record<ServiceCategory, { label: string; count: number; totalRevenue: number }> = {
      AL_SECO: { label: 'Lavado al Seco (Ternos, Vestidos, Abrigos)', count: 0, totalRevenue: 0 },
      AL_PESO: { label: 'Ropa al Peso & Edredones (kg)', count: 0, totalRevenue: 0 },
      ALFOMBRAS: { label: 'Alfombras Sintéticas y Lana (m²)', count: 0, totalRevenue: 0 },
      TENIDO: { label: 'Teñido Textil (Jeans, Casacas)', count: 0, totalRevenue: 0 },
      PLANCHADO: { label: 'Planchado a Vapor y Camisas', count: 0, totalRevenue: 0 },
      ADICIONALES: { label: 'Desmanchado & Empaque al Vacío', count: 0, totalRevenue: 0 },
      MUEBLES: { label: 'Lavado de Muebles & Tapicería', count: 0, totalRevenue: 0 },
    };

    periodOrders.forEach(order => {
      order.items.forEach(item => {
        if (stats[item.category]) {
          stats[item.category].count += (item.category === 'AL_PESO' ? 1 : item.quantity);
          stats[item.category].totalRevenue += item.subtotal;
        }
      });
    });

    return Object.entries(stats)
      .map(([key, data]) => ({ key: key as ServiceCategory, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [periodOrders]);

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<PaymentMethod, number> = {
      EFECTIVO: 0,
      YAPE: 0,
      PLIN: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0
    };

    periodPayments.forEach(p => {
      if (methods[p.paymentMethod] !== undefined) {
        methods[p.paymentMethod] += p.amount;
      }
    });

    const sum = Object.values(methods).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(methods).map(([name, amount]) => ({
      name: name as PaymentMethod,
      amount,
      percentage: Math.round((amount / sum) * 100)
    }));
  }, [periodPayments]);

  // Order Status Distribution
  const statusStats = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      RECIBIDO: 0,
      EN_LAVADO: 0,
      EN_SECADO: 0,
      EN_CONTROL_CALIDAD: 0,
      LISTO_PARA_ENTREGA: 0,
      ENTREGADO: 0,
      ENTREGA_PARCIAL: 0
    };

    periodOrders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    return counts;
  }, [periodOrders]);

  // Daily Sales Bar Chart Evolution within Filtered Period
  const dailySalesTimeline = useMemo(() => {
    const dailyMap: Record<string, { label: string; dateStr: string; revenue: number; collected: number; count: number }> = {};

    periodOrders.forEach(o => {
      const d = new Date(o.receivedAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const dayLabel = `${d.getDate()} ${MONTHS[d.getMonth()]?.label.slice(0, 3)}`;

      if (!dailyMap[key]) {
        dailyMap[key] = { label: dayLabel, dateStr: key, revenue: 0, collected: 0, count: 0 };
      }
      dailyMap[key].revenue += o.total;
      dailyMap[key].collected += o.totalPaid;
      dailyMap[key].count += 1;
    });

    const sorted = Object.values(dailyMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    const maxRev = Math.max(...sorted.map(s => s.revenue), 1);

    return sorted.map(item => ({
      ...item,
      percentage: Math.round((item.revenue / maxRev) * 100)
    }));
  }, [periodOrders]);

  // Top Customers in Period
  const topCustomers = useMemo(() => {
    const custMap: Record<string, { name: string; document: string; phone: string; totalSpent: number; ordersCount: number }> = {};

    periodOrders.forEach(o => {
      if (!custMap[o.customerId]) {
        custMap[o.customerId] = {
          name: o.customerName,
          document: o.customerDocument,
          phone: o.customerPhone,
          totalSpent: 0,
          ordersCount: 0
        };
      }
      custMap[o.customerId].totalSpent += o.total;
      custMap[o.customerId].ordersCount += 1;
    });

    return Object.values(custMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [periodOrders]);

  // Expenses Breakdown by Category in Period
  const expensesByCategory = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      INSUMOS_LIMPIEZA: 0,
      REFRIGERIO_PERSONAL: 0,
      DELIVERY_COMBUSTIBLE: 0,
      SERVICIOS_LUZ_AGUA: 0,
      MANTENIMIENTO_MAQUINAS: 0,
      OTROS: 0
    };

    periodExpenses.forEach(e => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount;
      }
    });

    const labels: Record<ExpenseCategory, string> = {
      INSUMOS_LIMPIEZA: 'Detergentes & Insumos Químicos',
      REFRIGERIO_PERSONAL: 'Alimentación & Refrigerio',
      DELIVERY_COMBUSTIBLE: 'Combustible & Pasajes Delivery',
      SERVICIOS_LUZ_AGUA: 'Servicios Básicos (Luz/Agua)',
      MANTENIMIENTO_MAQUINAS: 'Mantenimiento de Lavadoras/Calderas',
      OTROS: 'Otros Gastos Menores'
    };

    return Object.entries(map)
      .filter(([_, val]) => val > 0)
      .map(([cat, amount]) => ({
        category: cat as ExpenseCategory,
        label: labels[cat as ExpenseCategory] || cat,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses]);

  // Filter Presets Handlers
  const handleSetToday = () => {
    const d = new Date();
    setSelectedYear(d.getFullYear().toString());
    setSelectedMonth((d.getMonth() + 1).toString());
    const dayStr = d.getDate().toString();
    setDayFrom(dayStr);
    setDayTo(dayStr);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSetLast7Days = () => {
    const dEnd = new Date();
    const dStart = new Date();
    dStart.setDate(dEnd.getDate() - 6);

    const fmt = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    setCustomStartDate(fmt(dStart));
    setCustomEndDate(fmt(dEnd));
    setSelectedYear('TODOS');
    setSelectedMonth('TODOS');
    setDayFrom('TODOS');
    setDayTo('TODOS');
  };

  const handleSetFirstFortnight = () => {
    const d = new Date();
    setSelectedYear(selectedYear === 'TODOS' ? d.getFullYear().toString() : selectedYear);
    setSelectedMonth(selectedMonth === 'TODOS' ? (d.getMonth() + 1).toString() : selectedMonth);
    setDayFrom('1');
    setDayTo('15');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSetSecondFortnight = () => {
    const d = new Date();
    const y = selectedYear === 'TODOS' ? d.getFullYear().toString() : selectedYear;
    const m = selectedMonth === 'TODOS' ? (d.getMonth() + 1).toString() : selectedMonth;
    const maxDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();

    setSelectedYear(y);
    setSelectedMonth(m);
    setDayFrom('16');
    setDayTo(maxDay.toString());
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSetThisMonth = () => {
    const d = new Date();
    setSelectedYear(d.getFullYear().toString());
    setSelectedMonth((d.getMonth() + 1).toString());
    setDayFrom('TODOS');
    setDayTo('TODOS');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSetLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedYear(d.getFullYear().toString());
    setSelectedMonth((d.getMonth() + 1).toString());
    setDayFrom('TODOS');
    setDayTo('TODOS');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSetThisYear = () => {
    const d = new Date();
    setSelectedYear(d.getFullYear().toString());
    setSelectedMonth('TODOS');
    setDayFrom('TODOS');
    setDayTo('TODOS');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleResetFilters = () => {
    setSelectedYear('TODOS');
    setSelectedMonth('TODOS');
    setDayFrom('TODOS');
    setDayTo('TODOS');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const isFilterActive = selectedYear !== 'TODOS' || selectedMonth !== 'TODOS' || dayFrom !== 'TODOS' || dayTo !== 'TODOS' || !!customStartDate || !!customEndDate;

  // Human-readable Filter Label
  const filterDescription = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `Rango del ${customStartDate} al ${customEndDate}`;
    }
    if (!isFilterActive) {
      return 'Consolidado Histórico Completo';
    }

    const monthObj = MONTHS.find(m => m.value === selectedMonth);
    const monthName = monthObj ? monthObj.label : '';

    if (dayFrom !== 'TODOS' && dayTo !== 'TODOS') {
      if (dayFrom === dayTo) {
        return `Día ${dayFrom} de ${monthName || 'cada mes'}${selectedYear !== 'TODOS' ? ` de ${selectedYear}` : ''}`;
      }
      return `Del Día ${dayFrom} al Día ${dayTo} de ${monthName || 'cada mes'}${selectedYear !== 'TODOS' ? ` de ${selectedYear}` : ''}`;
    }
    if (dayFrom !== 'TODOS') {
      return `A partir del Día ${dayFrom} de ${monthName || 'cada mes'}${selectedYear !== 'TODOS' ? ` de ${selectedYear}` : ''}`;
    }
    if (dayTo !== 'TODOS') {
      return `Hasta el Día ${dayTo} de ${monthName || 'cada mes'}${selectedYear !== 'TODOS' ? ` de ${selectedYear}` : ''}`;
    }
    if (selectedYear !== 'TODOS' && selectedMonth !== 'TODOS') {
      return `Mes de ${monthName} de ${selectedYear}`;
    }
    if (selectedMonth !== 'TODOS') {
      return `Todos los meses de ${monthName}`;
    }
    return `Todo el Año ${selectedYear}`;
  }, [isFilterActive, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      <HistoricalModule context="dashboard" />
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-teal-600" />
              <span>Dashboard Ejecutivo &amp; Inteligencia de Negocio</span>
            </h1>
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-800 px-2 py-0.5 rounded-full border border-teal-500/30">
              Admin Suite
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control de facturación, rentabilidad por línea, cobranzas, flujo de caja y KPIs con filtros por Año, Mes y Rango de Días.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Informe</span>
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR: AÑO, MES, DÍAS (DE QUÉ DÍA A QUÉ DÍA) Y CALENDARIO */}
      <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Filtro Temporal del Dashboard</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  Año • Mes • De qué Día a qué Día
                </span>
              </span>
              <span className="text-[11px] text-slate-500 block">
                Seleccione el año, mes y el rango exacto de días (ej. día 1 al 15) o use el selector de fechas.
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              🟢 Hoy
            </button>
            <button
              type="button"
              onClick={handleSetLast7Days}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              ⚡ Últimos 7 Días
            </button>
            <button
              type="button"
              onClick={handleSetFirstFortnight}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              1ra Quincena (1 - 15)
            </button>
            <button
              type="button"
              onClick={handleSetSecondFortnight}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              2da Quincena (16 - Fin)
            </button>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              📅 Este Mes
            </button>
            <button
              type="button"
              onClick={handleSetLastMonth}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={handleSetThisYear}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              📆 Este Año
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                !isFilterActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🌐 Histórico Completo
            </button>
          </div>
        </div>

        {/* Detailed Controls: Año, Mes, Día Desde, Día Hasta, Calendario Rango */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* 1. Año */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>AÑO:</span>
              {selectedYear !== 'TODOS' && <span className="text-[10px] text-teal-600 font-semibold">Activo</span>}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
            >
              <option value="TODOS">Todos los Años</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr.toString()}>Año {yr}</option>
              ))}
            </select>
          </div>

          {/* 2. Mes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>MES:</span>
              {selectedMonth !== 'TODOS' && <span className="text-[10px] text-teal-600 font-semibold">Activo</span>}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
            >
              <option value="TODOS">Todos los Meses (1 - 12)</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>Mes {m.value.padStart(2, '0')} - {m.label}</option>
              ))}
            </select>
          </div>

          {/* 3. Día Desde (De qué día...) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>DÍA DESDE:</span>
              {dayFrom !== 'TODOS' && <span className="text-[10px] text-teal-600 font-semibold">Día {dayFrom}</span>}
            </label>
            <select
              value={dayFrom}
              onChange={(e) => {
                const val = e.target.value;
                setDayFrom(val);
                if (val !== 'TODOS' && dayTo !== 'TODOS' && parseInt(val, 10) > parseInt(dayTo, 10)) {
                  setDayTo(val);
                }
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
            >
              <option value="TODOS">Desde Día 1 (Inicio)</option>
              {Array.from({ length: daysInSelectedMonth }, (_, idx) => idx + 1).map(day => (
                <option key={day} value={day.toString()}>Día {day.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>

          {/* 4. Día Hasta (...a qué día) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>DÍA HASTA:</span>
              {dayTo !== 'TODOS' && <span className="text-[10px] text-teal-600 font-semibold">Día {dayTo}</span>}
            </label>
            <select
              value={dayTo}
              onChange={(e) => {
                const val = e.target.value;
                setDayTo(val);
                if (val !== 'TODOS' && dayFrom !== 'TODOS' && parseInt(val, 10) < parseInt(dayFrom, 10)) {
                  setDayFrom(val);
                }
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
            >
              <option value="TODOS">Hasta Día {daysInSelectedMonth} (Fin)</option>
              {Array.from({ length: daysInSelectedMonth }, (_, idx) => idx + 1).map(day => (
                <option key={day} value={day.toString()}>Día {day.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>

          {/* 5. Selector de Fecha Calendario Desde / Hasta */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>CALENDARIO RANGO:</span>
              <span className="text-[10px] text-slate-400">Directo</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Desde"
                className="w-1/2 px-2 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                title="Fecha Desde"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="Hasta"
                className="w-1/2 px-2 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                title="Fecha Hasta"
              />
            </div>
          </div>
        </div>

        {/* Current Active Filter Indicator Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Periodo filtrado:</span>
            <span className="font-bold text-teal-950 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{filterDescription}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[11px]">
              Analizando: <strong className="text-slate-900">{periodOrders.length} órdenes</strong>, <strong className="text-slate-900">{periodPayments.length} cobros</strong> y <strong className="text-slate-900">{periodExpenses.length} egresos</strong>
            </span>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-rose-600 hover:text-rose-800 font-bold underline text-[11px] cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 EXECUTIVE FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs">
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ventas (Facturación)</span>
            <ArrowUpRight className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-xl font-black text-slate-900 font-mono block">
            S/ {totalRevenue.toFixed(2)}
          </span>
          <span className="text-[10px] text-teal-600 font-semibold block">
            {periodOrders.length} órdenes registradas
          </span>
        </div>

        {/* KPI 2: Total Cobrado */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos Cobrados</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-800 font-mono block">
            + S/ {totalCollected.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {periodPayments.length} abonos recibidos
          </span>
        </div>

        {/* KPI 3: Egresos Operativos y Fijos */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Egresos Totales</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl font-black text-rose-700 font-mono block">
            - S/ {totalExpenses.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block truncate" title={`Diarios: S/ ${totalDailyExpenses.toFixed(2)} | Fijos Pagados: S/ ${totalFixedPaid.toFixed(2)}`}>
            Diarios: S/ {totalDailyExpenses.toFixed(0)} • Fijos: S/ {totalFixedPaid.toFixed(0)}
          </span>
        </div>

        {/* KPI 4: Utilidad Operativa Neta */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          netOperatingProfit >= 0 
            ? 'bg-teal-50/70 border-teal-200 text-teal-950' 
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">Utilidad Neta</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              netOperatingProfit >= 0 ? 'bg-teal-200 text-teal-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {profitMarginPercent}%
            </span>
          </div>
          <span className={`text-xl font-black font-mono block ${
            netOperatingProfit >= 0 ? 'text-teal-900' : 'text-rose-700'
          }`}>
            S/ {netOperatingProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-600 block">
            Cobrado - Egresos
          </span>
        </div>

        {/* KPI 5: Cuentas por Cobrar (Fiado) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Por Cobrar (Fiado)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 font-mono block">
            S/ {totalPendingReceivable.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Saldo pendiente al recojo
          </span>
        </div>

        {/* KPI 6: Ticket Promedio */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-xl font-black text-indigo-700 font-mono block">
            S/ {averageTicket.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {totalItemsCount} prendas • {totalWeightKilos.toFixed(1)} kg
          </span>
        </div>
      </div>

      {/* DAILY SALES EVOLUTION BAR CHART */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Evolución Diaria de Ventas y Cobranzas en el Periodo Filtrado</span>
            </h3>
            <p className="text-xs text-slate-500">Comportamiento día a día de las órdenes recibidas en mostrador</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            {dailySalesTimeline.length} día(s) con actividad comercial
          </span>
        </div>

        {dailySalesTimeline.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No hay movimientos comerciales en las fechas seleccionadas.</p>
            <p className="text-xs text-slate-400 mt-0.5">Pruebe ampliando el rango de días o seleccionando otro mes/año.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-2 items-end h-44 border-b border-slate-200 pb-3">
              {dailySalesTimeline.slice(0, 24).map((d) => (
                <div key={d.dateStr} className="flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-1 rounded shadow-sm whitespace-nowrap">
                    S/ {d.revenue.toFixed(0)}
                  </div>
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    {/* Revenue Bar */}
                    <div
                      className="w-1/2 bg-teal-500 hover:bg-teal-600 rounded-t-md transition-all cursor-pointer"
                      style={{ height: `${Math.max(12, d.percentage)}%` }}
                      title={`${d.dateStr}: Ventas S/ ${d.revenue.toFixed(2)} (${d.count} órdenes)`}
                    />
                    {/* Collected Bar */}
                    <div
                      className="w-1/2 bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all cursor-pointer"
                      style={{ height: `${Math.max(8, Math.round((d.collected / (dailySalesTimeline[0]?.revenue || 1)) * 100))}%` }}
                      title={`${d.dateStr}: Cobrado S/ ${d.collected.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono font-bold truncate max-w-full text-center">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
                  Ventas Facturadas
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
                  Cobranza Efectiva
                </span>
              </div>
              <span className="font-mono text-[11px]">
                Promedio diario: S/ {(totalRevenue / Math.max(dailySalesTimeline.length, 1)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2 COLUMN ANALYTICS: SERVICES RANKING & PAYMENT METHODS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Servicios Más Rentables (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Líneas de Servicio Más Rentables</h3>
                <p className="text-xs text-slate-500">Ranking por facturación aportada en el periodo</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              S/ {totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((item, idx) => {
              const maxCatRevenue = categoryStats[0]?.totalRevenue || 1;
              const barWidth = Math.round((item.totalRevenue / maxCatRevenue) * 100);
              const sharePercent = totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100) : 0;

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({item.count} prendas/uds)
                      </span>
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      S/ {item.totalRevenue.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">({sharePercent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-teal-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-cyan-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(item.totalRevenue > 0 ? 5 : 0, barWidth)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Distribución por Medios de Pago & Estado de Flujo (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Medios de Pago */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Medios de Pago Cobrados
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">
                Total: S/ {totalCollected.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {paymentBreakdown.map((pm) => (
                <div key={pm.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    {pm.name === 'EFECTIVO' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    {pm.name === 'YAPE' && <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                    {pm.name === 'PLIN' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />}
                    {pm.name === 'TARJETA' && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    {pm.name === 'TRANSFERENCIA' && <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />}
                    <span className="font-bold text-slate-700">{pm.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      S/ {pm.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-teal-600 font-bold ml-1.5 font-mono">
                      ({pm.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estado Operativo del Flujo */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Estado Operativo de las Órdenes</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Recibidas</span>
                <span className="text-base font-black text-slate-900 font-mono">{statusStats.RECIBIDO}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">En Lavado</span>
                <span className="text-base font-black text-blue-900 font-mono">{statusStats.EN_LAVADO}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
                <span className="text-[10px] text-cyan-700 uppercase font-bold block">En Secado</span>
                <span className="text-base font-black text-cyan-900 font-mono">{statusStats.EN_SECADO}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">En Control Calidad</span>
                <span className="text-base font-black text-amber-900 font-mono">{statusStats.EN_CONTROL_CALIDAD}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                <span className="text-[10px] text-teal-700 uppercase font-bold block">Listas para Entrega</span>
                <span className="text-base font-black text-teal-900 font-mono">{statusStats.LISTO_PARA_ENTREGA}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Entregadas</span>
                <span className="text-base font-black text-emerald-900 font-mono">{statusStats.ENTREGADO}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: TOP CLIENTES & GASTOS OPERATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Clientes del Periodo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Top Clientes Más Frecuentes en el Periodo
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">Ranking por consumo</span>
          </div>

          {topCustomers.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No hay clientes registrados en el periodo seleccionado
            </div>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 font-black text-[10px] flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.document} • Tel: {c.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 block">S/ {c.totalSpent.toFixed(2)}</span>
                    <span className="text-[10px] text-teal-600 font-semibold">{c.ordersCount} orden(es)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Egresos Detallados por Categoría en el Periodo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Estructura de Gastos Operativos
              </h3>
            </div>
            <span className="text-[11px] font-mono text-rose-600 font-bold">
              Total: -S/ {totalExpenses.toFixed(2)}
            </span>
          </div>

          {expensesByCategory.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No hay gastos registrados en el periodo seleccionado
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {expensesByCategory.map((exp, i) => {
                const perc = totalExpenses > 0 ? Math.round((exp.amount / totalExpenses) * 100) : 0;
                return (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      <span className="font-semibold text-slate-800">{exp.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-700">S/ {exp.amount.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5 font-bold">({perc}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
