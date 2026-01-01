import React, { useState } from 'react'
import { Button } from '../Button'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'

export interface WorkerAccessProps {
  token: string
  onValidateToken: (token: string) => Promise<void>
  isLoading?: boolean
  error?: string
}

export function WorkerAccess({ 
  token, 
  onValidateToken, 
  isLoading = false, 
  error 
}: WorkerAccessProps) {
  const [isExpired, setIsExpired] = useState(false)

  // Check if token appears expired (this would normally be done server-side)
  React.useEffect(() => {
    if (error?.includes('expired')) {
      setIsExpired(true)
    }
  }, [error])

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Link Expired</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              This link has expired. Ask your manager to send you a new one.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-1">No account required</p>
              <p className="text-xs text-blue-600">
                Just tap the new link when you receive it - no login needed.
              </p>
            </div>
            
            <Button 
              onClick={() => setIsExpired(false)}
              className="w-full"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !error.includes('expired')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-xl">Invalid Link</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              This link is invalid or has been used. Ask your manager to send you a new one.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-1">Quick access</p>
              <p className="text-xs text-blue-600">
                No account or password needed - just the link from your manager.
              </p>
            </div>
            
            <Button 
              onClick={() => setIsExpired(false)}
              className="w-full"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-xl">Welcome to Dashboard</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 font-medium mb-1">No account required</p>
            <p className="text-xs text-green-600">
              You're accessing this dashboard securely - no login needed.
            </p>
          </div>
          
          <p className="text-gray-600 mb-6">
            Click below to access your dashboard. This link is secure and temporary.
          </p>
          
          <Button 
            onClick={() => onValidateToken(token)}
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            Access Dashboard
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            This link expires after first use or in 24 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
