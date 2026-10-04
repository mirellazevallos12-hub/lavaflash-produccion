import { HistoricalModule } from '../reports/HistoricalModule';
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Order } from '../../types';
import { db } from '../../services/db';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  User, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ShoppingBag, 
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Filter,
  DollarSign
} from 'lucide-react';
import { EditCustomerModal } from './EditCustomerModal';
import { CustomerOrdersModal } from './CustomerOrdersModal';
import { NewCustomerModal } from './NewCustomerModal';

interface CustomerListViewProps {
  onOpenNewReceptionWithCustomer?: (customer: Customer) => void;
  onOpenReceipt?: (order: Order) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onOpenNewReceptionWithCustomer,
  onOpenReceipt,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'NATURAL' | 'EMPRESA' | 'LOYALTY' | 'PENDING_DEBT'>('ALL');
  
  // Modals state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [inspectingCustomerOrders, setInspectingCustomerOrders] = useState<Customer | null>(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  
  // Feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Subscribe to reactive database changes
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setCustomers(db.getCustomers());
      setOrders(db.getOrders());
    });
    return () => unsub();
  }, []);

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter(c => {
      // Search match
      const name = (c.fullName || '').toLowerCase();
      const phone = (c.phone || '').trim();
      const doc = (c.documentNumber || '').trim();
      const email = (c.email || '').toLowerCase();
      const address = (c.address || '').toLowerCase();

      const matchesSearch = !query || (
        name.includes(query) ||
        phone.includes(query) ||
        doc.includes(query) ||
        email.includes(query) ||
        address.includes(query)
      );

      if (!matchesSearch) return false;

      // Filter tabs
      if (filterType === 'NATURAL') return c.clientType === 'NATURAL' || c.documentType !== 'RUC';
      if (filterType === 'EMPRESA') return c.clientType === 'EMPRESA' || c.documentType === 'RUC';
      if (filterType === 'LOYALTY') return c.hasPendingVoucher || c.activeLoyaltyStamps >= 5;
      if (filterType === 'PENDING_DEBT') {
        const custOrders = orders.filter(o => o.customerId === c.id);
        return custOrders.some(o => o.pendingBalance > 0);
      }

      return true;
    });
  }, [customers, orders, searchQuery, filterType]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = customers.length;
    const empresas = customers.filter(c => c.clientType === 'EMPRESA' || c.documentType === 'RUC').length;
    const conVales = customers.filter(c => c.hasPendingVoucher).length;
    
    // Customers with uncollected orders
    const customersWithUncollected = new Set(
      orders
        .filter(o => o.status === 'LISTO_PARA_ENTREGA' || o.status === 'ENTREGA_PARCIAL')
        .map(o => o.customerId)
    ).size;

    return { total, empresas, conVales, customersWithUncollected };
  }, [customers, orders]);

  return (
    <div className="space-y-6">
      <HistoricalModule context="clientes" />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-emerald-600 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Directorio de Clientes</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta y edición de números de celular, direcciones, historial y fidelización de clientes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xl shrink-0">
            {stats.total}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Clientes</span>
            <span className="text-sm font-black text-slate-900">Registrados en POS</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xl shrink-0">
            {stats.conVales}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Vales S/ 15 Activos</span>
            <span className="text-sm font-black text-purple-900">10° Servicio Premio</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xl shrink-0">
            {stats.customersWithUncollected}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Prendas por Recoger</span>
            <span className="text-sm font-black text-amber-900">Listas en Mostrador</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xl shrink-0">
            {stats.empresas}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Empresas / RUC</span>
            <span className="text-sm font-black text-blue-900">Clientes Factura</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente por nombre, número de celular, DNI/RUC o email..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto shrink-0 pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({customers.length})
            </button>

            <button
              onClick={() => setFilterType('NATURAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === 'NATURAL'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Naturales
            </button>

            <button
              onClick={() => setFilterType('EMPRESA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === 'EMPRESA'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Empresas
            </button>

            <button
              onClick={() => setFilterType('LOYALTY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                filterType === 'LOYALTY'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Con Vales / Sellos</span>
            </button>

            <button
              onClick={() => setFilterType('PENDING_DEBT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                filterType === 'PENDING_DEBT'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Con Saldo Pendiente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Cards / List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No se encontraron clientes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery 
              ? `No hay coincidencias para la búsqueda "${searchQuery}". Intente con otro nombre, número de celular o documento.`
              : 'No hay clientes registrados con este filtro.'}
          </p>
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0) || customer.totalSpent || 0;
            const pendingOrders = customerOrders.filter(o => o.status === 'LISTO_PARA_ENTREGA' || o.status === 'ENTREGA_PARCIAL');
            const hasPendingBalance = customerOrders.reduce((sum, o) => sum + o.pendingBalance, 0);

            const isCompany = customer.clientType === 'EMPRESA' || customer.documentType === 'RUC';

            return (
              <div 
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Identity & Document */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                        isCompany 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}>
                        {isCompany ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {customer.fullName}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {customer.documentType}: {customer.documentNumber}
                          </span>

                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isCompany ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isCompany ? 'Empresa' : 'Natural'}
                          </span>

                          {customer.hasPendingVoucher && (
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-purple-200">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              Vale S/ 15
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      title="Editar celular y datos de este cliente"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-colors shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* KEY SECTION: EDITABLE PHONE NUMBER & CONTACT */}
                  <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                    {/* Celular with WhatsApp and Call actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-xs font-black font-mono text-slate-900 tracking-wide">
                          {customer.phone || 'Sin celular'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyPhone(customer.id, customer.phone)}
                          title="Copiar número"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          {copiedPhoneId === customer.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* WhatsApp button */}
                        <a
                          href={`https://wa.me/51${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir chat de WhatsApp"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Direct call */}
                        <a
                          href={`tel:${customer.phone}`}
                          title="Llamar directamente"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[10px] font-bold transition-colors"
                        >
                          Llamar
                        </a>
                      </div>
                    </div>

                    {/* Email if present */}
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {/* Address if present */}
                    {customer.address && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-tight">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}

                    {/* Observations / Preferences if present */}
                    {customer.observations && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 italic">
                        {customer.observations}
                      </p>
                    )}
                  </div>

                  {/* Active Orders / Alerts Indicator */}
                  {pendingOrders.length > 0 && (
                    <div className="mt-2.5 bg-amber-50 border border-amber-300 rounded-xl p-2 flex items-center justify-between text-xs text-amber-900">
                      <span className="font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {pendingOrders.length} orden(es) por recoger
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                        En Mostrador
                      </span>
                    </div>
                  )}

                  {hasPendingBalance > 0 && (
                    <div className="mt-1 bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-center justify-between text-xs text-rose-800 font-semibold">
                      <span>Saldo total pendiente:</span>
                      <span className="font-mono font-bold text-rose-700">S/ {hasPendingBalance.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Loyalty Card & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* Loyalty Card Mini Bar */}
                  <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tarjeta de Sellos</span>
                      <span className="font-bold text-slate-800">
                        {customer.activeLoyaltyStamps}/10 sellos
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Total Órdenes</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {totalOrders} (S/ {totalSpent.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInspectingCustomerOrders(customer)}
                      className="w-full py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                      <span>Ver Órdenes ({totalOrders})</span>
                    </button>

                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="w-full py-2 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                      <span>Editar Celular</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {editingCustomer && (
        <EditCustomerModal
          isOpen={!!editingCustomer}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onCustomerUpdated={(updated) => {
            setToastMessage(`¡Datos de ${updated.fullName} actualizados con éxito!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {inspectingCustomerOrders && (
        <CustomerOrdersModal
          isOpen={!!inspectingCustomerOrders}
          customer={inspectingCustomerOrders}
          onClose={() => setInspectingCustomerOrders(null)}
          onOpenReceipt={onOpenReceipt}
        />
      )}

      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerSaved={(newCust: Customer) => {
            setShowNewCustomerModal(false);
            setToastMessage(`¡Cliente ${newCust.fullName} registrado correctamente!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}
    </div>
  );
};
