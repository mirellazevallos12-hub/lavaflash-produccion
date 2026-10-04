# LAVA FLASH V8.31

Sistema unificado de LAVA FLASH con portal público, panel administrativo, API y base de datos central.

## Desarrollo local

En Windows puedes ejecutar `INICIAR_LOCAL.bat` o usar:

```bash
npm install
npm run dev
```

Accesos locales:

```text
Web:   http://127.0.0.1:5173/
Admin: http://127.0.0.1:5173/admin/
```

En desarrollo local, si no creas `.env`, la API usa temporalmente `admin / 2026`. Esto existe solo para desarrollo. En producción el servidor no inicia si faltan una contraseña administrativa y un secreto de sesión seguros.

## Producción

```bash
npm install
npm run build
npm start
```

Lee `docs/DEPLOY_NUBE.md` antes de publicar.
Si vienes de V8.30 y tienes datos reales en el navegador, lee también `docs/MIGRAR_DATOS_V8.30.md` antes de cambiar de dominio.

## Datos

Los datos operativos se guardan en una base SQLite central del servidor. El panel usa una caché local para renderizar rápido, pero sincroniza los cambios con la base central. Los pedidos creados por clientes desde la web aparecen en la misma base que usa el administrador.

El historial antiguo se importa desde `data-import/historial_lavaflash.json` la primera vez que inicia una base vacía.

## Seguridad

- Login administrativo validado por servidor.
- Cookie de sesión HttpOnly.
- Contraseñas de clientes con hash `scrypt`.
- Límite de intentos de acceso administrativo.
- `.env` excluido del proyecto distribuido.
- Cookies seguras en producción.

## Verificación

```bash
npm run check:production
```

La prueba automatizada valida login admin, sesión, SQLite, sanitización de contraseñas, login cliente, creación de pedido, visibilidad del pedido en admin, seguimiento e historial.

## Backup de la base

```bash
npm run backup:data
```
