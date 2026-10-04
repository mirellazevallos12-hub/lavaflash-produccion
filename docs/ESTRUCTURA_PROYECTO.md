# Estructura LAVA FLASH V8.31

```text
LAVAFLASH/
├─ apps/
│  ├─ web/                 Portal público
│  └─ admin/               Panel administrativo
├─ server/
│  ├─ index.mjs            API, seguridad y servidor de producción
│  └─ database.mjs         SQLite central
├─ data-import/
│  └─ historial_lavaflash.json
├─ data/                    Se crea al ejecutar; debe ser persistente en nube
├─ scripts/                Build, validación y pruebas
├─ docs/                   Documentación actual
├─ Dockerfile
├─ .dockerignore
├─ .env.example
├─ INICIAR_LOCAL.bat
└─ package.json
```

El frontend administrativo usa `localStorage` únicamente como caché reactiva para conservar la compatibilidad con sus componentes. La fuente central de los datos operativos es la API/SQLite del servidor.
