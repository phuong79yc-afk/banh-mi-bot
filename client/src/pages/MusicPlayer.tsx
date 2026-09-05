import { useState, useEffect } from 'react'
import { Play, Pause, SkipForward, Volume2, Music2, Users, Repeat, Repeat1 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface Track {
  title: string
  author: string
  url: string
  thumbnail: string
  duration: string
  durationFormatted: string
}

interface QueueTrack {
  title: string
  author: string
  duration: string
  thumbnail: string
}

interface MusicData {
  playing: boolean
  guildId?: string
  guildName?: string
  track?: Track
  queue?: {
    size: number
    tracks: QueueTrack[]
  }
  status?: {
    isPaused: boolean
    volume: number
    currentTime: string
    totalTime: string
    progress: number
    loop?: 'off' | 'queue' | 'track' | string
  }
  voiceChannel?: {
    name: string
    memberCount: number
  }
}

export default function MusicPlayer() {
  const { colors } = useTheme()
  const [musicData, setMusicData] = useState<MusicData>({ playing: false })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [localVolume, setLocalVolume] = useState(50)
  const [isControlling, setIsControlling] = useState(false)
  const [loopMode, setLoopMode] = useState<'off' | 'queue' | 'track'>('off')
  const [localProgress, setLocalProgress] = useState(0)
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)

  // Parse duration string (e.g., "3:45") to seconds
  const parseDuration = (duration: string): number => {
    const parts = duration.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
  }

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Smooth time animation - runs every second when playing
  useEffect(() => {
    if (!musicData?.playing || !musicData?.status || musicData.status.isPaused || totalSeconds === 0) {
      return
    }

    const timer = setInterval(() => {
      setCurrentSeconds(prev => {
        const next = prev + 1
        // Don't exceed total duration
        if (next >= totalSeconds) {
          return totalSeconds
        }
        // Update progress bar too
        setLocalProgress((next / totalSeconds) * 100)
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [musicData?.playing, musicData?.status?.isPaused, totalSeconds])

  useEffect(() => {
    setMounted(true)
    fetchMusicData()
    const interval = setInterval(fetchMusicData, 5000) // Giữ 5s vì cần sync time chính xác
    return () => clearInterval(interval)
  }, [])

  const fetchMusicData = async () => {
    try {
      const response = await axios.get('/api/music/current')
      if (response.data.playing && response.data.guilds && response.data.guilds.length > 0) {
        const data = {
          playing: true,
          ...response.data.guilds[0]
        }
        setMusicData(data)
        
        // Sync local progress and time with server
        if (data.status) {
          if (data.status.progress !== undefined) {
            setLocalProgress(data.status.progress)
          }
          
          // Parse and sync time
          if (data.status.currentTime && data.status.totalTime) {
            const current = parseDuration(data.status.currentTime)
            const total = parseDuration(data.status.totalTime)
            setCurrentSeconds(current)
            setTotalSeconds(total)
          }
          
          if (data.status.volume) {
            setLocalVolume(data.status.volume)
          }
          if (data.status.loop) {
            setLoopMode(data.status.loop)
          }
        }
      } else {
        setMusicData({ playing: false })
        setCurrentSeconds(0)
        setTotalSeconds(0)
        setLocalProgress(0)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch music data:', error)
      setLoading(false)
    }
  }

  const handleControl = async (action: string, guildId?: string) => {
    if (!guildId || isControlling) return
    
    setIsControlling(true)
    
    // Optimistic UI update
    if (action === 'pause') {
      setMusicData(prev => ({
        ...prev,
        status: prev.status ? { ...prev.status, isPaused: !prev.status.isPaused } : undefined
      }))
    }
    
    try {
      await axios.post(`/api/music/control/${guildId}`, { action })
      setTimeout(() => {
        fetchMusicData()
        setIsControlling(false)
      }, 300)
    } catch (error) {
      console.error('Control action failed:', error)
      // Revert optimistic update on error
      fetchMusicData()
      setIsControlling(false)
    }
  }

  const handleVolumeChange = async (value: number, guildId?: string) => {
    if (!guildId) return
    
    setLocalVolume(value)
    
    try {
      await axios.post(`/api/music/control/${guildId}`, { 
        action: 'volume',
        volume: value 
      })
    } catch (error) {
      console.error('Volume change failed:', error)
    }
  }

  const handleLoopToggle = async (guildId?: string) => {
    if (!guildId || isControlling) return
    
    // Cycle through loop modes: off -> queue -> track -> off
    const nextMode = loopMode === 'off' ? 'queue' : loopMode === 'queue' ? 'track' : 'off'
    setLoopMode(nextMode)
    
    setIsControlling(true)
    
    try {
      await axios.post(`/api/music/control/${guildId}`, { 
        action: 'loop',
        mode: nextMode
      })
      setTimeout(() => {
        fetchMusicData()
        setIsControlling(false)
      }, 300)
    } catch (error) {
      console.error('Loop toggle failed:', error)
      setIsControlling(false)
    }
  }

  const handlePlayTrack = async (trackIndex: number, guildId?: string) => {
    if (!guildId || isControlling) return
    
    setIsControlling(true)
    
    try {
      await axios.post(`/api/music/control/${guildId}`, { 
        action: 'jump',
        trackIndex
      })
      setTimeout(() => {
        fetchMusicData()
        setIsControlling(false)
      }, 300)
    } catch (error) {
      console.error('Jump to track failed:', error)
      setIsControlling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  if (!musicData.playing || !musicData.track) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in min-h-screen"
        style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
        <LiquidGlass 
          width="100vw" 
          height="100vh" 
          position="fixed"
          top="0"
          left="0"
          glassFrost={0.05}
          glassSaturation={1.1}
          borderRadius="0"
          className="pointer-events-none"
        />
        <div className="relative z-10 text-center">
          <Music2 className="h-24 w-24 animate-pulse mx-auto" style={{ color: colors.textSecondary }} />
          <h2 className="text-2xl font-bold mt-4" style={{ color: colors.text }}>No Music Playing</h2>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            Không có bài hát nào đang phát. Sử dụng lệnh /play để bắt đầu nghe nhạc!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="space-y-6 max-w-5xl mx-auto relative min-h-screen"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      
      {/* Liquid Glass Background */}
      <LiquidGlass 
        width="100vw" 
        height="100vh" 
        position="fixed"
        top="0"
        left="0"
        glassFrost={0.05}
        glassSaturation={1.1}
        borderRadius="0"
        className="pointer-events-none"
      />
      <style>{`
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 15px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale3d(0.97, 0.97, 1); }
          to { opacity: 1; transform: scale3d(1, 1, 1); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: opacity;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
        
        .hover-lift {
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        
        .hover-lift:hover {
          transform: translate3d(0, -3px, 0);
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          transition: transform 0.1s cubic-bezier(0.22, 1, 0.36, 1), 
                      box-shadow 0.1s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          will-change: transform;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale3d(1.15, 1.15, 1);
          box-shadow: 0 0 12px rgba(55, 65, 81, 0.6);
        }
        
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale3d(1.05, 1.05, 1);
          box-shadow: 0 0 8px rgba(55, 65, 81, 0.8);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          border: none;
          transition: transform 0.05s cubic-bezier(0.4, 0, 0.2, 1);
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale3d(1.15, 1.15, 1);
        }
        button {
          transition: all 0.05s cubic-bezier(0.4, 0, 0.2, 1) !important;
          transform: translateZ(0);
        }
        * {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `}</style>
      {/* Server Info */}
      <div className={`flex items-center gap-2 text-sm relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ color: colors.text }}>
        <Users className="h-4 w-4" />
        <span>Playing in {musicData.guildName}</span>
        {musicData.voiceChannel && (
          <>
            <span>•</span>
            <span>{musicData.voiceChannel.name}</span>
            <span>•</span>
            <span>{musicData.voiceChannel.memberCount} listeners</span>
          </>
        )}
      </div>

      {/* Now Playing Card */}
      <div className={`rounded-2xl backdrop-blur-xl border overflow-hidden hover-lift relative z-10 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          borderColor: 'rgba(200, 200, 200, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Album Art */}
          <div className="flex-shrink-0">
            <img 
              src={musicData.track.thumbnail} 
              alt={musicData.track.title}
              className="w-full md:w-64 h-64 object-cover rounded-xl shadow-2xl hover:scale-105 transition-transform duration-300"
              style={{
                imageRendering: 'crisp-edges',
                WebkitFontSmoothing: 'antialiased'
              }}
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: colors.textSecondary }}>
                Now Playing
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                {musicData.track.title}
              </h1>
              <p className="text-lg mb-4" style={{ color: colors.textSecondary }}>
                {musicData.track.author}
              </p>
            </div>

            {/* Progress Bar */}
            {musicData.status && (
              <div className="space-y-2">
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: `${colors.primary}30` }}>
                  <div 
                    className="h-2 rounded-full transition-all duration-100"
                    style={{ 
                      width: `${localProgress}%`,
                      backgroundColor: colors.primary
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
                  <span>{formatTime(currentSeconds)}</span>
                  <span>{formatTime(totalSeconds)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleControl('pause', musicData.guildId)}
                  disabled={isControlling}
                  className="h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                >
                  {musicData.status?.isPaused ? (
                    <Play className="h-5 w-5 text-white" />
                  ) : (
                    <Pause className="h-5 w-5 text-white" />
                  )}
                </button>
                
                <button
                  onClick={() => handleControl('skip', musicData.guildId)}
                  disabled={isControlling}
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 transition-all"
                  style={{ backgroundColor: colors.primaryLight }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                >
                  <SkipForward className="h-4 w-4 text-white" />
                </button>

                <button
                  onClick={() => handleLoopToggle(musicData.guildId)}
                  disabled={isControlling}
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 transition-all"
                  style={{ 
                    backgroundColor: loopMode === 'off' ? colors.primaryLight : colors.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = loopMode === 'off' ? colors.primaryLight : colors.primary}
                  title={loopMode === 'off' ? 'Loop: Off' : loopMode === 'queue' ? 'Loop: Queue' : 'Loop: Track'}
                >
                  {loopMode === 'track' ? (
                    <Repeat1 className="h-4 w-4 text-white" />
                  ) : (
                    <Repeat className="h-4 w-4 text-white" />
                  )}
                </button>

                <div className="text-xs font-medium" style={{ color: colors.text }}>
                  {loopMode === 'off' ? 'Loop: Off' : loopMode === 'queue' ? 'Loop: Queue' : 'Loop: Track'}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5" style={{ color: colors.text }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localVolume}
                  onChange={(e) => setLocalVolume(Number(e.target.value))}
                  onMouseUp={(e) => handleVolumeChange(Number((e.target as HTMLInputElement).value), musicData.guildId)}
                  onTouchEnd={(e) => handleVolumeChange(Number((e.target as HTMLInputElement).value), musicData.guildId)}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${localVolume}%, ${colors.primaryLight}40 ${localVolume}%, ${colors.primaryLight}40 100%)`
                  }}
                />
                <div className="text-sm font-medium min-w-[3rem] text-right" style={{ color: colors.text }}>
                  {localVolume}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue */}
      {musicData.queue && musicData.queue.size > 0 && (
        <div className={`rounded-2xl border-2 backdrop-blur-xl relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            borderColor: 'rgba(200, 200, 200, 0.4)'
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: `${colors.primary}40` }}>
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              Queue ({musicData.queue.size} tracks)
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: `${colors.primary}30` }}>
            {musicData.queue.tracks.slice(0, 10).map((track, index) => (
              <div 
                key={index} 
                onClick={() => handlePlayTrack(index, musicData.guildId)}
                className="p-4 hover:bg-white/80 flex items-center gap-4 hover:translate-x-2 cursor-pointer group transition-all"
              >
                <div className="text-sm font-medium w-8" style={{ color: colors.textSecondary }}>
                  {index + 1}
                </div>
                <div className="relative">
                  <img 
                    src={track.thumbnail} 
                    alt={track.title}
                    className="h-12 w-12 rounded object-cover hover:scale-110"
                  />
                  <div className="absolute inset-0 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{ backgroundColor: `${colors.primary}80` }}
                  >
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
                    {track.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                    {track.author}
                  </p>
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  {track.duration}
                </div>
              </div>
            ))}
          </div>
          {musicData.queue.size > 10 && (
            <div className="p-4 text-center text-sm border-t" style={{ color: colors.textSecondary, borderColor: `${colors.primary}30` }}>
              And {musicData.queue.size - 10} more tracks...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
