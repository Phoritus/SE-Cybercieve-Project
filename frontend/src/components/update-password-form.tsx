import { cn } from '@/src/libs/utils'
import { supabase } from '@/src/api/supabaseClient'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/src/components/ui/card'

import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border-slate-800 bg-slate-900/30 py-0 shadow-none backdrop-blur-sm">
        <CardHeader className="pb-0">
        </CardHeader>
          <CardContent className="px-6 pb-6 pt-4 sm:px-8">
            <form className="mx-auto w-full max-w-md space-y-4" onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-slate-100">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="New password"
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
                <Label htmlFor="confirm-password" className="text-slate-100">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className="h-10 border-slate-800 bg-slate-800/70 pr-12 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
              {success && <p className="text-sm text-emerald-400">Password updated successfully. Redirecting to login...</p>}
              <Button type="submit" className="h-10 w-full bg-blue-500 text-white hover:bg-blue-400" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save new password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
