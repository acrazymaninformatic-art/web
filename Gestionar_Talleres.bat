@echo off
title Panel de Talleres - Eva Vidal Nutricion
cd /d "%~dp0"
echo =======================================================
echo   Iniciando Panel de Gestion de Talleres...
echo   Se abrira en tu navegador web en un instante.
echo   (No cierres esta ventana mientras uses el panel)
echo =======================================================
python panel-talleres.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Hubo un problema al iniciar Python.
    pause
)
