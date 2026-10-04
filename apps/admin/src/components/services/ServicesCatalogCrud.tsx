import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { CatalogService, ServiceCategory, ServiceUnit } from '../../types';
import { 
  Sparkles, Plus, Search, Edit3, Trash2, CheckCircle2, 
  XCircle, ArrowUpDown, Tag, DollarSign, Clock, 
  Layers, Shirt, Scale, Grid, Palette, Flame, Scissors, 
  Armchair, RefreshCw, Percent, AlertCircle, Check, 
  ChevronRight, Calculator, Ruler, Eye, SlidersHorizontal, 
  Info, X
} from 'lucide-react';
import { CarpetDimensionsModal } from '../pos/CarpetDimensionsModal';

const CATEGORY_CONFIG: Record<ServiceCategory, { label: string; icon: any; color: string; bg: string }> = {
  AL_SECO: { label: 'Lavado en Seco', icon: Shirt, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  AL_PESO: { label: 'Lavado por Peso (kg)', icon: Scale, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  ALFOMBRAS: { label: 'Lavado de Alfombras', icon: Grid, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  TENIDO: { label: 'Teñido de Ropa', icon: Palette, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  PLANCHADO: { label: 'Planchado Profesional', icon: Flame, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ADICIONALES: { label: 'Servicios Adicionales', icon: Scissors, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  MUEBLES: { label: 'Muebles & Colchones', icon: Armchair, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const UNIT_LABELS: Record<ServiceUnit, string> = {
  prenda: 'Por Prenda',
  kg: 'Por Kilogramo (kg)',
  m2: 'Por Metro Cuadrado (m²)',
  pieza: 'Por Pieza',
  servicio: 'Por Servicio Integral',
  par: 'Por Par',
  conjunto: 'Por Conjunto',
};

export const ServicesCatalogCrud: React.FC = () => {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<CatalogService | null>(null);
  const [testingCarpetService, setTestingCarpetService] = useState<CatalogService | null>(null);

  // Form state for Create / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('AL_SECO');
  const [formUnit, setFormUnit] = useState<ServiceUnit>('prenda');
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formMinPrice, setFormMinPrice] = useState<number | undefined>(undefined);
  const [formEstimatedHours, setFormEstimatedHours] = useState<number>(24);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formFormula, setFormFormula] = useState<'STANDARD' | 'DIMENSIONS_M2' | 'WEIGHT_KG'>('STANDARD');

  // Batch adjust state
  const [batchCategory, setBatchCategory] = useState<string>('ALL');
  const [batchPercentage, setBatchPercentage] = useState<number>(10);

  // Notification feedback
  const [notification, setNotification] = useState<string | null>(null);

  const loadServices = () => {
    setServices(db.getServices());
  };

  useEffect(() => {
    loadServices();
    return db.subscribe(loadServices);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormName('');
    setFormCategory('AL_SECO');
    setFormUnit('prenda');
    setFormUnitPrice(20);
    setFormMinPrice(undefined);
    setFormEstimatedHours(48);
    setFormDescription('');
    setFormIsActive(true);
    setFormFormula('STANDARD');
    setShowEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (srv: CatalogService) => {
    setEditingService(srv);
    setFormName(srv.name);
    setFormCategory(srv.category);
    setFormUnit(srv.unit);
    setFormUnitPrice(srv.unitPrice);
    setFormMinPrice(srv.minPrice);
    setFormEstimatedHours(srv.estimatedHours || 24);
    setFormDescription(srv.description || '');
    setFormIsActive(srv.isActive !== false);
    setFormFormula(srv.pricingFormula || (srv.category === 'ALFOMBRAS' || srv.unit === 'm2' ? 'DIMENSIONS_M2' : srv.category === 'AL_PESO' ? 'WEIGHT_KG' : 'STANDARD'));
    setShowEditModal(true);
  };

  // Auto-adjust unit & formula when category changes in form
  const handleCategoryChange = (newCat: ServiceCategory) => {
    setFormCategory(newCat);
    if (newCat === 'ALFOMBRAS') {
      setFormUnit('m2');
      setFormFormula('DIMENSIONS_M2');
      if (formUnitPrice < 10) setFormUnitPrice(18);
      if (formEstimatedHours < 48) setFormEstimatedHours(72);
    } else if (newCat === 'AL_PESO') {
      setFormUnit('kg');
      setFormFormula('WEIGHT_KG');
      if (formUnitPrice > 20) setFormUnitPrice(8);
      setFormEstimatedHours(24);
    } else if (newCat === 'PLANCHADO') {
      setFormUnit('prenda');
      setFormFormula('STANDARD');
      setFormEstimatedHours(12);
    } else if (newCat === 'TENIDO') {
      setFormUnit('prenda');
      setFormFormula('STANDARD');
      setFormEstimatedHours(72);
    } else if (newCat === 'MUEBLES') {
      setFormUnit('pieza');
      setFormFormula('STANDARD');
      setFormEstimatedHours(48);
    }
  };

  // Save Service (Create or Update)
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('El nombre del servicio es obligatorio.');
      return;
    }
    if (formUnitPrice <= 0) {
      alert('El precio debe ser mayor a cero.');
      return;
    }

    try {
      db.saveService({
        id: editingService?.id,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit,
        unitPrice: Number(formUnitPrice),
        minPrice: formMinPrice ? Number(formMinPrice) : undefined,
        estimatedHours: Number(formEstimatedHours),
        description: formDescription.trim(),
        isActive: formIsActive,
        pricingFormula: formUnit === 'm2' || formCategory === 'ALFOMBRAS' ? 'DIMENSIONS_M2' : formFormula,
      });

      setShowEditModal(false);
      showToast(editingService ? `Servicio "${formName}" actualizado con éxito.` : `Nuevo servicio "${formName}" creado exitosamente.`);
    } catch (err: any) {
      alert(err.message || 'Error al guardar el servicio');
    }
  };

  // Delete Service
  const handleConfirmDelete = () => {
    if (!showDeleteConfirm) return;
    const name = showDeleteConfirm.name;
    const ok = db.deleteService(showDeleteConfirm.id);
    if (ok) {
      showToast(`Servicio "${name}" eliminado del catálogo.`);
    }
    setShowDeleteConfirm(null);
  };

  // Toggle active
  const handleToggleStatus = (srv: CatalogService) => {
    db.toggleServiceStatus(srv.id);
    showToast(`Servicio "${srv.name}" ${srv.isActive ? 'desactivado' : 'activado'}.`);
  };

  // Inline Quick Price Update
  const handleQuickPriceChange = (srv: CatalogService, newPrice: number) => {
    if (newPrice <= 0 || isNaN(newPrice)) return;
    db.updateServicePrice(srv.id, newPrice);
    showToast(`Precio de "${srv.name}" actualizado a S/ ${newPrice.toFixed(2)}.`);
  };

  // Batch Price Adjust
  const handleApplyBatchPrices = () => {
    db.batchUpdatePrices(batchCategory, batchPercentage);
    setShowBatchModal(false);
    showToast(`Ajuste de +${batchPercentage}% aplicado correctamente.`);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('¿Está seguro de restablecer todos los servicios y tarifas a los valores de fábrica? Los cambios personalizados se sobreescribirán.')) {
      db.resetServicesToDefault();
      showToast('Tarifario restablecido a valores predeterminados.');
    }
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter(srv => {
      const matchesCat = selectedCategory === 'ALL' || srv.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        srv.name.toLowerCase().includes(q) || 
        srv.category.toLowerCase().includes(q) ||
        (srv.description && srv.description.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [services, selectedCategory, searchQuery]);

  // Catalog Statistics
  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.isActive !== false).length;
    const carpetCount = services.filter(s => s.category === 'ALFOMBRAS' || s.unit === 'm2').length;
    const avgPrice = total > 0 ? (services.reduce((acc, s) => acc + s.unitPrice, 0) / total) : 0;
    return { total, active, carpetCount, avgPrice };
  }, [services]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-teal-300 border border-teal-500/50 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs font-bold text-white">{notification}</span>
        </div>
      )}

      {/* Top Header & Overview Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Gestión de Servicios &amp; Tarifario
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  CRUD Activo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Crea, modifica, ajusta precios y configura la fórmula de cálculo de metros cuadrados para alfombras
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
            title="Aumentar o ajustar precios por porcentaje"
          >
            <Percent className="w-4 h-4 text-teal-600" />
            <span>Ajuste Masivo</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Restablecer tarifas de fábrica"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex-1 lg:flex-initial px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-teal-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Servicios</span>
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Activos en POS</span>
            <span className="text-xl font-black text-emerald-700">{stats.active}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Alfombras (m²)</span>
            <span className="text-xl font-black text-cyan-800">{stats.carpetCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tarifa Promedio</span>
            <span className="text-xl font-black text-slate-900 font-mono">S/ {stats.avgPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio por nombre o palabra clave..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end md:self-center">
            Mostrando <strong className="text-slate-900">{filteredServices.length}</strong> de {services.length} servicios
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({services.length})
          </button>
          
          {(Object.keys(CATEGORY_CONFIG) as ServiceCategory[]).map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const count = services.filter(s => s.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Servicio / Prenda</th>
                <th className="py-3.5 px-3">Categoría</th>
                <th className="py-3.5 px-3">Unidad de Cobro</th>
                <th className="py-3.5 px-4 text-right">Precio Unitario (S/)</th>
                <th className="py-3.5 px-3 text-center">Plazo Entrega</th>
                <th className="py-3.5 px-3 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No se encontraron servicios</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba con otra búsqueda o categoría</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => {
                  const catConfig = CATEGORY_CONFIG[srv.category] || CATEGORY_CONFIG.AL_SECO;
                  const Icon = catConfig.icon;
                  const isCarpetOrM2 = srv.category === 'ALFOMBRAS' || srv.unit === 'm2' || srv.pricingFormula === 'DIMENSIONS_M2';

                  return (
                    <tr 
                      key={srv.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${srv.isActive === false ? 'opacity-60 bg-slate-50/50' : ''}`}
                    >
                      {/* Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${catConfig.bg}`}>
                            <Icon className={`w-4 h-4 ${catConfig.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{srv.name}</span>
                              {isCarpetOrM2 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                                  <Ruler className="w-2.5 h-2.5 text-teal-700" />
                                  <span>Alto × Ancho</span>
                                </span>
                              )}
                              {srv.category === 'AL_PESO' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                  <Scale className="w-2.5 h-2.5 text-indigo-700" />
                                  <span>Balanza</span>
                                </span>
                              )}
                            </div>
                            {srv.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                                {srv.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${catConfig.bg} ${catConfig.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{catConfig.label}</span>
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-700 block">
                          {UNIT_LABELS[srv.unit] || `Por ${srv.unit}`}
                        </span>
                        {isCarpetOrM2 && (
                          <span className="text-[10px] text-teal-700 font-semibold block">
                            Calcula m² automáticamente
                          </span>
                        )}
                      </td>

                      {/* Unit Price with Quick Edit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span className="text-sm font-black font-mono text-slate-900">
                            S/ {srv.unitPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            /{srv.unit}
                          </span>
                        </div>
                        {srv.minPrice && (
                          <span className="text-[10px] text-slate-400 block">
                            Mínimo: S/ {srv.minPrice.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* SLA Hours */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{srv.estimatedHours || 24}h</span>
                        </span>
                      </td>

                      {/* Status Active Toggle */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(srv)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                            srv.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clic para cambiar estado activo/inactivo"
                        >
                          {srv.isActive !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* If carpet, allow testing calculator */}
                          {isCarpetOrM2 && (
                            <button
                              type="button"
                              onClick={() => setTestingCarpetService(srv)}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors"
                              title="Probar calculadora de medidas (Alto × Ancho)"
                            >
                              <Calculator className="w-4 h-4 text-teal-600" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(srv)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Modificar servicio y precio"
                          >
                            <Edit3 className="w-4 h-4 text-slate-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(srv)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT SERVICE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 border border-white/10">
                  {editingService ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingService ? 'Modificar Servicio & Precio' : 'Crear Nuevo Servicio'}
                  </h3>
                  <p className="text-xs text-teal-200/80 font-medium">
                    {editingService ? `Editando código: ${editingService.id}` : 'Registra un nuevo item en el catálogo general'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveService} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Service Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Nombre del Servicio o Prenda <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Alfombra Shaggy de Pelo Largo, Terno 3 Piezas, Vestido de Fiesta..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold text-slate-900"
                  required
                />
              </div>

              {/* Category & Unit in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Categoría de Servicio:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
                  >
                    <option value="AL_SECO">Lavado en Seco (AL_SECO)</option>
                    <option value="AL_PESO">Lavado por Peso (AL_PESO)</option>
                    <option value="ALFOMBRAS">Alfombras (ALFOMBRAS)</option>
                    <option value="TENIDO">Teñido de Ropa (TENIDO)</option>
                    <option value="PLANCHADO">Planchado Profesional (PLANCHADO)</option>
                    <option value="ADICIONALES">Adicionales &amp; Costura (ADICIONALES)</option>
                    <option value="MUEBLES">Muebles a Domicilio (MUEBLES)</option>
                  </select>
                </div>

                {/* Unit of measure */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Unidad de Medida:</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as ServiceUnit)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
                  >
                    <option value="prenda">Por Prenda (prenda)</option>
                    <option value="m2">Por Metro Cuadrado - Alto × Ancho (m²)</option>
                    <option value="kg">Por Kilo - Balanza (kg)</option>
                    <option value="servicio">Por Servicio Integral (servicio)</option>
                  </select>
                </div>

              </div>

              {/* Special Notice if Carpet or m² */}
              {(formCategory === 'ALFOMBRAS' || formUnit === 'm2') && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-teal-900">
                  <Ruler className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-teal-950">Fórmula de Medidas Activada:</span>
                    <span className="text-[11px] text-teal-800 block">
                      En el punto de venta (POS) y recepción, este servicio desplegará automáticamente la calculadora de <strong>Altura × Ancho</strong> para calcular los metros cuadrados (m²) y el precio exacto.
                    </span>
                  </div>
                </div>
              )}

              {/* Unit Price */}
              <div className="grid grid-cols-1 gap-3">
                
                {/* Unit Price */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Precio Unitario (S/) <span className="text-rose-500">*</span>:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-black text-slate-900 text-sm"
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Descripción / Instrucciones Técnicas:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles del proceso, insumos especiales, recomendaciones de cuidado..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Estado del Servicio:</span>
                  <span className="text-[11px] text-slate-500">Disponible para ser seleccionado en mostrador y órdenes</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Live Preview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Vista Previa en Punto de Venta:
                </span>
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{formName || 'Nombre del Servicio'}</span>
                    <span className="text-[10px] text-slate-400">Por {formUnit} • {formEstimatedHours}h de proceso</span>
                  </div>
                  <span className="text-sm font-black text-teal-700 font-mono">
                    S/ {Number(formUnitPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-teal-600/25"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingService ? 'Guardar Cambios' : 'Crear Servicio'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* BATCH PRICE ADJUST MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Ajuste Masivo de Precios</h3>
                <p className="text-xs text-slate-500">Actualiza las tarifas de forma porcentual</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Aplicar a Categoría:</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900"
                >
                  <option value="ALL">Todas las Categorías ({services.length} servicios)</option>
                  {(Object.keys(CATEGORY_CONFIG) as ServiceCategory[]).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Porcentaje de Incremento (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="-50"
                    max="100"
                    value={batchPercentage}
                    onChange={(e) => setBatchPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900"
                  />
                  <span className="font-black text-sm text-slate-600">%</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[5, 10, 15, 20].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBatchPercentage(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[11px]"
                    >
                      +{p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong className="block">Aviso de seguridad:</strong>
                Esta acción modificará los precios unitarios de los servicios seleccionados y quedará registrada en la bitácora de auditoría.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBatchPrices}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/25"
              >
                Aplicar Ajuste (+{batchPercentage}%)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">¿Eliminar este servicio?</h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Se eliminará permanentemente del tarifario <strong>"{showDeleteConfirm.name}"</strong> (S/ {showDeleteConfirm.unitPrice.toFixed(2)}).
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST CARPET CALCULATOR MODAL */}
      {testingCarpetService && (
        <CarpetDimensionsModal
          isOpen={!!testingCarpetService}
          service={testingCarpetService}
          availableCarpetServices={services.filter(s => s.category === 'ALFOMBRAS' || s.unit === 'm2')}
          onClose={() => setTestingCarpetService(null)}
          onConfirm={(data) => {
            setTestingCarpetService(null);
            showToast(`Cálculo de prueba: ${data.heightMeters}m × ${data.widthMeters}m = ${data.areaM2} m² ➔ S/ ${data.subtotal.toFixed(2)}`);
          }}
        />
      )}

    </div>
  );
};
