import React, { useState } from 'react'
import { Button } from '../Button'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { Input } from '../Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs'
import { ForgotPassword } from './ForgotPassword'

export interface MagicLinkAuthProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (data: { email: string; password: string }) => Promise<void>
  onMagicLink: (data: { email: string }) => Promise<void>
  onSignup: (data: { organization: string; email: string; password: string; confirmPassword: string }) => Promise<void>
  onForgotPassword?: (email: string) => Promise<void>
  isLoading?: boolean
  error?: string
}

export function MagicLinkAuth({ 
  isOpen, 
  onClose, 
  onLogin, 
  onMagicLink,
  onSignup,
  onForgotPassword,
  isLoading = false, 
  error 
}: MagicLinkAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'magic-link' | 'signup'>('magic-link')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  // Magic link form state
  const [magicLinkData, setMagicLinkData] = useState({
    email: '',
    sent: false
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await onMagicLink(magicLinkData)
    setMagicLinkData(prev => ({ ...prev, sent: true }))
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'magic-link' | 'signup')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="login">Password</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="magic-link" className="mt-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Magic Link</h3>
                <p className="text-sm text-gray-600">Get a secure link sent to your email. No password needed.</p>
              </div>
              
              {!magicLinkData.sent ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@company.com"
                    value={magicLinkData.email}
                    onChange={(e) => setMagicLinkData(prev => ({ ...prev, email: e.target.value }))}
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
                    Send Magic Link
                  </Button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    We've sent a magic link to <strong>{magicLinkData.email}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Click the link in the email to sign in. The link expires in 15 minutes.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMagicLinkData({ email: '', sent: false })}
                    className="w-full"
                  >
                    Send to different email
                  </Button>
                </div>
              )}
            </TabsContent>
            
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
                    Prefer passwordless?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('magic-link')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Use magic link
                    </button>
                  </p>
                  {onForgotPassword && (
                    <p className="text-sm text-gray-600 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Forgot password?
                      </button>
                    </p>
                  )}
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
      
      {/* Forgot Password Modal */}
      {onForgotPassword && (
        <ForgotPassword
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          onSubmit={onForgotPassword}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  )
}
