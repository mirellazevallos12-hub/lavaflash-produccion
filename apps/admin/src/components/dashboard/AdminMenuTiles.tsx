import React from 'react';
import type { UserRole } from '../../types';
import {
  BellRing,
  Bike,
  Boxes,
  CheckSquare,
  DollarSign,
  History,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Plus,
  ShieldAlert,
  Shirt,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';

type Props = {
  role: UserRole;
  onSelectTab: (tab: string) => void;
  onNewReception: () => void;
};

type Tile = {
  id: string;
  label: string;
  tab?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  action?: 'NEW_RECEPTION' | 'WHATSAPP';
};

const TILES: Tile[] = [
  { id: 'VENTA', label: 'VENTA', tab: 'MOSTRADOR', icon: Shirt, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'CLIENTES', label: 'CLIENTES', tab: 'CLIENTES', icon: Users, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'PRENDAS', label: 'PRENDAS', tab: 'WORKFLOW', icon: Layers, roles: ['ADMIN', 'MOSTRADOR', 'CALIDAD', 'MOTORIZADO'] },
  { id: 'NUEVA_RECEPCION', label: 'NUEVA VENTA', icon: Plus, roles: ['ADMIN', 'MOSTRADOR'], action: 'NEW_RECEPTION' },
  { id: 'CAJA', label: 'CAJA', tab: 'CAJA', icon: DollarSign, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'INVENTARIO', label: 'INVENTARIO', tab: 'INVENTARIO', icon: Boxes, roles: ['ADMIN'] },
  { id: 'REPORTE', label: 'REPORTE', tab: 'INDICADORES', icon: LayoutDashboard, roles: ['ADMIN', 'MOSTRADOR'] },

  { id: 'ENTREGADOS', label: 'ENTREGADOS', tab: 'WORKFLOW', icon: CheckSquare, roles: ['ADMIN', 'MOSTRADOR', 'CALIDAD', 'MOTORIZADO'] },
  { id: 'WHATSAPP', label: 'WHATSAPP', icon: MessageCircle, roles: ['ADMIN', 'MOSTRADOR'], action: 'WHATSAPP' },
  { id: 'PROMOCIONES', label: 'PROMOCIONES', tab: 'PROMOCIONES', icon: Tag, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'SERVICIOS', label: 'SERVICIOS', tab: 'SERVICIOS_CRUD', icon: Sparkles, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'CALIDAD', label: 'CALIDAD', tab: 'CALIDAD', icon: CheckSquare, roles: ['ADMIN', 'CALIDAD'] },
  { id: 'DELIVERY', label: 'DELIVERY', tab: 'DELIVERY', icon: Bike, roles: ['ADMIN', 'MOTORIZADO'] },
  { id: 'RECLAMOS', label: 'RECLAMOS', tab: 'RECLAMOS', icon: ShieldAlert, roles: ['ADMIN', 'MOSTRADOR'] },

  { id: 'HISTORIAL', label: 'HISTORIAL VENTAS', tab: 'HISTORIAL', icon: History, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'RECORDATORIOS', label: 'DEL DÍA', tab: 'RECORDATORIOS', icon: BellRing, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'FIDELIZACION', label: 'FIDELIZACIÓN', tab: 'FIDELIZACION', icon: Sparkles, roles: ['ADMIN', 'MOSTRADOR'] },
  { id: 'AUDITORIA', label: 'AUDITORÍA', tab: 'AUDITORIA', icon: History, roles: ['ADMIN'] },
];

export const AdminMenuTiles: React.FC<Props> = ({ role, onSelectTab, onNewReception }) => {
  const tiles = TILES.filter((tile) => tile.roles.includes(role));

  const handleTile = (tile: Tile) => {
    if (tile.action === 'NEW_RECEPTION') {
      onNewReception();
      return;
    }
    if (tile.action === 'WHATSAPP') {
      window.open('https://wa.me/51942279627', '_blank', 'noopener,noreferrer');
      return;
    }
    if (tile.tab) onSelectTab(tile.tab);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600">Accesos rápidos</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">Panel administrativo</h2>
          <p className="mt-1 text-xs text-slate-500">Selecciona un módulo para trabajar.</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-100">
          Lava Flash
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const isWhatsApp = tile.action === 'WHATSAPP';
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTile(tile)}
              className="group min-h-[170px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-950/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <div className={`mx-auto flex aspect-square w-full max-w-[132px] items-center justify-center rounded-full shadow-inner transition-transform duration-200 group-hover:scale-[1.03] ${
                isWhatsApp ? 'bg-emerald-500 text-white' : 'bg-cyan-500 text-white'
              }`}>
                <Icon className="h-14 w-14 stroke-[1.7] sm:h-16 sm:w-16" />
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <p className="text-[11px] font-black uppercase tracking-tight text-indigo-950 sm:text-xs">{tile.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
