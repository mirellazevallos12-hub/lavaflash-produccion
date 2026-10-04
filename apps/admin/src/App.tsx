/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { db } from './services/db';
import { Order, User, UserRole } from './types';
import { AdminLoginView } from './components/auth/AdminLoginView';
import { MostradorView } from './components/pos/MostradorView';
import { NewReceptionModal } from './components/pos/NewReceptionModal';
import { OrderReceiptModal } from './components/pos/OrderReceiptModal';
import { QualityControlView } from './components/quality/QualityControlView';
import { WorkflowBoard } from './components/workflow/WorkflowBoard';
import { PartialDeliveryModal } from './components/delivery-partial/PartialDeliveryModal';
import { CashRegisterView } from './components/cashier/CashRegisterView';
import { CustomerLoyaltyView } from './components/customers/CustomerLoyaltyView';
import { HistoricalSalesView } from './components/reports/HistoricalSalesView';
import { CustomerListView } from './components/customers/CustomerListView';
import { PickupRemindersView } from './components/customers/PickupRemindersView';
import { AdminDashboardView } from './components/dashboard/AdminDashboardView';
import { AdminMenuTiles } from './components/dashboard/AdminMenuTiles';
import { PromotionsView } from './components/promotions/PromotionsView';
import { InventoryView } from './components/inventory/InventoryView';
import { ClaimsView } from './components/claims/ClaimsView';
import { DeliveryRoutesView } from './components/delivery/DeliveryRoutesView';
import { AuditLogView } from './components/audit/AuditLogView';
import { NewCustomerModal } from './components/customers/NewCustomerModal';
import { ServicesCatalogCrud } from './components/services/ServicesCatalogCrud';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { restoreAdminSession, endAdminSession } from './services/auth';
import { hydrateBusinessState, refreshBusinessState, disableBusinessSync } from './services/cloudState';
import { ADMIN_LOGO_URL } from './config/site';

import {
  BellRing,
  Bike,
  Boxes,
  CheckSquare,
  Clock3,
  DollarSign,
  ExternalLink,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldAlert,
  Shirt,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  section: 'GENERAL' | 'OPERACION' | 'GESTION' | 'CONTROL';
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MOSTRADOR: 'Mostrador',
  CALIDAD: 'Calidad',
  MOTORIZADO: 'Motorizado',
};

const SECTION_LABELS: Record<NavItem['section'], string> = {
  GENERAL: 'General',
  OPERACION: 'Operación',
  GESTION: 'Gestión',
  CONTROL: 'Control y reportes',
};

const NAV_ITEMS: NavItem[] = [
  { id: 'DASHBOARD', label: 'Inicio', description: 'Accesos rápidos a los módulos', icon: LayoutDashboard, roles: ['ADMIN', 'MOSTRADOR'], section: 'GENERAL' },
  { id: 'INDICADORES', label: 'Indicadores y reportes', description: 'Resumen financiero y operativo', icon: LayoutDashboard, roles: ['ADMIN', 'MOSTRADOR'], section: 'CONTROL' },
  { id: 'CLIENTES', label: 'Clientes', description: 'Directorio y ficha de clientes', icon: Users, roles: ['ADMIN', 'MOSTRADOR'], section: 'GENERAL' },
  { id: 'RECORDATORIOS', label: 'Recordatorios', description: 'Recojos y avisos pendientes', icon: BellRing, roles: ['ADMIN', 'MOSTRADOR'], section: 'GENERAL' },
  { id: 'MOSTRADOR', label: 'Mostrador y ventas', description: 'Recepciones, pedidos y cobros', icon: Shirt, roles: ['ADMIN', 'MOSTRADOR'], section: 'OPERACION' },
  { id: 'WORKFLOW', label: 'Prendas entregadas', description: 'Historial de prendas entregadas', icon: Layers, roles: ['ADMIN', 'MOSTRADOR', 'CALIDAD', 'MOTORIZADO'], section: 'OPERACION' },
  { id: 'CALIDAD', label: 'Calidad', description: 'Control y comunicación', icon: CheckSquare, roles: ['ADMIN', 'CALIDAD'], section: 'OPERACION' },
  { id: 'DELIVERY', label: 'Delivery y rutas', description: 'Entregas y motorizados', icon: Bike, roles: ['ADMIN', 'MOTORIZADO'], section: 'OPERACION' },
  { id: 'CAJA', label: 'Caja', description: 'Ingresos, egresos y cortes', icon: DollarSign, roles: ['ADMIN', 'MOSTRADOR'], section: 'GESTION' },
  { id: 'FIDELIZACION', label: 'Fidelización', description: 'Vales y beneficios', icon: Sparkles, roles: ['ADMIN', 'MOSTRADOR'], section: 'GESTION' },
  { id: 'PROMOCIONES', label: 'Promociones', description: 'Campañas y descuentos', icon: Tag, roles: ['ADMIN', 'MOSTRADOR'], section: 'GESTION' },
  { id: 'INVENTARIO', label: 'Inventario', description: 'Stock y kardex', icon: Boxes, roles: ['ADMIN'], section: 'GESTION' },
  { id: 'RECLAMOS', label: 'Reclamos y garantías', description: 'Incidencias y seguimiento', icon: ShieldAlert, roles: ['ADMIN', 'MOSTRADOR'], section: 'GESTION' },
  { id: 'SERVICIOS_CRUD', label: 'Tarifario y servicios', description: 'Precios y catálogo', icon: Sparkles, roles: ['ADMIN', 'MOSTRADOR'], section: 'GESTION' },
  { id: 'HISTORIAL', label: 'Historial de ventas', description: 'Consulta de operaciones', icon: History, roles: ['ADMIN', 'MOSTRADOR'], section: 'CONTROL' },
  { id: 'AUDITORIA', label: 'Auditoría', description: 'Trazabilidad de cambios', icon: History, roles: ['ADMIN'], section: 'CONTROL' },
];

