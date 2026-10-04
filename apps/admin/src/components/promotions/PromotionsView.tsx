import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Promotion, ServiceCategory } from '../../types';
import { Tag, Plus, CheckCircle2, XCircle, Calendar, Sparkles, Percent } from 'lucide-react';

export const PromotionsView: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PORCENTAJE' | 'MONTO_FIJO'>('PORCENTAJE');
  const [discountValue, setDiscountValue] = useState('15');
  const [category, setCategory] = useState<ServiceCategory | 'TODOS'>('TODOS');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const loadData = () => {
    setPromotions(db.getPromotions());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleToggleActive = (id: string) => {
    db.togglePromotion(id);
  };

  const handleCreatePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    db.savePromotion({
      id: `promo-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      applicableCategory: category,
      active: true,
      validUntil: new Date(validUntil).toISOString(),
      timesUsed: 0
    });

    setShowModal(false);
    setCode('');
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Promociones y Campañas de Marketing
          </h1>
          <p className="text-xs text-slate-500">
            Configuración de descuentos especiales por día, categoría de prendas y cupones de fidelización.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña / Descuento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
              p.active ? 'border-teal-200 shadow-xs' : 'border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                  {p.code}
                </span>
                <button
                  onClick={() => handleToggleActive(p.id)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {p.active ? 'Activa' : 'Pausada'}
                </button>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-2">{p.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{p.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Beneficio:</span>
                <span className="text-base font-black text-teal-600 font-mono">
                  {p.discountType === 'PORCENTAJE' ? `${p.discountValue}% OFF` : `S/ ${p.discountValue.toFixed(2)}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Usado:</span>
                <span className="font-bold text-slate-700">{p.timesUsed} veces</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Crear Nueva Promoción</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePromotion} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Código del Cupón:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. VERANO20"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Tipo de Descuento:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO_FIJO">Monto Fijo (S/)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Nombre de la Campaña:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Miércoles de Ternos y Vestidos"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Valor de Descuento:</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Aplica a Categoría:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="TODOS">Todas las categorías</option>
                    <option value="AL_SECO">Al Seco</option>
                    <option value="AL_PESO">Al Peso</option>
                    <option value="ALFOMBRAS">Alfombras</option>
                    <option value="PLANCHADO">Planchado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Descripción para el cliente:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. 15% de descuento en prendas al seco"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Válido hasta:</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Publicar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
