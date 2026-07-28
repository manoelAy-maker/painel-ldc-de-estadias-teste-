@echo off
setlocal
title AYRES TERMINAL

set "SCRIPT_DIR=%~dp0"
set "TERMINAL_SCRIPT=%SCRIPT_DIR%scripts\AyresTerminal.ps1"

if not exist "%TERMINAL_SCRIPT%" (
  echo.
  echo [ERRO] Nao encontrei:
  echo %TERMINAL_SCRIPT%
  echo.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TERMINAL_SCRIPT%"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo O AYRES TERMINAL terminou com o codigo %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
