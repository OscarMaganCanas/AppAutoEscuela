@echo off
echo ============================================
echo   Autoescuela Rosales - Deploy a Vercel
echo ============================================
echo.
echo Ya tienes sesion iniciada. Desplegando...
echo Cuando te pregunte el nombre del proyecto escribe:
echo   autoescuela-rosales
echo y pulsa Enter. En las demas preguntas pulsa Enter.
echo.
cd /d "%~dp0"
call vercel

echo.
echo ============================================
echo  Listo. Copia la URL que aparece arriba.
echo ============================================
pause
