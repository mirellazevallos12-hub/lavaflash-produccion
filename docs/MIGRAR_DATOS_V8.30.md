# Migrar datos de V8.30 a V8.31 antes de publicar

V8.30 guardaba varias colecciones del panel en el navegador. V8.31 usa SQLite en el servidor como fuente central.

## Si tienes datos reales en tu navegador local

1. Conserva una copia de la carpeta V8.30 por seguridad.
2. Abre V8.31 **en la misma dirección local que usabas antes**: `http://127.0.0.1:5173/admin/`.
3. Inicia sesión y espera a que aparezca el panel. Al cargar, V8.31 detecta las colecciones antiguas del navegador y las sincroniza con la base central local.
4. Revisa Clientes, Ventas/Pedidos, Caja, Inventario, Promociones y Reclamos.
5. Cierra el servidor y crea una copia consistente con:

```bash
npm run backup:data
```

6. Para nube, utiliza esa base migrada como base inicial del volumen persistente o conserva el backup antes de mover el sistema.

## Historial de ventas antiguo

El archivo `data-import/historial_lavaflash.json` se importa automáticamente cuando la tabla histórica está vacía. No depende del almacenamiento del navegador.

## Importante

El `localStorage` pertenece al dominio y puerto del navegador. Un dominio nuevo en la nube no puede leer directamente el `localStorage` de `127.0.0.1:5173`. Por eso la migración debe hacerse localmente antes de publicar si allí tienes información que quieras conservar.
