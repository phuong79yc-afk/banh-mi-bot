import { useState } from 'react'
import { Play, Pause, SkipForward, Volume2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import api, { apiEndpoints } from '../../lib/api'

interface BotControlWidgetProps {
  currentSong?: {
    title: string
    artist: string
    thumbnail: string
  }
  isPlaying: boolean
  volume: number
}

export default function BotControlWidget({ currentSong, isPlaying: initialPlaying, volume: initialVolume }: BotControlWidgetProps) {
  const { colors } = useTheme()
  const [isPlaying, setIsPlaying] = useState(initialPlaying)
  const [volume, setVolume] = useState(initialVolume)
  const [loading, setLoading] = useState(false)

  const handlePlayPause = async () => {
    setLoading(true)
    try {
      if (isPlaying) {
        await api.post(apiEndpoints.musicPause)
        setIsPlaying(false)
      } else {
        await api.post(apiEndpoints.musicResume)
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Failed to control playback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      await api.post(apiEndpoints.musicSkip)
    } catch (error) {
      console.error('Failed to skip song:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume)
    try {
      await api.post(apiEndpoints.musicVolume, { volume: newVolume })
    } catch (error) {
      console.error('Failed to change volume:', error)
    }
  }

  return (
    <div 
      className="w-80 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-xl"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'transparent'
      }}
    >
      {/* Current Song */}
      <div className="flex items-center gap-3 mb-4">
        {currentSong ? (
          <>
            <img 
              src={currentSong.thumbnail} 
              alt={currentSong.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: colors.text }}>
                {currentSong.title}
              </p>
              <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                {currentSong.artist}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center w-full">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              No song playing
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handlePlayPause}
          disabled={loading || !currentSong}
          className="rounded-full p-4 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl"
          style={{ 
            backgroundColor: 'transparent',
            border: `2px solid ${colors.primary}60`
          }}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" style={{ color: colors.primary }} />
          ) : (
            <Play className="w-6 h-6" style={{ color: colors.primary }} />
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={loading || !currentSong}
          className="rounded-full p-3 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl"
          style={{ 
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: colors.textSecondary
          }}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-5 h-5" style={{ color: colors.primary }} />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: colors.primary }}
        />
        <span className="text-sm font-medium w-10 text-right" style={{ color: colors.text }}>
          {volume}%
        </span>
      </div>
    </div>
  )
}
