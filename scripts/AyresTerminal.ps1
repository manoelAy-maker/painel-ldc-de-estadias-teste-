[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectPath = Split-Path -Parent $PSScriptRoot
$LocalUrl = 'http://localhost:5173'
$DevProcess = $null

function Write-Header {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor DarkCyan
    Write-Host '                       AYRES TERMINAL' -ForegroundColor Cyan
    Write-Host '          PAINEL LOCAL | GIT | TESTES | PUBLICACAO' -ForegroundColor DarkCyan
    Write-Host '============================================================' -ForegroundColor DarkCyan
    Write-Host "Projeto: $ProjectPath"
    Write-Host
}

function Pause-Ayres {
    Write-Host
    [void](Read-Host 'Pressione ENTER para voltar')
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
    Write-Host "`nVerificando dependencias..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'install')
}

function Update-Project {
    $changes = Get-ChangedFiles
    if ($changes.Count -gt 0) {
        Write-Host 'Ha alteracoes locais. A atualizacao foi interrompida para nao sobrescrever seu trabalho.' -ForegroundColor Yellow
        & git -C $ProjectPath status --short
        return
    }

    Write-Host "`nBuscando atualizacoes..." -ForegroundColor Cyan
    Invoke-External -Command 'git' -Arguments @('-C', $ProjectPath, 'pull', '--ff-only')
    Install-Dependencies
    Write-Host "`nPainel atualizado." -ForegroundColor Green
}

function Start-LocalPanel {
    $envFile = Join-Path $ProjectPath '.env.local'
    if (-not (Test-Path $envFile)) {
        Write-Host 'Falta o arquivo .env.local. Use a opcao Configurar Supabase primeiro.' -ForegroundColor Yellow
        return
    }

    $changes = Get-ChangedFiles
    if ($changes.Count -eq 0) {
        Write-Host "`nAtualizando antes de iniciar..." -ForegroundColor Cyan
        & git -C $ProjectPath pull --ff-only
        if ($LASTEXITCODE -eq 0) {
            Install-Dependencies
        }
        else {
            Write-Host 'Nao foi possivel atualizar agora. Vou iniciar a versao que esta no computador.' -ForegroundColor Yellow
        }
    }
    elseif (-not (Test-Path (Join-Path $ProjectPath 'node_modules'))) {
        Install-Dependencies
    }
    else {
        Write-Host 'Existem alteracoes locais; a atualizacao automatica foi pulada para protege-las.' -ForegroundColor Yellow
    }

    $existing = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "O painel ja esta rodando em $LocalUrl" -ForegroundColor Green
        Start-Process $LocalUrl
        return
    }

    Write-Host "`nIniciando o Painel Ayres..." -ForegroundColor Cyan
    Write-Host 'Esta janela exibira os logs. Use Ctrl+C para encerrar o servidor.' -ForegroundColor DarkGray
    Start-Process $LocalUrl
    Push-Location $ProjectPath
    try {
        & npm.cmd run dev -- --host 127.0.0.1
    }
    finally {
        Pop-Location
    }
}

function Show-GitStatus {
    Write-Host "`nStatus do projeto:" -ForegroundColor Cyan
    & git -C $ProjectPath status -sb
    Write-Host "`nUltimos commits:" -ForegroundColor Cyan
    & git -C $ProjectPath log -5 --oneline --decorate
}

function Test-Project {
    Write-Host "`nExecutando testes..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'test')
    Write-Host "`nGerando build de producao..." -ForegroundColor Cyan
    Invoke-External -Command 'npm.cmd' -Arguments @('--prefix', $ProjectPath, 'run', 'build')
    Write-Host "`nTestes e build aprovados." -ForegroundColor Green
}

function Publish-Project {
    $changes = Get-ChangedFiles
    if ($changes.Count -eq 0) {
        Write-Host "`nNao ha alteracoes para publicar." -ForegroundColor Yellow
        return
    }

    Assert-NoSensitiveFiles
    Write-Host "`nArquivos que serao publicados:" -ForegroundColor Cyan
    & git -C $ProjectPath status --short

    $confirmation = Read-Host "`nDigite PUBLICAR para validar, criar o commit e enviar ao GitHub"
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
    Write-Host "`nAlteracoes publicadas no GitHub." -ForegroundColor Green
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
    Write-Host "`nSupabase configurado apenas neste computador." -ForegroundColor Green
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

try {
    Test-RequiredCommands
    Set-Location $ProjectPath

    while ($true) {
        Write-Header
        Write-Host '[1] Atualizar e rodar painel local' -ForegroundColor Green
        Write-Host '[2] Atualizar do GitHub'
        Write-Host '[3] Publicar alteracoes no GitHub' -ForegroundColor Yellow
        Write-Host '[4] Ver status do Git'
        Write-Host '[5] Rodar testes e build'
        Write-Host '[6] Abrir projeto no VS Code'
        Write-Host '[7] Configurar Supabase local'
        Write-Host '[0] Sair'
        Write-Host

        $option = Read-Host 'Escolha'
        try {
            switch ($option) {
                '1' { Start-LocalPanel }
                '2' { Update-Project; Pause-Ayres }
                '3' { Publish-Project; Pause-Ayres }
                '4' { Show-GitStatus; Pause-Ayres }
                '5' { Test-Project; Pause-Ayres }
                '6' { Open-Project }
                '7' { Configure-Supabase; Pause-Ayres }
                '0' { exit 0 }
                default { Write-Host 'Opcao invalida.' -ForegroundColor Yellow; Start-Sleep -Seconds 1 }
            }
        }
        catch {
            Write-Host "`n[ERRO] $($_.Exception.Message)" -ForegroundColor Red
            Pause-Ayres
        }
    }
}
catch {
    Write-Host "`n[ERRO] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Corrija o problema e abra novamente o AYRES TERMINAL.' -ForegroundColor Yellow
    exit 1
}
