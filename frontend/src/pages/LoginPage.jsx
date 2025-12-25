import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password required'),
  tenantSubdomain: z.string().optional(),
})

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    setError(null)
    setSubmitting(true)
    try {
      await login(values)
      const redirectTo = location.state?.from?.pathname || '/app'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div>
          <h1 style={{ marginBottom: 8 }}>Welcome back</h1>
          <p className="page-subtitle">Sign in to orchestrate every tenant workspace</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@tenant.com" {...register('email')} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" placeholder="••••••••" {...register('password')} />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="tenantSubdomain">Tenant Subdomain (optional)</label>
            <input id="tenantSubdomain" className="input" placeholder="acme" {...register('tenantSubdomain')} />
            {errors.tenantSubdomain && <span className="field-error">{errors.tenantSubdomain.message}</span>}
          </div>
          {error && <div className="field-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Enter workspace'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)' }}>
          Need a tenant? <Link to="/register">Create one</Link>
        </p>
      </section>
      <section className="auth-hero">
        <div className="auth-hero-content">
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '0.75rem' }}>Pulse</p>
          <h2 style={{ marginTop: 0 }}>Realtime guardrails for every workspace</h2>
          <p>Monitor usage quotas, unlock dormant tenants, and keep every project visible from a single pane.</p>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
