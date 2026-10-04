import React, { useState, useMemo } from 'react';
import { 
  X, Search, Printer, MessageSquare, Clock, 
  Sparkles, Check, Plus, Minus, Trash2,
  Bike, AlertCircle, MapPin, Phone,
  Flame, Shirt, Layers, Palette, Scale, ArrowRight
} from 'lucide-react';
import { 
  PRICE_CATEGORIES, 
  PRICE_MENU_ITEMS, 
  PriceGarmentItem 
} from './priceMenuData';
import { BUSINESS } from '../../config/business';

interface PriceMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnlineRequest?: () => void;
}

interface CartItem {
  item: PriceGarmentItem;
  quantity: number;
}

export const PriceMenuModal: React.FC<PriceMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenOnlineRequest
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBag, setSelectedBag] = useState<CartItem[]>([]);
  const [showBagDrawer, setShowBagDrawer] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return PRICE_MENU_ITEMS.filter(item => {
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Bag interactions
  const addToBag = (item: PriceGarmentItem) => {
    setSelectedBag(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, quantity: 1 }];
    });
    setShowBagDrawer(true);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedBag(prev => {
      return prev
        .map(p => {
          if (p.item.id === itemId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearBag = () => setSelectedBag([]);

  const bagTotal = useMemo(() => {
    return selectedBag.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  }, [selectedBag]);

  const totalGarments = useMemo(() => {
    return selectedBag.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [selectedBag]);

  // Generate WhatsApp message from bag or general
  const getBagWhatsAppUrl = () => {
    if (selectedBag.length === 0) {
      const text = `Hola Lavaflash, estuve revisando su Carta de Precios y quisiera consultar por un servicio.`;
      return `${BUSINESS.whatsappUrl}?text=${encodeURIComponent(text)}`;
    }

    const itemsSummary = selectedBag
      .map(b => `• ${b.quantity}x ${b.item.name} (S/ ${(b.item.price * b.quantity).toFixed(2)})`)
      .join('\n');

    const message = 
      `¡Hola Lavaflash! 👋 Vi su Carta de Precios y armé esta cotización previa:\n\n` +
      `${itemsSummary}\n\n` +
      `💰 *Total estimado:* S/ ${bagTotal.toFixed(2)}\n\n` +
      `📍 Sede: ${BUSINESS.addressShort}\n` +
      `¿Podrían confirmar disponibilidad de recojo o recepción?`;

    return `${BUSINESS.whatsappUrl}?text=${encodeURIComponent(message)}`;
  };

  // Direct single-item WhatsApp link
  const getSingleItemWhatsAppUrl = (item: PriceGarmentItem) => {
    const text = `Hola Lavaflash, vi en su Carta de Precios el servicio de *${item.name}* a S/ ${item.price.toFixed(2)} (${item.deliveryTime}). Quisiera coordinar el servicio.`;
    return `${BUSINESS.whatsappUrl}?text=${encodeURIComponent(text)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header (Screen View) */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Tarifario Oficial al Público
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  <span>San Borja: {BUSINESS.addressShort}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Carta de Precios &amp; Tiempos de Entrega</span>
              </h2>
              <p className="text-xs text-slate-300">
                Consulta los costos oficiales de lavado en seco, edredones, planchado al vapor, teñido y ropa por peso.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all"
                title="Imprimir o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Carta</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Cerrar carta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Search & Rules Banner */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar prenda (ej. terno, edredón, camisa, jean, abrigo, frazada...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Quick Contact & WhatsApp Indicator */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={`${BUSINESS.whatsappUrl}?text=Hola%20Lavaflash%2C%20tengo%20una%20consulta%20sobre%20la%20carta%20de%20precios`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 rounded-xl transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>WhatsApp: {BUSINESS.phoneCompact}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {PRICE_CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
                }`}
              >
                {cat.id === 'AL_SECO' && <Shirt className="w-3.5 h-3.5" />}
                {cat.id === 'EDREDONES' && <Layers className="w-3.5 h-3.5" />}
                {cat.id === 'PLANCHADO' && <Flame className="w-3.5 h-3.5" />}
                {cat.id === 'TENIDO' && <Palette className="w-3.5 h-3.5" />}
                {cat.id === 'AL_PESO' && <Scale className="w-3.5 h-3.5" />}
                {cat.id === 'ALL' && <Sparkles className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
                {cat.delivery && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.delivery}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Operational Guarantee Rule Pill Bar */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-4 py-2 text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Reglas de entrega garantizadas:</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">
              Al peso: <strong>48h (dejando 1 día)</strong> • Al seco: <strong>3 a 4 días</strong> • Edredones: <strong>1 semana</strong>
            </span>
          </div>
          <span className="text-amber-900 font-semibold">
            ⚖️ Menos de 3 kg al peso: S/ 12.00 fijo | Edredones NO van al peso
          </span>
        </div>

        {/* Garment Cards Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                No encontramos prendas con "{searchQuery}"
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba buscando otro término o consulta directamente con nuestro equipo por WhatsApp al {BUSINESS.phoneCompact}.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Ver toda la carta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map(item => {
                const inBag = selectedBag.find(b => b.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-teal-400/80 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                            {item.categoryLabel}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-teal-700 transition-colors">
                            {item.name}
                          </h4>
                        </div>

                        {/* Price Badge */}
                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-lg font-black text-slate-900">
                            S/ {item.price.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            por {item.unit}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Delivery Time & Notes */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>Entrega: {item.deliveryTime}</span>
                        </span>
                        {item.deliveryHoursNote && (
                          <span className="text-[10px] text-slate-600 italic">
                            ({item.deliveryHoursNote})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={getSingleItemWhatsAppUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 fill-emerald-600" />
                        <span>Pedir vía WhatsApp</span>
                      </a>

                      {/* Add to quotation bag */}
                      {inBag ? (
                        <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-white text-teal-700 hover:bg-teal-100 flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-teal-900 px-1.5">
                            {inBag.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToBag(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <Plus className="w-3 h-3 text-teal-600" />
                          <span>Agregar a cotización</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Bag Summary (if items added) or Footer Info */}
        {selectedBag.length > 0 ? (
          <div className="p-4 bg-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-teal-800 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center font-bold text-teal-200">
                {totalGarments}
              </div>
              <div>
                <span className="text-xs text-teal-200 block">Prendas seleccionadas ({selectedBag.length} tipos):</span>
                <span className="text-base font-black text-white">
                  Total estimado: S/ {bagTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={clearBag}
                className="px-3 py-2 text-xs font-medium text-teal-200 hover:text-white bg-teal-800/80 hover:bg-teal-800 rounded-xl transition-all"
              >
                Vaciar
              </button>
              
              <a
                href={getBagWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>Enviar cotización por WhatsApp</span>
              </a>

              {onOpenOnlineRequest && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenOnlineRequest();
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-teal-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Bike className="w-4 h-4 text-teal-600" />
                  <span className="hidden sm:inline">Solicitar Recojo</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Sede Central: <strong>{BUSINESS.addressShort}</strong> | {BUSINESS.hours}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={`${BUSINESS.whatsappUrl}?text=Hola%20Lavaflash%2C%20quisiera%20consultar%20por%20un%20servicio%20no%20listado`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-emerald-600" />
                <span>¿Prenda no listada? Pregúntanos por WhatsApp</span>
              </a>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
