import React, { useEffect, useMemo, useState } from 'react';
import { getHistoricalRows, HISTORICAL_UPDATED, HistoricalRow, importHistoricalRows } from '../../services/historicalSales';

interface Props { context: 'clientes' | 'mostrador' | 'dashboard' | 'caja'; }
export const HistoricalModule: React.FC<Props> = ({ context }) => {
  const [rows, setRows] = useState<HistoricalRow[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const [year, setYear] = useState('TODOS');
  useEffect(() => {
    const load = () => { void getHistoricalRows().then(setRows).catch(() => setRows([])); };
    load(); window.addEventListener(HISTORICAL_UPDATED, load);
    return () => window.removeEventListener(HISTORICAL_UPDATED, load);
  }, []);
  const sales = useMemo(() => new Set(rows.map(r => r[1])).size, [rows]);
  const customers = useMemo(() => new Set(rows.map(r => r[10])).size, [rows]);
  const years = useMemo(() => [...new Set(rows.map(r => r[2].slice(0,4)))].sort(), [rows]);
  const period = years.length ? `${years[0]}–${years[years.length - 1]}` : 'Sin importar';
  const filtered = useMemo(() => rows.filter(r => [r[1],r[3],r[8],r[9],r[10]].some(value => value.toLowerCase().includes(query.trim().toLowerCase()))), [rows, query]);
  const customerList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sales: Set<string>; first: string; last: string; amount: number }>();
    for (const r of rows) { const c = map.get(r[10]) ?? { id:r[10], name:r[9], sales:new Set<string>(), first:r[2], last:r[2], amount:0 }; c.sales.add(r[1]); if(r[2]<c.first)c.first=r[2]; if(r[2]>c.last)c.last=r[2]; c.amount+=r[6]??0; map.set(r[10],c); }
    return [...map.values()];
  }, [rows]);
  const matchingCustomers = customerList.filter(c => [c.name,c.id].some(v => v.toLowerCase().includes(query.trim().toLowerCase())));
  const selectedRows = rows.filter(r => context === 'clientes' ? r[10] === selected : r[1] === selected);
  const periodRows = year === 'TODOS' ? rows : rows.filter(r => r[2].startsWith(year));
  const periodSales = new Set(periodRows.map(r => r[1])).size;
  const periodTotal = periodRows.reduce((sum, r) => sum + (r[6] ?? 0), 0);
  const categories = [...new Map([...new Set(periodRows.map(r => r[7]))].map(category => [category, periodRows.filter(r => r[7] === category).length]))];
  const number = (n: number) => n.toLocaleString('es-PE');
  return <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black text-slate-900">Historial importado del Excel · {period}</h2><p className="text-sm text-slate-600">{number(customers)} clientes · {number(sales)} ventas · {number(rows.length)} servicios o prendas</p></div><button className="rounded-lg bg-teal-700 px-4 py-2 text-white text-sm font-semibold" onClick={() => setOpen(!open)}>{open ? 'Ocultar historial' : 'Consultar historial'}</button></div>
    {(context === 'dashboard' || context === 'caja') && <div className="space-y-2 text-sm"><label className="font-semibold">Periodo histórico: <select className="rounded-lg border p-1 ml-2" value={year} onChange={e => setYear(e.target.value)}><option value="TODOS">Todos los años</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label><div className="flex flex-wrap gap-4"><span>Ventas registradas: <strong>{number(periodSales)}</strong></span><span>Servicios o prendas: <strong>{number(periodRows.length)}</strong></span><span>Valor registrado: <strong>S/ {periodTotal.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></span><span>Promedio por venta: <strong>S/ {periodSales ? (periodTotal/periodSales).toFixed(2) : '0.00'}</strong></span></div><p>Por categoría: {categories.map(([name,count]) => `${name}: ${number(count)}`).join(' · ') || 'Sin datos'}</p></div>}
    {!rows.length && <label className="inline-block cursor-pointer rounded-lg bg-teal-700 px-3 py-2 text-white text-sm font-semibold">Cargar historial del Excel<input type="file" accept=".json,application/json" className="sr-only" onChange={e => {const file=e.target.files?.[0];if(file)void importHistoricalRows(file).then(count=>setNotice(`${count.toLocaleString('es-PE')} detalles cargados`)).catch(err=>setNotice(`Error: ${String(err)}`));e.target.value='';}} /></label>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    <p className="text-xs text-slate-600">El valor histórico es facturación registrada, no dinero cobrado. El Excel no indica medio de pago ni entrega. No se incluye en el saldo de caja ni en los pedidos activos.</p>
    {open && <div className="space-y-3"><input className="w-full rounded-lg border border-slate-300 p-2" placeholder={context === 'clientes' ? 'Buscar por nombre o ID de cliente' : 'Buscar cliente, venta, ticket o servicio'} value={query} onChange={e => {setQuery(e.target.value);setSelected('');}} />
      {context === 'clientes' ? <div className="max-h-80 overflow-auto rounded-lg bg-white divide-y">{matchingCustomers.slice(0,100).map(c => <button key={c.id} className="block w-full text-left p-2 hover:bg-teal-50 text-sm" onClick={() => setSelected(c.id)}>{c.name} · {c.id} · {c.sales.size} ventas · {c.first} a {c.last}</button>)}</div> : <div className="max-h-80 overflow-auto rounded-lg bg-white divide-y">{filtered.slice(0,100).map(r => <button key={r[0]} className="block w-full text-left p-2 hover:bg-teal-50 text-sm" onClick={() => setSelected(r[1])}>{r[2]} · Venta {r[1]} · {r[9]} · {r[8]} · {r[4] ?? '—'} · S/ {(r[6] ?? 0).toFixed(2)}</button>)}</div>}
      {selected && <div className="rounded-lg border border-teal-300 bg-white p-3 max-h-96 overflow-auto"><h3 className="font-bold">{context === 'clientes' ? `Ventas del cliente ${selected}` : `Detalle de venta ${selected}`}</h3>{selectedRows.map(r => <p key={r[0]} className="border-t py-2 text-sm">{r[2]} · Venta {r[1]} · Ticket {r[3]} · {r[8]} ({r[7]}) · Cantidad {r[4] ?? 'Sin dato'} · Precio {r[5] == null ? 'Sin dato' : `S/ ${r[5].toFixed(2)}`} · Subtotal {r[6] == null ? 'Sin dato' : `S/ ${r[6].toFixed(2)}`}</p>)}<p className="text-sm text-amber-800">Pago y entrega: Sin dato en el Excel.</p></div>}
      <p className="text-xs text-slate-500">Se muestran los primeros 100 resultados. Usa la búsqueda para encontrar otros registros.</p></div>}
  </section>;
};
