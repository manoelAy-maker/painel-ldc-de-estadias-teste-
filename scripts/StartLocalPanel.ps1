[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectPath = Split-Path -Parent $PSScriptRoot

try {
    $Host.UI.RawUI.WindowTitle = 'AYRES // LOCAL SERVER'
    $Host.UI.RawUI.BackgroundColor = 'Black'
}
catch {
    # O host pode nao permitir alterar a aparencia.
}

Clear-Host
Write-Host '  AYRES // LOCAL SERVER' -ForegroundColor Green
Write-Host '  http://localhost:5173' -ForegroundColor Cyan
Write-Host '  Feche esta janela para encerrar o servidor.' -ForegroundColor DarkGray
Write-Host

Set-Location $ProjectPath
& npm.cmd run dev -- --host 127.0.0.1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n  [ERRO] O servidor terminou com o codigo $LASTEXITCODE." -ForegroundColor Red
    [void](Read-Host '  Pressione ENTER para fechar')
}
