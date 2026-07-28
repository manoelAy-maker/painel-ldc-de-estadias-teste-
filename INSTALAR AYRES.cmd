@echo off
setlocal
title INSTALADOR AYRES

set "INSTALLER_URL=https://raw.githubusercontent.com/manoelAy-maker/painel-ldc-de-estadias-teste-/main/scripts/InstallAyres.ps1"
set "TEMP_INSTALLER=%TEMP%\InstallAyres-%RANDOM%.ps1"

echo.
echo  AYRES - INSTALADOR DO PAINEL
echo  O instalador sera baixado do repositorio oficial.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri '%INSTALLER_URL%' -OutFile '%TEMP_INSTALLER%'"

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel baixar o instalador.
  echo Verifique sua internet e tente novamente.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TEMP_INSTALLER%"
set "EXIT_CODE=%ERRORLEVEL%"
del "%TEMP_INSTALLER%" >nul 2>&1

if not "%EXIT_CODE%"=="0" (
  echo.
  echo A instalacao terminou com o codigo %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
