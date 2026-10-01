import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import LiquidGlass from '../components/LiquidGlass'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { colors } = useTheme()
  const [status, setStatus] = useState('Đang xử lý...')
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessedRef.current) return

    const handleCallback = async () => {
      hasProcessedRef.current = true
      
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      console.log('🔐 AuthCallback: Processing code:', code ? `${code.substring(0, 10)}...` : 'MISSING')

      if (errorParam) {
        setError('Đăng nhập Discord bị hủy')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      if (!code) {
        setError('Không nhận được mã xác thực')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      try {
        setStatus('Đang xác thực với Discord...')

        console.log('📤 Sending code to backend...')

        // Send code to backend
        const response = await fetch('http://localhost:3000/api/auth/discord/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        console.log('📥 Backend response status:', response.status)

        const data = await response.json()
        console.log('📥 Backend response data:', data)

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Xác thực thất bại')
        }

        // Store auth data
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_role', data.user.role)
        localStorage.setItem('username', data.user.username)
        localStorage.setItem('discord_id', data.user.id)
        localStorage.setItem('discord_avatar', data.user.avatar)

        // Store user data for display
        setUserData(data.user)

        console.log('✅ Auth data saved, redirecting to dashboard...')

        setStatus('Đăng nhập thành công!')
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } catch (err: any) {
        console.error('❌ Callback error:', err)
        setError(err.message || 'Có lỗi xảy ra khi đăng nhập')
        setTimeout(() => navigate('/login'), 2000)
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />

      {/* Liquid Glass Effects */}
      <LiquidGlass
        width="600px"
        height="600px"
        position="fixed"
        top="30%"
        left="25%"
        glassFrost={0.3}
        glassSaturation={1.5}
      />

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        <div
          className="p-8 rounded-3xl backdrop-blur-xl border-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: error ? '#ef4444' : colors.primary,
          }}
        >
          {!error ? (
            <>
              {!userData ? (
                <>
                  <div
                    className="animate-spin h-16 w-16 border-4 border-t-transparent rounded-full mx-auto mb-4"
                    style={{ borderColor: colors.primary }}
                  />
                  <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                    {status}
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Vui lòng đợi một chút...
                  </p>
                </>
              ) : (
                <>
                  {/* Success with Avatar */}
                  <div className="space-y-4">
                    {/* Avatar with animation */}
                    <div className="relative mx-auto w-24 h-24 mb-4">
                      <div
                        className="absolute inset-0 rounded-full animate-pulse"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                          filter: 'blur(10px)',
                          opacity: 0.5,
                        }}
                      />
                      <img
                        src={userData.avatar}
                        alt={userData.username}
                        className="relative w-full h-full rounded-full border-4 animate-[bounce_1s_ease-in-out]"
                        style={{ borderColor: colors.primary }}
                      />
                      {/* Checkmark badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-4"
                        style={{
                          backgroundColor: '#10b981',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Welcome message */}
                    <div>
                      <h2 className="text-3xl font-bold mb-1" style={{ color: colors.text }}>
                        Xin chào, {userData.username}!
                      </h2>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {status}
                      </p>
                    </div>

                    {/* Role badge */}
                    <div className="flex justify-center">
                      <div
                        className="px-4 py-2 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: userData.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: userData.role === 'admin' ? '#ef4444' : '#3b82f6',
                          border: `2px solid ${userData.role === 'admin' ? '#ef4444' : '#3b82f6'}`,
                        }}
                      >
                        {userData.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                      </div>
                    </div>

                    {/* Loading bar */}
                    <div className="mt-6">
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div
                          className="h-full animate-[loading_2s_ease-in-out]"
                          style={{
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                        Đang chuyển đến dashboard...
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#ef444420', border: '2px solid #ef4444' }}
              >
                <svg
                  className="h-8 w-8"
                  style={{ color: '#ef4444' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#ef4444' }}>
                Lỗi Xác Thực
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {error}
              </p>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                Đang chuyển về trang đăng nhập...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
