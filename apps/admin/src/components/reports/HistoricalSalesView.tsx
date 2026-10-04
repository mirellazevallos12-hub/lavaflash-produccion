import React, { useEffect, useState } from 'react';
import { getHistoricalRows, importHistoricalRows } from '../../services/historicalSales';

type Row = [string, string, string, string, number | null, number | null, number | null, string, string, string, string];
export const HistoricalSalesView: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [mode, setMode] = useState<'CLIENTES' | 'DETALLES'>('CLIENTES');
  const reload = async () => {
    setRows(await getHistoricalRows());
  };
  useEffect(() => { reload().catch(() => setMessage('No se pudo leer el historial desde la base central.')); }, []);
  const importFile = async (file?: File) => {
    if (!file) return;
    setMessage('Validando e importando el historial en la base central...');
    try {
      const count = await importHistoricalRows(file);
      await reload();
      setMessage(`${count.toLocaleString('es-PE')} detalles importados. Los ID existentes se actualizaron sin duplicarse.`);
    } catch (error) { setMessage(`No se importó el archivo: ${String(error)}`); }
  };
  const sales = new Set(rows.map(r => r[1])).size;
  const dates = rows.map(r => r[2]).sort();
  const years = dates.length ? `${dates[0].slice(0, 4)}–${dates[dates.length - 1].slice(0, 4)}` : '—';
  const customerMap = new Map<string, { id: string; name: string; sales: Set<string>; details: number; first: string; last: string; total: number }>();
  for (const r of rows) {
    const c = customerMap.get(r[10]) ?? { id: r[10], name: r[9], sales: new Set<string>(), details: 0, first: r[2], last: r[2], total: 0 };
    c.sales.add(r[1]); c.details++; c.first = r[2] < c.first ? r[2] : c.first; c.last = r[2] > c.last ? r[2] : c.last; c.total += r[6] ?? 0; customerMap.set(r[10], c);
  }
  const customerRows = [...customerMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const matchingCustomers = customerRows.filter(c => !query.trim() || [c.id, c.name].some(v => v.toLowerCase().includes(query.toLowerCase().trim())));
  const selectedCustomerRows = rows.filter(r => r[10] === selectedCustomer);
  const customerSales = [...new Map(selectedCustomerRows.map(r => [r[1], r[1]])).keys()].map(id => { const details = selectedCustomerRows.filter(r => r[1] === id); return { id, date: details[0][2], ticket: details[0][3], details, total: details.reduce((a, r) => a + (r[6] ?? 0), 0) }; }).sort((a, b) => b.date.localeCompare(a.date));
  const customers = new Set(rows.map(r => r[10])).size;
  const filtered = query.trim() ? rows.filter(r => [r[1],r[3],r[9],r[10],r[8]].some(v => v.toLowerCase().includes(query.toLowerCase().trim()))) : rows;
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-bold text-slate-900">Historial de ventas Lavaflash</h1><p className="text-slate-600">Consulta de ventas antiguas. Los importes del Excel no acreditan pagos ni entregas.</p></header>
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
      <p className="font-semibold">{customers.toLocaleString('es-PE')} clientes · {sales.toLocaleString('es-PE')} ventas · {rows.length.toLocaleString('es-PE')} detalles · Años {years}</p>
      <p className="text-sm text-amber-800 mt-2">El Excel no indica método de pago, monto pagado ni si las prendas fueron entregadas. En esas columnas se muestra «Sin dato»; el subtotal representa el valor de la venta, no un pago confirmado.</p>
      <p className="text-sm text-slate-500 mt-1">La base histórica se guarda en el servidor central. El archivo de migración está en data-import/historial_lavaflash.json y se importa automáticamente la primera vez que inicia el servidor.</p>
      <label className="inline-block mt-4 cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-white font-semibold">Importar historial JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {message && <p className="mt-3 text-sm" role="status">{message}</p>}
    </div>
    <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={() => {setMode('CLIENTES');setSelectedCustomer(null);setSelectedSale(null);setQuery('');}}>Clientes</button><button className="rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={() => {setMode('DETALLES');setSelectedCustomer(null);setSelectedSale(null);setQuery('');}}>Todos los detalles</button></div>
    {mode === 'CLIENTES' && !selectedCustomer && <>
      <input className="w-full rounded-lg border border-slate-300 bg-white p-3" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente por nombre o ID" aria-label="Buscar cliente histórico" />
      <p className="text-sm text-slate-500">{matchingCustomers.length.toLocaleString('es-PE')} clientes encontrados. Se muestran los primeros 100.</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-100"><tr>{['ID cliente','Cliente','Primera venta','Última venta','Ventas','Detalles','Valor registrado','Acción'].map(h => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{matchingCustomers.slice(0,100).map(c => <tr key={c.id} className="border-t"><td className="p-3">{c.id}</td><td className="p-3">{c.name}</td><td className="p-3">{c.first}</td><td className="p-3">{c.last}</td><td className="p-3">{c.sales.size}</td><td className="p-3">{c.details}</td><td className="p-3">S/ {c.total.toFixed(2)}</td><td className="p-3"><button className="text-teal-700 font-semibold" onClick={() => setSelectedCustomer(c.id)}>Ver ventas</button></td></tr>)}</tbody></table></div>
    </>}
    {mode === 'CLIENTES' && selectedCustomer && <>
      <button className="text-teal-700 font-semibold" onClick={() => {setSelectedCustomer(null);setSelectedSale(null);}}>← Volver a clientes</button>
      <h2 className="text-xl font-bold">{customerMap.get(selectedCustomer)?.name} · {selectedCustomer}</h2>
      <p className="text-sm text-slate-600">{customerSales.length} ventas desde {customerMap.get(selectedCustomer)?.first} hasta {customerMap.get(selectedCustomer)?.last}</p>
      <div className="space-y-3">{customerSales.map(sale => <div key={sale.id} className="rounded-xl bg-white border border-slate-200 p-4"><button className="w-full text-left font-semibold text-teal-800" onClick={() => setSelectedSale(selectedSale === sale.id ? null : sale.id)}>{sale.date} · Venta {sale.id} · Ticket {sale.ticket} · {sale.details.length} detalles · S/ {sale.total.toFixed(2)} {selectedSale === sale.id ? '▲' : '▼'}</button>{selectedSale === sale.id && <div className="mt-3 space-y-2 text-sm">{sale.details.map(r => <p key={r[0]} className="border-t pt-2">{r[8]} · {r[7]} · Cantidad: {r[4] ?? 'Sin dato'} · Precio: {r[5] == null ? 'Sin dato' : `S/ ${r[5].toFixed(2)}`} · Subtotal: {r[6] == null ? 'Sin dato' : `S/ ${r[6].toFixed(2)}`}</p>)}<p className="text-slate-600">Tipo de pago: Sin dato · Estado de entrega: Sin dato</p></div>}</div>)}</div>
    </>}
    {mode === 'DETALLES' && <>
      <input className="w-full rounded-lg border border-slate-300 bg-white p-3" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por cliente, ID, venta, ticket o servicio" aria-label="Buscar historial" />
      <p className="text-sm text-slate-500">{filtered.length.toLocaleString('es-PE')} detalles encontrados. Se muestran los primeros 100.</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-100"><tr>{['Fecha','Venta','Ticket','ID cliente','Cliente','Servicio o prenda','Cantidad','Subtotal','Pago','Entrega'].map(h => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{filtered.slice(0,100).map(r => <tr key={r[0]} className="border-t"><td className="p-3">{r[2]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[3]}</td><td className="p-3">{r[10]}</td><td className="p-3">{r[9]}</td><td className="p-3">{r[8]}</td><td className="p-3">{r[4] ?? '—'}</td><td className="p-3">{r[6] == null ? '—' : `S/ ${r[6].toFixed(2)}`}</td><td className="p-3">Sin dato</td><td className="p-3">Sin dato</td></tr>)}</tbody></table></div>
    </>}
  </div>;
};
