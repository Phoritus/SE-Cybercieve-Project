import { cn } from '@/src/libs/utils'
import { supabase } from '@/src/api/supabaseClient'
import api from '@/src/api/axios'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        await api.post('/register', {
          id: data.user.id,
          email: email,
          username: email.split("@")[0]
        });
        setSuccess(true)
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError(error.message || 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      console.error("Google login failed", err)
      setError(err.message || "Could not initiate Google login.")
    }
  }

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      console.error("Github login failed", err)
      setError(err.message || "Could not initiate Github login.")
    }
  }

  return (
    <div className={cn('flex flex-col gap-5', className)} {...props}>
      {success ? (
        <Card className="border-slate-800 bg-slate-900/30 py-0 shadow-none backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-300">
              You&apos;ve successfully signed up. Please check your email to confirm your account
              before signing in.
            </p>
            <Button className="mt-4 h-10 w-full bg-blue-500 text-white hover:bg-blue-400" onClick={() => location.href = "/login"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-800 bg-slate-900/30 py-0 shadow-none backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-100">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-10 border-slate-800 bg-slate-800/70 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-slate-100">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="ml-auto inline-block text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="h-10 border-slate-800 bg-slate-800/70 pr-12 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#FFFFFF80] transition-colors hover:text-white"
                      aria-label={showPasswords ? 'Hide value' : 'Show value'}
                    >
                      <Icon icon="iconoir:eye-solid" width={18} height={18} style={{ color: '#FFFFFF80' }} />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="repeat-password" className="text-slate-100">Confirm Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="repeat-password"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="h-10 border-slate-800 bg-slate-800/70 pr-12 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#FFFFFF80] transition-colors hover:text-white"
                      aria-label={showPasswords ? 'Hide value' : 'Show value'}
                    >
                      <Icon icon="iconoir:eye-solid" width={18} height={18} style={{ color: '#FFFFFF80' }} />
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="h-10 w-full bg-blue-500 text-white hover:bg-blue-400" disabled={isLoading}>
                  {isLoading ? 'Creating an account...' : 'Sign up'}
                </Button>
              </div>
              <div className="mt-3.5 flex flex-col gap-2">
                <Button variant="outline" className="h-10 w-full border-blue-500/60 bg-transparent text-slate-100 hover:bg-blue-500/10 hover:text-white" onClick={handleGoogleLogin} type="button">
                  Sign up with Google
                </Button>
                <Button variant="outline" className="h-10 w-full border-blue-500/60 bg-transparent text-slate-100 hover:bg-blue-500/10 hover:text-white" onClick={handleGithubLogin} type="button">
                  Sign up with GitHub
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
