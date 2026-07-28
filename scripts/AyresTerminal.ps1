[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectPath = Split-Path -Parent $PSScriptRoot
$LocalUrl = 'http://localhost:5173'

function Set-AyresConsole {
    try {
        $Host.UI.RawUI.WindowTitle = 'AYRES // COMMAND TERMINAL'
        $Host.UI.RawUI.BackgroundColor = 'Black'
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    }
    catch {
        # Aparencia aprimorada quando o host oferece suporte.
    }
}

function Test-LocalPanel {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $LocalUrl -TimeoutSec 2 -ErrorAction Stop
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    }
    catch {
        return $false
    }
}

function Get-GitBranch {
    $branch = (& git -C $ProjectPath branch --show-current 2>$null)
    if ([string]::IsNullOrWhiteSpace($branch)) {
        return 'desconhecida'
    }

    return $branch.Trim()
}

function Write-Header {
    Clear-Host
    $localStatus = if (Test-LocalPanel) { 'ONLINE :5173' } else { 'OFFLINE' }
    $localColor = if (Test-LocalPanel) { 'Green' } else { 'DarkGray' }
    $codexStatus = if (Get-Command codex.cmd -ErrorAction SilentlyContinue) { 'READY' } else { 'NAO INSTALADO' }
    $codexColor = if ($codexStatus -eq 'READY') { 'Green' } else { 'Yellow' }

    Write-Host '  +----------------------------------------------------------+' -ForegroundColor DarkGreen
    Write-Host '  |  AYRES // COMMAND TERMINAL                               |' -ForegroundColor Green
    Write-Host '  |  PROJECT OPERATIONS + LOCAL CONTROL + CODEX AI           |' -ForegroundColor Cyan
    Write-Host '  +----------------------------------------------------------+' -ForegroundColor DarkGreen
    Write-Host
    Write-Host '  SYSTEM  ' -NoNewline -ForegroundColor DarkGray
    Write-Host 'ONLINE' -NoNewline -ForegroundColor Green
    Write-Host '   USER  ' -NoNewline -ForegroundColor DarkGray
    Write-Host $env:USERNAME -NoNewline -ForegroundColor Cyan
    Write-Host '   BRANCH  ' -NoNewline -ForegroundColor DarkGray
    Write-Host (Get-GitBranch) -ForegroundColor White
    Write-Host '  LOCAL   ' -NoNewline -ForegroundColor DarkGray
    Write-Host $localStatus -NoNewline -ForegroundColor $localColor
    Write-Host '   CODEX  ' -NoNewline -ForegroundColor DarkGray
    Write-Host $codexStatus -ForegroundColor $codexColor
    Write-Host
    Write-Host '  [ PAINEL LOCAL ]' -ForegroundColor DarkCyan
}

function Pause-Ayres {
    Write-Host
    [void](Read-Host '  Pressione ENTER para voltar ao menu')
}

function Invoke-External {
    param(
        [Parameter(Mandatory)]
        [string]$Command,
        [string[]]$Arguments = @(),
        [switch]$AllowFailure
    )

    & $Command @Arguments
    $exitCode = $LASTEXITCODE
    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "O comando '$Command' terminou com o codigo $exitCode."
    }

    return $exitCode
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $npmPath = Join-Path $env:APPDATA 'npm'
    $env:Path = "$machinePath;$userPath;$npmPath"
}

function Test-RequiredCommands {
    foreach ($command in @('git', 'node', 'npm.cmd')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "O comando '$command' nao foi encontrado. Rode novamente o INSTALAR AYRES."
        }
    }
}

function Get-ChangedFiles {
    return @(& git -C $ProjectPath status --porcelain)
}

function Assert-NoSensitiveFiles {
    $sensitive = @(Get-ChangedFiles | Where-Object {
        $_ -match '(^|[\\/\s])\.env($|\.)' -or
        $_ -match '\.(pem|pfx|key)(\s|$)'
    })

    if ($sensitive.Count -gt 0) {
        Write-Host 'Publicacao bloqueada: encontrei arquivo sensivel no Git.' -ForegroundColor Red
        $sensitive | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        throw 'Remova esses arquivos do controle do Git antes de publicar.'
    }
}

function Install-Dependencies {
    Write-Host "`n  [>] Verificando dependencias..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'install', '--prefer-offline', '--no-audit', '--no-fund')
}

