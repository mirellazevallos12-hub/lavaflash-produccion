import type { User } from '../types';
import { db } from './db';

const requestJson = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      signal: options.signal || controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    let payload: any = null;
    try { payload = await response.json(); } catch { payload = null; }
    return { response, payload };
  } finally {
    window.clearTimeout(timer);
  }
};

export type AdminAuthResult =
  | { ok: true; user: User; mode: 'server' }
  | { ok: false; error: string; status?: number };

export type AdminApiStatus = 'online' | 'offline';

export async function checkAdminApi(): Promise<AdminApiStatus> {
  try {
    const { response, payload } = await requestJson('/api/health', {}, 8000);
    return response.ok && payload?.ok === true && payload?.version === '8.31.0' ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export async function authenticateAdmin(username: string, code: string): Promise<AdminAuthResult> {
  const cleanUsername = username.trim();
  const cleanCode = code.trim();
  if (!cleanUsername || !cleanCode) return { ok: false, error: 'Completa usuario y código de acceso.' };

  try {
    const { response, payload } = await requestJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: cleanUsername, code: cleanCode }),
    });
    if (response.ok && payload?.user) {
      const user = payload.user as User;
      db.setCurrentUser(user);
      return { ok: true, user, mode: 'server' };
    }
    const fallback = response.status === 401
      ? 'Usuario o código de acceso incorrecto.'
      : response.status === 429
        ? 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
        : 'No se pudo validar el acceso administrativo.';
    return { ok: false, status: response.status, error: String(payload?.error || fallback) };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor administrativo. Verifica que el sistema esté iniciado.' };
  }
}

export async function restoreAdminSession(): Promise<User | null> {
  try {
    const { response, payload } = await requestJson('/api/admin/session', {}, 8000);
    if (response.ok && payload?.user) {
      const user = payload.user as User;
      db.setCurrentUser(user, false);
      return user;
    }
  } catch {
    // Sin servidor o sin sesión válida, se vuelve al login.
  }
  db.logout();
  return null;
}

export async function endAdminSession(): Promise<void> {
  try { await requestJson('/api/admin/logout', { method: 'POST' }, 3000); } catch { /* cierre local de cache */ }
  db.logout();
}
