import { HistoricalModule } from '../reports/HistoricalModule';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { 
  CashRegisterShift, Expense, ExpenseCategory, Order, 
  PaymentMethod, PaymentTransaction, MonthlyFixedExpense, FixedExpenseCategory 
} from '../../types';
import { 
  DollarSign, ArrowDownRight, ArrowUpRight, Lock, 
  Unlock, Calculator, Receipt, ShieldAlert, CheckCircle2, 
  AlertTriangle, History, Plus, FileSpreadsheet, EyeOff, Eye,
  Calendar, Filter, RefreshCw, Search, Wallet, CreditCard, 
  Smartphone, Building, TrendingUp, TrendingDown, ArrowRightLeft,
  Clock, User, Check, Layers, Sparkles, Coins, Zap, Droplets,
  Edit2, Trash2, CheckCircle, XCircle, Info, CalendarDays, CheckCheck, ChevronRight
} from 'lucide-react';

interface EnrichedPayment extends PaymentTransaction {
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  customerDocument?: string;
  voucherType?: string;
  voucherNumber?: string;
}

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

export const FIXED_CATEGORY_CONFIG: Record<FixedExpenseCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  ALQUILER_LOCAL: { label: 'Alquiler de Local', icon: Building, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  LUZ_ELECTRICA: { label: 'Luz Eléctrica Comercial', icon: Zap, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  AGUA_SEDAPAL: { label: 'Agua Potable Sedapal', icon: Droplets, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  PLANILLA_SUELDOS: { label: 'Planilla y Sueldos', icon: User, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  INTERNET_TELEFONIA: { label: 'Internet y Telefonía', icon: Smartphone, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  MANTENIMIENTO_MAQUINARIA: { label: 'Mantenimiento Preventivo', icon: RefreshCw, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  CONTABILIDAD_ASESORIA: { label: 'Asesoría Contable / SUNAT', icon: FileSpreadsheet, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ARBITRIOS_MUNICIPALES: { label: 'Arbitrios y Licencias', icon: ShieldAlert, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  ALQUILER_POS_SISTEMA: { label: 'Alquiler Terminales POS', icon: CreditCard, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  PUBLICIDAD_MARKETING: { label: 'Publicidad y Marketing', icon: Sparkles, color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  OTROS_FIJOS: { label: 'Otros Gastos Fijos', icon: Layers, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

export const CashRegisterView: React.FC = () => {
  const [shifts, setShifts] = useState<CashRegisterShift[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<MonthlyFixedExpense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeShift, setActiveShift] = useState<CashRegisterShift | undefined>(undefined);

  // Active Tab: 'RESUMEN' | 'INGRESOS' | 'EGRESOS' | 'GASTOS_FIJOS' | 'TURNOS'
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'INGRESOS' | 'EGRESOS' | 'GASTOS_FIJOS' | 'TURNOS'>('RESUMEN');

  // Temporal Date Filters (Año, Mes, Rango de Días: De qué día a qué día)
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [dayFrom, setDayFrom] = useState<string>('TODOS');
  const [dayTo, setDayTo] = useState<string>('TODOS');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sub-filters for Ingresos
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeMethodFilter, setIncomeMethodFilter] = useState<'TODOS' | PaymentMethod>('TODOS');

  // Sub-filters for Egresos Diarios
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'TODOS' | ExpenseCategory>('TODOS');

  // Sub-filters for Gastos Fijos Mensuales
  const [fixedStatusFilter, setFixedStatusFilter] = useState<'TODOS' | 'PAGADO' | 'PENDIENTE'>('TODOS');
  const [fixedCategoryFilter, setFixedCategoryFilter] = useState<'TODOS' | FixedExpenseCategory>('TODOS');
  const [fixedSearch, setFixedSearch] = useState('');
  const [fixedMonthFilter, setFixedMonthFilter] = useState<string>('TODOS');
  const [fixedYearFilter, setFixedYearFilter] = useState<string>('TODOS');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFixedExpenseModal, setShowFixedExpenseModal] = useState(false);
  const [editingFixedExpense, setEditingFixedExpense] = useState<MonthlyFixedExpense | null>(null);
  const [showPayFixedModal, setShowPayFixedModal] = useState(false);
  const [targetFixedToPay, setTargetFixedToPay] = useState<MonthlyFixedExpense | null>(null);
  const [payFixedMethod, setPayFixedMethod] = useState<MonthlyFixedExpense['paymentMethod']>('TRANSFERENCIA');
  const [payFixedReceipt, setPayFixedReceipt] = useState('');
  const [showBlindAuditModal, setShowBlindAuditModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);

  // New Daily Expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('INSUMOS_LIMPIEZA');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');

  // New/Edit Fixed Expense form
  const [fixedConcept, setFixedConcept] = useState('');
  const [fixedCategory, setFixedCategory] = useState<FixedExpenseCategory>('ALQUILER_LOCAL');
  const [fixedMonth, setFixedMonth] = useState<number>(new Date().getMonth() + 1);
  const [fixedYear, setFixedYear] = useState<number>(new Date().getFullYear());
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedDueDate, setFixedDueDate] = useState('');
  const [fixedSupplier, setFixedSupplier] = useState('');
  const [fixedIsRecurring, setFixedIsRecurring] = useState(true);
  const [fixedNotes, setFixedNotes] = useState('');
  const [fixedInitialStatus, setFixedInitialStatus] = useState<'PENDIENTE' | 'PAGADO'>('PENDIENTE');
  const [fixedFormPayMethod, setFixedFormPayMethod] = useState<MonthlyFixedExpense['paymentMethod']>('TRANSFERENCIA');
  const [fixedFormReceipt, setFixedFormReceipt] = useState('');

  // Open shift form
  const [initialCashInput, setInitialCashInput] = useState('150.00');

  // Blind Count State (Arqueo Ciego)
  const [blindCount, setBlindCount] = useState({
    bills100: 0,
    bills50: 0,
    bills20: 0,
    bills10: 0,
    coins5: 0,
    coins2: 0,
    coins1: 0,
    coins050: 0,
    coins020: 0,
    coins010: 0,
  });
  const [auditNotes, setAuditNotes] = useState('');
  const [auditResultShift, setAuditResultShift] = useState<CashRegisterShift | null>(null);

  const loadData = () => {
    setShifts(db.getShifts());
    setExpenses(db.getExpenses());
    setFixedExpenses(db.getFixedExpenses());
    setActiveShift(db.getActiveShift());
    setOrders(db.getOrders());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  // Extract all income payments from orders
  const allIncomes = useMemo<EnrichedPayment[]>(() => {
    const list: EnrichedPayment[] = [];
    orders.forEach(o => {
      if (o.payments && Array.isArray(o.payments)) {
        o.payments.forEach(p => {
          list.push({
            ...p,
            orderCode: o.code,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerDocument: o.customerDocument,
            voucherType: o.voucherType,
            voucherNumber: o.voucherNumber
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  // Compute declared cash from blind count
  const declaredTotal = (
    (blindCount.bills100 * 100) +
    (blindCount.bills50 * 50) +
    (blindCount.bills20 * 20) +
    (blindCount.bills10 * 10) +
    (blindCount.coins5 * 5) +
    (blindCount.coins2 * 2) +
    (blindCount.coins1 * 1) +
    (blindCount.coins050 * 0.50) +
    (blindCount.coins020 * 0.20) +
    (blindCount.coins010 * 0.10)
  );

  // Determine available years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentY = new Date().getFullYear();
    yearsSet.add(currentY);

    allIncomes.forEach(i => {
      const y = new Date(i.createdAt).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    expenses.forEach(e => {
      const y = new Date(e.createdAt).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    shifts.forEach(s => {
      const y = new Date(s.openedAt).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    fixedExpenses.forEach(f => {
      if (f.year) yearsSet.add(f.year);
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allIncomes, expenses, shifts, fixedExpenses]);

  // Compute max days for selected month & year
  const daysInSelectedMonth = useMemo(() => {
    if (selectedMonth === 'TODOS') return 31;
    const y = selectedYear !== 'TODOS' ? parseInt(selectedYear, 10) : new Date().getFullYear();
    const m = parseInt(selectedMonth, 10);
    return new Date(y, m, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Date matcher function supporting Year, Month, Day Range (de qué día a qué día) and Calendar range
  const matchesDateFilter = (dateStr?: string) => {
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

  // Base filtered lists by date
  const periodIncomes = useMemo(() => {
    return allIncomes.filter(inc => matchesDateFilter(inc.createdAt));
  }, [allIncomes, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(exp => matchesDateFilter(exp.createdAt));
  }, [expenses, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  const periodShifts = useMemo(() => {
    return shifts.filter(sh => matchesDateFilter(sh.openedAt));
  }, [shifts, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  // Financial aggregates for the filtered period
  const totalPeriodIncome = useMemo(() => {
    return periodIncomes.reduce((sum, p) => sum + p.amount, 0);
  }, [periodIncomes]);

  const totalPeriodExpense = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [periodExpenses]);

  const netPeriodBalance = totalPeriodIncome - totalPeriodExpense;

  const cashIncome = useMemo(() => {
    return periodIncomes.filter(p => p.paymentMethod === 'EFECTIVO').reduce((sum, p) => sum + p.amount, 0);
  }, [periodIncomes]);

  const digitalIncome = totalPeriodIncome - cashIncome;

  const yapeIncome = useMemo(() => periodIncomes.filter(p => p.paymentMethod === 'YAPE').reduce((sum, p) => sum + p.amount, 0), [periodIncomes]);
  const plinIncome = useMemo(() => periodIncomes.filter(p => p.paymentMethod === 'PLIN').reduce((sum, p) => sum + p.amount, 0), [periodIncomes]);
  const cardIncome = useMemo(() => periodIncomes.filter(p => p.paymentMethod === 'TARJETA').reduce((sum, p) => sum + p.amount, 0), [periodIncomes]);
  const transferIncome = useMemo(() => periodIncomes.filter(p => p.paymentMethod === 'TRANSFERENCIA').reduce((sum, p) => sum + p.amount, 0), [periodIncomes]);

  // Search and sub-filtered lists for the tables
  const displayedIncomes = useMemo(() => {
    return periodIncomes.filter(inc => {
      if (incomeMethodFilter !== 'TODOS' && inc.paymentMethod !== incomeMethodFilter) return false;
      if (incomeSearch.trim()) {
        const q = incomeSearch.toLowerCase();
        const matchesCode = inc.orderCode.toLowerCase().includes(q);
        const matchesCust = inc.customerName.toLowerCase().includes(q);
        const matchesRef = (inc.referenceCode || '').toLowerCase().includes(q);
        const matchesCashier = (inc.cashierName || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesCust && !matchesRef && !matchesCashier) return false;
      }
      return true;
    });
  }, [periodIncomes, incomeMethodFilter, incomeSearch]);

  const displayedExpenses = useMemo(() => {
    return periodExpenses.filter(exp => {
      if (expenseCategoryFilter !== 'TODOS' && exp.category !== expenseCategoryFilter) return false;
      if (expenseSearch.trim()) {
        const q = expenseSearch.toLowerCase();
        const matchesDesc = exp.description.toLowerCase().includes(q);
        const matchesResp = exp.responsibleName.toLowerCase().includes(q);
        const matchesRcpt = (exp.receiptNumber || '').toLowerCase().includes(q);
        if (!matchesDesc && !matchesResp && !matchesRcpt) return false;
      }
      return true;
    });
  }, [periodExpenses, expenseCategoryFilter, expenseSearch]);

  // Effective Year and Month for Monthly Fixed Expenses
  const effectiveFixedYear = useMemo(() => {
    if (fixedYearFilter !== 'TODOS') return fixedYearFilter;
    if (selectedYear !== 'TODOS') return selectedYear;
    return new Date().getFullYear().toString();
  }, [fixedYearFilter, selectedYear]);

  const effectiveFixedMonth = useMemo(() => {
    if (fixedMonthFilter !== 'TODOS') return fixedMonthFilter;
    if (selectedMonth !== 'TODOS') return selectedMonth;
    return (new Date().getMonth() + 1).toString();
  }, [fixedMonthFilter, selectedMonth]);

  // Base list of fixed expenses for the period
  const periodFixedExpenses = useMemo(() => {
    return fixedExpenses.filter(fix => {
      if (effectiveFixedYear !== 'TODOS' && fix.year.toString() !== effectiveFixedYear) return false;
      if (effectiveFixedMonth !== 'TODOS' && fix.month.toString() !== effectiveFixedMonth) return false;
      return true;
    });
  }, [fixedExpenses, effectiveFixedYear, effectiveFixedMonth]);

  // Sub-filtered list for the table
  const displayedFixedExpenses = useMemo(() => {
    return periodFixedExpenses.filter(fix => {
      if (fixedStatusFilter !== 'TODOS' && fix.status !== fixedStatusFilter) return false;
      if (fixedCategoryFilter !== 'TODOS' && fix.category !== fixedCategoryFilter) return false;
      if (fixedSearch.trim()) {
        const q = fixedSearch.toLowerCase();
        const mConcept = fix.concept.toLowerCase().includes(q);
        const mSupplier = (fix.supplierName || '').toLowerCase().includes(q);
        const mReceipt = (fix.receiptNumber || '').toLowerCase().includes(q);
        const mNotes = (fix.notes || '').toLowerCase().includes(q);
        if (!mConcept && !mSupplier && !mReceipt && !mNotes) return false;
      }
      return true;
    });
  }, [periodFixedExpenses, fixedStatusFilter, fixedCategoryFilter, fixedSearch]);

  const totalFixedPeriod = useMemo(() => {
    return periodFixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  }, [periodFixedExpenses]);

  const totalFixedPaid = useMemo(() => {
    return periodFixedExpenses.filter(f => f.status === 'PAGADO').reduce((sum, f) => sum + f.amount, 0);
  }, [periodFixedExpenses]);

  const totalFixedPending = useMemo(() => {
    return periodFixedExpenses.filter(f => f.status === 'PENDIENTE').reduce((sum, f) => sum + f.amount, 0);
  }, [periodFixedExpenses]);

  const fixedPaidPercent = totalFixedPeriod > 0 ? Math.round((totalFixedPaid / totalFixedPeriod) * 100) : 0;

  // Real Net Operating Profit (Ingresos Totales - Gastos Diarios de Turno - Gastos Fijos Pagados)
  const realNetOperatingProfit = totalPeriodIncome - totalPeriodExpense - totalFixedPaid;

  // Preset filter helpers
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

  const handleSetAllTime = () => {
    setSelectedYear('TODOS');
    setSelectedMonth('TODOS');
    setDayFrom('TODOS');
    setDayTo('TODOS');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const isFilterActive = selectedYear !== 'TODOS' || selectedMonth !== 'TODOS' || dayFrom !== 'TODOS' || dayTo !== 'TODOS' || !!customStartDate || !!customEndDate;

  const filterDescription = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `Rango del ${customStartDate} al ${customEndDate}`;
    }
    if (!isFilterActive) {
      return 'Mostrando Histórico Completo de Caja';
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
    if (selectedYear !== 'TODOS') {
      return `Todo el Año ${selectedYear}`;
    }
    if (selectedMonth !== 'TODOS') {
      return `Todos los meses de ${monthName}`;
    }
    return `Periodo personalizado`;
  }, [isFilterActive, selectedYear, selectedMonth, dayFrom, dayTo, customStartDate, customEndDate]);

  const handleSingleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      setSelectedYear(parseInt(parts[0], 10).toString());
      setSelectedMonth(parseInt(parts[1], 10).toString());
      const d = parseInt(parts[2], 10).toString();
      setDayFrom(d);
      setDayTo(d);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) {
      alert('Ingrese un monto válido.');
      return;
    }
    if (!expenseDesc.trim()) {
      alert('Ingrese una descripción para el egreso.');
      return;
    }

    db.registerExpense({
      amount: amt,
      category: expenseCategory,
      description: expenseDesc.trim(),
      receiptNumber: expenseReceipt.trim() || undefined
    });

    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseReceipt('');
    setShowExpenseModal(false);
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const initial = parseFloat(initialCashInput) || 0;
    db.openShift(initial);
    setShowOpenShiftModal(false);
  };

  const handleExecuteBlindAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const countData = {
      ...blindCount,
      totalDeclared: Number(declaredTotal.toFixed(2))
    };

    const closed = db.executeBlindAuditAndCloseShift(activeShift.id, countData, auditNotes);
    if (closed) {
      setAuditResultShift(closed);
      setShowBlindAuditModal(false);
    }
  };

  // Fixed Expenses Handlers
  const handleOpenNewFixedModal = (presetMonth?: number, presetYear?: number) => {
    setEditingFixedExpense(null);
    setFixedConcept('');
    setFixedCategory('ALQUILER_LOCAL');
    const m = presetMonth || (effectiveFixedMonth !== 'TODOS' ? parseInt(effectiveFixedMonth, 10) : new Date().getMonth() + 1);
    const y = presetYear || (effectiveFixedYear !== 'TODOS' ? parseInt(effectiveFixedYear, 10) : new Date().getFullYear());
    setFixedMonth(m);
    setFixedYear(y);
    setFixedAmount('');
    setFixedDueDate(`${y}-${m.toString().padStart(2, '0')}-28`);
    setFixedSupplier('');
    setFixedIsRecurring(true);
    setFixedNotes('');
    setFixedInitialStatus('PENDIENTE');
    setFixedFormPayMethod('TRANSFERENCIA');
    setFixedFormReceipt('');
    setShowFixedExpenseModal(true);
  };

  const handleOpenEditFixedModal = (fix: MonthlyFixedExpense) => {
    setEditingFixedExpense(fix);
    setFixedConcept(fix.concept);
    setFixedCategory(fix.category);
    setFixedMonth(fix.month);
    setFixedYear(fix.year);
    setFixedAmount(fix.amount.toString());
    setFixedDueDate(fix.dueDate || '');
    setFixedSupplier(fix.supplierName || '');
    setFixedIsRecurring(fix.isRecurring);
    setFixedNotes(fix.notes || '');
    setFixedInitialStatus(fix.status);
    setFixedFormPayMethod(fix.paymentMethod || 'TRANSFERENCIA');
    setFixedFormReceipt(fix.receiptNumber || '');
    setShowFixedExpenseModal(true);
  };

  const handleSaveFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fixedAmount);
    if (!amt || amt <= 0) {
      alert('Ingrese un monto válido mayor a S/ 0.');
      return;
    }
    if (!fixedConcept.trim()) {
      alert('Ingrese el concepto o nombre del gasto fijo.');
      return;
    }

    const payload: Omit<MonthlyFixedExpense, 'id' | 'createdAt'> & { id?: string } = {
      ...(editingFixedExpense ? { id: editingFixedExpense.id } : {}),
      concept: fixedConcept.trim(),
      category: fixedCategory,
      month: fixedMonth,
      year: fixedYear,
      amount: amt,
      dueDate: fixedDueDate || undefined,
      status: fixedInitialStatus,
      supplierName: fixedSupplier.trim() || undefined,
      isRecurring: fixedIsRecurring,
      notes: fixedNotes.trim() || undefined,
      ...(fixedInitialStatus === 'PAGADO' ? {
        paidAt: editingFixedExpense?.paidAt || new Date().toISOString(),
        paymentMethod: fixedFormPayMethod,
        receiptNumber: fixedFormReceipt.trim() || undefined,
        paidBy: editingFixedExpense?.paidBy || 'Carlos Mendoza'
      } : {})
    };

    db.saveFixedExpense(payload);
    setShowFixedExpenseModal(false);
    setActionNotice(editingFixedExpense ? `Gasto fijo "${fixedConcept}" actualizado.` : `Gasto fijo "${fixedConcept}" registrado con éxito.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteFixed = (id: string, concept: string) => {
    if (window.confirm(`¿Está seguro de eliminar el gasto fijo "${concept}"?`)) {
      db.deleteFixedExpense(id);
      setActionNotice(`Gasto fijo "${concept}" eliminado.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleOpenPayFixedModal = (fix: MonthlyFixedExpense) => {
    setTargetFixedToPay(fix);
    setPayFixedMethod('TRANSFERENCIA');
    setPayFixedReceipt('');
    setShowPayFixedModal(true);
  };

  const handleConfirmPayFixed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFixedToPay) return;
    db.toggleFixedExpensePayment(targetFixedToPay.id, payFixedMethod, payFixedReceipt.trim() || undefined);
    setShowPayFixedModal(false);
    setActionNotice(`Pago registrado para "${targetFixedToPay.concept}" (${payFixedMethod}).`);
    setTargetFixedToPay(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRevertPayFixed = (id: string, concept: string) => {
    db.toggleFixedExpensePayment(id);
    setActionNotice(`El gasto fijo "${concept}" volvió al estado PENDIENTE.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleGenerateRecurring = () => {
    const m = effectiveFixedMonth !== 'TODOS' ? parseInt(effectiveFixedMonth, 10) : new Date().getMonth() + 1;
    const y = effectiveFixedYear !== 'TODOS' ? parseInt(effectiveFixedYear, 10) : new Date().getFullYear();
    const result = db.generateRecurringFixedExpenses(m, y);
    if (result.addedCount > 0) {
      setActionNotice(`¡Listo! Se generaron ${result.addedCount} gastos fijos recurrentes para ${MONTHS.find(mon => mon.value === m.toString())?.label} ${y}.`);
    } else {
      setActionNotice(`Los gastos fijos recurrentes de ${MONTHS.find(mon => mon.value === m.toString())?.label} ${y} ya estaban creados.`);
    }
    setTimeout(() => setActionNotice(null), 4500);
  };

  return (
    <div className="space-y-6">
      <HistoricalModule context="caja" />
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Gestión Integral de Caja, Ingresos y Egresos
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              Control Financiero
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtros por año, mes y día para ingresos, egresos, saldos en efectivo y arqueos de caja.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenNewFixedModal()}
            className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Registrar gastos fijos estructurales (Alquiler, Luz, Agua, Planillas, etc.)"
          >
            <Building className="w-4 h-4 text-purple-600" />
            <span>+ Gasto Fijo Mensual</span>
          </button>

          {activeShift ? (
            <>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Registrar gastos operativos menores descontados de la caja física del cajero"
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Gasto Diario (Caja Chica)</span>
              </button>
              <button
                onClick={() => setShowBlindAuditModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-teal-400" />
                <span>Corte de Turno (Arqueo)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Aperturar Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="bg-slate-900 text-white border border-teal-500/40 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* BARRA DE FILTRO POR AÑO, MES Y DÍA */}
      <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>Filtro de Fecha para Ingresos, Egresos y Caja</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  Año • Mes • Día
                </span>
              </span>
              <span className="text-[11px] text-slate-500 block">
                Selecciona cualquier combinación para ver movimientos específicos de caja.
              </span>
            </div>
          </div>


        </div>

        {/* 5 Dropdown Selectors: Año, Mes, Día Desde, Día Hasta, Calendario Rango */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Selector 1: Año */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>AÑO:</span>
              {selectedYear !== 'TODOS' && (
                <span className="text-[10px] text-teal-600 font-semibold font-mono">Activo</span>
              )}
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

          {/* Selector 2: Mes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>MES:</span>
              {selectedMonth !== 'TODOS' && (
                <span className="text-[10px] text-teal-600 font-semibold font-mono">Activo</span>
              )}
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

          {/* Selector 3: Día Desde (De qué día...) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>DÍA DESDE:</span>
              {dayFrom !== 'TODOS' && (
                <span className="text-[10px] text-teal-600 font-semibold font-mono">Día {dayFrom}</span>
              )}
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

          {/* Selector 4: Día Hasta (...a qué día) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>DÍA HASTA:</span>
              {dayTo !== 'TODOS' && (
                <span className="text-[10px] text-teal-600 font-semibold font-mono">Día {dayTo}</span>
              )}
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

          {/* Selector 5: Calendario Rango Directo (Desde / Hasta) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>CALENDARIO RANGO:</span>
              <span className="text-[10px] text-slate-400">Desde - Hasta</span>
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

        {/* Current Filter Status Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filtro aplicado:</span>
            <span className="font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{filterDescription}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[11px]">
              Movimientos encontrados: <strong className="text-slate-900">{periodIncomes.length} ingresos</strong>, <strong className="text-slate-900">{periodExpenses.length} egresos</strong>
            </span>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleSetAllTime}
                className="text-rose-600 hover:text-rose-800 font-bold underline text-[11px] cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FINANCIAL SNAPSHOT CARDS FOR THE FILTERED PERIOD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {/* Total Ingresos */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ingresos Cobrados</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {periodIncomes.length} op.
            </span>
          </div>
          <span className="text-lg font-black text-emerald-800 font-mono block">
            + S/ {totalPeriodIncome.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Efectivo: S/ {cashIncome.toFixed(2)} • Digital: S/ {digitalIncome.toFixed(2)}
          </span>
        </div>

        {/* Total Egresos */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Egresos / Gastos</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded">
              {periodExpenses.length} reg.
            </span>
          </div>
          <span className="text-lg font-black text-rose-700 font-mono block">
            - S/ {totalPeriodExpense.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Salidas y compras registradas
          </span>
        </div>

        {/* Balance Neto */}
        <div className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
          netPeriodBalance >= 0 
            ? 'bg-teal-50/60 border-teal-200 text-teal-950' 
            : 'bg-rose-50/60 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Balance Neto</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
              netPeriodBalance >= 0 ? 'bg-teal-200 text-teal-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {netPeriodBalance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
            </span>
          </div>
          <span className={`text-lg font-black font-mono block ${
            netPeriodBalance >= 0 ? 'text-teal-900' : 'text-rose-700'
          }`}>
            S/ {netPeriodBalance.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-600 block">
            Ingresos menos egresos
          </span>
        </div>

        {/* Efectivo Físico Neto */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>Efectivo Neto</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">Físico</span>
          </div>
          <span className="text-lg font-black text-slate-900 font-mono block">
            S/ {(cashIncome - totalPeriodExpense).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Efectivo cobrado - egresos
          </span>
        </div>

        {/* Billeteras Digitales & Tarjetas */}
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-sm space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-teal-400">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Cobros Digitales</span>
            </span>
            <span className="text-[10px] font-mono text-teal-300 font-bold">POS/Apps</span>
          </div>
          <span className="text-lg font-black text-white font-mono block">
            S/ {digitalIncome.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            Yape: {yapeIncome.toFixed(0)} | Plin: {plinIncome.toFixed(0)} | POS: {cardIncome.toFixed(0)}
          </span>
        </div>
      </div>

      {/* TABS DE SELECCIÓN DE VISTA */}
      <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('RESUMEN')}
          className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'RESUMEN'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Resumen & Balance de Caja</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INGRESOS')}
          className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'INGRESOS'
              ? 'border-emerald-600 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>Ingresos y Cobros ({displayedIncomes.length})</span>
          <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
            S/ {totalPeriodIncome.toFixed(2)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EGRESOS')}
          className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'EGRESOS'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-600" />
          <span>Gastos Diarios de Turno ({displayedExpenses.length})</span>
          <span className="bg-rose-100 text-rose-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
            S/ {totalPeriodExpense.toFixed(2)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GASTOS_FIJOS')}
          className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'GASTOS_FIJOS'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-purple-600" />
          <span>Gastos Fijos Mensuales ({displayedFixedExpenses.length})</span>
          <span className="bg-purple-100 text-purple-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
            S/ {totalFixedPeriod.toFixed(2)}
          </span>
          {totalFixedPending > 0 && (
            <span className="bg-amber-100 text-amber-800 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold" title="Pendientes de pago">
              {periodFixedExpenses.filter(f => f.status === 'PENDIENTE').length} pend.
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TURNOS')}
          className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'TURNOS'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-slate-600" />
          <span>Cortes y Turnos de Caja ({periodShifts.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: RESUMEN Y BALANCE */}
      {activeTab === 'RESUMEN' && (
        <div className="space-y-6">
          {/* Active Shift Card if exists */}
          {activeShift && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold text-teal-400 font-mono">{activeShift.shiftNumber}</span>
                    <h2 className="text-base font-bold">Turno de Caja en Operación Hoy</h2>
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  Cajero: <strong className="text-white">{activeShift.cashierName}</strong> • Abierto:{' '}
                  {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 block mb-1">Fondo Inicial:</span>
                  <span className="text-base font-bold text-slate-800 font-mono">
                    S/ {activeShift.initialCash.toFixed(2)}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-emerald-700 font-medium block mb-1">Efectivo Ingresado:</span>
                  <span className="text-base font-black text-emerald-900 font-mono">
                    + S/ {activeShift.totalCashSales.toFixed(2)}
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl">
                  <span className="text-indigo-700 font-medium block mb-1">Yape Recibido:</span>
                  <span className="text-base font-bold text-indigo-900 font-mono">
                    S/ {activeShift.totalYapeSales.toFixed(2)}
                  </span>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl">
                  <span className="text-cyan-700 font-medium block mb-1">Plin / Transf:</span>
                  <span className="text-base font-bold text-cyan-900 font-mono">
                    S/ {(activeShift.totalPlinSales + activeShift.totalTransferSales).toFixed(2)}
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                  <span className="text-purple-700 font-medium block mb-1">Tarjetas (POS):</span>
                  <span className="text-base font-bold text-purple-900 font-mono">
                    S/ {activeShift.totalCardSales.toFixed(2)}
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  <span className="text-rose-700 font-medium block mb-1">Egresos del Turno:</span>
                  <span className="text-base font-black text-rose-900 font-mono">
                    - S/ {activeShift.totalExpenses.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900 text-white p-3 rounded-xl col-span-2 lg:col-span-1 shadow-sm">
                  <span className="text-teal-400 font-bold block mb-1">Gaveta Físico:</span>
                  <span className="text-lg font-black font-mono text-white">
                    S/ {activeShift.expectedCash.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Saldo esperado</span>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown by Payment Method in the Filtered Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Desglose de Ingresos por Medio de Pago
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  Total: S/ {totalPeriodIncome.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Efectivo */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Efectivo en Ventanilla
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      S/ {cashIncome.toFixed(2)} ({totalPeriodIncome > 0 ? Math.round((cashIncome / totalPeriodIncome) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${totalPeriodIncome > 0 ? (cashIncome / totalPeriodIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Yape */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-purple-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                      Yape Móvil
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      S/ {yapeIncome.toFixed(2)} ({totalPeriodIncome > 0 ? Math.round((yapeIncome / totalPeriodIncome) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${totalPeriodIncome > 0 ? (yapeIncome / totalPeriodIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Plin */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-cyan-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                      Plin
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      S/ {plinIncome.toFixed(2)} ({totalPeriodIncome > 0 ? Math.round((plinIncome / totalPeriodIncome) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${totalPeriodIncome > 0 ? (plinIncome / totalPeriodIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Tarjetas */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      Tarjetas POS Débito/Crédito
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      S/ {cardIncome.toFixed(2)} ({totalPeriodIncome > 0 ? Math.round((cardIncome / totalPeriodIncome) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${totalPeriodIncome > 0 ? (cardIncome / totalPeriodIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Transferencias */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                      Transferencias Bancarias
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      S/ {transferIncome.toFixed(2)} ({totalPeriodIncome > 0 ? Math.round((transferIncome / totalPeriodIncome) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-600 h-full rounded-full transition-all"
                      style={{ width: `${totalPeriodIncome > 0 ? (transferIncome / totalPeriodIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary of Expenses & Actions in Period */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Egresos del Periodo Filtrado
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-rose-600 font-bold">
                  - S/ {totalPeriodExpense.toFixed(2)}
                </span>
              </div>

              {periodExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold text-slate-600">No se registraron egresos en el periodo seleccionado.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {periodExpenses.map(exp => (
                    <div key={exp.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">{exp.description}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(exp.createdAt).toLocaleDateString('es-PE')} • {exp.responsibleName} • {exp.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="font-black text-rose-600 font-mono">
                        - S/ {exp.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comparativa: Gastos Diarios de Turno vs Gastos Fijos Mensuales */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Estructura de Gastos: Gastos Diarios vs Gastos Fijos Mensuales
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Separación clara entre caja chica de mostrador y compromisos estructurales del negocio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('GASTOS_FIJOS')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Ver Módulo de Gastos Fijos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Gastos Diarios */}
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="font-bold uppercase tracking-wider text-[10px]">1. Gastos Diarios (Caja Chica)</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                    {periodExpenses.length} reg.
                  </span>
                </div>
                <span className="text-xl font-black text-rose-400 font-mono block">
                  - S/ {totalPeriodExpense.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Insumos urgentes, combustible y refrigerios (deducen del arqueo de caja física).
                </span>
              </div>

              {/* Gastos Fijos Mensuales */}
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-purple-300">
                  <span className="font-bold uppercase tracking-wider text-[10px]">2. Gastos Fijos Mensuales</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                    {periodFixedExpenses.length} comp.
                  </span>
                </div>
                <span className="text-xl font-black text-purple-300 font-mono block">
                  S/ {totalFixedPeriod.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Pagados: <strong className="text-emerald-400 font-mono">S/ {totalFixedPaid.toFixed(2)}</strong> • Pendientes: <strong className="text-amber-400 font-mono">S/ {totalFixedPending.toFixed(2)}</strong>
                </span>
              </div>

              {/* Utilidad Operativa Real */}
              <div className="bg-white/10 border border-teal-500/30 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-teal-300">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Utilidad Operativa Real</span>
                  <span className="text-[10px] font-bold text-teal-400">Margen Neto</span>
                </div>
                <span className={`text-xl font-black font-mono block ${realNetOperatingProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  S/ {realNetOperatingProfit.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Ingresos cobrados menos gastos diarios y gastos fijos pagados.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: INGRESOS Y COBROS */}
      {activeTab === 'INGRESOS' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-3">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Ingresos y Cobros Registrados en Caja
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Cobros de adelantos, pagos totales y liquidaciones de órdenes en el periodo.
              </p>
            </div>

            {/* Subfilters for Ingresos */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  placeholder="Buscar orden, cliente o ref..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={incomeMethodFilter}
                onChange={(e) => setIncomeMethodFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700"
              >
                <option value="TODOS">Todos los Métodos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TARJETA">Tarjeta POS</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Orden / Comprobante</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Medio de Pago</th>
                  <th className="py-2.5 px-4">Tipo de Cobro</th>
                  <th className="py-2.5 px-4">N° Operación</th>
                  <th className="py-2.5 px-4">Cajero</th>
                  <th className="py-2.5 px-4 text-right">Monto Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedIncomes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron cobros registrados en la fecha seleccionada.</p>
                      <span className="text-[11px] text-slate-400">Pruebe ajustando el año, mes o día en el panel superior.</span>
                    </td>
                  </tr>
                ) : (
                  displayedIncomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div>{new Date(inc.createdAt).toLocaleDateString('es-PE')}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900 block">{inc.orderCode}</span>
                        {inc.voucherNumber && (
                          <span className="text-[10px] text-slate-500 block">
                            {inc.voucherType?.replace('_', ' ')}: {inc.voucherNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{inc.customerName}</span>
                        {inc.customerPhone && (
                          <span className="text-[10px] text-slate-500 font-mono">{inc.customerPhone}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                          inc.paymentMethod === 'EFECTIVO' ? 'bg-emerald-100 text-emerald-800' :
                          inc.paymentMethod === 'YAPE' ? 'bg-purple-100 text-purple-800' :
                          inc.paymentMethod === 'PLIN' ? 'bg-cyan-100 text-cyan-800' :
                          inc.paymentMethod === 'TARJETA' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {inc.paymentMethod === 'EFECTIVO' && <Coins className="w-3 h-3" />}
                          {inc.paymentMethod === 'YAPE' && <Smartphone className="w-3 h-3" />}
                          {inc.paymentMethod === 'PLIN' && <Smartphone className="w-3 h-3" />}
                          {inc.paymentMethod === 'TARJETA' && <CreditCard className="w-3 h-3" />}
                          {inc.paymentMethod === 'TRANSFERENCIA' && <Building className="w-3 h-3" />}
                          <span>{inc.paymentMethod}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-semibold text-[11px]">
                        {inc.paymentType.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {inc.referenceCode || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {inc.cashierName}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-700 font-mono text-sm">
                        + S/ {inc.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: GASTOS DIARIOS DE TURNO (CAJA CHICA) */}
      {activeTab === 'EGRESOS' && (
        <div className="space-y-4">
          {/* Callout explaining difference with Fixed Expenses */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-purple-900 block font-bold">
                  ¿Buscando gestionar compromisos mensuales recurrentes (Alquiler, Luz, Agua, Planillas)?
                </strong>
                <span className="text-purple-700 text-[11px]">
                  Estos gastos diarios de abajo se descuentan del efectivo físico del cajero en turno. Los costos fijos estructurales se controlan aparte.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('GASTOS_FIJOS')}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <span>Ir a Gastos Fijos Mensuales</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-3">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Gastos Diarios Operativos de Turno (Caja Chica)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Salidas en efectivo autorizadas durante el turno: insumos urgentes, combustible de moto, refrigerio y reparaciones menores.
                </p>
              </div>

            {/* Subfilters for Egresos */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Buscar motivo, comprobante..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700"
              >
                <option value="TODOS">Todas las Categorías</option>
                <option value="INSUMOS_LIMPIEZA">Insumos de Limpieza</option>
                <option value="REFRIGERIO_PERSONAL">Refrigerio Personal</option>
                <option value="DELIVERY_COMBUSTIBLE">Combustible Delivery</option>
                <option value="SERVICIOS_LUZ_AGUA">Servicios Luz / Agua</option>
                <option value="MANTENIMIENTO_MAQUINAS">Mantenimiento Máquinas</option>
                <option value="OTROS">Otros</option>
              </select>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar Egreso</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Categoría</th>
                  <th className="py-2.5 px-4">Descripción del Gasto</th>
                  <th className="py-2.5 px-4">N° Comprobante</th>
                  <th className="py-2.5 px-4">Responsable</th>
                  <th className="py-2.5 px-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron egresos en el periodo seleccionado.</p>
                    </td>
                  </tr>
                ) : (
                  displayedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div>{new Date(exp.createdAt).toLocaleDateString('es-PE')}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {exp.category.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">{exp.description}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{exp.receiptNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{exp.responsibleName}</td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 font-mono text-sm">
                        - S/ {exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* TAB CONTENT 4: GASTOS FIJOS MENSUALES (ESTRUCTURALES) */}
      {activeTab === 'GASTOS_FIJOS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Panel for Gastos Fijos */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Gastos Fijos Mensuales del Negocio
                    </h2>
                    <span className="text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full uppercase">
                      Costos Estructurales
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    Alquiler, Luz, Agua, Planillas, Mantenimiento y compromisos recurrentes, separados de la caja chica diaria.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateRecurring}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-purple-300/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Generar automáticamente los gastos recurrentes para el mes seleccionado"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                <span>Generar Plantilla Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNewFixedModal()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Gasto Fijo</span>
              </button>
            </div>
          </div>

          {/* 4 Financial KPI Cards for Fixed Expenses */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Presupuesto Total */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  <span>Presupuesto Mes</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded">
                  {periodFixedExpenses.length} gastos
                </span>
              </div>
              <span className="text-xl font-black text-slate-900 font-mono block">
                S/ {totalFixedPeriod.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Compromiso total de {MONTHS.find(m => m.value === effectiveFixedMonth)?.label || 'este mes'} {effectiveFixedYear}
              </span>
            </div>

            {/* Pagados */}
            <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gastos Pagados</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">
                  {periodFixedExpenses.filter(f => f.status === 'PAGADO').length} pagados
                </span>
              </div>
              <span className="text-xl font-black text-emerald-700 font-mono block">
                S/ {totalFixedPaid.toFixed(2)}
              </span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all" 
                  style={{ width: `${fixedPaidPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {fixedPaidPercent}% del presupuesto cancelado
              </span>
            </div>

            {/* Pendientes de Pago */}
            <div className={`bg-white border p-4 rounded-2xl shadow-2xs space-y-1 ${
              totalFixedPending > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-amber-700">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pendiente de Pago</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  totalFixedPending > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {periodFixedExpenses.filter(f => f.status === 'PENDIENTE').length} pendientes
                </span>
              </div>
              <span className="text-xl font-black text-amber-700 font-mono block">
                S/ {totalFixedPending.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {totalFixedPending > 0 ? 'Facturas/servicios por cancelar' : 'Todo al día este mes'}
              </span>
            </div>

            {/* Recurrentes vs Únicos */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center justify-between text-purple-300">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recurrentes</span>
                </span>
                <span className="text-[10px] font-mono text-purple-200 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  Mensuales
                </span>
              </div>
              <span className="text-xl font-black text-white font-mono block">
                {periodFixedExpenses.filter(f => f.isRecurring).length} contratos
              </span>
              <span className="text-[10px] text-slate-400 block">
                Alquiler, Luz, Agua, Planillas, Internet, POS
              </span>
            </div>
          </div>

          {/* Filtering and Search Toolbar for Gastos Fijos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Month and Year Quick Selectors */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                  <span>Mes:</span>
                </span>
                <select
                  value={fixedMonthFilter}
                  onChange={(e) => setFixedMonthFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="TODOS">Todos los Meses</option>
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <span className="text-slate-500 font-bold ml-1">Año:</span>
                <select
                  value={fixedYearFilter}
                  onChange={(e) => setFixedYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="TODOS">Todos los Años</option>
                  {availableYears.map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <span className="text-slate-500 font-bold ml-2">Estado:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFixedStatusFilter('TODOS')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      fixedStatusFilter === 'TODOS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({periodFixedExpenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFixedStatusFilter('PENDIENTE')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      fixedStatusFilter === 'PENDIENTE' ? 'bg-amber-100 text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pendientes ({periodFixedExpenses.filter(f => f.status === 'PENDIENTE').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFixedStatusFilter('PAGADO')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      fixedStatusFilter === 'PAGADO' ? 'bg-emerald-100 text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pagados ({periodFixedExpenses.filter(f => f.status === 'PAGADO').length})
                  </button>
                </div>
              </div>

              {/* Subfilters: Category & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={fixedSearch}
                    onChange={(e) => setFixedSearch(e.target.value)}
                    placeholder="Buscar concepto, proveedor..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={fixedCategoryFilter}
                  onChange={(e) => setFixedCategoryFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 max-w-[200px]"
                >
                  <option value="TODOS">Todas las Categorías</option>
                  {Object.entries(FIXED_CATEGORY_CONFIG).map(([k, cfg]) => (
                    <option key={k} value={k}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table of Monthly Fixed Expenses */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Concepto / Descripción</th>
                    <th className="py-3 px-4">Proveedor / Entidad</th>
                    <th className="py-3 px-4">Periodo & Vencimiento</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Estado & Comprobante</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedFixedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Building className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">No se encontraron gastos fijos con los filtros seleccionados.</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Puede registrar un nuevo gasto fijo o generar los compromisos recurrentes del mes.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleOpenNewFixedModal()}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs"
                          >
                            + Nuevo Gasto Fijo
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateRecurring}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                          >
                            Generar Plantilla del Mes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedFixedExpenses.map((fix) => {
                      const cfg = FIXED_CATEGORY_CONFIG[fix.category] || FIXED_CATEGORY_CONFIG.OTROS_FIJOS;
                      const CatIcon = cfg.icon;
                      const isPaid = fix.status === 'PAGADO';

                      // Due date calculations
                      const isPastDue = !isPaid && fix.dueDate && new Date(`${fix.dueDate}T23:59:59`).getTime() < Date.now();

                      return (
                        <tr key={fix.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Categoría */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              <CatIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          {/* Concepto y Notas */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block text-xs">{fix.concept}</span>
                            {fix.notes && (
                              <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-1">{fix.notes}</span>
                            )}
                            {fix.isRecurring && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded mt-1">
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Recurrente mensual</span>
                              </span>
                            )}
                          </td>

                          {/* Proveedor */}
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {fix.supplierName || '—'}
                          </td>

                          {/* Periodo & Vencimiento */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                            <span className="text-slate-800 font-bold block">
                              {MONTHS.find(m => m.value === fix.month.toString())?.label} {fix.year}
                            </span>
                            {fix.dueDate ? (
                              <span className={`text-[10px] block mt-0.5 font-sans ${
                                isPastDue ? 'text-rose-600 font-bold flex items-center gap-0.5' : 'text-slate-500'
                              }`}>
                                {isPastDue && <AlertTriangle className="w-3 h-3" />}
                                Vence: {new Date(fix.dueDate).toLocaleDateString('es-PE')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block">—</span>
                            )}
                          </td>

                          {/* Monto */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            <span className="text-sm font-black text-slate-900 block">
                              S/ {fix.amount.toFixed(2)}
                            </span>
                          </td>

                          {/* Estado & Comprobante */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isPaid ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  <span>PAGADO</span>
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  <span>{fix.paymentMethod || 'Transferencia'}</span>
                                  {fix.receiptNumber && (
                                    <span className="font-mono block text-slate-400">{fix.receiptNumber}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                                  isPastDue ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{isPastDue ? 'VENCIDO' : 'PENDIENTE'}</span>
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayFixedModal(fix)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                  title="Registrar pago de este gasto fijo"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pagar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRevertPayFixed(fix.id, fix.concept)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                                  title="Revertir estado a pendiente"
                                >
                                  <span>Revertir</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditFixedModal(fix)}
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                                title="Editar gasto fijo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFixed(fix.id, fix.concept)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                                title="Eliminar gasto fijo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

          {/* Category Breakdown Grid Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Distribución por Categoría de Gastos Fijos</span>
              <span className="text-[10px] font-normal text-slate-400">
                ({MONTHS.find(m => m.value === effectiveFixedMonth)?.label || 'Periodo'} {effectiveFixedYear})
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {Object.entries(FIXED_CATEGORY_CONFIG).map(([catKey, catCfg]) => {
                const CatIcon = catCfg.icon;
                const catItems = periodFixedExpenses.filter(f => f.category === catKey);
                const catTotal = catItems.reduce((s, itm) => s + itm.amount, 0);
                if (catTotal === 0 && catItems.length === 0) return null;

                return (
                  <div key={catKey} className={`p-3 rounded-xl border ${catCfg.bg} ${catCfg.border} space-y-1`}>
                    <div className="flex items-center gap-1.5">
                      <CatIcon className={`w-3.5 h-3.5 ${catCfg.color}`} />
                      <span className={`font-bold text-[11px] truncate ${catCfg.color}`}>{catCfg.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      S/ {catTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {catItems.length} comprobante(s)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: CORTES Y TURNOS DE CAJA */}
      {activeTab === 'TURNOS' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Historial de Cortes de Turno y Arqueos Ciegos</h3>
                <p className="text-[11px] text-slate-500">Auditoría de gavetas de dinero y verificación de descuadres.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              {periodShifts.length} turno(s) en periodo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">N° Turno</th>
                  <th className="py-2.5 px-4">Cajero</th>
                  <th className="py-2.5 px-4">Fecha y Hora Apertura / Cierre</th>
                  <th className="py-2.5 px-4 text-right">Fondo Inicial</th>
                  <th className="py-2.5 px-4 text-right">Efectivo Esperado</th>
                  <th className="py-2.5 px-4 text-right">Declarado (Ciego)</th>
                  <th className="py-2.5 px-4 text-center">Descuadre / Auditoría</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodShifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron turnos de caja en la fecha seleccionada.</p>
                    </td>
                  </tr>
                ) : (
                  periodShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{shift.shiftNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{shift.cashierName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        <div>{new Date(shift.openedAt).toLocaleDateString('es-PE')} {new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {shift.closedAt ? (
                          <div className="text-[10px] text-slate-400">Cierre: {new Date(shift.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600">(En curso)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        S/ {shift.initialCash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        S/ {shift.expectedCash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {shift.declaredCash !== undefined ? `S/ ${shift.declaredCash.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {shift.discrepancy !== undefined ? (
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            shift.discrepancy === 0 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : shift.discrepancy > 0 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-rose-100 text-rose-800 font-black'
                          }`}>
                            {shift.discrepancy === 0 
                              ? 'CUADRE EXACTO' 
                              : shift.discrepancy > 0 
                                ? `SOBRANTE +S/ ${shift.discrepancy.toFixed(2)}` 
                                : `FALTANTE -S/ ${Math.abs(shift.discrepancy).toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pendiente de corte</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          shift.status === 'ABIERTA' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR EGRESO */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Registrar Egreso de Caja</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Monto de la salida (Soles):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">S/</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Categoría del Egreso:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="INSUMOS_LIMPIEZA">Compra urgente de insumos / detergente</option>
                  <option value="REFRIGERIO_PERSONAL">Refrigerio / alimentación personal</option>
                  <option value="DELIVERY_COMBUSTIBLE">Combustible moto delivery</option>
                  <option value="SERVICIOS_LUZ_AGUA">Pago de servicios / recibos</option>
                  <option value="MANTENIMIENTO_MAQUINAS">Mantenimiento preventivo / técnico</option>
                  <option value="OTROS">Otros gastos menores</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Descripción detallada:</label>
                <textarea
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Detalle exacto del motivo del gasto..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">N° Comprobante / Boleta física:</label>
                <input
                  type="text"
                  value={expenseReceipt}
                  onChange={(e) => setExpenseReceipt(e.target.value)}
                  placeholder="Ej. B01-002819"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirmar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CORTE DE TURNO - ARQUEO CIEGO */}
      {showBlindAuditModal && activeShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Corte de Turno - Arqueo Ciego de Seguridad</h3>
                  <p className="text-[11px] text-slate-400">El cajero debe declarar el dinero físico sin consultar el sistema</p>
                </div>
              </div>
              <button onClick={() => setShowBlindAuditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleExecuteBlindAudit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Protocolo de Auditoría:</strong> Ingrese la cantidad de cada denominación contada físicamente en la gaveta. Al presionar "Cerrar Turno", el sistema comparará lo declarado contra las ventas y egresos reales registrados.
                </p>
              </div>

              {/* Billetes Grid */}
              <div>
                <span className="font-bold text-slate-700 block mb-2 uppercase text-[11px]">1. Conteo de Billetes:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'bills100', val: 100, label: 'S/ 100.00' },
                    { key: 'bills50', val: 50, label: 'S/ 50.00' },
                    { key: 'bills20', val: 20, label: 'S/ 20.00' },
                    { key: 'bills10', val: 10, label: 'S/ 10.00' },
                  ].map((denom) => (
                    <div key={denom.key} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                      <span className="text-slate-500 font-semibold block mb-1">{denom.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={(blindCount as any)[denom.key]}
                        onChange={(e) => setBlindCount({ ...blindCount, [denom.key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400 text-right block mt-1">
                        = S/ {((blindCount as any)[denom.key] * denom.val).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monedas Grid */}
              <div>
                <span className="font-bold text-slate-700 block mb-2 uppercase text-[11px]">2. Conteo de Monedas:</span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { key: 'coins5', val: 5, label: 'S/ 5.00' },
                    { key: 'coins2', val: 2, label: 'S/ 2.00' },
                    { key: 'coins1', val: 1, label: 'S/ 1.00' },
                    { key: 'coins050', val: 0.50, label: 'S/ 0.50' },
                    { key: 'coins020', val: 0.20, label: 'S/ 0.20' },
                    { key: 'coins010', val: 0.10, label: 'S/ 0.10' },
                  ].map((denom) => (
                    <div key={denom.key} className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <span className="text-slate-500 font-semibold block mb-1 text-[11px]">{denom.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={(blindCount as any)[denom.key]}
                        onChange={(e) => setBlindCount({ ...blindCount, [denom.key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded font-bold text-center text-xs"
                      />
                      <span className="text-[9px] text-slate-400 text-right block mt-0.5">
                        = S/ {((blindCount as any)[denom.key] * denom.val).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declared Total Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-300">TOTAL DECLARADO EN ARQUEO FÍSICO:</span>
                <span className="text-xl font-black text-teal-400 font-mono">
                  S/ {declaredTotal.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Notas u observaciones del cajero:</label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Ej. Se dejaron S/ 100 en monedas para el siguiente turno..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlindAuditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-teal-400" />
                  Cerrar Turno y Comparar Arqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT RESULT REPORT */}
      {auditResultShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Resultado del Corte de Turno</h3>
              </div>
              <button onClick={() => setAuditResultShift(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="text-center border-b border-dashed border-slate-200 pb-3">
                <span className="text-[11px] text-slate-500 block">ACTA DE CIERRE DE CAJA</span>
                <span className="text-base font-bold text-slate-900">{auditResultShift.shiftNumber}</span>
                <p className="text-[10px] text-slate-400">Cajero: {auditResultShift.cashierName}</p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span>S/ {auditResultShift.initialCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas Efectivo:</span>
                  <span>+ S/ {auditResultShift.totalCashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Egresos Efectivo:</span>
                  <span>- S/ {auditResultShift.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                  <span>Efectivo Esperado:</span>
                  <span>S/ {auditResultShift.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Efectivo Declarado:</span>
                  <span>S/ {auditResultShift.declaredCash?.toFixed(2)}</span>
                </div>
              </div>

              {/* Final Verdict */}
              <div className={`p-4 rounded-xl text-center font-bold text-sm ${
                auditResultShift.discrepancy === 0
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : auditResultShift.discrepancy! > 0
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {auditResultShift.discrepancy === 0 ? (
                  <span>✓ ¡CUADRE EXACTO! Sin diferencias.</span>
                ) : auditResultShift.discrepancy! > 0 ? (
                  <span>SOBRANTE: + S/ {auditResultShift.discrepancy?.toFixed(2)}</span>
                ) : (
                  <span>FALTANTE DE CAJA: - S/ {Math.abs(auditResultShift.discrepancy || 0).toFixed(2)}</span>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setAuditResultShift(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg text-xs"
                >
                  Entendido y Archivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: APERTURA DE NUEVO TURNO */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Aperturar Turno de Caja</h3>
              </div>
              <button onClick={() => setShowOpenShiftModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleOpenShift} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Fondo de Caja Inicial (Sencillo):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">S/</span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Monto físico con el que se inicia la gaveta para dar vuelto.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Iniciar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REGISTRAR / EDITAR GASTO FIJO MENSUAL */}
      {showFixedExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    {editingFixedExpense ? 'Editar Gasto Fijo Mensual' : 'Registrar Nuevo Gasto Fijo Mensual'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Compromiso estructural del negocio (independiente de la caja chica diaria)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowFixedExpenseModal(false)} 
                className="text-purple-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFixedExpense} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Concepto */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Concepto / Nombre del Gasto Fijo: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fixedConcept}
                  onChange={(e) => setFixedConcept(e.target.value)}
                  placeholder="Ej. Alquiler Local Central San Borja, Luz del Sur, Planilla Lavanderos..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Categoría y Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Categoría:</label>
                  <select
                    value={fixedCategory}
                    onChange={(e) => setFixedCategory(e.target.value as FixedExpenseCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(FIXED_CATEGORY_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Monto Presupuestado (S/): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mes y Año de Aplicación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Mes Aplicable:</label>
                  <select
                    value={fixedMonth}
                    onChange={(e) => setFixedMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Año:</label>
                  <select
                    value={fixedYear}
                    onChange={(e) => setFixedYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Proveedor y Fecha de Vencimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Proveedor / Entidad:</label>
                  <input
                    type="text"
                    value={fixedSupplier}
                    onChange={(e) => setFixedSupplier(e.target.value)}
                    placeholder="Ej. Luz del Sur, Inmobiliaria, SEDAPAL..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Fecha de Vencimiento:</label>
                  <input
                    type="date"
                    value={fixedDueDate}
                    onChange={(e) => setFixedDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Recurrencia */}
              <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fixedRecurringCheck"
                  checked={fixedIsRecurring}
                  onChange={(e) => setFixedIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="fixedRecurringCheck" className="text-xs text-purple-950 font-medium cursor-pointer">
                  <strong>Gasto Recurrente Mensual:</strong> Se incluirá automáticamente en la plantilla recurrente de los próximos meses.
                </label>
              </div>

              {/* Estado Inicial de Pago */}
              <div className="border-t border-slate-200 pt-3">
                <label className="text-slate-700 font-bold block mb-2">Estado del Pago:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFixedInitialStatus('PENDIENTE')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      fixedInitialStatus === 'PENDIENTE'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⏳ Pendiente de Pago
                  </button>

                  <button
                    type="button"
                    onClick={() => setFixedInitialStatus('PAGADO')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      fixedInitialStatus === 'PAGADO'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Ya está Pagado
                  </button>
                </div>
              </div>

              {/* Si está pagado: medio de pago y nro comprobante */}
              {fixedInitialStatus === 'PAGADO' && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-emerald-900 font-bold block mb-1 text-[11px]">Medio de Pago:</label>
                      <select
                        value={fixedFormPayMethod}
                        onChange={(e) => setFixedFormPayMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                        <option value="DEBITO_AUTOMATICO">Débito Automático</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                        <option value="CHEQUE">Cheque de Gerencia</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-emerald-900 font-bold block mb-1 text-[11px]">N° Operación / Recibo:</label>
                      <input
                        type="text"
                        value={fixedFormReceipt}
                        onChange={(e) => setFixedFormReceipt(e.target.value)}
                        placeholder="Ej. BCP-892018"
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Notas u Observaciones (opcional):</label>
                <textarea
                  value={fixedNotes}
                  onChange={(e) => setFixedNotes(e.target.value)}
                  placeholder="Detalles sobre suministro, contrato, contacto o cuenta bancaria..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFixedExpenseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingFixedExpense ? 'Actualizar Gasto Fijo' : 'Guardar Gasto Fijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: REGISTRAR PAGO DE GASTO FIJO */}
      {showPayFixedModal && targetFixedToPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Registrar Pago de Gasto Fijo</h3>
              </div>
              <button onClick={() => setShowPayFixedModal(false)} className="text-emerald-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmPayFixed} className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Concepto a Pagar:</span>
                <span className="text-sm font-bold text-emerald-950 block">{targetFixedToPay.concept}</span>
                {targetFixedToPay.supplierName && (
                  <span className="text-[11px] text-emerald-800 block">Proveedor: {targetFixedToPay.supplierName}</span>
                )}
                <div className="pt-2 flex justify-between items-baseline border-t border-emerald-200/60 mt-2">
                  <span className="text-emerald-900 font-bold">Monto a Cancelar:</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    S/ {targetFixedToPay.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Medio de Pago:</label>
                <select
                  value={payFixedMethod}
                  onChange={(e) => setPayFixedMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria (BCP/BBVA/Interbank)</option>
                  <option value="DEBITO_AUTOMATICO">Débito Automático en Cuenta</option>
                  <option value="EFECTIVO">Efectivo de Mostrador</option>
                  <option value="YAPE">Yape Negocios</option>
                  <option value="PLIN">Plin</option>
                  <option value="CHEQUE">Cheque / Giro</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">N° de Operación / Comprobante:</label>
                <input
                  type="text"
                  value={payFixedReceipt}
                  onChange={(e) => setPayFixedReceipt(e.target.value)}
                  placeholder="Ej. OP-984128 o F001-00281"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayFixedModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
