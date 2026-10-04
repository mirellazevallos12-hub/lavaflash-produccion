import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Customer, Order } from '../../types';
import { NewCustomerModal } from './NewCustomerModal';
import { 
  Users, Gift, Search, Sparkles, Plus, 
  History, Phone, MapPin, Receipt, Star, CheckCircle2, 
  Award, ShieldCheck, ArrowRight, Building2, User
} from 'lucide-react';

interface CustomerLoyaltyViewProps {
  onSelectCustomerForOrder?: (customer: Customer) => void;
}

export const CustomerLoyaltyView: React.FC<CustomerLoyaltyViewProps> = ({
  onSelectCustomerForOrder
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  const loadData = () => {
    const list = db.getCustomers();
    setCustomers(list);
    if (!selectedCustomer && list.length > 0) {
      setSelectedCustomer(list[0]);
      setCustomerOrders(db.getOrdersByCustomer(list[0].id));
    } else if (selectedCustomer) {
      const refreshed = list.find(c => c.id === selectedCustomer.id);
      if (refreshed) {
        setSelectedCustomer(refreshed);
        setCustomerOrders(db.getOrdersByCustomer(refreshed.id));
      }
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerOrders(db.getOrdersByCustomer(c.id));
  };

  const handleCustomerCreated = (newCust: Customer) => {
    loadData();
    setSelectedCustomer(newCust);
    setCustomerOrders(db.getOrdersByCustomer(newCust.id));
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.documentNumber.includes(searchQuery) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Gestión de Clientes &amp; Tarjeta de Vales Digital
            </h1>
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-800 px-2 py-0.5 rounded-full border border-teal-500/30">
              Lavaflash Club
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Directorio de clientes y sellos de fidelización. Los datos se registran manualmente y permanecen en este navegador hasta conectar la base central.
          </p>
        </div>

        <button
          onClick={() => setShowNewCustomerModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Registrar Nuevo Cliente (DNI / RUC)
        </button>
      </div>

      {/* Main Grid: List (4 cols) & Detail Card (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Customers Directory (4 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col h-[650px]">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por DNI/RUC, nombre o celular..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Customer list scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No se encontraron clientes con el criterio ingresado.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                const isCompany = c.clientType === 'EMPRESA' || c.documentType === 'RUC';

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 shadow-2xs'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isCompany ? (
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {c.fullName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{c.documentType}: {c.documentNumber}</span>
                        <span>•</span>
                        <span>{c.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {c.activeLoyaltyStamps}/10
                      </span>
                      {c.hasPendingVoucher && (
                        <span className="block text-[9px] font-bold text-amber-600 uppercase mt-1">
                          ★ Vale S/15
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Customer Profile & Digital Loyalty Card (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedCustomer ? (
            <>
              {/* VIRTUAL LOYALTY CARD (TARJETA DE VALES DIGITAL) */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-teal-500/20 relative overflow-hidden space-y-5">
                
                {/* Header card */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">
                      LAVAFLASH - TARJETA DE VALES DIGITAL
                    </span>
                    <h2 className="text-xl font-black text-white mt-1 leading-tight">
                      {selectedCustomer.fullName}
                    </h2>
                    <span className="text-xs text-teal-200 font-mono">
                      {selectedCustomer.documentType}: {selectedCustomer.documentNumber} • {selectedCustomer.phone}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    selectedCustomer.clientType === 'EMPRESA' || selectedCustomer.documentType === 'RUC'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}>
                    {selectedCustomer.clientType === 'EMPRESA' || selectedCustomer.documentType === 'RUC' ? 'Empresa' : 'Persona'}
                  </span>
                </div>

                {/* 10 STAMPS INTERACTIVE GRID */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Gift className="w-4 h-4 text-amber-400" />
                      Acumulador de Servicios (Regla: 10° Servicio = Vale de S/ 15.00)
                    </span>
                    <span className="font-mono font-bold text-teal-300 text-sm">
                      {selectedCustomer.activeLoyaltyStamps} de 10 Sellos
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const stampNumber = idx + 1;
                      const isStamped = stampNumber <= selectedCustomer.activeLoyaltyStamps;
                      const isMilestone = stampNumber === 10;

                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                            isStamped
                              ? 'border-teal-400 bg-teal-500/30 text-teal-200 shadow-md shadow-teal-500/20'
                              : isMilestone
                                ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 ring-2 ring-amber-400/20'
                                : 'border-white/10 bg-white/5 text-white/40'
                          }`}
                        >
                          {isStamped ? (
                            <CheckCircle2 className="w-5 h-5 text-teal-300" />
                          ) : isMilestone ? (
                            <Gift className="w-5 h-5 text-amber-300 animate-pulse" />
                          ) : (
                            <span className="text-xs font-bold font-mono">{stampNumber}</span>
                          )}
                          <span className="text-[8px] font-bold mt-0.5">
                            {isMilestone ? 'VALE' : `#${stampNumber}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status message of Voucher */}
                {selectedCustomer.hasPendingVoucher ? (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>
                        ¡Felicidades! Este cliente tiene un <strong>Vale de S/ 15.00 de Descuento</strong> disponible para su próxima orden en Lavaflash.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-300">
                    Faltan <strong>{10 - selectedCustomer.activeLoyaltyStamps} servicio(s)</strong> para completar la cartilla y canjear el vale de S/ 15.00.
                  </div>
                )}

              </div>

              {/* Order History */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-600" />
                    Historial Completo de Órdenes &amp; Recepciones
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Total órdenes: {customerOrders.length}
                  </span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Este cliente aún no registra órdenes de lavandería en el sistema.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">{ord.code}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(ord.receivedAt).toLocaleDateString('es-PE')} • {ord.items.length} prenda(s)
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            S/ {ord.total.toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            ord.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {ord.pendingBalance > 0 ? `Saldo: S/ ${ord.pendingBalance.toFixed(2)}` : 'PAGADO'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Seleccione un cliente para ver su tarjeta de fidelización e historial.
            </div>
          )}
        </div>

      </div>

      {/* NEW CUSTOMER MODAL */}
      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerSaved={handleCustomerCreated}
        />
      )}
    </div>
  );
};