function Update-Project {
    $changes = Get-ChangedFiles
    if ($changes.Count -gt 0) {
        Write-Host 'Ha alteracoes locais. A atualizacao foi interrompida para nao sobrescrever seu trabalho.' -ForegroundColor Yellow
        & git -C $ProjectPath status --short
        return
    }

    Write-Host "`n  [>] Buscando atualizacoes..." -ForegroundColor Cyan
    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'pull', '--ff-only')
    Install-Dependencies
    Write-Host "`n  [OK] Painel atualizado." -ForegroundColor Green
}

function Start-LocalPanel {
    $envFile = Join-Path $ProjectPath '.env.local'
    if (-not (Test-Path $envFile)) {
        Write-Host 'Falta o arquivo .env.local. Use Configurar Supabase primeiro.' -ForegroundColor Yellow
        return
    }

    $nodeModules = Join-Path $ProjectPath 'node_modules'
    $lockFile = Join-Path $ProjectPath 'package-lock.json'
    $lockHashBefore = if (Test-Path $lockFile) { (Get-FileHash -LiteralPath $lockFile -Algorithm SHA256).Hash } else { '' }

    $changes = Get-ChangedFiles
    if ($changes.Count -eq 0) {
        Write-Host "`n  [>] Sincronizando antes de iniciar..." -ForegroundColor Cyan
        & git -C $ProjectPath pull --ff-only
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'Nao foi possivel atualizar. Vou iniciar a versao local.' -ForegroundColor Yellow
        }
    }
    else {
        Write-Host 'Alteracoes locais detectadas; atualizacao automatica ignorada para protege-las.' -ForegroundColor Yellow
    }

    $lockHashAfter = if (Test-Path $lockFile) { (Get-FileHash -LiteralPath $lockFile -Algorithm SHA256).Hash } else { '' }
    if (-not (Test-Path $nodeModules) -or $lockHashBefore -ne $lockHashAfter) {
        Install-Dependencies
    }
    else {
        Write-Host '  [OK] Dependencias ja instaladas. Inicializacao rapida.' -ForegroundColor DarkGreen
    }

    if (Test-LocalPanel) {
        Write-Host "`n  [OK] Painel ja esta rodando em $LocalUrl" -ForegroundColor Green
        Start-Process $LocalUrl
        return
    }

    $serverScript = Join-Path $PSScriptRoot 'StartLocalPanel.ps1'
    $serverArguments = "-NoExit -NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$serverScript`""
    Start-Process -FilePath 'powershell.exe' -ArgumentList $serverArguments -WorkingDirectory $ProjectPath

    Write-Host "`n  [>] Inicializando servidor local em outra janela..." -ForegroundColor Cyan
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-LocalPanel) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Host "  [OK] Painel online: $LocalUrl" -ForegroundColor Green
        Start-Process $LocalUrl
    }
    else {
        $logFile = Join-Path $ProjectPath 'AYRES-LOCAL-SERVER.log'
        Write-Host '  [ERRO] O servidor nao respondeu em 30 segundos.' -ForegroundColor Red
        Write-Host "  Confira a janela AYRES LOCAL SERVER ou o log: $logFile" -ForegroundColor Yellow
    }
}

function Open-Codex {
    $codex = Get-Command codex.cmd -ErrorAction SilentlyContinue
    if (-not $codex) {
        Write-Host "`n  Codex AI ainda nao esta instalado." -ForegroundColor Yellow
        $confirmation = Read-Host '  Digite INSTALAR para instalar a CLI oficial da OpenAI'
        if ($confirmation -cne 'INSTALAR') {
            Write-Host '  Instalacao cancelada.' -ForegroundColor DarkGray
            return
        }

        Write-Host "`n  [>] Instalando Codex AI..." -ForegroundColor Cyan
        Invoke-External -Command 'npm.cmd' -Arguments @('install', '--global', '@openai/codex')
        Refresh-Path
        $codex = Get-Command codex.cmd -ErrorAction SilentlyContinue
        if (-not $codex) {
            throw 'Codex foi instalado, mas ainda nao apareceu no PATH. Feche e abra o AYRES TERMINAL.'
        }
    }

    $codexScript = Join-Path $PSScriptRoot 'StartCodex.ps1'
    $codexArguments = "-NoExit -NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$codexScript`""
    Start-Process -FilePath 'powershell.exe' -ArgumentList $codexArguments -WorkingDirectory $ProjectPath
    Write-Host "`n  [OK] Codex AI aberto na pasta do Painel Ayres." -ForegroundColor Green
    Write-Host '  O menu principal continuara aberto nesta janela.' -ForegroundColor DarkGray
}

