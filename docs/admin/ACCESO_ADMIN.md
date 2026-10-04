# Acceso administrativo — V8.31

El panel se sirve bajo la misma aplicación:

```text
/admin/
```

En desarrollo local:

```text
http://127.0.0.1:5173/admin/
```

Ejecuta `INICIAR_LOCAL.bat` o `npm run dev`. El frontend no contiene una contraseña de respaldo: el acceso siempre se valida contra `/api/admin/login`.

En desarrollo, si no existe `.env`, el servidor permite temporalmente `admin / 2026`. En producción esa contraseña no se usa y el servidor exige variables de entorno seguras antes de iniciar.
