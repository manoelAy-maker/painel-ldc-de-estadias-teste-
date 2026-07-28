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
