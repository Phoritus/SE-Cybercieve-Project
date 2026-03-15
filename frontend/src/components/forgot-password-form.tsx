import { cn } from '@/src/libs/utils'
import { supabase } from '@/src/api/supabaseClient'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-5', className)} {...props}>
      {success ? (
        <Card className="border-slate-800 bg-slate-900/30 py-0 shadow-none backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-300">
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
            <Button className="mt-4 h-10 w-full bg-blue-500 text-white hover:bg-blue-400" onClick={() => location.href = "/login"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-800 bg-slate-900/30 py-0 shadow-none backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-100">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    className="h-10 border-slate-800 bg-slate-800/70 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="h-10 w-full bg-blue-500 text-white hover:bg-blue-400" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send reset email'}
                </Button>
              </div>
              <div className="mt-3.5 text-center text-sm text-slate-300">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 transition-colors hover:text-blue-300">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
