# Historial de ventas LavaFlash — V8.31

El historial convertido se encuentra en:

```text
data-import/historial_lavaflash.json
```

El archivo no forma parte del frontend público. Cuando el servidor inicia con una base histórica vacía, lo importa automáticamente a SQLite. La importación usa el ID de detalle como clave, por lo que volver a importar actualiza registros sin duplicarlos.

También se puede importar manualmente desde el módulo **Historial de ventas** del administrador.

El Excel original no registra forma de pago, importe efectivamente cobrado ni estado de entrega. Por eso esos datos históricos continúan mostrándose como “Sin dato” y no se inventan movimientos de caja.
