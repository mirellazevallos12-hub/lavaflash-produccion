import React from 'react';
import { BUSINESS } from '../../config/business';
import { 
  X, Clock, DollarSign, Scale, Shirt, Layers, 
  Grid, Palette, Flame, Armchair, AlertTriangle, 
  CheckCircle2, Phone, MapPin, MessageSquare, Sparkles, BookOpen 
} from 'lucide-react';

interface InformationBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerPriceMenu?: () => void;
}

export const InformationBoardModal: React.FC<InformationBoardModalProps> = ({
  isOpen,
  onClose,
  onOpenCustomerPriceMenu
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Panel de Información &amp; Tarifas Oficiales
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                  Lavaflash San Borja
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guía rápida de tiempos de entrega, tarifas vigentes y reglas para mostrador y clientes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* Top Quick Bar: WhatsApp & Sede */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">WhatsApp Oficial:</span>
                <a 
                  href={BUSINESS.whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-700 hover:text-emerald-800 font-black text-sm"
                >
                  {BUSINESS.phoneCompact}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Sede Central:</span>
                <span className="text-slate-700 font-semibold">{BUSINESS.addressShort}</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: Plazos Oficiales de Entrega */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                1. Plazos Oficiales de Entrega
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Al Peso */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>Ropa al Peso</span>
                </div>
                <div className="text-xl font-black text-indigo-950 font-mono">
                  Cada 48 Horas
                </div>
                <span className="inline-block text-[11px] font-bold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-md">
                  Dejando 1 Día
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Lavado, secado a máquina y doblado prolijo de prendas de uso diario.
                </p>
              </div>

              {/* Al Seco */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
                  <Shirt className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Ropa al Seco</span>
                </div>
                <div className="text-xl font-black text-sky-950 font-mono">
                  3 a 4 Días
                </div>
                <span className="inline-block text-[11px] font-bold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-md">
                  Según el Material
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Tornos, vestidos finos, abrigos y sedas que requieren desmanchado delicado.
                </p>
              </div>

              {/* Edredones */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Edredones &amp; Frazadas</span>
                </div>
                <div className="text-xl font-black text-amber-950 font-mono">
                  1 Semana (7 Días)
                </div>
                <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                  Lavado al Seco / Delicado
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Desinfección térmica y secado integral profundo de rellenos sintéticos o plumas.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Tarifario Completo & Reglas de Cobro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                2. Tarifas Vigentes de Precios &amp; Condiciones
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Lavado al Peso */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Lavado al Peso (Prendas Diarias)
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Entrega: 48h
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">Ropa Diaria (a partir de 3 kg):</span>
                    <span className="font-black font-mono text-indigo-700">S/ 4.50 / kg</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50/60 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">Tarifa Mínima (&lt; 3 kg):</span>
                    <span className="font-black font-mono text-amber-800">S/ 12.00 tarifa fija</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">Carga Exclusiva Sábanas y Toallas:</span>
                    <span className="font-black font-mono text-slate-900">S/ 6.00 / kg</span>
                  </div>
                </div>

                {/* Important rule badge */}
                <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded-xl text-[11px] text-amber-950 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Reglas de recepción Al Peso:</span>
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                    <li>Solo para ropa diaria (ropa interior, polos, pantalones, camisas comunes).</li>
                    <li>En la carga se permite <strong>máximo 1 juego de sábanas o 1 toalla</strong>.</li>
                    <li><strong>NO entran edredones ni frazadas al peso</strong>; van al seco por pieza.</li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Lavado al Seco, Edredones y Frazadas */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase">
                    <Shirt className="w-4 h-4 text-sky-600" />
                    Lavado al Seco, Edredones &amp; Frazadas
                  </span>
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
                    15-20 días / Edredón: 1 sem.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Terno 2 Piezas:</span>
                    <span className="font-black font-mono text-slate-900">S/ 35.00</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Saco / Blazer:</span>
                    <span className="font-black font-mono text-slate-900">S/ 20.00</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Pantalón / Falda:</span>
                    <span className="font-black font-mono text-slate-900">S/ 15.00</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Vestido Fiesta / Noche:</span>
                    <span className="font-black font-mono text-slate-900">S/ 40.00</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Abrigo Paño / Gabardina:</span>
                    <span className="font-black font-mono text-slate-900">S/ 30.00</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Casaca Plumas / Cuero Sint.:</span>
                    <span className="font-black font-mono text-slate-900">S/ 28.00</span>
                  </div>
                </div>

                {/* Edredones Highlight */}
                <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-sky-950 block">Edredones &amp; Frazadas (Entrega: 1 semana):</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 font-mono font-bold text-[11px]">
                    <div className="bg-white p-1 rounded-lg border border-sky-100">
                      <span className="text-[10px] text-slate-500 block font-sans">2 Plazas</span>
                      <span className="text-sky-900">S/ 28.00</span>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-sky-100">
                      <span className="text-[10px] text-slate-500 block font-sans">King / Queen</span>
                      <span className="text-sky-900">S/ 35.00</span>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-sky-100">
                      <span className="text-[10px] text-slate-500 block font-sans">Frazada Polar</span>
                      <span className="text-sky-900">S/ 20.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Alfombras (m2) */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase">
                    <Grid className="w-4 h-4 text-teal-600" />
                    Lavado de Alfombras (por m²)
                  </span>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                    15-20 días
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 block">Alfombra Sintética / Convencional:</span>
                      <span className="text-[10px] text-slate-500">Cálculo: Alto (m) × Ancho (m) × S/ 18</span>
                    </div>
                    <span className="font-black font-mono text-teal-700">S/ 18.00 / m²</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 block">Alfombra Persa o Lana Natural:</span>
                      <span className="text-[10px] text-slate-500">Lavado artesanal con secado antiácaros</span>
                    </div>
                    <span className="font-black font-mono text-teal-700">S/ 30.00 / m²</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * El sistema de recepción cuenta con calculadora automática al ingresar el alto y ancho.
                </p>
              </div>

              {/* Card 4: Otros Servicios (Teñido, Muebles, Planchado) */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Teñido, Muebles &amp; Planchado
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-purple-50/50 rounded-xl">
                    <span className="font-medium text-slate-800">Teñido Pantalón Jean / Dril (Azul/Negro):</span>
                    <span className="font-black font-mono text-purple-900">S/ 25.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50/50 rounded-xl">
                    <span className="font-medium text-slate-800">Teñido Casaca / Polerón:</span>
                    <span className="font-black font-mono text-purple-900">S/ 32.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-rose-50/50 rounded-xl">
                    <span className="font-medium text-slate-800">Lavado de Mueble 2 Cuerpos (A Domicilio):</span>
                    <span className="font-black font-mono text-rose-900">S/ 85.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-50/50 rounded-xl">
                    <span className="font-medium text-slate-800">Planchado a Vapor Camisa / Blusa:</span>
                    <span className="font-black font-mono text-amber-900">S/ 6.00</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Tarifario oficial registrado en el catálogo central de Lavaflash San Borja.
          </span>
          <div className="flex items-center gap-2">
            {onOpenCustomerPriceMenu && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomerPriceMenu();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ver Carta Digital del Cliente</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
