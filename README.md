# Painel Ayres V2

Reconstrução limpa do controle logístico Ayres.

## Módulos

- Visão geral;
- Controle de estadias;
- Controle de embarques;
- Captação de veículos;
- Relatórios;
- Administração por perfil e filial.

## Desenvolvimento

Requisitos: Node.js 24 ou versão LTS compatível.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure em `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

A chave publicável pode ser usada no navegador porque o acesso real é
protegido pelas políticas RLS. Nunca use `service_role` no frontend.

## Validação

```bash
npm test
npm run build
```

O banco versionado está em `supabase/migrations`.

## AYRES Terminal no Windows

O projeto inclui um terminal próprio para instalar, atualizar, executar,
publicar e trabalhar no painel com o Codex AI.

### Primeira instalação

1. Baixe `INSTALAR AYRES.cmd` pelo GitHub.
2. Abra o arquivo no Windows.
3. Informe a chave publicável do Supabase quando solicitado.

O instalador:

- instala Git e Node.js LTS pelo `winget`, se necessário;
- baixa o painel em `Documentos\AYRES\painel-ldc-de-estadias`;
- instala as dependências;
- cria o `.env.local` somente no computador;
- cria o atalho `AYRES TERMINAL` na Área de Trabalho.

### Uso diário

Abra `AYRES TERMINAL` para:

- atualizar e iniciar o painel em `http://localhost:5173`;
- manter o servidor local em uma janela independente e voltar ao menu;
- atualizar o código do GitHub;
- validar e publicar alterações;
- consultar o status do Git;
- executar testes e build;
- abrir o projeto no VS Code;
- reconfigurar a conexão local com o Supabase;
- instalar e abrir o Codex AI diretamente na pasta do projeto.

No primeiro uso da opção **Codex AI**, confirme `INSTALAR`. O terminal instala a
CLI oficial `@openai/codex` e abre o login pelo navegador. Nenhuma chave da
OpenAI é gravada no projeto.

Antes de publicar, o terminal mostra os arquivos alterados, bloqueia arquivos
sensíveis, exige a confirmação `PUBLICAR` e só envia o commit depois que testes
e build forem aprovados.
