# Banco do Painel Ayres V2

A migração em `migrations/20260728010000_initial_schema.sql` cria:

- Supabase Auth ligado à tabela `profiles`;
- cinco filiais iniciais;
- tabelas normalizadas de estadias, embarques, captações e anexos;
- RLS por filial;
- trilha de auditoria;
- bucket privado `ayres-anexos`.

Também estão protegidos no banco:

- visualizadores têm acesso somente de leitura;
- operadores e gestores alteram apenas registros da própria filial;
- somente administradores atravessam filiais e administram perfis;
- `created_by` e a filial de um registro não podem ser trocados por operadores;
- cada registro aceita no máximo dois anexos ativos;
- o caminho do arquivo precisa começar pelo UUID da filial;
- anexos precisam apontar para um registro real da mesma filial;
- finalizar uma estadia registra automaticamente usuário e horário;
- exclusão operacional é lógica por `deleted_at`, preservando histórico e lixeira.

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

## Verificação

Depois de aplicar a migração, execute `verify_database.sql` no SQL Editor.
Todas as linhas devem retornar `ok = true`. O arquivo é somente leitura e
confere tabelas, RLS, bloqueio do papel `anon`, bucket privado e as cinco
filiais iniciais.
