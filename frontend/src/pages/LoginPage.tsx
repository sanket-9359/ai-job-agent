import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { loginUser } from '../api'
import type { AuthUser } from '../types'

interface Props {
  onSuccess: (user: AuthUser, token: string) => void
  onSwitchToRegister: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage({ onSuccess, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!EMAIL_REGEX.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'
    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setServerError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const response = await loginUser(email.trim(), password)
      onSuccess(response.user, response.token)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05070f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-muted">Secure access</p>
          <h1 className="text-3xl font-bold">Login to AI Job Agent</h1>
          <p className="text-sm text-muted">Use your registered account to access your dashboard.</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-white">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-accent"
              placeholder=""
              autoComplete="off"
              spellCheck={false}
            />
            {errors.email && <p className="mt-2 text-xs text-red-200">{errors.email}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-[#0b1220] px-4 py-3 pr-12 text-white outline-none transition focus:border-accent"
                placeholder=""
                autoComplete="new-password"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-xs text-red-200">{errors.password}</p>}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full justify-center rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to AI Job Agent?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  )
}
