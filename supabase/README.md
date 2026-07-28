# Banco do Painel Ayres V2

A migração em `migrations/20260728010000_initial_schema.sql` cria:

- Supabase Auth ligado à tabela `profiles`;
- cinco filiais iniciais;
- tabelas normalizadas de estadias, embarques, captações e anexos;
- RLS por filial;
- trilha de auditoria;
- bucket privado `ayres-anexos`.

## Primeiro administrador

Depois de aplicar a migração:

1. Crie o usuário em **Authentication > Users**.
2. Copie o UUID do usuário.
3. Execute no SQL Editor, substituindo o UUID e a filial:

```sql
update public.profiles
set
  nome = 'Manoel',
  role = 'admin',
  filial_id = (select id from public.filiais where codigo = 'jatai-go'),
  ativo = true
where id = 'UUID-DO-USUARIO';
```

Novos usuários são criados bloqueados (`ativo = false`) e precisam ser
liberados por um administrador. O frontend nunca recebe chave secreta ou
`service_role`.

