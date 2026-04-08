'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { demoAdmins, demoOrganizations } from '@/lib/data/demo-data'
import type { Admin, Organization } from '@/lib/data/types'

interface AuthState {
  admin: Admin | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo password for all accounts
const DEMO_PASSWORD = 'demo123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    admin: null,
    organization: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check for existing session on mount
  useEffect(() => {
    const storedAdminId = localStorage.getItem('demo_admin_id')
    if (storedAdminId) {
      const admin = demoAdmins.find(a => a.id === storedAdminId)
      if (admin) {
        const organization = demoOrganizations.find(o => o.id === admin.organizationId)
        setState({
          admin,
          organization: organization || null,
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }
    }
    setState(prev => ({ ...prev, isLoading: false }))
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check credentials
    if (password !== DEMO_PASSWORD) {
      return false
    }

    const admin = demoAdmins.find(a => a.email.toLowerCase() === email.toLowerCase())
    if (!admin) {
      return false
    }

    const organization = demoOrganizations.find(o => o.id === admin.organizationId)
    
    // Store session
    localStorage.setItem('demo_admin_id', admin.id)
    
    setState({
      admin,
      organization: organization || null,
      isAuthenticated: true,
      isLoading: false,
    })

    return true
  }

  const logout = () => {
    localStorage.removeItem('demo_admin_id')
    setState({
      admin: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
