import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthContext } from '@/lib/auth-context'

type Step = 'email' | 'sent'

export function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithOtp } = useAuthContext()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signInWithOtp(email)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'email'
              ? 'Enter your email to sign in'
              : 'Check your email'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to sign in.
            </p>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-primary underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
