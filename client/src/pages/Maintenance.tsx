import { useEffect, useState } from 'react'
import { Wrench, Clock, AlertTriangle, RefreshCw, Server, Terminal, Database, Zap, Shield, Activity } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'

export default function Maintenance() {
  const { colors } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [dots, setDots] = useState('')
  const [progress, setProgress] = useState(0)
  
  // Countdown timer state (15 minutes = 900 seconds)
  const [timeRemaining, setTimeRemaining] = useState(900)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(15)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    document.title = 'Maintenance Mode - Bot Dashboard'
    setMounted(true)

    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    // Fake progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 100 ? 0 : prev + 1)
    }, 200)

    // Countdown timer
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 900 // Reset to 15 minutes when done
        
        const newTime = prev - 1
        const h = Math.floor(newTime / 3600)
        const m = Math.floor((newTime % 3600) / 60)
        const s = newTime % 60
        
        setHours(h)
        setMinutes(m)
        setSeconds(s)
        
        return newTime
      })
    }, 1000)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(progressInterval)
      clearInterval(timerInterval)
    }
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay - giống Dashboard */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      
      {/* Liquid Glass Background Effect */}
      <LiquidGlass
        width="600px"
        height="600px"
        position="fixed"
        top="30%"
        left="20%"
        glassFrost={0.3}
        glassSaturation={1.5}
      />
      <LiquidGlass
        width="500px"
        height="500px"
        position="fixed"
        top="60%"
        left="70%"
        glassFrost={0.25}
        glassSaturation={1.6}
      />

      {/* Content */}
      <div className={`max-w-2xl w-full space-y-6 text-center relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Main Icon */}
        <div className="flex justify-center animate-float">
          <GlassCard variant="strong" className="relative p-8 rounded-3xl inline-block">
            <Wrench
              className="h-24 w-24 animate-pulse animate-spin-slow"
              style={{ color: colors.primary }}
            />
            <div
              className="absolute -top-2 -right-2 p-3 rounded-full backdrop-blur-xl animate-pulse"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </GlassCard>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1
            className="text-5xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Đang Bảo Trì
          </h1>
          <p
            className="text-xl"
            style={{ color: colors.textSecondary }}
          >
            Dashboard hiện đang được nâng cấp
          </p>
        </div>

        {/* Progress Card */}
        <GlassCard variant="strong" className="rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-6 w-6" style={{ color: colors.primary }} />
            <h2
              className="text-2xl font-semibold"
              style={{ color: colors.text }}
            >
              Tiến Trình Bảo Trì
            </h2>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.textSecondary }}>Đang xử lý{dots}</span>
              <span style={{ color: colors.primary }} className="font-semibold">{progress}%</span>
            </div>
            <div 
              className="h-3 rounded-full overflow-hidden backdrop-blur-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div
                className="h-full transition-all duration-200 rounded-full"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                  boxShadow: `0 0 10px ${colors.primary}40`
                }}
              />
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div 
              className="p-4 rounded-xl backdrop-blur-xl text-center space-y-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Server className="h-6 w-6 mx-auto" style={{ color: '#10b981' }} />
              <div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Server</div>
                <div className="text-sm font-bold" style={{ color: '#10b981' }}>Online</div>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl backdrop-blur-xl text-center space-y-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Terminal className="h-6 w-6 mx-auto" style={{ color: '#f0b232' }} />
              <div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Dashboard</div>
                <div className="text-sm font-bold" style={{ color: '#f0b232' }}>Updating</div>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl backdrop-blur-xl text-center space-y-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Database className="h-6 w-6 mx-auto" style={{ color: '#10b981' }} />
              <div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Database</div>
                <div className="text-sm font-bold" style={{ color: '#10b981' }}>Healthy</div>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl backdrop-blur-xl text-center space-y-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Shield className="h-6 w-6 mx-auto" style={{ color: '#10b981' }} />
              <div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Security</div>
                <div className="text-sm font-bold" style={{ color: '#10b981' }}>Active</div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-3 pt-4">
            <div 
              className="flex items-center justify-between p-3 rounded-xl backdrop-blur-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" style={{ color: colors.primary }} />
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  Bot Discord
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                  Hoạt động
                </span>
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded-xl backdrop-blur-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: colors.primary }} />
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  API Response
                </span>
              </div>
              <span className="text-sm font-semibold" style={{ color: colors.text }}>
                ~45ms
              </span>
            </div>
          </div>
        </GlassCard>

        {/* What's Being Updated */}
        <GlassCard variant="strong" className="rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-center" style={{ color: colors.text }}>
            🔧 Đang Nâng Cấp
          </h3>
          <div className="space-y-2">
            {[
              { icon: '✨', text: 'Cải thiện hiệu suất dashboard', done: true },
              { icon: '🎨', text: 'Cập nhật giao diện người dùng', done: true },
              { icon: '🔒', text: 'Tăng cường bảo mật', done: false },
              { icon: '🚀', text: 'Thêm tính năng mới', done: false },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: item.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm flex-1" style={{ color: colors.text }}>
                  {item.text}
                </span>
                {item.done && (
                  <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                    ✓ Hoàn thành
                  </span>
                )}
                {!item.done && (
                  <span className="text-xs font-semibold" style={{ color: '#f0b232' }}>
                    ⏳ Đang xử lý
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Info Message */}
        <GlassCard 
          variant="subtle" 
          className="rounded-xl p-4"
          style={{ borderLeft: `4px solid ${colors.primary}` }}
        >
          <p className="text-sm" style={{ color: colors.text }}>
            <span className="font-semibold">💡 Lưu ý:</span> Bot vẫn hoạt động bình thường trên Discord.
            Bạn có thể sử dụng các lệnh slash như thường lệ.
          </p>
        </GlassCard>

        {/* Estimated Time - Animated Countdown */}
        <GlassCard variant="strong" className="rounded-2xl p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-6 w-6 animate-pulse" style={{ color: colors.primary }} />
              <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                Thời Gian Dự Kiến
              </h3>
            </div>
            
            {/* Countdown Display */}
            <div className="flex justify-center items-center gap-3 mb-4">
              {/* Hours */}
              <div className="relative">
                <div 
                  className="countdown-card p-6 rounded-2xl backdrop-blur-xl min-w-[100px]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: `2px solid ${colors.primary}40`,
                    boxShadow: `0 8px 20px ${colors.primary}20`
                  }}
                >
                  <div className="countdown-number text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                    {String(hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: colors.textSecondary }}>
                    Giờ
                  </div>
                </div>
                {/* Animated glow */}
                <div 
                  className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${colors.primary}30 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                    zIndex: -1
                  }}
                />
              </div>

              {/* Separator */}
              <div className="text-4xl font-bold animate-blink" style={{ color: colors.primary }}>
                :
              </div>

              {/* Minutes */}
              <div className="relative">
                <div 
                  className="countdown-card p-6 rounded-2xl backdrop-blur-xl min-w-[100px]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: `2px solid ${colors.primary}40`,
                    boxShadow: `0 8px 20px ${colors.primary}20`
                  }}
                >
                  <div className="countdown-number text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                    {String(minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: colors.textSecondary }}>
                    Phút
                  </div>
                </div>
                <div 
                  className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${colors.primary}30 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                    zIndex: -1,
                    animationDelay: '0.3s'
                  }}
                />
              </div>

              {/* Separator */}
              <div className="text-4xl font-bold animate-blink" style={{ color: colors.primary }}>
                :
              </div>

              {/* Seconds */}
              <div className="relative">
                <div 
                  className="countdown-card p-6 rounded-2xl backdrop-blur-xl min-w-[100px]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: `2px solid ${colors.primary}40`,
                    boxShadow: `0 8px 20px ${colors.primary}20`
                  }}
                >
                  <div className="countdown-number text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                    {String(seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: colors.textSecondary }}>
                    Giây
                  </div>
                </div>
                <div 
                  className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${colors.primary}30 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                    zIndex: -1,
                    animationDelay: '0.6s'
                  }}
                />
              </div>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="transform -rotate-90" width="120" height="120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={colors.primary}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                    style={{
                      transition: 'stroke-dashoffset 0.3s ease',
                      filter: `drop-shadow(0 0 8px ${colors.primary}60)`
                    }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {progress}%
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    Hoàn thành
                  </div>
                </div>
              </div>

              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 w-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: timeRemaining > 600 ? '#10b981' : timeRemaining > 300 ? '#f0b232' : '#ef4444' }}
                  />
                  <span className="text-sm" style={{ color: colors.text }}>
                    Đang xử lý{dots}
                  </span>
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  {timeRemaining > 600 ? 'Còn nhiều thời gian' : timeRemaining > 300 ? 'Sắp hoàn thành' : 'Gần xong rồi!'}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Contact & Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard 
            variant="hover" 
            className="rounded-xl p-4 cursor-pointer"
            onClick={() => window.open('https://discord.gg/yourserver', '_blank')}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ 
                  backgroundColor: `${colors.primary}20`,
                  border: `1px solid ${colors.primary}40`
                }}
              >
                <svg className="h-6 w-6" style={{ color: colors.primary }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: colors.text }}>
                  Discord Support
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  Join our server
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard 
            variant="hover" 
            className="rounded-xl p-4 cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ 
                  backgroundColor: `${colors.primary}20`,
                  border: `1px solid ${colors.primary}40`
                }}
              >
                <RefreshCw className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: colors.text }}>
                  Check Status
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  Refresh page
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-xl flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: `2px solid ${colors.primary}`,
            color: colors.text
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${colors.primary}30`
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 8px 20px ${colors.primary}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <RefreshCw className="h-5 w-5" />
          Kiểm Tra Lại Trạng Thái
        </button>

        {/* Footer */}
        <div className="pt-4">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Cảm ơn bạn đã kiên nhẫn • <span style={{ color: colors.primary }}>♥</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translate3d(0, 15px, 0);
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
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        @keyframes numberChange {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.1);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes cardGlow {
          0%, 100% {
            box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.2);
          }
          50% {
            box-shadow: 0 8px 30px rgba(var(--primary-rgb), 0.4);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        
        .animate-blink {
          animation: blink 1.5s ease-in-out infinite;
        }
        
        .countdown-card {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          animation: cardGlow 2s ease-in-out infinite;
        }
        
        .countdown-card:hover {
          transform: translateY(-5px) scale(1.05);
        }
        
        .countdown-number {
          font-variant-numeric: tabular-nums;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .countdown-card:hover .countdown-number {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
