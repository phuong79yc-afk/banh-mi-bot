import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface Permissions {
  canViewDashboard: boolean
  canViewStats: boolean
  canExecuteCommands: boolean
  canChangeSettings: boolean
  canManageBot: boolean
  canAccessAPI: boolean
  isAdmin: boolean
  isUser: boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuth()
  
  const permissions = useMemo(() => {
    const role = user?.role || 'user'
    
    // Admin có full quyền
    if (role === 'admin') {
      return {
        canViewDashboard: true,
        canViewStats: true,
        canExecuteCommands: true,
        canChangeSettings: true,
        canManageBot: true,
        canAccessAPI: true,
        isAdmin: true,
        isUser: false,
      }
    }
    
    // User chỉ xem, không được thay đổi gì
    return {
      canViewDashboard: true,    // Được xem dashboard
      canViewStats: true,         // Được xem stats
      canExecuteCommands: false,  // KHÔNG được execute commands
      canChangeSettings: false,   // KHÔNG được change settings
      canManageBot: false,        // KHÔNG được manage bot (start/stop/restart)
      canAccessAPI: false,        // KHÔNG được access API endpoints
      isAdmin: false,
      isUser: true,
    }
  }, [user])
  
  return permissions
}
