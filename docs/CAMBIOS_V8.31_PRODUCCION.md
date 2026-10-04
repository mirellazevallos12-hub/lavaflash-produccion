# LAVA FLASH V8.31 — Preparación para producción

Esta versión deja de tratar los datos operativos como datos de maqueta del navegador y los sincroniza con una base SQLite central administrada por el servidor.

## Cambios principales

- Base central SQLite para clientes, servicios, pedidos, caja, gastos, inventario, promociones, reclamos y auditoría.
- Historial de ventas migrado de IndexedDB del navegador a SQLite del servidor.
- El archivo histórico de migración ya no está dentro del frontend; se encuentra en `data-import/` y se importa automáticamente una sola vez si la tabla histórica está vacía.
- El portal del cliente usa API real para registro, inicio de sesión, pedidos, reclamos y seguimiento.
- Las contraseñas de clientes se guardan con `scrypt`; no se devuelven al navegador ni se almacenan en el estado administrativo.
- El administrador se autentica siempre contra el servidor. Se eliminó el acceso local embebido en el frontend.
- Límite de intentos de login administrativo: 5 intentos por ventana de 15 minutos.
- Cookies `HttpOnly`, `SameSite=Strict` y `Secure` en producción.
- Sincronización administrativa con control de revisiones, cola persistente de cambios pendientes y resolución de conflictos entre dispositivos.
- Se eliminó el archivo `.env` del paquete; solo se incluye `.env.example`.
- Dependencias fijadas a versiones exactas en los `package.json` de cada frontend.
- Se eliminaron scripts BAT y documentos de versiones antiguas. Queda un único `INICIAR_LOCAL.bat` para desarrollo.
- Se quitó del panel el modal técnico de “Arquitectura de datos”, que era útil para demostración pero no para operación diaria.
- Se mantiene el diseño de botones/tarjetas administrativas aprobado para el panel.
- No se modificó el pie de página público.

## Arquitectura

- `/` → portal público React.
- `/admin/` → panel administrativo React.
- `/api/*` → API Node.js.
- `data/lavaflash.sqlite` → base central en el servidor.

En nube, la carpeta `data/` debe estar en un disco persistente.

## Alcance de despliegue

V8.31 está diseñada para una instancia de aplicación con almacenamiento persistente. Para varias réplicas concurrentes, la siguiente evolución debe mover la persistencia a PostgreSQL/MySQL.
