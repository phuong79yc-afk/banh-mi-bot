import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  username: string
  role: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    // Simple check: if token exists in localStorage, user is authenticated
    const token = localStorage.getItem('auth_token')
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('user_role')
    
    if (token && username) {
      setUser({ username, role: role || 'user' })
    }
    
    setIsLoading(false)
  }

  const login = async (_username: string, _password: string, _remember: boolean) => {
    throw new Error('Use direct login in Login component')
  }

  const logout = () => {
    console.log('🚪 Logging out...')
    
    // Clear all auth data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')
    
    // Clear user state
    setUser(null)
    
    console.log('✅ Auth cleared, redirecting to login...')
    
    // Force reload to login page to completely reset state
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
