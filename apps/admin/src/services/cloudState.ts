const BUSINESS_KEYS = new Set([
  'lavanderiapro_customers',
  'lavanderiapro_services',
  'lavanderiapro_orders',
  'lavanderiapro_expenses',
  'lavanderiapro_fixed_expenses',
  'lavanderiapro_shifts',
  'lavanderiapro_inventory',
  'lavanderiapro_inventory_movs',
  'lavanderiapro_promotions',
  'lavanderiapro_claims',
  'lavanderiapro_audit_logs',
  'lavanderiapro_reviews',
]);

const PENDING_KEY = 'lavaflash_admin_pending_sync_v831';
let enabled = false;
let applyingRemote = false;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const revisions = new Map<string, number>();
const baseSnapshots = new Map<string, unknown>();

const parseStored = (raw: string | null) => {
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};
const clone = <T,>(value: T): T => value == null ? value : JSON.parse(JSON.stringify(value));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const newer = (a: any, b: any) => {
  const at = Date.parse(String(a?.updatedAt || a?.updated_at || a?.timestamp || '')) || 0;
  const bt = Date.parse(String(b?.updatedAt || b?.updated_at || b?.timestamp || '')) || 0;
  return bt > at ? b : a;
};

function mergeOnConflict(base: any, local: any, remote: any) {
  if (!Array.isArray(local) || !Array.isArray(remote) || !local.every(x => x && typeof x === 'object' && 'id' in x) || !remote.every(x => x && typeof x === 'object' && 'id' in x)) {
    return same(local, base) ? remote : local;
  }
  const baseMap = new Map((Array.isArray(base) ? base : []).filter(x => x?.id).map(x => [String(x.id), x]));
  const localMap = new Map(local.map(x => [String(x.id), x]));
  const remoteMap = new Map(remote.map(x => [String(x.id), x]));
  const ids = new Set([...baseMap.keys(), ...localMap.keys(), ...remoteMap.keys()]);
  const out: any[] = [];
  for (const id of ids) {
    const b = baseMap.get(id); const l = localMap.get(id); const r = remoteMap.get(id);
    if (b === undefined) {
      if (l !== undefined && r !== undefined) out.push(same(l, r) ? l : newer(l, r));
      else if (l !== undefined) out.push(l);
      else if (r !== undefined) out.push(r);
      continue;
    }
    if (l === undefined) {
      if (r === undefined || same(r, b)) continue;
      out.push(r); // remoto cambió el registro mientras local intentó borrarlo: se conserva lo más seguro.
      continue;
    }
    if (r === undefined) {
      if (same(l, b)) continue;
      out.push(l);
      continue;
    }
    if (same(l, b)) out.push(r);
    else if (same(r, b)) out.push(l);
    else if (same(l, r)) out.push(l);
    else out.push(newer(l, r));
  }
  return out;
}

type PendingEntry = {
  _lavaflashPending: 1;
  value: unknown;
  revision: number;
  base: unknown;
  queuedAt: string;
};

const readPending = (): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
};
const savePending = (pending: Record<string, unknown>) => {
  if (Object.keys(pending).length) localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  else localStorage.removeItem(PENDING_KEY);
};
const asPendingEntry = (key: string, raw: unknown): PendingEntry => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as any)._lavaflashPending === 1) {
    const item = raw as any;
    return {
      _lavaflashPending: 1,
      value: item.value,
      revision: Number(item.revision || 0),
      base: item.base ?? null,
      queuedAt: String(item.queuedAt || new Date().toISOString()),
    };
  }
  // Compatibilidad con pendientes creados por una versión anterior.
  return {
    _lavaflashPending: 1,
    value: raw,
    revision: Number(revisions.get(key) || 0),
    base: clone(baseSnapshots.get(key) ?? null),
    queuedAt: new Date().toISOString(),
  };
};

async function requestJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin', cache: 'no-store', ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(String(payload?.error || `HTTP ${response.status}`));
    error.status = response.status; error.payload = payload; throw error;
  }
  return payload;
}

async function flushPendingWrites() {
  const pending = readPending();
  const entries = Object.entries(pending).filter(([key]) => BUSINESS_KEYS.has(key));
  if (!entries.length) return true;

  let flushed = 0;
  for (const [key, raw] of entries) {
    const entry = asPendingEntry(key, raw);
    revisions.set(key, entry.revision);
    baseSnapshots.set(key, clone(entry.base));
    const finalValue = await putKey(key, entry.value);

    const latest = readPending();
    const latestEntry = Object.prototype.hasOwnProperty.call(latest, key) ? asPendingEntry(key, latest[key]) : null;
    const stillSameWrite = latestEntry?.queuedAt === entry.queuedAt;
    if (stillSameWrite) {
      applyingRemote = true;
      try { localStorage.setItem(key, JSON.stringify(finalValue)); } finally { applyingRemote = false; }
      delete latest[key];
      savePending(latest);
    }
    flushed += 1;
  }
  window.dispatchEvent(new CustomEvent('lavaflash-cloud-sync', { detail: { ok: true, flushed } }));
  return true;
}

