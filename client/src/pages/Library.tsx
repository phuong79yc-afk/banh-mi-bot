import { useState, useEffect, useMemo } from 'react'
import { Search, Music, Play, Clock, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: string
  thumbnail: string
  url: string
  plays?: number
}

export default function Library() {
  const { colors, darkMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    setLoading(true)
    setError(null)
    
    // Show fallback immediately while loading
    setSongs(getFallbackSongs())
    
    try {
      const response = await axios.get('/api/music/library', { 
        timeout: 30000 // 30 seconds
      })
      
      if (response.data.success && response.data.songs && response.data.songs.length > 0) {
        setSongs(response.data.songs)
        setError(null)
      }
    } catch (err: any) {
      console.error('Failed to fetch library:', err)
      if (err.code === 'ECONNABORTED') {
        setError('⏱️ API timeout - showing offline data')
      } else {
        setError('🔌 Cannot connect to server - showing offline data')
      }
      // Keep fallback songs
    }
    setLoading(false)
  }

  const getFallbackSongs = (): Song[] => {
    return [
      {
        id: '1',
        title: 'Lạc Trôi',
        artist: 'Sơn Tùng M-TP',
        duration: '4:32',
        thumbnail: 'https://i.ytimg.com/vi/DrY_K0mT-As/maxresdefault.jpg',
        url: 'Sơn Tùng M-TP - Lạc Trôi',
        plays: 100000000
      },
      {
        id: '2',
        title: 'Hãy Trao Cho Anh',
        artist: 'Sơn Tùng M-TP',
        duration: '3:58',
        thumbnail: 'https://i.ytimg.com/vi/knW7-x7Y7RE/maxresdefault.jpg',
        url: 'Sơn Tùng M-TP - Hãy Trao Cho Anh',
        plays: 50000000
      },
      {
        id: '3',
        title: 'Bài Này Chill Phết',
        artist: 'Đen & Min',
        duration: '4:15',
        thumbnail: 'https://i.ytimg.com/vi/JofwzbFVQDY/maxresdefault.jpg',
        url: 'Đen - Bài Này Chill Phết',
        plays: 30000000
      },
      {
        id: '4',
        title: 'Có Chắc Yêu Là Đây',
        artist: 'Sơn Tùng M-TP',
        duration: '5:26',
        thumbnail: 'https://i.ytimg.com/vi/knW7-x7Y7RE/maxresdefault.jpg',
        url: 'Sơn Tùng M-TP - Có Chắc Yêu Là Đây',
        plays: 80000000
      },
      {
        id: '5',
        title: 'Anh Đang Ở Đâu Đấy Anh',
        artist: 'Hương Ly',
        duration: '3:45',
        thumbnail: 'https://i.ytimg.com/vi/jQJQ8w_h-tw/maxresdefault.jpg',
        url: 'Hương Ly - Anh Đang Ở Đâu Đấy Anh',
        plays: 25000000
      },
    ]
  }

  const handlePlay = async (song: Song) => {
    try {
      const query = song.url || `${song.artist} - ${song.title}`
      await axios.post('/api/music/play', { query })
    } catch (error) {
      console.error('Failed to play song:', error)
    }
  }

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs
    const query = searchQuery.toLowerCase()
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    )
  }, [songs, searchQuery])

  return (
    <div 
      className="space-y-6 relative min-h-screen"
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
        glassFrost={0.06}
        glassSaturation={1.1}
        borderRadius="0"
        className="pointer-events-none"
      />

      {/* Header */}
      <div className={`relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Music Library</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          {songs.length} bài hát có sẵn
        </p>
      </div>

      {/* Search Bar */}
      <GlassCard variant="default" className="p-4 rounded-2xl relative z-10">
        <div className="relative">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Tìm bài hát, nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
            style={{
              backgroundColor: darkMode ? `${colors.primary}10` : 'white',
              border: `2px solid ${colors.border}`,
              color: colors.text
            }}
          />
        </div>
      </GlassCard>

      {/* Error Message */}
      {error && (
        <div 
          className="p-4 rounded-xl relative z-10"
          style={{
            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
            border: `2px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5'}`
          }}
        >
          <p style={{ color: darkMode ? '#fca5a5' : '#dc2626' }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 relative z-10">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: colors.primary }}
          />
          <p style={{ color: colors.textSecondary }}>Đang tải thư viện...</p>
        </div>
      )}

      {/* Songs Grid */}
      {!loading && filteredSongs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative z-10">
          {filteredSongs.map((song, index) => (
            <GlassCard
              key={song.id}
              variant="hover"
              className="overflow-hidden cursor-pointer group rounded-2xl"
              onClick={() => handlePlay(song)}
            >
              <div className="relative aspect-square rounded-t-2xl">
                <img 
                  src={song.thumbnail} 
                  alt={song.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%238B5A3C" width="200" height="200"/%3E%3Ctext fill="white" font-size="60" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🎵%3C/text%3E%3C/svg%3E'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p 
                  className="font-semibold truncate text-sm"
                  style={{ color: colors.text }}
                >
                  {song.title}
                </p>
                <p 
                  className="text-xs truncate mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  {song.artist}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: colors.textSecondary }}>
                  <Clock className="h-3 w-3" />
                  <span>{song.duration}</span>
                  {song.plays && (
                    <>
                      <span>•</span>
                      <TrendingUp className="h-3 w-3" />
                      <span>{(song.plays / 1000000).toFixed(1)}M</span>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSongs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 relative z-10">
          <Music className="h-24 w-24 mb-4" style={{ color: colors.textSecondary }} />
          <p className="text-xl font-semibold" style={{ color: colors.text }}>
            {searchQuery ? 'Không tìm thấy kết quả' : 'Thư viện trống'}
          </p>
          <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
            {searchQuery ? 'Thử từ khóa khác' : 'Chưa có bài hát nào'}
          </p>
        </div>
      )}
    </div>
  )
}
