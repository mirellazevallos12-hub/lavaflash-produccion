# Publicar LAVA FLASH V8.31 en la nube

## Requisitos

- Node.js 22.16 o superior; recomendado Node 24.
- HTTPS en producción.
- Contraseña administrativa de 12 caracteres o más y secreto de sesión de 32 caracteres o más.
- Un servidor/servicio con disco persistente para SQLite.

## Variables de entorno obligatorias

Configura estas variables en el panel de tu proveedor. No subas un `.env` con valores reales.

```text
NODE_ENV=production
PORT=8080
LAVAFLASH_ADMIN_USER=admin
LAVAFLASH_ADMIN_PASSWORD=UNA_CLAVE_LARGA_Y_UNICA_DE_12_O_MAS
LAVAFLASH_SESSION_SECRET=UN_SECRETO_ALEATORIO_DE_64_CARACTERES_O_MAS
LAVAFLASH_ADMIN_NAME=Administrador LavaFlash
LAVAFLASH_ADMIN_BRANCH=LavaFlash
LAVAFLASH_DATABASE_FILE=/app/data/lavaflash.sqlite
```

## Despliegue con Docker

1. Crea un servicio desde el `Dockerfile` incluido.
2. Monta un volumen persistente en `/app/data`.
3. Configura las variables anteriores.
4. Expón el puerto `8080`.
5. Usa un dominio con HTTPS.

El mismo dominio sirve la web y el administrador:

```text
https://tudominio.com/
https://tudominio.com/admin/
```

## Despliegue sin Docker

Comandos de build:

```bash
npm install
npm run build
```

Comando de inicio:

```bash
npm start
```

Configura `LAVAFLASH_DATABASE_FILE` para apuntar a una carpeta persistente de tu proveedor.

## Base histórica

`data-import/historial_lavaflash.json` se importa automáticamente la primera vez que el servidor detecta una base histórica vacía. Después, los datos viven en SQLite.

## Migración desde V8.30

Si tienes operaciones reales guardadas en el navegador de la versión anterior, sigue `docs/MIGRAR_DATOS_V8.30.md` **antes** de cambiar al dominio de producción.

## Antes de publicar

Ejecuta:

```bash
npm run check:production
```

La verificación revisa archivos, API, sesiones, almacenamiento central, historial y flujo pedido web → administrador.

## Copias de seguridad

Con el volumen persistente montado, puedes crear una copia consistente de SQLite con:

```bash
npm run backup:data
```

Por defecto se guarda en `backups/`. En nube puedes definir `LAVAFLASH_BACKUP_DIR` para guardar las copias en otra ruta persistente.

## Escalado

Esta versión está preparada para **una instancia/servidor con disco persistente**. Si en el futuro usas varias réplicas simultáneas, migra la persistencia de SQLite a PostgreSQL/MySQL antes de activar el escalado horizontal.
