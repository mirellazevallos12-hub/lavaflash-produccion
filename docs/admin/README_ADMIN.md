# Panel administrativo LAVA FLASH V8.31

El panel vive en `/admin/` y se autentica mediante la API Node del mismo dominio.

Los módulos operativos usan una caché local para respuesta inmediata, pero la fuente central es SQLite en el servidor. El panel sincroniza clientes, pedidos, caja, gastos, inventario, promociones, reclamos y auditoría, y detecta revisiones obsoletas para evitar sobrescribir silenciosamente cambios hechos desde otro dispositivo.

No hay contraseña administrativa incrustada en el bundle público. En producción las credenciales y el secreto de sesión se suministran por variables de entorno.
