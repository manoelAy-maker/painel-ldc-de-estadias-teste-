[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectPath = Split-Path -Parent $PSScriptRoot
$LocalUrl = 'http://localhost:5173'
$LogFile = Join-Path $ProjectPath 'AYRES-LOCAL-SERVER.log'
$transcriptStarted = $false
$exitCode = 0

try {
    $Host.UI.RawUI.WindowTitle = 'AYRES // LOCAL SERVER'
    $Host.UI.RawUI.BackgroundColor = 'Black'
}
catch {
    # O host pode nao permitir alterar a aparencia.
}

Clear-Host
Write-Host '  AYRES // LOCAL SERVER' -ForegroundColor Green
Write-Host "  $LocalUrl" -ForegroundColor Cyan
Write-Host "  Log: $LogFile" -ForegroundColor DarkGray
Write-Host '  Feche esta janela para encerrar o servidor.' -ForegroundColor DarkGray
Write-Host

try {
    Start-Transcript -LiteralPath $LogFile -Force | Out-Null
    $transcriptStarted = $true

    Set-Location $ProjectPath

    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'npm nao foi encontrado. Rode novamente o INSTALAR AYRES.'
    }

    if (-not (Test-Path (Join-Path $ProjectPath 'package.json'))) {
        throw "package.json nao encontrado em $ProjectPath"
    }

    if (-not (Test-Path (Join-Path $ProjectPath 'node_modules'))) {
        Write-Host '  [>] Dependencias ausentes. Instalando...' -ForegroundColor Cyan
        & npm.cmd install --prefer-offline --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "npm install terminou com o codigo $LASTEXITCODE"
        }
    }

    Write-Host "  Node: $(& node --version)" -ForegroundColor DarkGray
    Write-Host "  npm:  $(& npm.cmd --version)" -ForegroundColor DarkGray
    Write-Host '  [>] Iniciando Vite...' -ForegroundColor Cyan
    Write-Host

    & npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        throw "O servidor terminou com o codigo $exitCode"
    }
}
catch {
    $exitCode = 1
    Write-Host "`n  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Diagnostico salvo em: $LogFile" -ForegroundColor Yellow
}
finally {
    if ($transcriptStarted) {
        try { Stop-Transcript | Out-Null } catch {}
    }
}

Write-Host
if ($exitCode -eq 0) {
    Write-Host '  Servidor encerrado.' -ForegroundColor Yellow
}
[void](Read-Host '  Pressione ENTER para voltar/fechar')
exit $exitCode
