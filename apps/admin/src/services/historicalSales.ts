export type HistoricalRow = [string, string, string, string, number | null, number | null, number | null, string, string, string, string];
export const HISTORICAL_UPDATED = 'lavaflash-historical-updated';

async function requestJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload?.error || `HTTP ${response.status}`));
  return payload;
}

export const getHistoricalRows = async (): Promise<HistoricalRow[]> => {
  const payload = await requestJson('/api/admin/history');
  return Array.isArray(payload?.rows) ? payload.rows as HistoricalRow[] : [];
};

export const importHistoricalRows = async (file: File): Promise<number> => {
  const payload = JSON.parse(await file.text());
  if (payload.version !== 1 || !Array.isArray(payload.rows) || !payload.rows.every((r: unknown) => Array.isArray(r) && r.length === 11 && typeof r[0] === 'string' && typeof r[1] === 'string' && typeof r[10] === 'string')) {
    throw new Error('Archivo de historial inválido');
  }
  const result = await requestJson('/api/admin/history/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  window.dispatchEvent(new Event(HISTORICAL_UPDATED));
  return Number(result?.count || payload.rows.length);
};
