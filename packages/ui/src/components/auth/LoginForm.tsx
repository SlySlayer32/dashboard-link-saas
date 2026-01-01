import React, { useState } from 'react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card'
import { Input } from '../Input'
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '../Modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  onForgotPassword?: () => void
  onSwitchToSignup?: () => void
  isLoading?: boolean
  error?: string
}

export function LoginForm({ 
  onSubmit, 
  onForgotPassword, 
  onSwitchToSignup, 
  isLoading = false, 
  error 
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const errors: typeof fieldErrors = {}
    
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(email, password)
    } catch {
      // Error handling is managed by parent component
    }
  }

  return (
    <Card variant="default" className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Dashboard Link account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <Badge variant="error" className="text-sm">
                {error}
              </Badge>
            </div>
          )}
          
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={isLoading}
            required
          />
          
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </Button>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          
          {onSwitchToSignup && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={onSwitchToSignup}
                  disabled={isLoading}
                >
                  Sign up
                </Button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

interface AuthModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (data: SignupData) => Promise<void>
  onForgotPassword?: () => void
  isLoading?: boolean
  error?: string
}

interface SignupData {
  organizationName: string
  adminEmail: string
  adminPassword: string
  confirmPassword: string
  acceptTerms: boolean
}

export function AuthModal({ 
  isOpen, 
  onOpenChange, 
  onLogin, 
  onSignup, 
  onForgotPassword,
  isLoading = false, 
  error 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  
  const handleLogin = async (email: string, password: string) => {
    await onLogin(email, password)
  }
  
  const handleSignup = async (data: SignupData) => {
    await onSignup(data)
  }
  
  const switchToSignup = () => setActiveTab('signup')
  const switchToLogin = () => setActiveTab('login')
  
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>Authentication</ModalTitle>
          <ModalDescription>
            Sign in to your account or create a new one
          </ModalDescription>
        </ModalHeader>
        
        <ModalFooter className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="p-6 pt-0">
              <LoginForm
                onSubmit={handleLogin}
                onForgotPassword={onForgotPassword}
                onSwitchToSignup={switchToSignup}
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>
            
            <TabsContent value="signup" className="p-6 pt-0">
              <SignupForm
                onSubmit={handleSignup}
                onSwitchToLogin={switchToLogin}
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>
          </Tabs>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface SignupFormProps {
  onSubmit: (data: SignupData) => Promise<void>
  onSwitchToLogin?: () => void
  isLoading?: boolean
  error?: string
}

export function SignupForm({ 
  onSubmit, 
  onSwitchToLogin, 
  isLoading = false, 
  error 
}: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({
    organizationName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    acceptTerms: false
  })
  
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupData, string>>>({})

  const validateForm = () => {
    const errors: Partial<Record<keyof SignupData, string>> = {}
    
    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required'
    }
    
    if (!formData.adminEmail) {
      errors.adminEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      errors.adminEmail = 'Invalid email address'
    }
    
    if (!formData.adminPassword) {
      errors.adminPassword = 'Password is required'
    } else if (formData.adminPassword.length < 8) {
      errors.adminPassword = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.adminPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch {
      // Error handling is managed by parent component
    }
  }

  const updateField = (field: keyof SignupData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card variant="default" className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start your free trial of Dashboard Link
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <Badge variant="error" className="text-sm">
                {error}
              </Badge>
            </div>
          )}
          
          <Input
            label="Organization Name"
            placeholder="Acme Corporation"
            value={formData.organizationName}
            onChange={(e) => updateField('organizationName', e.target.value)}
            error={fieldErrors.organizationName}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@company.com"
            value={formData.adminEmail}
            onChange={(e) => updateField('adminEmail', e.target.value)}
            error={fieldErrors.adminEmail}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={formData.adminPassword}
            onChange={(e) => updateField('adminPassword', e.target.value)}
            error={fieldErrors.adminPassword}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            error={fieldErrors.confirmPassword}
            disabled={isLoading}
            required
          />
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                disabled={isLoading}
                className="rounded border-gray-300"
              />
              <span className="text-muted-foreground">
                I accept the{' '}
                <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                  Terms and Conditions
                </Button>
                {' '}and{' '}
                <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                  Privacy Policy
                </Button>
              </span>
            </label>
            {fieldErrors.acceptTerms && (
              <Badge variant="error" className="text-xs">
                {fieldErrors.acceptTerms}
              </Badge>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
          
          {onSwitchToLogin && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={onSwitchToLogin}
                  disabled={isLoading}
                >
                  Sign in
                </Button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
