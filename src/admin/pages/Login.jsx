import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { site } from '../../config/site.js'
import { signIn } from '../api.js'

function loginError(err) {
  const message = err?.message ?? ''
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.'
  if (/email not confirmed/i.test(message)) return 'This email address has not been confirmed yet.'
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.'
  return message || 'Could not sign in. Check your connection and try again.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `Sign in · Admin | ${site.name}`
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      // AdminApp picks up the new session from onAuthStateChange.
    } catch (err) {
      setError(loginError(err))
      setBusy(false)
    }
  }

  return (
    <div className="a-fullscreen a-login">
      <form className="a-auth-card" onSubmit={onSubmit}>
        <img src={site.logo.wordmark} alt={site.fullName} className="a-login__logo" width="270" height="51" />
        <div>
          <h1>Admin sign in</h1>
          <p className="a-muted">Manage courses, images, testimonials and enquiries.</p>
        </div>

        <div className="a-field">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            className="a-input"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="a-field">
          <label htmlFor="admin-password">Password</label>
          <div className="a-password">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              className="a-input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="a-icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="a-auth-card__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="a-btn a-btn--primary a-btn--block" disabled={busy}>
          {busy ? <Loader2 size={18} className="a-spin" /> : <Lock size={16} />}
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  )
}
