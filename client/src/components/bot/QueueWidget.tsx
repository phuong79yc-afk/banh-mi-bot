import { useEffect, useState } from 'react'
import { Music, Trash2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import axios from 'axios'

interface QueueSong {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
}

export default function QueueWidget() {
  const { colors } = useTheme()
  const [queue, setQueue] = useState<QueueSong[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 10000) // Giảm từ 5s → 10s
    return () => clearInterval(interval)
  }, [])

  const fetchQueue = async () => {
    try {
      const response = await axios.get('/api/music/queue')
      setQueue(response.data.queue || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch queue:', error)
      setLoading(false)
    }
  }

  const removeFromQueue = async (songId: string) => {
    try {
      await axios.delete(`/api/music/queue/${songId}`)
      setQueue(queue.filter(song => song.id !== songId))
    } catch (error) {
      console.error('Failed to remove song:', error)
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5" style={{ color: colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
          Music Queue
        </h3>
        <span 
          className="ml-auto text-xs font-medium px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: `${colors.primary}20`,
            color: colors.text
          }}
        >
          {queue.length} songs
        </span>
      </div>

      {/* Queue List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderColor: colors.primary }}
            />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-30" style={{ color: colors.textSecondary }} />
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Queue is empty
            </p>
          </div>
        ) : (
          queue.map((song, index) => (
            <div 
              key={song.id}
              className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group"
              style={{ 
                backgroundColor: index === 0 ? `${colors.primary}10` : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (index !== 0) e.currentTarget.style.backgroundColor = `${colors.primary}05`
              }}
              onMouseLeave={(e) => {
                if (index !== 0) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <img 
                src={song.thumbnail} 
                alt={song.title}
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
                  {song.title}
                </p>
                <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                  {song.artist} • {song.duration}
                </p>
              </div>
              {index === 0 ? (
                <span 
                  className="text-xs font-bold px-2 py-1 rounded text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  NOW
                </span>
              ) : (
                <button
                  onClick={() => removeFromQueue(song.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear Queue Button */}
      {queue.length > 0 && (
        <button
          onClick={async () => {
            try {
              await axios.delete('/api/music/queue')
              setQueue([])
            } catch (error) {
              console.error('Failed to clear queue:', error)
            }
          }}
          className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-xl"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: colors.text,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Clear Queue
        </button>
      )}
    </div>
  )
}
