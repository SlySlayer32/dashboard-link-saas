import React, { useState } from 'react'
import { Button } from '../Button'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { Input } from '../Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs'

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (data: { email: string; password: string }) => Promise<void>
  onSignup: (data: { organization: string; email: string; password: string; confirmPassword: string }) => Promise<void>
  isLoading?: boolean
  error?: string
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onSignup, 
  isLoading = false, 
  error 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    organization: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin(loginData)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSignup(signupData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dashboard Link</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Sign In
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Need an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  label="Organization Name"
                  type="text"
                  placeholder="Your company name"
                  value={signupData.organization}
                  onChange={(e) => setSignupData(prev => ({ ...prev, organization: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  disabled={isLoading}
                  error={signupData.confirmPassword && signupData.password !== signupData.confirmPassword ? 'Passwords do not match' : undefined}
                />
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={signupData.termsAccepted}
                    onChange={(e) => setSignupData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    disabled={isLoading}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  loading={isLoading}
                  disabled={isLoading || !signupData.termsAccepted}
                >
                  Create Account
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
