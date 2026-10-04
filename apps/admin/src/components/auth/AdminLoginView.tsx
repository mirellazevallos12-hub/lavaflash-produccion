import React, { useEffect, useState } from 'react';
import { authenticateAdmin, checkAdminApi } from '../../services/auth';
import { ADMIN_PUBLIC_URL } from '../../config/site';
import { User } from '../../types';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, LogIn, Server, ShieldCheck, UserRound, WifiOff } from 'lucide-react';

export const AdminLoginView: React.FC<{ onLoginSuccess: (user: User) => void | Promise<void> }> = ({ onLoginSuccess }) => {
  const publicSiteUrl = ADMIN_PUBLIC_URL;
  const [username, setUsername] = useState(() => (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' ? 'admin' : ''));
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let active = true;
    checkAdminApi().then((status) => {
      if (active) setServerStatus(status);
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await authenticateAdmin(username, code);
    if ('error' in result) {
      setError(result.error);
      if (!result.status) setServerStatus('offline');
      setSubmitting(false);
      return;
    }
    setServerStatus('online');
    setSubmitting(false);
    await onLoginSuccess(result.user);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-800 bg-white shadow-2xl shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mt-16 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Gestión interna</p>
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">Todo el control del negocio en un solo panel.</h1>
                <p className="mt-4 text-sm leading-6 text-slate-300">Clientes, ventas, prendas, caja, calidad, delivery, inventario, promociones e historial organizados por rol.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mb-2 h-5 w-5 text-teal-300" />
                <p className="font-bold text-white">Acceso por rol</p>
                <p className="mt-1 text-slate-400">Cada usuario ve solo sus módulos habilitados.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <LockKeyhole className="mb-2 h-5 w-5 text-teal-300" />
                <p className="font-bold text-white">Área privada</p>
                <p className="mt-1 text-slate-400">Uso exclusivo del personal autorizado.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-9 lg:p-10">
            <div className="mx-auto max-w-md">
              <a href={publicSiteUrl} className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-teal-700">
                <ArrowLeft className="h-4 w-4" /> Volver a la página principal
              </a>

              <div className="mb-7 lg:hidden">
                <p className="text-xs font-semibold text-teal-700">Panel administrativo</p>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">Acceso interno</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Iniciar sesión</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa tu usuario exacto y tu código personal para continuar.</p>
                <div className="mt-4">
                  {serverStatus === 'checking' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                      <Server className="h-3.5 w-3.5" /> Verificando servidor…
                    </span>
                  )}
                  {serverStatus === 'online' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Servidor conectado
                    </span>
                  )}
                  {serverStatus === 'offline' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                      <WifiOff className="h-3.5 w-3.5" /> Servidor no disponible
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="staff-user" className="mb-1.5 block text-xs font-extrabold text-slate-700">Usuario</label>
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="staff-user"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={username}
                      onChange={(event) => { setUsername(event.target.value); if (error) setError(''); }}
                      placeholder="Ej. admin"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="staff-code" className="mb-1.5 block text-xs font-extrabold text-slate-700">Código de acceso</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="staff-code"
                      autoComplete="current-password"
                      required
                      type={showCode ? 'text' : 'password'}
                      value={code}
                      onChange={(event) => { setCode(event.target.value); if (error) setError(''); }}
                      placeholder="••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    />
                    <button
                      type="button"
                      aria-label={showCode ? 'Ocultar código' : 'Mostrar código'}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setShowCode((value) => !value)}
                    >
                      {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-700">{error}</p>}

                <button
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 p-3.5 text-sm font-black text-white shadow-lg shadow-teal-600/15 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="h-5 w-5" />
                  {submitting ? 'Validando…' : 'Ingresar al sistema'}
                </button>
              </form>

              <div className="mt-7 rounded-xl bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-500 ring-1 ring-inset ring-slate-200">
                Área de uso interno. El acceso se valida en el servidor y la sesión administrativa se mantiene protegida mediante una cookie segura.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
