@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo   LAVA FLASH V8.31 - DESARROLLO LOCAL
echo ==============================================
echo.
where node >nul 2>nul || (echo ERROR: Node.js no esta instalado.& pause & exit /b 1)
if not exist "apps\web\node_modules\vite\bin\vite.js" (
  echo Instalando dependencias por primera vez...
  call npm install || (echo ERROR al instalar dependencias.& pause & exit /b 1)
)
echo.
echo Pagina: http://127.0.0.1:5173/
echo Admin:  http://127.0.0.1:5173/admin/
echo Usuario local: admin
echo Codigo local: 2026
echo.
echo IMPORTANTE: para nube cambia las credenciales mediante variables de entorno.
echo.
call npm run dev
pause
