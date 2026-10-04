import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { InventoryItem, InventoryMovement } from '../../types';
import { 
  Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Plus, History, RefreshCw, CheckCircle2, Package
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Movement Form
  const [movementType, setMovementType] = useState<'ENTRADA_COMPRA' | 'SALIDA_CONSUMO' | 'AJUSTE_MERMA'>('SALIDA_CONSUMO');
  const [quantity, setQuantity] = useState('5');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setItems(db.getInventory());
    setMovements(db.getInventoryMovements());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleOpenMovement = (item: InventoryItem, defaultType: 'ENTRADA_COMPRA' | 'SALIDA_CONSUMO') => {
    setSelectedItem(item);
    setMovementType(defaultType);
    setQuantity(defaultType === 'SALIDA_CONSUMO' ? '2' : '10');
    setNotes(defaultType === 'SALIDA_CONSUMO' ? 'Consumo en lavado turno tarde' : 'Reabastecimiento compra a proveedor');
    setShowMovementModal(true);
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      alert('Ingrese una cantidad válida.');
      return;
    }

    db.recordInventoryMovement(selectedItem.id, movementType, qty, notes.trim());
    setShowMovementModal(false);
  };

  const lowStockCount = items.filter(i => i.currentStock <= i.minStock).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Inventario de Insumos y Kardex de Limpieza
          </h1>
          <p className="text-xs text-slate-500">
            Control de insumos críticos de lavandería (detergentes, suavizantes, bolsas, ganchos) y prevención de desabastecimiento.
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>{lowStockCount} producto(s) por debajo del stock mínimo</span>
          </div>
        )}
      </div>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isLow = item.currentStock <= item.minStock;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all bg-white ${
                isLow ? 'border-rose-300 ring-1 ring-rose-200 shadow-sm' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {item.code}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{item.name}</h3>
                  <span className="text-[11px] text-slate-500">{item.category}</span>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isLow ? 'bg-rose-100 text-rose-800 font-black' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isLow ? 'STOCK BAJO' : 'STOCK ÓPTIMO'}
                </span>
              </div>

              {/* Stock Counter */}
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {item.currentStock}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Mínimo: {item.minStock} {item.unit}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleOpenMovement(item, 'ENTRADA_COMPRA')}
                  className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  + Entrada
                </button>
                <button
                  onClick={() => handleOpenMovement(item, 'SALIDA_CONSUMO')}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  - Salida
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kardex Movements Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800">Kardex de Movimientos de Insumos</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Fecha / Hora</th>
                <th className="py-2.5 px-4">Insumo</th>
                <th className="py-2.5 px-4">Tipo Movimiento</th>
                <th className="py-2.5 px-4 text-right">Cant.</th>
                <th className="py-2.5 px-4 text-right">Stock Anterior</th>
                <th className="py-2.5 px-4 text-right">Stock Nuevo</th>
                <th className="py-2.5 px-4">Motivo / Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {new Date(m.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{m.itemName}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.movementType === 'ENTRADA_COMPRA' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.movementType === 'ENTRADA_COMPRA' ? '+ ENTRADA' : '- SALIDA / CONSUMO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">{m.quantity}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">{m.previousStock}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">{m.newStock}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    <span>{m.notes}</span>
                    <span className="text-[10px] text-slate-400 block">Resp: {m.responsibleName}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Registrar Movimiento: {selectedItem.name}</h3>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Tipo de Operación:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('ENTRADA_COMPRA')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      movementType === 'ENTRADA_COMPRA' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700'
                    }`}
                  >
                    + Entrada / Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('SALIDA_CONSUMO')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      movementType === 'SALIDA_CONSUMO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700'
                    }`}
                  >
                    - Salida / Consumo
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">
                  Cantidad ({selectedItem.unit}):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-center"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Motivo / Observación de Kardex:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar en Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
