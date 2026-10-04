import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Filter, History, Database, FileText } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLogs(db.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entityId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Auditoría Inmutable & Trazabilidad Total
          </h1>
          <p className="text-xs text-slate-500">
            Registro secuencial de cada transacción, cobro, egreso, cambio de estado e inventario guardado en este navegador.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por acción, usuario o entidad..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Fecha y Hora</th>
                <th className="py-2.5 px-4">Usuario Responsable</th>
                <th className="py-2.5 px-4">Acción Ejecutada</th>
                <th className="py-2.5 px-4">Entidad Afectada</th>
                <th className="py-2.5 px-4">Detalles Técnicos (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-PE')}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px] font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    <span className="font-semibold text-teal-700">{log.entityType}:</span> {log.entityId}
                  </td>
                  <td className="py-2.5 px-4 max-w-md font-mono text-[10px] text-slate-600 truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
