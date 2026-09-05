import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

export default function Login() {
  const { colors, darkMode } = useTheme()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Attempting login:', { username, remember })
      
      const response = await axios.post('/api/auth/login', {
        username,
        password,
        remember
      }, {
        withCredentials: true // Important for cookies
      })

      console.log('✅ Login response:', response.data)

      if (response.data.success) {
        // Store auth data
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user_role', response.data.role)
        localStorage.setItem('username', username)
        
        console.log('✅ Auth stored, redirecting to dashboard...')
        
        // Force redirect
        window.location.href = '/dashboard'
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err: any) {
      console.error('❌ Login error:', err)
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ 
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9f9f9'
      }}
    >
      {/* Soft Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" style={{ zIndex: 0 }} />
      
      {/* Liquid Glass Background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        <LiquidGlass 
          width="100vw" 
          height="100vh" 
          position="fixed"
          top="0"
          left="0"
          transform="none"
          glassFrost={0.05}
          glassSaturation={1.1}
          borderRadius="0"
          className="pointer-events-none"
        />
      </div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* LiquidGlass for Card */}
        <LiquidGlass 
          width="100%" 
          height="100%" 
          position="absolute"
          top="0"
          left="0"
          transform="none"
          glassFrost={0.12}
          glassSaturation={1.2}
          borderRadius="24px"
          className="pointer-events-none"
        />
        
        <div className="relative z-10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg bg-white/80 border border-gray-200/50">
        {/* Header */}
        <div 
          className="p-8 text-center backdrop-blur-md bg-white/60 border-b border-gray-200/50"
        >
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm shadow-sm border"
            style={{ 
              backgroundColor: `${colors.primary}20`,
              borderColor: `${colors.primary}40`
            }}
          >
            <LogIn className="w-10 h-10" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>Welcome Back</h1>
          <p style={{ color: colors.textSecondary }}>Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div 
              className="p-4 rounded-lg border-2 border-red-500"
              style={{ backgroundColor: darkMode ? '#7f1d1d20' : '#fef2f2' }}
            >
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.text }}
            >
              Username
            </label>
            <div className="relative">
              <User 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: colors.textSecondary }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all backdrop-blur-sm bg-white/60 border-2 focus:bg-white/80"
                style={{
                  borderColor: `${colors.primary}60`,
                  color: colors.text
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.text }}
            >
              Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: colors.textSecondary }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all backdrop-blur-sm bg-white/60 border-2 focus:bg-white/80"
                style={{
                  borderColor: `${colors.primary}60`,
                  color: colors.text
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: colors.primary }}
              />
              <span className="text-sm" style={{ color: colors.text }}>
                Remember me
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border-2"
            style={{
              backgroundColor: `${colors.primary}40`,
              borderColor: colors.primary,
              color: colors.text
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}60`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}40`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Quick Login Hint */}
          <div 
            className="p-4 rounded-xl text-center backdrop-blur-sm border"
            style={{
              backgroundColor: `${colors.primary}10`,
              borderColor: `${colors.primary}30`
            }}
          >
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Default credentials: <strong style={{ color: colors.text }}>admin / admin123</strong>
            </p>
          </div>

          {/* Back to Landing */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.text }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text}
            >
              ← Back to Home
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