function Show-GitStatus {
    Write-Host "`n  Status do projeto:" -ForegroundColor Cyan
    & git -C $ProjectPath status -sb
    Write-Host "`n  Ultimos commits:" -ForegroundColor Cyan
    & git -C $ProjectPath log -5 --oneline --decorate
}

function Test-Project {
    Write-Host "`n  [>] Executando testes..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'test')
    Write-Host "`n  [>] Gerando build de producao..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'run', 'build')
    Write-Host "`n  [OK] Testes e build aprovados." -ForegroundColor Green
}

function Publish-Project {
    $changes = Get-ChangedFiles
    if ($changes.Count -eq 0) {
        Write-Host "`n  Nao ha alteracoes para publicar." -ForegroundColor Yellow
        return
    }

    Assert-NoSensitiveFiles
    Write-Host "`n  Arquivos que serao publicados:" -ForegroundColor Cyan
    & git -C $ProjectPath status --short

    $confirmation = Read-Host "`n  Digite PUBLICAR para validar, criar o commit e enviar"
    if ($confirmation -cne 'PUBLICAR') {
        Write-Host 'Publicacao cancelada.' -ForegroundColor Yellow
        return
    }

    Test-Project
    $message = Read-Host 'Descreva a alteracao em uma frase'
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Atualiza Painel Ayres em $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
    }

    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'add', '--all')
    Assert-NoSensitiveFiles
    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'commit', '-m', $message)
    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'pull', '--rebase')
    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'push')
    Write-Host "`n  [OK] Alteracoes publicadas no GitHub." -ForegroundColor Green
}

function Configure-Supabase {
    $envFile = Join-Path $ProjectPath '.env.local'
    $supabaseUrl = Read-Host 'URL do Supabase [https://tpvkuqzxafuyubhtqydd.supabase.co]'
    if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
        $supabaseUrl = 'https://tpvkuqzxafuyubhtqydd.supabase.co'
    }

    if ($supabaseUrl -notmatch '^https://[a-z0-9]+\.supabase\.co$') {
        Write-Host 'URL do Supabase invalida.' -ForegroundColor Red
        return
    }

    $publishableKey = Read-Host 'Chave publicavel (sb_publishable_...)'
    if ($publishableKey -notmatch '^sb_publishable_[A-Za-z0-9_-]+$') {
        Write-Host 'Chave publicavel invalida.' -ForegroundColor Red
        return
    }

    @(
        "VITE_SUPABASE_URL=$supabaseUrl"
        "VITE_SUPABASE_PUBLISHABLE_KEY=$publishableKey"
    ) | Set-Content -LiteralPath $envFile -Encoding UTF8
    Write-Host "`n  [OK] Supabase configurado apenas neste computador." -ForegroundColor Green
}


