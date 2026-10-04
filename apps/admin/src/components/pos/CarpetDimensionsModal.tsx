import React, { useState, useMemo } from 'react';
import { CatalogService } from '../../types';
import { 
  X, Grid, Ruler, Sparkles, AlertCircle, 
  Check, Plus, Minus, Info, Calculator 
} from 'lucide-react';

interface CarpetDimensionsModalProps {
  isOpen: boolean;
  service: CatalogService;
  availableCarpetServices?: CatalogService[];
  onClose: () => void;
  onConfirm: (data: {
    service: CatalogService;
    heightMeters: number;
    widthMeters: number;
    areaM2: number;
    subtotal: number;
    notes: string;
  }) => void;
  initialHeight?: number;
  initialWidth?: number;
  initialNotes?: string;
}

export const CarpetDimensionsModal: React.FC<CarpetDimensionsModalProps> = ({
  isOpen,
  service: initialService,
  availableCarpetServices = [],
  onClose,
  onConfirm,
  initialHeight = 2.5,
  initialWidth = 1.8,
  initialNotes = ''
}) => {
  const [selectedService, setSelectedService] = useState<CatalogService>(initialService);
  const [height, setHeight] = useState<number>(initialHeight);
  const [width, setWidth] = useState<number>(initialWidth);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [carpetTypeCustom, setCarpetTypeCustom] = useState<string>('');

  if (!isOpen) return null;

  // Calculate Area and Subtotal
  const areaM2 = useMemo(() => {
    const h = Number(height) || 0;
    const w = Number(width) || 0;
    return Math.round(h * w * 100) / 100;
  }, [height, width]);

  const subtotal = useMemo(() => {
    return Math.round(areaM2 * selectedService.unitPrice * 100) / 100;
  }, [areaM2, selectedService.unitPrice]);

  // Dimension presets for fast POS operation
  const presets = [
    { label: 'Chica', h: 1.5, w: 1.0, area: 1.5 },
    { label: 'Mediana', h: 2.0, w: 1.5, area: 3.0 },
    { label: 'Estándar', h: 2.5, w: 1.8, area: 4.5 },
    { label: 'Sala Grande', h: 3.0, w: 2.0, area: 6.0 },
    { label: 'Extra Grande', h: 4.0, w: 3.0, area: 12.0 },
  ];

  const handleApplyPreset = (h: number, w: number) => {
    setHeight(h);
    setWidth(w);
  };

  const handleAdjust = (dimension: 'h' | 'w', delta: number) => {
    if (dimension === 'h') {
      setHeight(prev => Math.max(0.2, Math.round((prev + delta) * 10) / 10));
    } else {
      setWidth(prev => Math.max(0.2, Math.round((prev + delta) * 10) / 10));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (areaM2 <= 0) {
      alert('Las medidas deben ser mayores a cero.');
      return;
    }

    const fullNotes = [
      `Medidas: ${height.toFixed(2)}m (alto) × ${width.toFixed(2)}m (ancho) = ${areaM2.toFixed(2)} m²`,
      carpetTypeCustom ? `Detalle: ${carpetTypeCustom}` : '',
      notes.trim()
    ].filter(Boolean).join(' | ');

    onConfirm({
      service: selectedService,
      heightMeters: height,
      widthMeters: width,
      areaM2,
      subtotal,
      notes: fullNotes
    });
  };

  // Aspect ratio calculation for visual preview box
  const previewAspectRatio = useMemo(() => {
    if (!height || !width) return 1;
    const ratio = width / height;
    // clamp between 0.4 and 2.5 for nice container display
    return Math.min(Math.max(ratio, 0.4), 2.5);
  }, [height, width]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 border border-white/10 shadow-inner">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Calculadora de Alfombras</h3>
                <span className="text-[10px] uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-300/30 px-2 py-0.5 rounded-full font-bold">
                  Por m²
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-medium">
                Ingresa altura y ancho en metros para el cálculo automático
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Service Selector if multiple carpet options exist */}
          {availableCarpetServices.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Tipo de Lavado de Alfombra:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableCarpetServices.map(srv => {
                  const isSelected = selectedService.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                        isSelected 
                          ? 'border-teal-600 bg-teal-50/80 text-teal-950 font-bold shadow-xs' 
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="line-clamp-1">{srv.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-1" />}
                      </div>
                      <span className="text-[11px] text-teal-700 font-bold block mt-1">
                        S/ {srv.unitPrice.toFixed(2)} por m²
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Medidas comunes / Preconfiguradas:</span>
              <span className="text-[10px] text-teal-700 font-semibold">Clic para rellenar rápido</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => {
                const isActive = Math.abs(height - p.h) < 0.05 && Math.abs(width - p.w) < 0.05;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.h, p.w)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isActive 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="font-bold">{p.label}:</span> {p.h}m × {p.w}m ({p.area} m²)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs for Altura (Largo) y Ancho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            {/* Altura / Largo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-teal-600" />
                  Altura / Largo (metros):
                </span>
                <span className="text-[11px] font-mono text-teal-700 font-bold">{height.toFixed(2)} m</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust('h', -0.1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    max="30"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-center text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">m</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjust('h', 0.1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-1 justify-center">
                {[1.5, 2.0, 2.5, 3.0].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHeight(v)}
                    className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    {v.toFixed(1)}m
                  </button>
                ))}
              </div>
            </div>

            {/* Ancho */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-teal-600" />
                  Ancho (metros):
                </span>
                <span className="text-[11px] font-mono text-teal-700 font-bold">{width.toFixed(2)} m</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust('w', -0.1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    max="30"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-center text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">m</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjust('w', 0.1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-1 justify-center">
                {[1.0, 1.5, 1.8, 2.0].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWidth(v)}
                    className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    {v.toFixed(1)}m
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Visual Carpet Simulation & Live Calculation Display */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50/50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Visual rug graphic with proportion representation */}
            <div className="w-full sm:w-44 flex flex-col items-center justify-center py-2">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest mb-1.5 block">
                Proporción Visual
              </span>
              <div className="h-28 w-36 bg-slate-200/60 rounded-xl p-2 flex items-center justify-center border border-dashed border-teal-300/80">
                <div 
                  style={{ 
                    aspectRatio: `${previewAspectRatio}`,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  className="bg-gradient-to-tr from-teal-700 to-teal-500 rounded-lg shadow-sm border border-white/50 flex flex-col items-center justify-center p-1 text-white text-center transition-all duration-200"
                >
                  <Grid className="w-3 h-3 opacity-60 mb-0.5" />
                  <span className="text-[9px] font-bold leading-none">
                    {areaM2.toFixed(2)} m²
                  </span>
                  <span className="text-[8px] opacity-80 mt-0.5">
                    {height}m × {width}m
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex-1 w-full space-y-2 border-t sm:border-t-0 sm:border-l border-teal-200 sm:pl-4 pt-3 sm:pt-0">
              <div className="flex items-center justify-between text-xs text-teal-900">
                <span className="font-medium">Fórmula de Área:</span>
                <span className="font-mono font-bold">{height.toFixed(2)}m × {width.toFixed(2)}m</span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-teal-900">
                <span className="font-bold">Total Metros Cuadrados:</span>
                <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-md border border-teal-300 text-teal-800">
                  {areaM2.toFixed(2)} m²
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-teal-900">
                <span className="font-medium">Tarifa del Servicio:</span>
                <span className="font-mono font-bold">S/ {selectedService.unitPrice.toFixed(2)} / m²</span>
              </div>

              <div className="pt-2 border-t border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider block">
                    Precio Total Calculado:
                  </span>
                  <span className="text-[10px] text-teal-600">
                    ({areaM2.toFixed(2)} m² × S/ {selectedService.unitPrice.toFixed(2)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">
                    S/ {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Observations & Stains for the carpet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Observaciones del estado de la alfombra (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Mancha de vino en el centro, deshilachado en fleco izquierdo, pelo alto..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/25 transition-all"
          >
            <Calculator className="w-4 h-4" />
            <span>Agregar Alfombra (S/ {subtotal.toFixed(2)})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
