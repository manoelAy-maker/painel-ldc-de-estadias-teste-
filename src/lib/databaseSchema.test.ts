import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260728010000_initial_schema.sql', import.meta.url),
  'utf8',
)

describe('segurança da migração do banco', () => {
  it('ativa RLS em todas as tabelas expostas', () => {
    for (const table of [
      'filiais',
      'profiles',
      'estadias',
      'embarques',
      'captacoes',
      'anexos',
      'audit_logs',
    ]) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`,
      )
    }
  })

  it('não cria política pública para anon', () => {
    expect(migration).not.toMatch(/create policy[\s\S]{0,250}\bto anon\b/i)
  })

  it('não concede exclusão física às aplicações cliente', () => {
    expect(migration).not.toMatch(
      /grant[^;]*\bdelete\b[^;]*\bto authenticated\b/i,
    )
  })

  it('mantém anexos privados, limitados e separados por filial', () => {
    expect(migration).toContain(
      "values ('ayres-anexos', 'ayres-anexos', false, 10485760)",
    )
    expect(migration).toContain('check (posicao in (1, 2))')
    expect(migration).toContain(
      "(storage.foldername(name))[1] = (select private.current_filial_id())::text",
    )
  })

  it('impede visualizadores de gravar dados operacionais', () => {
    expect(migration.match(/\(select private\.can_write\(\)\)/g)?.length).toBeGreaterThanOrEqual(10)
  })
})

