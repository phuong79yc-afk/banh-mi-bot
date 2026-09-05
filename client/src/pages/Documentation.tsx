import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { Book, Settings, BarChart3, Music, Terminal, ArrowLeft } from 'lucide-react'
import LiquidGlass from '../components/LiquidGlass'

export default function Documentation() {
  const navigate = useNavigate()
  const { colors } = useTheme()

  return (
    <div 
      className="min-h-screen w-full"
      style={{
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Background Image */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      />

      {/* Liquid Glass Background */}
      <LiquidGlass 
        width="100%" 
        height="100%" 
        position="fixed"
        top="0"
        left="0"
        transform="none"
        glassFrost={0.06}
        glassSaturation={1.1}
        borderRadius="0"
        className="pointer-events-none"
      />

      {/* Header */}
      <div 
        className="border-b-2 backdrop-blur-xl relative z-10"
        style={{ 
          borderColor: colors.primary,
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay Lại Trang Chủ
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded font-medium text-sm"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white'
            }}
          >
            Đăng Nhập
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <Book className="h-12 w-12" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>
            Tài Liệu & Hướng Dẫn
          </h1>
          <p className="text-xl" style={{ color: colors.textSecondary }}>
            Mọi thứ bạn cần để bắt đầu với Discord Bot Dashboard
          </p>
        </div>

        {/* Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {/* Installation */}
          <div 
            className="rounded-xl p-8 border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <Settings className="h-12 w-12 mb-4" style={{ color: colors.primary }} />
            <h3 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
              Cài Đặt Bot
            </h3>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              Hướng dẫn chi tiết để cài đặt và cấu hình Discord bot
            </p>
            <div className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>1.</span>
                <span>Clone repository: <code className="bg-black/10 px-2 py-0.5 rounded">git clone ...</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>2.</span>
                <span>Install: <code className="bg-black/10 px-2 py-0.5 rounded">npm install</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>3.</span>
                <span>Setup .env file với Discord Token</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>4.</span>
                <span>Deploy: <code className="bg-black/10 px-2 py-0.5 rounded">npm run deploy</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>5.</span>
                <span>Run: <code className="bg-black/10 px-2 py-0.5 rounded">npm run dev</code></span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div 
            className="rounded-xl p-8 border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/dashboard/stats')}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <BarChart3 className="h-12 w-12 mb-4" style={{ color: colors.secondary }} />
            <h3 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
              Thống Kê
            </h3>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              Analytics và metrics để theo dõi bot activity
            </p>
            <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>✓</span>
                <span>Real-time bot status (CPU, RAM, Ping)</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>✓</span>
                <span>Server & User growth charts</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>✓</span>
                <span>Command usage analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>✓</span>
                <span>Activity tracking by hour</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>✓</span>
                <span>Top active servers ranking</span>
              </div>
            </div>
          </div>

          {/* Music */}
          <div 
            className="rounded-xl p-8 border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/dashboard/music')}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <Music className="h-12 w-12 mb-4" style={{ color: colors.accent }} />
            <h3 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
              Music Player
            </h3>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              Music player với lyrics AI và queue management
            </p>
            <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>♪</span>
                <span>YouTube & Spotify search</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>♪</span>
                <span>Auto lyrics with Google Gemini AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>♪</span>
                <span>Queue management</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>♪</span>
                <span>Playback controls</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.primary }}>♪</span>
                <span>Volume & loop mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commands Section */}
        <div 
          className="rounded-xl p-12 border-2 backdrop-blur-xl"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderColor: colors.primary
          }}
        >
          <div className="text-center mb-12">
            <Terminal className="h-12 w-12 mx-auto mb-4" style={{ color: colors.primary }} />
            <h2 className="text-4xl font-bold mb-3" style={{ color: colors.text }}>
              42+ Bot Commands
            </h2>
            <p className="text-lg" style={{ color: colors.textSecondary }}>
              Tất cả commands được tổ chức theo categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="text-center">
              <div className="text-4xl mb-3">🎵</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>11</div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Music</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                play, pause, skip, queue...
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">🛡️</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>13</div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Moderation</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                kick, ban, mute, warn...
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>9</div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Utility</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                help, ping, stats...
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">😄</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>5</div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Fun</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                8ball, joke, meme...
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>4</div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Economy</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                balance, daily, shop...
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/dashboard/commands')}
              className="px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            >
              Xem Tất Cả Commands →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
