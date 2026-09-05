import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import LiquidGlass from '../components/LiquidGlass'

export default function Landing() {
  const navigate = useNavigate()
  const { colors } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundImage: 'url("/background.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#f9f9f9'
    }}>
      
      {/* Soft Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" style={{ zIndex: 0 }} />
      
      {/* Liquid Glass Full Screen */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
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

      {/* Top Navigation */}
      <nav className="relative z-50 backdrop-blur-md bg-white/60 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-sm font-bold tracking-wider" style={{ color: colors.text }}>
            DISCORD BOT DASHBOARD
          </div>
          <div className="flex gap-6 text-sm" style={{ color: colors.text }}>
            <button onClick={() => navigate('/dashboard')} className="hover:text-blue-600 transition-colors font-medium">Dashboard</button>
            <button onClick={() => navigate('/music')} className="hover:text-purple-600 transition-colors font-medium">Music</button>
            <button onClick={() => navigate('/login')} className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">Login</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16 items-center">
          
            {/* Left Column */}
            <div className={`space-y-6 lg:space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-sm" style={{ color: colors.text }}>
                  Quản lý Discord Bot
                </h1>
                <h2 className="text-4xl lg:text-5xl font-bold" style={{ color: colors.text }}>
                  Dễ dàng & Hiệu quả
                </h2>
              </div>

              <p className="text-lg leading-relaxed animate-fade-in drop-shadow-sm" style={{ animationDelay: '0.3s', color: colors.textSecondary }}>
                Dashboard hiện đại với real-time analytics, music player chất lượng cao,
                và hơn 42+ lệnh mạnh mẽ cho server Discord của bạn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="relative">
                  <LiquidGlass 
                    width="100%" 
                    height="100%" 
                    position="absolute"
                    top="0"
                    left="0"
                    transform="none"
                    glassFrost={0.08}
                    glassSaturation={1.15}
                    borderRadius="20px"
                    className="pointer-events-none"
                  />
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="relative z-10 w-full px-8 py-4 border-2 font-semibold rounded-2xl transition-all shadow-sm hover:scale-105 hover:-translate-y-1"
                    style={{
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}30`,
                      color: colors.text
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}50`
                      e.currentTarget.style.borderColor = colors.primaryDark
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}30`
                      e.currentTarget.style.borderColor = colors.primary
                    }}
                  >
                    Mở Dashboard →
                  </button>
                </div>
                
                <div className="relative">
                  <LiquidGlass 
                    width="100%" 
                    height="100%" 
                    position="absolute"
                    top="0"
                    left="0"
                    transform="none"
                    glassFrost={0.06}
                    glassSaturation={1.1}
                    borderRadius="20px"
                    className="pointer-events-none"
                  />
                  <button 
                    onClick={() => navigate('/demo')}
                    className="relative z-10 w-full px-8 py-4 border-2 font-semibold rounded-2xl transition-all hover:scale-105 hover:-translate-y-1 shadow-sm"
                    style={{
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}20`,
                      color: colors.text
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}40`
                      e.currentTarget.style.borderColor = colors.primaryDark
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}20`
                      e.currentTarget.style.borderColor = colors.primary
                    }}
                  >
                    Xem Demo
                  </button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <LiquidGlass 
                  width="100%" 
                  height="100%" 
                  position="absolute"
                  top="0"
                  left="0"
                  transform="none"
                  glassFrost={0.07}
                  glassSaturation={1.12}
                  borderRadius="16px"
                  className="pointer-events-none"
                />
                <div className="relative z-10 backdrop-blur-lg bg-white/80 rounded-3xl p-6 border shadow-lg" style={{ borderColor: `${colors.primary}30` }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: colors.text }}>THỐNG KÊ THỜI GIAN THỰC</div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="group cursor-pointer transition-transform hover:scale-110">
                      <div className="text-3xl font-bold transition-colors" style={{ color: colors.text }}>100+</div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>Servers Active</div>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-110">
                      <div className="text-3xl font-bold transition-colors" style={{ color: colors.text }}>1,000+</div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>Người dùng</div>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-110">
                      <div className="text-3xl font-bold transition-colors" style={{ color: colors.text }}>42+</div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>Lệnh</div>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-110">
                      <div className="text-3xl font-bold transition-colors" style={{ color: colors.text }}>99.9%</div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={`w-full pr-4 lg:pr-0 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="w-full max-w-2xl mx-auto lg:ml-auto lg:mr-0 space-y-6">
                {/* Video Box */}
                <div className="relative animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <LiquidGlass 
                    width="100%" 
                    height="100%" 
                    position="absolute"
                    top="0"
                    left="0"
                    transform="none"
                    glassFrost={0.09}
                    glassSaturation={1.18}
                    borderRadius="24px"
                    className="pointer-events-none"
                  />
                  <div className="relative z-10 w-full aspect-video rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:scale-105 hover:shadow-3xl transition-all duration-500 hover:border-white/50">
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    >
                      <source src="/background-video.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>

                {/* Info Card */}
                <div className="relative animate-fade-in" style={{ animationDelay: '0.7s' }}>
                  <LiquidGlass 
                    width="100%" 
                    height="100%" 
                    position="absolute"
                    top="0"
                    left="0"
                    transform="none"
                    glassFrost={0.18}
                    glassSaturation={1.35}
                    borderRadius="20px"
                    className="pointer-events-none"
                  />
                  <div className="relative z-10 w-full backdrop-blur-md bg-white/80 rounded-2xl border p-4 shadow-md" style={{ borderColor: `${colors.primary}30` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold mb-1" style={{ color: colors.text }}>🎵 Music Player & Analytics</div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>Preview dashboard với music player</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                        <span className="text-sm font-medium" style={{ color: colors.text }}>LIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/5 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between text-sm text-white/70">
          <div>Discord Bot Dashboard © 2026</div>
          <div className="flex gap-6">
            <button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">Docs</button>
            <button onClick={() => navigate('/support')} className="hover:text-white transition-colors">Support</button>
          </div>
        </div>
      </div>
    </div>
  )
}
