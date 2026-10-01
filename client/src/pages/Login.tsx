import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, User, Lock, Eye, EyeOff, Sparkles, Shield, Zap } from 'lucide-react'
import LiquidGlass from '../components/LiquidGlass'
import GlassCard from '../components/GlassCard'

export default function Login() {
  const { colors, darkMode } = useTheme()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Login - Bot Dashboard'
    setMounted(true)
    
    // If already logged in, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Attempting login:', { username, remember })
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Only one valid credential
      if (username === 'admin' && password === 'admin123') {
        const token = btoa(`${username}:${Date.now()}`)
        
        // Store auth data
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_role', 'admin')
        localStorage.setItem('username', username)
        
        console.log('✅ Login successful, showing success animation...')
        
        // Show success animation
        setLoginSuccess(true)
        
        // Wait for animation to complete before redirecting
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng')
      }
    } catch (err: any) {
      console.error('❌ Login error:', err)
      setError('Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscordLogin = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get Discord OAuth URL from backend
      const response = await fetch('http://localhost:3000/api/auth/discord/url')
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Discord OAuth
        window.location.href = data.url
      } else {
        setError('Không thể kết nối Discord')
      }
    } catch (err) {
      console.error('Discord OAuth error:', err)
      setError('Lỗi kết nối Discord')
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      
      {/* Success Overlay - Simple & Clean */}
      {loginSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 animate-fade-in"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)'
            }}
          />
          
          {/* Success Message */}
          <div className="relative z-10 text-center animate-success-pop">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="/banhcuon-icon-1024.gif" 
                alt="Success" 
                className="w-28 h-28 mx-auto rounded-2xl object-cover"
                style={{ 
                  boxShadow: '0 20px 60px rgba(16, 185, 129, 0.5)',
                  filter: 'brightness(1.2)'
                }}
              />
            </div>
            
            {/* Text */}
            <h2 
              className="text-4xl font-bold mb-2"
              style={{ 
                color: '#fff',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              ✓ Thành công
            </h2>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              Đang chuyển hướng...
            </p>
          </div>
        </div>
      )}
      
      {/* Liquid Glass Background Effects */}
      <LiquidGlass
        width="700px"
        height="700px"
        position="fixed"
        top="20%"
        left="15%"
        glassFrost={0.3}
        glassSaturation={1.5}
      />
      <LiquidGlass
        width="600px"
        height="600px"
        position="fixed"
        top="50%"
        left="75%"
        glassFrost={0.25}
        glassSaturation={1.6}
      />
      
      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        
        {/* Left Side - Branding & Features */}
        <div className="hidden md:block space-y-6">
          <div className="animate-float">
            <GlassCard variant="strong" className="p-8 rounded-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img 
                    src="/banhcuon-icon-1024.gif" 
                    alt="Bánh Cuốn Bot Logo" 
                    className="w-16 h-16 rounded-2xl object-cover animate-bounce-slow shadow-lg"
                    style={{ 
                      boxShadow: `0 8px 20px ${colors.primary}40`
                    }}
                  />
                  {/* Sparkle effect */}
                  <div 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: colors.primaryLight,
                      boxShadow: `0 0 15px ${colors.primaryLight}`
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                    Bánh Cuốn Bot
                  </h1>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Quản lý bot Discord của bạn
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Sparkles, title: 'Giao diện hiện đại', desc: 'Dashboard đẹp với glass morphism' },
                  { icon: Zap, title: 'Hiệu suất cao', desc: 'Tải nhanh và mượt mà' },
                  { icon: Shield, title: 'Bảo mật tốt', desc: 'Dữ liệu được mã hóa an toàn' }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl transition-all backdrop-blur-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${colors.primary}20`,
                        border: `1px solid ${colors.primary}40`
                      }}
                    >
                      <feature.icon className="h-5 w-5" style={{ color: colors.primary }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: colors.text }}>
                        {feature.title}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Servers', value: '1,234' },
              { label: 'Users', value: '50K+' },
              { label: 'Uptime', value: '99.9%' }
            ].map((stat, index) => (
              <GlassCard 
                key={index}
                variant="hover" 
                className="p-4 rounded-xl text-center"
              >
                <div className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  {stat.label}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <GlassCard variant="strong" className="rounded-3xl overflow-hidden">
          {/* Header */}
          <div 
            className="p-8 text-center backdrop-blur-xl border-b"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="animate-float">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {/* Animated logo */}
                <img 
                  src="/banhcuon-icon-1024.gif" 
                  alt="Bánh Cuốn Bot Logo" 
                  className="w-full h-full rounded-3xl object-cover shadow-2xl animate-scale-pulse"
                  style={{ 
                    boxShadow: `0 8px 30px ${colors.primary}60`
                  }}
                />
                {/* Glow effect rings */}
                <div 
                  className="absolute inset-0 rounded-3xl animate-ping-slow"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primaryLight}40)`,
                    filter: 'blur(20px)',
                    opacity: 0.6
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-3xl animate-spin-slow"
                  style={{
                    background: `conic-gradient(from 0deg, ${colors.primary}00, ${colors.primary}80, ${colors.primary}00)`,
                    filter: 'blur(15px)'
                  }}
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2 animate-fade-in" style={{ color: colors.text }}>
              Chào Mừng Trở Lại
            </h2>
            <p className="text-sm animate-fade-in-delay" style={{ color: colors.textSecondary }}>
              Đăng nhập vào Bánh Cuốn Bot Dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div 
                className="p-4 rounded-xl border-2 animate-shake"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#ef4444'
                }}
              >
                <p className="text-sm text-center font-semibold" style={{ color: '#ef4444' }}>
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Tên Đăng Nhập
              </label>
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors"
                  style={{ color: focusedInput === 'username' ? colors.primary : colors.textSecondary }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Nhập tên đăng nhập"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all backdrop-blur-xl border-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: focusedInput === 'username' ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                    color: colors.text,
                    boxShadow: focusedInput === 'username' ? `0 0 20px ${colors.primary}20` : 'none'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors"
                  style={{ color: focusedInput === 'password' ? colors.primary : colors.textSecondary }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl focus:outline-none transition-all backdrop-blur-xl border-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: focusedInput === 'password' ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                    color: colors.text,
                    boxShadow: focusedInput === 'password' ? `0 0 20px ${colors.primary}20` : 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all hover:scale-110"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded transition-all"
                  style={{ accentColor: colors.primary }}
                />
                <span className="text-sm group-hover:scale-105 transition-transform" style={{ color: colors.text }}>
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                boxShadow: `0 8px 20px ${colors.primary}40`
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = `0 12px 30px ${colors.primary}60`
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = `0 8px 20px ${colors.primary}40`
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng Nhập'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 backdrop-blur-xl rounded-full" style={{ color: colors.textSecondary, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                  hoặc
                </span>
              </div>
            </div>

            {/* Discord Login Button */}
            <button
              type="button"
              onClick={handleDiscordLogin}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #5865F2, #4752C4)',
                boxShadow: '0 8px 20px rgba(88, 101, 242, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 12px 30px rgba(88, 101, 242, 0.6)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 8px 20px rgba(88, 101, 242, 0.4)'
              }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Đăng Nhập Bằng Discord
            </button>

            {/* Back to Home */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm hover:underline transition-all hover:scale-105 inline-flex items-center gap-1"
                style={{ color: colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
              >
                ← Về Trang Chủ
              </button>
            </div>
          </form>
        </GlassCard>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translate3d(0, 20px, 0);
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes scalePulse {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.05);
          }
        }
        
        @keyframes pingSlow {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInDelay {
          0% { opacity: 0; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-scale-pulse {
          animation: scalePulse 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fadeInDelay 1.2s ease-out;
        }
        
        @keyframes successPop {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-success-pop {
          animation: successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  )
}
