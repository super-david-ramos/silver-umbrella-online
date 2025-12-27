import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OTPInput } from './OTPInput'
import { useAuthContext } from '@/lib/auth-context'

type Step = 'email' | 'otp'

export function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithOtp, verifyOtp } = useAuthContext()
  const navigate = useNavigate()

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

    setStep('otp')
    setLoading(false)
  }

  const handleOTPComplete = async (code: string) => {
    setLoading(true)
    setError(null)

    const { error } = await verifyOtp(email, code)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/app')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'email'
              ? 'Enter your email to sign in'
              : 'Enter the code sent to your email'}
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
          <div className="space-y-4">
            <OTPInput onComplete={handleOTPComplete} disabled={loading} />
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-primary underline"
              >
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
