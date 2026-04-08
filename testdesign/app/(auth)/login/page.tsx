'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { MessageSquare, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(email, password)
    
    if (success) {
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">ConnectHub</span>
          </div>
          <p className="text-muted-foreground text-center">
            Multi-niche communication platform for managing your workforce via SMS
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@cleaning.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}

              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Demo accounts (password: <code className="bg-muted px-1 py-0.5 rounded text-xs">demo123</code>)
              </p>
              <div className="grid gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@cleaning.demo'); setPassword('demo123') }}
                  className="text-left px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">admin@cleaning.demo</span>
                  <span className="text-muted-foreground ml-2">- CleanPro Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@hospital.demo'); setPassword('demo123') }}
                  className="text-left px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">admin@hospital.demo</span>
                  <span className="text-muted-foreground ml-2">- Metro General Hospital</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@transport.demo'); setPassword('demo123') }}
                  className="text-left px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">admin@transport.demo</span>
                  <span className="text-muted-foreground ml-2">- Swift Logistics</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