const getInitialTab = (user: User | null) => {
  if (user?.role === 'ADMIN') return 'DASHBOARD';
  if (user?.role === 'CALIDAD') return 'CALIDAD';
  if (user?.role === 'MOTORIZADO') return 'DELIVERY';
  return 'MOSTRADOR';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dataSyncError, setDataSyncError] = useState('');
  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab(db.getCurrentUser()));
  const [now, setNow] = useState(() => new Date());

  const [showNewReception, setShowNewReception] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [deliveryOrder, setDeliveryOrder] = useState<Order | null>(null);
  const [activeShift, setActiveShift] = useState(() => db.getActiveShift());

  useEffect(() => {
    let active = true;
    restoreAdminSession().then(async (user) => {
      if (!active) return;
      if (user) {
        try {
          await hydrateBusinessState();
          db.notifyExternalUpdate();
          setDataSyncError('');
        } catch (error) {
          console.error('No se pudo sincronizar la base central:', error);
          setDataSyncError('No se pudo cargar la base central. Revisa el servidor antes de continuar.');
        }
      }
      if (!active) return;
      setCurrentUser(user);
      if (user) setActiveTab(getInitialTab(user));
      setAuthChecked(true);
    });
    return () => { active = false; };
  }, []);

  const canCreateReception = currentUser?.role === 'ADMIN' || currentUser?.role === 'MOSTRADOR';

  const allowedNavItems = useMemo(
    () => (currentUser ? NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role)) : []),
    [currentUser],
  );

  const activeItem = allowedNavItems.find((item) => item.id === activeTab) ?? allowedNavItems[0];

  useEffect(() => {
    const unsubscribe = db.subscribe(() => setActiveShift(db.getActiveShift()));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const timer = window.setInterval(() => {
      void refreshBusinessState().then((changed) => {
        if (changed) db.notifyExternalUpdate();
      }).catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [currentUser]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2' && canCreateReception) {
        event.preventDefault();
        setShowNewReception(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canCreateReception]);

  useEffect(() => {
    if (!currentUser) return;
    const stillAllowed = allowedNavItems.some((item) => item.id === activeTab);
    if (!stillAllowed) setActiveTab(getInitialTab(currentUser));
  }, [activeTab, allowedNavItems, currentUser]);

  const handleLoginSuccess = async (user: User) => {
    setAuthChecked(false);
    setCurrentUser(user);
    setActiveTab(getInitialTab(user));
    try {
      await hydrateBusinessState();
      db.notifyExternalUpdate();
      setDataSyncError('');
    } catch (error) {
      console.error('No se pudo sincronizar la base central:', error);
      setDataSyncError('No se pudo cargar la base central. Revisa el servidor antes de continuar.');
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogout = async () => {
    disableBusinessSync();
    await endAdminSession();
    setCurrentUser(null);
    setActiveTab('DASHBOARD');
  };

  const retryDataSync = async () => {
    setAuthChecked(false);
    try {
      await hydrateBusinessState();
      db.notifyExternalUpdate();
      setDataSyncError('');
    } catch (error) {
      console.error('No se pudo sincronizar la base central:', error);
      setDataSyncError('La base central sigue sin responder. Revisa el servidor y vuelve a intentar.');
    } finally {
      setAuthChecked(true);
    }
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
  };

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-bold text-teal-200">Verificando acceso administrativo…</div>;
  }

  if (!currentUser) {
    return <AdminLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (dataSyncError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Base central</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">No abrimos el panel para evitar trabajar con datos desactualizados.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{dataSyncError}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => void retryDataSync()} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-black text-white hover:bg-teal-700">Reintentar conexión</button>
            <button onClick={() => void handleLogout()} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cerrar sesión</button>
          </div>
        </section>
      </main>
    );
  }

  const dateText = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now);
  const timeText = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-950/10">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <button
            type="button"
            onClick={() => selectTab('DASHBOARD')}
            className="flex min-w-0 items-center gap-3 text-left"
            title="Volver al panel principal"
          >
            <div className="rounded-lg bg-white px-2 py-1">
              <img src={ADMIN_LOGO_URL} alt="LavaFlash" className="h-9 w-auto object-contain" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300">Panel administrativo</p>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs md:flex">
              <Clock3 className="h-4 w-4 text-teal-300" />
              <span className="capitalize text-slate-400">{dateText}</span>
              <span className="font-bold tabular-nums text-white">{timeText}</span>
            </div>

            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-teal-500/60 hover:text-teal-200 xl:flex"
              title="Abrir la página pública"
            >
              Sitio público <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {activeTab !== 'DASHBOARD' && (
              <button
                type="button"
                onClick={() => selectTab('DASHBOARD')}
                className="hidden items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-xs font-black text-teal-200 transition hover:bg-teal-500/20 md:flex"
                title="Volver al panel principal"
              >
                <LayoutDashboard className="h-4 w-4" />
                Panel principal
              </button>
            )}

            {canCreateReception && (
              <button
                onClick={() => setShowNewReception(true)}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-teal-400"
                title="Nueva recepción (F2)"
              >
                <Plus className="h-4 w-4" />
                Nueva recepción
                <span className="rounded-md bg-slate-950/15 px-1.5 py-0.5 text-[9px]">F2</span>
              </button>
            )}

            <div className="ml-1 flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-xs font-bold text-white">{currentUser.name}</p>
                <p className="text-[10px] font-semibold text-teal-300">{ROLE_LABELS[currentUser.role]}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Lavaflash / {SECTION_LABELS[activeItem?.section ?? 'GENERAL']}</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950 md:text-2xl">{activeItem?.label ?? 'Panel administrativo'}</h1>
              <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{activeItem?.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {activeTab !== 'DASHBOARD' && (
                <button
                  type="button"
                  onClick={() => selectTab('DASHBOARD')}
                  className="rounded-xl bg-teal-50 px-3 py-2 text-[11px] font-black text-teal-700 ring-1 ring-inset ring-teal-200"
                >
                  Panel
                </button>
              )}
              <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-right">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Hora</p>
                <p className="text-xs font-black tabular-nums text-slate-800">{timeText.slice(0, 5)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'DASHBOARD' && (
              <AdminMenuTiles
                role={currentUser.role}
                onSelectTab={selectTab}
                onNewReception={() => setShowNewReception(true)}
              />
            )}
            {activeTab === 'INDICADORES' && <AdminDashboardView />}
            {activeTab === 'CLIENTES' && <CustomerListView onOpenReceipt={(order) => setReceiptOrder(order)} />}
            {activeTab === 'RECORDATORIOS' && (
              <PickupRemindersView
                onOpenReceipt={(order) => setReceiptOrder(order)}
                onOpenPartialDelivery={(order) => setDeliveryOrder(order)}
              />
            )}
            {activeTab === 'MOSTRADOR' && (
              <MostradorView
                onOpenNewReception={() => setShowNewReception(true)}
                onOpenNewCustomer={() => setShowNewCustomer(true)}
                onOpenReceipt={(order) => setReceiptOrder(order)}
                onOpenPartialDelivery={(order) => setDeliveryOrder(order)}
              />
            )}
            {activeTab === 'WORKFLOW' && (
              <WorkflowBoard
                onOpenReceipt={(order) => setReceiptOrder(order)}
                onOpenPartialDelivery={(order) => setDeliveryOrder(order)}
              />
            )}
            {activeTab === 'CALIDAD' && <QualityControlView />}
            {activeTab === 'CAJA' && <CashRegisterView />}
            {activeTab === 'FIDELIZACION' && <CustomerLoyaltyView />}
            {activeTab === 'PROMOCIONES' && <PromotionsView />}
            {activeTab === 'INVENTARIO' && <InventoryView />}
            {activeTab === 'RECLAMOS' && <ClaimsView />}
            {activeTab === 'DELIVERY' && <DeliveryRoutesView />}
            {activeTab === 'AUDITORIA' && <AuditLogView />}
            {activeTab === 'SERVICIOS_CRUD' && <ServicesCatalogCrud />}
            {activeTab === 'HISTORIAL' && <HistoricalSalesView />}
          </div>
        </div>
      </main>

      {showNewReception && canCreateReception && (
        <NewReceptionModal
          isOpen={showNewReception}
          onClose={() => setShowNewReception(false)}
          onOrderCreated={(created: Order) => {
            setShowNewReception(false);
            setReceiptOrder(created);
          }}
        />
      )}

      {receiptOrder && <OrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}

      {deliveryOrder && (
        <PartialDeliveryModal
          order={deliveryOrder}
          isOpen={!!deliveryOrder}
          onClose={() => setDeliveryOrder(null)}
          onSuccess={(updated) => setReceiptOrder(updated)}
        />
      )}

      {showNewCustomer && canCreateReception && (
        <NewCustomerModal
          isOpen={showNewCustomer}
          onClose={() => setShowNewCustomer(false)}
          onCustomerSaved={() => setShowNewCustomer(false)}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
