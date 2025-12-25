import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const schema = z.object({
  tenantName: z.string().min(2, 'Tenant name is required'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters'),
  adminFullName: z.string().min(2, 'Admin name is required'),
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z.string().min(8, 'Password must be 8+ characters'),
})

const RegisterPage = () => {
  const navigate = useNavigate()
  const { registerTenant } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await registerTenant(values)
      setSuccess('Tenant created. You can sign in now.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to register tenant')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div>
          <h1 style={{ marginBottom: 8 }}>Launch a tenant</h1>
          <p className="page-subtitle">Provision a dedicated workspace in seconds</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label htmlFor="tenantName">Tenant name</label>
            <input id="tenantName" className="input" placeholder="Cosmic Design" {...register('tenantName')} />
            {errors.tenantName && <span className="field-error">{errors.tenantName.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="subdomain">Subdomain</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="subdomain" className="input" placeholder="cosmic" {...register('subdomain')} />
              <div className="pill" style={{ alignSelf: 'center' }}>.saas.local</div>
            </div>
            {errors.subdomain && <span className="field-error">{errors.subdomain.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="adminFullName">Admin name</label>
            <input id="adminFullName" className="input" placeholder="Jamie Lee" {...register('adminFullName')} />
            {errors.adminFullName && <span className="field-error">{errors.adminFullName.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="adminEmail">Admin email</label>
            <input id="adminEmail" type="email" className="input" placeholder="jamie@cosmic.com" {...register('adminEmail')} />
            {errors.adminEmail && <span className="field-error">{errors.adminEmail.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="adminPassword">Password</label>
            <input id="adminPassword" type="password" className="input" placeholder="••••••••" {...register('adminPassword')} />
            {errors.adminPassword && <span className="field-error">{errors.adminPassword.message}</span>}
          </div>
          {error && <div className="field-error">{error}</div>}
          {success && <div style={{ color: 'var(--success)' }}>{success}</div>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create tenant'}
          </button>
        </form>
        <p style={{ color: 'var(--muted)' }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
      <section className="auth-hero">
        <div className="auth-hero-content">
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '0.75rem' }}>Blueprint</p>
          <h2 style={{ marginTop: 0 }}>Provision, invite, and enforce usage caps out-of-the-box</h2>
          <p>Your new tenant ships with project, task, and audit layers so teams can work instantly.</p>
        </div>
      </section>
    </div>
  )
}

export default RegisterPage
