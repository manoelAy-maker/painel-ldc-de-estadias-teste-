import { LockKeyhole, ShieldCheck, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { InlineError } from '../components/Ui'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('E-mail ou senha inválidos. Confira os dados e tente novamente.')
    }
    setSubmitting(false)
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="brand-mark brand-mark--large">A</div>
          <div>
            <strong>PAINEL AYRES</strong>
            <span>CONTROLE LOGÍSTICO INTEGRADO</span>
          </div>
        </div>

        <div className="login-message">
          <span className="eyebrow">OPERAÇÃO EM TEMPO REAL</span>
          <h1>Informação certa. Decisão rápida. Operação sob controle.</h1>
          <p>
            Estadias, embarques e captação reunidos em uma plataforma segura,
            organizada por filial e preparada para crescer.
          </p>
        </div>

        <div className="login-metrics">
          <span><Truck size={18} /> Operação centralizada</span>
          <span><ShieldCheck size={18} /> Acesso por filial</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-icon"><LockKeyhole size={24} /></div>
          <span className="eyebrow">ACESSO RESTRITO</span>
          <h2>Entre na sua conta</h2>
          <p>Use o e-mail corporativo cadastrado pelo administrador.</p>

          {!isSupabaseConfigured && (
            <InlineError message="Configure as variáveis do Supabase antes de entrar." />
          )}
          {error && <InlineError message={error} />}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@empresa.com.br"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Validando acesso…' : 'Entrar no painel'}
          </button>
          <small>Problemas de acesso? Procure o administrador da sua filial.</small>
        </form>
      </section>
    </main>
  )
}
