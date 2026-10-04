import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Claim, ClaimType, ClaimStatus } from '../../types';
import { 
  ShieldAlert, Plus, CheckCircle2, RefreshCw, 
  CreditCard, FileText, AlertTriangle, ArrowRight 
} from 'lucide-react';

export const ClaimsView: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Form states
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [claimType, setClaimType] = useState<ClaimType>('RE_LAVADO');
  const [description, setDescription] = useState('');

  // Resolution form
  const [resolutionStatus, setResolutionStatus] = useState<ClaimStatus>('APROBADO_RELAVADO');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  const loadData = () => {
    setClaims(db.getClaims());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || !customerName.trim() || !description.trim()) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    db.registerClaim({
      orderId: 'ord-ref',
      orderCode: orderCode.trim().toUpperCase(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '999888777',
      itemDescription: itemDescription.trim(),
      claimType,
      description: description.trim(),
      status: 'REGISTRADO'
    });

    setShowModal(false);
    setOrderCode('');
    setCustomerName('');
    setItemDescription('');
    setDescription('');
  };

  const handleResolveClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    db.resolveClaim(
      selectedClaim.id,
      resolutionStatus,
      resolutionNotes.trim(),
      creditAmount ? parseFloat(creditAmount) : undefined
    );

    setSelectedClaim(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Gestión de Reclamos, Garantías y Conformidad
          </h1>
          <p className="text-xs text-slate-500">
            Control de incidencias de calidad, re-lavados urgentes sin costo y emisión de notas de crédito.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Incidencia / Reclamo
        </button>
      </div>

      {/* Claims List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Orden</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Prenda Afectada</th>
                <th className="py-2.5 px-4">Tipo Incidencia</th>
                <th className="py-2.5 px-4">Detalle del Reclamo</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                    Sin reclamos abiertos. 100% de conformidad en entregas.
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.orderCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.customerName}</td>
                    <td className="py-3 px-4 text-slate-700">{c.itemDescription}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {c.claimType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <p className="line-clamp-2">{c.description}</p>
                      {c.resolutionNotes && (
                        <p className="text-[10px] text-teal-700 font-semibold mt-0.5">
                          Resolución: {c.resolutionNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.status === 'APROBADO_RELAVADO' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'NOTA_CREDITO_EMITIDA' ? 'bg-indigo-100 text-indigo-800' :
                        c.status === 'REGISTRADO' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedClaim(c);
                          setResolutionStatus(c.status);
                          setResolutionNotes(c.resolutionNotes || '');
                          setCreditAmount(c.creditNoteAmount ? c.creditNoteAmount.toString() : '');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-teal-700 font-bold rounded-lg transition-colors text-[11px]"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER CLAIM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Registrar Reclamo de Calidad / Prenda</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClaim} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Código de Orden:</label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Ej. ORD-2026-0101"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Tipo de Incidencia:</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as any)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="RE_LAVADO">Re-Lavado (Mancha persistente)</option>
                    <option value="DANO_PRENDA">Daño de prenda (Botón, rasgadura)</option>
                    <option value="DEMORA">Demora en entrega</option>
                    <option value="EXTRAVIO">Prenda no localizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Nombre del Cliente:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombres completos"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Celular Cliente:</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="999888777"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Prenda Afectada:</label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ej. Saco de terno gris"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Descripción de lo ocurrido:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle de la inconformidad del cliente..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Registrar Reclamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Gestionar Reclamo: {selectedClaim.orderCode}</h3>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleResolveClaim} className="p-6 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Cliente y Prenda:</span>
                <p className="font-bold text-slate-800">{selectedClaim.customerName} - {selectedClaim.itemDescription}</p>
                <p className="text-slate-600 italic mt-0.5">{selectedClaim.description}</p>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Resolución a Aplicar:</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as ClaimStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="APROBADO_RELAVADO">Aprobar Re-Lavado Prioritario sin Costo</option>
                  <option value="NOTA_CREDITO_EMITIDA">Emitir Nota de Crédito / Descuento</option>
                  <option value="RESUELTO_RECHAZADO">Rechazar Reclamo (Daño previo registrado en ticket)</option>
                </select>
              </div>

              {resolutionStatus === 'NOTA_CREDITO_EMITIDA' && (
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Monto de Nota de Crédito (Soles):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Ej. 35.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-slate-600 font-bold block mb-1">Notas de Auditoría y Solución:</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detalles de la solución acordada con el cliente..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