function Invoke-LoadTest {
    $target = Read-Host "Endereco para testar [$LocalUrl]"
    if ([string]::IsNullOrWhiteSpace($target)) { $target = $LocalUrl }
    if ($target -notmatch '^https?://') {
        Write-Host 'Informe um endereco iniciado por http:// ou https://.' -ForegroundColor Red
        return
    }
    if ($target -eq $LocalUrl -and -not (Test-LocalPanel)) {
        Write-Host 'O painel local esta offline. Use a opcao 1 antes do teste.' -ForegroundColor Yellow
        return
    }

    Write-Host '  Degraus sugeridos: 50, 200, 500 e 1000 usuarios.' -ForegroundColor DarkGray
    $rawUsers = Read-Host 'Usuarios simultaneos [200] (1 a 1000)'
    if ([string]::IsNullOrWhiteSpace($rawUsers)) { $rawUsers = '200' }
    $users = 0
    if (-not [int]::TryParse($rawUsers, [ref]$users) -or $users -lt 1 -or $users -gt 1000) {
        Write-Host 'Informe um numero inteiro entre 1 e 1000.' -ForegroundColor Red
        return
    }

    $rawDuration = Read-Host 'Duracao em segundos [60] (5 a 300)'
    if ([string]::IsNullOrWhiteSpace($rawDuration)) { $rawDuration = '60' }
    $duration = 0
    if (-not [int]::TryParse($rawDuration, [ref]$duration) -or $duration -lt 5 -or $duration -gt 300) {
        Write-Host 'Informe uma duracao entre 5 e 300 segundos.' -ForegroundColor Red
        return
    }

    if ($target -match '^https://' -and $users -ge 100) {
        Write-Host "`n  Carga alta: $users usuarios por $duration segundos em URL publica." -ForegroundColor Yellow
        $confirmation = Read-Host '  Digite TESTAR para confirmar que a URL e sua'
        if ($confirmation -cne 'TESTAR') {
            Write-Host '  Teste cancelado.' -ForegroundColor DarkGray
            return
        }
    }

    if ($users -gt 500) {
        Write-Host "`n  TESTE EXTREMO: a carga pode atingir limites da hospedagem e do seu plano." -ForegroundColor Red
        $extremeConfirmation = Read-Host '  Digite CARGA EXTREMA para continuar'
        if ($extremeConfirmation -cne 'CARGA EXTREMA') {
            Write-Host '  Teste extremo cancelado.' -ForegroundColor DarkGray
            return
        }
    }

    Write-Host "`n  [>] Simulando $users usuarios simultaneos por $duration segundos..." -ForegroundColor Cyan
    Write-Host '  Leituras GET em intervalos controlados; nenhum cadastro sera alterado.' -ForegroundColor DarkGray
    $loadTestScript = Join-Path $PSScriptRoot 'LoadTest.mjs'
    Invoke-External -Command 'node' -Arguments @($loadTestScript, $target, [string]$users, [string]$duration) -AllowFailure
}

function Open-Project {
    if (Get-Command code -ErrorAction SilentlyContinue) {
        & code $ProjectPath
    }
    else {
        Start-Process explorer.exe -ArgumentList $ProjectPath
        Write-Host 'VS Code nao encontrado; abri a pasta no Explorador.' -ForegroundColor Yellow
    }
}

Set-AyresConsole

try {
    Test-RequiredCommands
    Set-Location $ProjectPath

    while ($true) {
        Write-Header
        Write-Host '  [1] INICIAR / ABRIR PAINEL LOCAL' -ForegroundColor Green
        Write-Host '  [2] Atualizar codigo do GitHub'
        Write-Host '  [3] Publicar alteracoes no GitHub' -ForegroundColor Yellow
        Write-Host '  [4] Ver status e historico Git'
        Write-Host '  [5] Rodar testes e build'
        Write-Host '  [6] Abrir projeto no VS Code'
        Write-Host '  [7] Configurar Supabase local'
        Write-Host
        Write-Host '  [ CODEX AI ]' -ForegroundColor DarkCyan
        Write-Host '  [8] ABRIR CODEX AI NO PROJETO' -ForegroundColor Cyan
        Write-Host
        Write-Host '  [ TESTE DE CAPACIDADE ]' -ForegroundColor DarkCyan
        Write-Host '  [9] TESTAR CAPACIDADE (ATE 1000 USUARIOS)' -ForegroundColor Magenta
        Write-Host
        Write-Host '  [0] Sair' -ForegroundColor DarkGray
        Write-Host

        $option = Read-Host '  AYRES>'
        try {
            switch ($option) {
                '1' { Start-LocalPanel; Pause-Ayres }
                '2' { Update-Project; Pause-Ayres }
                '3' { Publish-Project; Pause-Ayres }
                '4' { Show-GitStatus; Pause-Ayres }
                '5' { Test-Project; Pause-Ayres }
                '6' { Open-Project; Pause-Ayres }
                '7' { Configure-Supabase; Pause-Ayres }
                '8' { Open-Codex; Pause-Ayres }
                '9' { Invoke-LoadTest; Pause-Ayres }
                '0' { exit 0 }
                default { Write-Host '  Opcao invalida.' -ForegroundColor Yellow; Start-Sleep -Seconds 1 }
            }
        }
        catch {
            Write-Host "`n  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
            Pause-Ayres
        }
    }
}
catch {
    Write-Host "`n  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  Corrija o problema e abra novamente o AYRES TERMINAL.' -ForegroundColor Yellow
    Pause-Ayres
    exit 1
}
