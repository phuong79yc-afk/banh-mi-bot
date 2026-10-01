import { useState, useEffect } from 'react'

interface BotStatus {
  online: boolean
  status: string
  ping: number
  uptime: number
  guilds: number
  users: number
  timestamp: number
}

export function useBotStatus(refreshInterval: number = 5000) {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      // Use relative path for Vite proxy in dev mode
      const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000')
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching bot status:', err)
      setError(err.message || 'Bot offline or API unavailable')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Refresh status every X seconds
    const interval = setInterval(fetchStatus, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return { status, loading, error, refresh: fetchStatus }
}
