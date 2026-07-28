[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectPath = Split-Path -Parent $PSScriptRoot

try {
    $Host.UI.RawUI.WindowTitle = 'AYRES // CODEX AI'
    $Host.UI.RawUI.BackgroundColor = 'Black'
}
catch {
    # O host pode nao permitir alterar a aparencia.
}

Clear-Host
Write-Host '  AYRES // CODEX AI' -ForegroundColor Cyan
Write-Host "  Workspace: $ProjectPath" -ForegroundColor DarkGray
Write-Host

$codex = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codex) {
    Write-Host '  [ERRO] Codex CLI nao foi encontrado.' -ForegroundColor Red
    [void](Read-Host '  Pressione ENTER para fechar')
    exit 1
}

$codexPath = $codex.Source

& $codexPath login status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host '  Primeiro acesso: entre com sua conta do ChatGPT no navegador.' -ForegroundColor Yellow
    & $codexPath login
    if ($LASTEXITCODE -ne 0) {
        Write-Host '  [ERRO] Nao foi possivel autenticar o Codex.' -ForegroundColor Red
        [void](Read-Host '  Pressione ENTER para fechar')
        exit 1
    }
}

Set-Location $ProjectPath
& $codexPath --cd $ProjectPath --sandbox workspace-write --ask-for-approval on-request
