[CmdletBinding()]
param(
    [string]$InstallPath = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'AYRES\painel-ldc-de-estadias'),
    [switch]$SkipLaunch
)

$ErrorActionPreference = 'Stop'
$RepositoryUrl = 'https://github.com/manoelAy-maker/painel-ldc-de-estadias-teste-.git'
$SupabaseUrl = 'https://tpvkuqzxafuyubhtqydd.supabase.co'

function Write-Step {
    param([string]$Message)
    Write-Host "`n>> $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
    param([string]$Message)
    Write-Host "`n[ERRO] $Message" -ForegroundColor Red
    exit 1
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machinePath;$userPath"
}

function Ensure-Command {
    param(
        [string]$Command,
        [string]$WingetId,
        [string]$DisplayName
    )

    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        return
    }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Stop-WithMessage "$DisplayName nao esta instalado e o Windows Package Manager (winget) nao foi encontrado."
    }

    Write-Step "Instalando $DisplayName"
    & winget install --exact --id $WingetId --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "Nao foi possivel instalar $DisplayName."
    }

    Refresh-Path
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Stop-WithMessage "$DisplayName foi instalado, mas ainda nao esta disponivel. Reinicie o computador e rode o instalador novamente."
    }
}

Clear-Host
Write-Host '============================================================' -ForegroundColor DarkCyan
Write-Host '                 INSTALADOR DO PAINEL AYRES' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor DarkCyan
Write-Host "Destino: $InstallPath"

Ensure-Command -Command 'git' -WingetId 'Git.Git' -DisplayName 'Git'
Ensure-Command -Command 'node' -WingetId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'

$nodeVersion = (& node --version).TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 22) {
    Stop-WithMessage "O Node.js $nodeVersion e antigo para este painel. Atualize para Node.js 22 LTS ou superior e rode o instalador novamente."
}

$parentPath = Split-Path -Parent $InstallPath
New-Item -ItemType Directory -Path $parentPath -Force | Out-Null

if (Test-Path (Join-Path $InstallPath '.git')) {
    Write-Step 'O Painel Ayres ja existe. Atualizando o codigo'
    & git -C $InstallPath pull --ff-only
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage 'A atualizacao falhou. Abra o AYRES TERMINAL e use a opcao Status Git.'
    }
}
elseif (Test-Path $InstallPath) {
    $items = @(Get-ChildItem -LiteralPath $InstallPath -Force)
    if ($items.Count -gt 0) {
        Stop-WithMessage "A pasta de destino ja existe e nao esta vazia: $InstallPath"
    }

    Write-Step 'Baixando o Painel Ayres'
    & git clone $RepositoryUrl $InstallPath
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage 'Nao foi possivel clonar o repositorio.'
    }
}
else {
    Write-Step 'Baixando o Painel Ayres'
    & git clone $RepositoryUrl $InstallPath
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage 'Nao foi possivel clonar o repositorio.'
    }
}

Write-Step 'Instalando as dependencias'
& npm.cmd --prefix $InstallPath install
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage 'O npm nao conseguiu instalar as dependencias.'
}

$envFile = Join-Path $InstallPath '.env.local'
if (-not (Test-Path $envFile)) {
    Write-Step 'Configurando a conexao local com o Supabase'
    Write-Host 'Cole abaixo a chave PUBLICAVEL (sb_publishable_...).'
    Write-Host 'Ela sera salva apenas neste computador e nao sera enviada ao GitHub.' -ForegroundColor Yellow
    $publishableKey = Read-Host 'Chave'

    if ($publishableKey -notmatch '^sb_publishable_[A-Za-z0-9_-]+$') {
        Stop-WithMessage 'A chave informada nao tem o formato sb_publishable_ esperado.'
    }

    @(
        "VITE_SUPABASE_URL=$SupabaseUrl"
        "VITE_SUPABASE_PUBLISHABLE_KEY=$publishableKey"
    ) | Set-Content -LiteralPath $envFile -Encoding UTF8
}

$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'AYRES TERMINAL.lnk'
$targetPath = Join-Path $InstallPath 'AYRES TERMINAL.cmd'

try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetPath
    $shortcut.WorkingDirectory = $InstallPath
    $shortcut.Description = 'Atualizar, executar e publicar o Painel Ayres'
    $shortcut.Save()
}
catch {
    Write-Host '[AVISO] Nao foi possivel criar o atalho na Area de Trabalho.' -ForegroundColor Yellow
}

Write-Step 'Instalacao concluida'
Write-Host "Painel: $InstallPath" -ForegroundColor Green
Write-Host "Atalho: $shortcutPath" -ForegroundColor Green

if (-not $SkipLaunch) {
    Write-Host "`nAbrindo o AYRES TERMINAL..." -ForegroundColor Cyan
    Start-Process -FilePath $targetPath -WorkingDirectory $InstallPath
}