async function putKey(key: string, localValue: unknown) {
  const revision = revisions.get(key) ?? 0;
  try {
    const payload = await requestJson(`/api/admin/state/${encodeURIComponent(key)}`, {
      method: 'PUT', body: JSON.stringify({ value: localValue, revision }),
    });
    revisions.set(key, Number(payload?.revision ?? revision + 1));
    baseSnapshots.set(key, clone(localValue));
    return localValue;
  } catch (error: any) {
    if (error?.status !== 409 || !error?.payload) throw error;
    const remote = error.payload.current;
    const remoteRevision = Number(error.payload.revision || 0);
    const merged = mergeOnConflict(baseSnapshots.get(key), localValue, remote);
    applyingRemote = true;
    try { localStorage.setItem(key, JSON.stringify(merged)); } finally { applyingRemote = false; }
    revisions.set(key, remoteRevision);
    baseSnapshots.set(key, clone(remote));
    const retry = await requestJson(`/api/admin/state/${encodeURIComponent(key)}`, {
      method: 'PUT', body: JSON.stringify({ value: merged, revision: remoteRevision }),
    });
    revisions.set(key, Number(retry?.revision ?? remoteRevision + 1));
    baseSnapshots.set(key, clone(merged));
    return merged;
  }
}

export function isBusinessKey(key: string) { return BUSINESS_KEYS.has(key); }

export function writeLocalAndSync(key: string, value: string) {
  localStorage.setItem(key, value);
  if (!enabled || applyingRemote || !BUSINESS_KEYS.has(key)) return;
  const pending = readPending();
  const previous = Object.prototype.hasOwnProperty.call(pending, key) ? asPendingEntry(key, pending[key]) : null;
  pending[key] = {
    _lavaflashPending: 1,
    value: parseStored(value),
    revision: previous?.revision ?? Number(revisions.get(key) || 0),
    base: clone(previous?.base ?? baseSnapshots.get(key) ?? null),
    queuedAt: new Date().toISOString(),
  } satisfies PendingEntry;
  savePending(pending);
  const existing = timers.get(key); if (existing) clearTimeout(existing);
  const timer = setTimeout(async () => {
    timers.delete(key);
    const snapshot = readPending();
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) return;
    const entry = asPendingEntry(key, snapshot[key]);
    revisions.set(key, entry.revision);
    baseSnapshots.set(key, clone(entry.base));
    try {
      const finalValue = await putKey(key, entry.value);
      const latest = readPending();
      const latestEntry = Object.prototype.hasOwnProperty.call(latest, key) ? asPendingEntry(key, latest[key]) : null;
      const stillSameWrite = latestEntry?.queuedAt === entry.queuedAt;
      if (stillSameWrite) {
        delete latest[key]; savePending(latest);
        if (!same(finalValue, parseStored(localStorage.getItem(key)))) {
          applyingRemote = true; try { localStorage.setItem(key, JSON.stringify(finalValue)); } finally { applyingRemote = false; }
        }
      }
      window.dispatchEvent(new CustomEvent('lavaflash-cloud-sync', { detail: { key, ok: true } }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('lavaflash-cloud-sync', { detail: { key, ok: false, error: String(error) } }));
    }
  }, 180);
  timers.set(key, timer);
}

export async function hydrateBusinessState() {
  try { await flushPendingWrites(); } catch { /* se valida nuevamente con GET */ }
  const payload = await requestJson('/api/admin/state');
  const state = payload?.state && typeof payload.state === 'object' ? payload.state : {};
  const remoteRevisions = payload?.revisions && typeof payload.revisions === 'object' ? payload.revisions : {};
  const localSeed: Record<string, unknown> = {};
  applyingRemote = true;
  try {
    for (const key of BUSINESS_KEYS) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        localStorage.setItem(key, JSON.stringify(state[key]));
        baseSnapshots.set(key, clone(state[key]));
        revisions.set(key, Number(remoteRevisions[key] || 0));
      } else {
        const raw = localStorage.getItem(key);
        if (raw != null) localSeed[key] = parseStored(raw);
      }
    }
  } finally { applyingRemote = false; }

  if (Object.keys(localSeed).length) {
    // Migra caché local antigua sin sobrescribir silenciosamente datos que otro equipo haya creado en paralelo.
    for (const [key, value] of Object.entries(localSeed)) {
      revisions.set(key, 0);
      baseSnapshots.set(key, null);
      const finalValue = await putKey(key, value);
      applyingRemote = true;
      try { localStorage.setItem(key, JSON.stringify(finalValue)); } finally { applyingRemote = false; }
    }
  }
  enabled = true;
  window.dispatchEvent(new Event('lavaflash-cloud-hydrated'));
}

export async function refreshBusinessState() {
  if (!enabled || timers.size) return false;
  try { await flushPendingWrites(); } catch { return false; }
  if (Object.keys(readPending()).length) return false;
  const payload = await requestJson('/api/admin/state');
  const state = payload?.state && typeof payload.state === 'object' ? payload.state : {};
  const remoteRevisions = payload?.revisions && typeof payload.revisions === 'object' ? payload.revisions : {};
  let changed = false;
  applyingRemote = true;
  try {
    for (const key of BUSINESS_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(state, key)) continue;
      const next = JSON.stringify(state[key]);
      if (localStorage.getItem(key) !== next) { localStorage.setItem(key, next); changed = true; }
      baseSnapshots.set(key, clone(state[key])); revisions.set(key, Number(remoteRevisions[key] || 0));
    }
  } finally { applyingRemote = false; }
  if (changed) window.dispatchEvent(new Event('lavaflash-cloud-hydrated'));
  return changed;
}

export function disableBusinessSync() {
  enabled = false;
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear(); revisions.clear(); baseSnapshots.clear();
}
