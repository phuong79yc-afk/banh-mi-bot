import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationDropdown() {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get notification settings from localStorage with better defaults
  const getNotificationSettings = () => {
    const stored = localStorage.getItem('notificationSettings');
    if (!stored) {
      const defaults = {
        pushNotifications: true,
        serverAlerts: true,
        errorReports: true,
        commandUsage: true,
        maintenance: true,
        emailNotifications: false
      };
      localStorage.setItem('notificationSettings', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(stored);
  };
  
  const notificationSettings = getNotificationSettings();
  
  // Always fetch notifications, regardless of settings
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications(true, 3000); // Always enabled

  // Filter notifications based on settings (for display only)
  const filteredNotifications = notifications.filter(notification => {
    // If setting doesn't exist for this type, show it by default
    const settingKey = notification.type as keyof typeof notificationSettings;
    return notificationSettings[settingKey] !== false;
  });

  // Animation state for new notifications
  const [shouldBounce, setShouldBounce] = useState(false);
  const previousUnreadRef = useRef(unreadCount);
  const [isClearing, setIsClearing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  // Trigger bounce animation when unread count increases
  useEffect(() => {
    if (unreadCount > previousUnreadRef.current && previousUnreadRef.current > 0) {
      setShouldBounce(true);
      setTimeout(() => setShouldBounce(false), 1000);
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Handle open with bell ring
  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setBellRinging(true);
      setIsOpen(true);
      setTimeout(() => setBellRinging(false), 500);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('🔔 NotificationDropdown State:', {
      notificationsCount: notifications.length,
      filteredCount: filteredNotifications.length,
      unreadCount,
      loading,
      isOpen,
      settings: notificationSettings
    });
  }, [notifications, filteredNotifications, unreadCount, loading, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'serverAlerts': return '🌐';
      case 'errorReports': return '⚠️';
      case 'commandUsage': return '⚡';
      case 'musicUpdates': return '🎵';
      case 'maintenance': return '🔧';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-110 ${shouldBounce ? 'animate-bounce' : ''} ${bellRinging ? 'bell-ring' : ''}`}
        style={{ 
          backgroundColor: isOpen ? `${colors.primary}20` : 'transparent',
          color: colors.text 
        }}
      >
        <Bell className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-12' : ''}`} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ 
              backgroundColor: colors.primary,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border-2 overflow-hidden z-50"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            animation: isClosing 
              ? 'slideUp 0.3s ease-out, fadeOut 0.3s ease-out' 
              : 'slideDown 0.3s ease-out, fadeIn 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: `2px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" style={{ color: colors.primary }} />
              <h3 className="font-semibold" style={{ color: colors.text }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary 
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:scale-110 transition-all duration-200 group"
                  title="Mark all as read"
                  style={{ 
                    color: colors.textSecondary,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <CheckCheck className="h-4 w-4 group-hover:text-green-500 transition-colors" />
                </button>
              )}
              {filteredNotifications.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm('🗑️ Clear all notifications? This cannot be undone.')) {
                      setIsClearing(true);
                      await clearAll();
                      setTimeout(() => {
                        setIsClearing(false);
                        setIsOpen(false);
                      }, 500);
                    }
                  }}
                  disabled={isClearing}
                  className="p-1.5 rounded-lg hover:scale-110 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Clear all notifications"
                  style={{ 
                    color: colors.textSecondary,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => !isClearing && (e.currentTarget.style.backgroundColor = `${colors.primary}10`)}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 className={`h-4 w-4 group-hover:text-red-500 transition-all ${isClearing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:scale-110 transition-all duration-200 group"
                style={{ 
                  color: colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center" style={{ color: colors.textSecondary }}>
                <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto" 
                     style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
                <p className="mt-3">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 && notifications.length > 0 ? (
              <div className="p-8 text-center" style={{ color: colors.textSecondary }}>
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">All filtered</p>
                <p className="text-sm mt-1">Enable notification types in Settings to see them here</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center" style={{ color: colors.textSecondary }}>
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {filteredNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    data-notification-item
                    className="p-4 transition-all duration-300 hover:bg-opacity-10 hover:bg-black cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                    onClick={() => markAsRead(notification.id)}
                    style={{
                      backgroundColor: notification.read ? 'transparent' : `${colors.primary}05`,
                      animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`,
                      transformOrigin: 'left center'
                    }}
                  >
                    <div className="flex gap-3">
                      <span 
                        className="text-2xl transition-transform duration-200 hover:scale-125"
                        style={{ animation: notification.read ? 'none' : 'wiggle 0.5s ease-in-out' }}
                      >
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p 
                            className="font-semibold text-sm transition-colors duration-200"
                            style={{ color: colors.text }}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div 
                              className="h-2 w-2 rounded-full flex-shrink-0 mt-1"
                              style={{ 
                                backgroundColor: colors.primary,
                                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                              }}
                            />
                          )}
                        </div>
                        <p 
                          className="text-sm mb-2 line-clamp-2 transition-colors duration-200"
                          style={{ color: colors.textSecondary }}
                        >
                          {notification.message}
                        </p>
                        <p 
                          className="text-xs transition-colors duration-200"
                          style={{ color: colors.textSecondary }}
                        >
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div 
              className="p-3"
              style={{ 
                borderTop: `2px solid ${colors.border}`,
                backgroundColor: `${colors.primary}05`
              }}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleClose();
                    setTimeout(() => {
                      window.location.href = '/dashboard/settings';
                    }, 300);
                  }}
                  className="flex-1 text-sm font-medium hover:underline transition-all py-2 rounded-lg"
                  style={{ color: colors.primary }}
                >
                  ⚙️ Settings
                </button>
                
                <button
                  onClick={async () => {
                    if (window.confirm(`🗑️ Clear all ${filteredNotifications.length} notifications?\n\nThis action cannot be undone.`)) {
                      setIsClearing(true);
                      
                      // Animate out each notification
                      const items = document.querySelectorAll('[data-notification-item]');
                      items.forEach((item, index) => {
                        setTimeout(() => {
                          (item as HTMLElement).style.animation = 'slideOutRight 0.3s ease-out forwards';
                        }, index * 30);
                      });
                      
                      // Wait for animations then clear
                      setTimeout(async () => {
                        await clearAll();
                        setIsClearing(false);
                        handleClose();
                      }, items.length * 30 + 300);
                    }
                  }}
                  disabled={isClearing}
                  className="flex-1 text-sm font-medium transition-all py-2 rounded-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: isClearing ? `${colors.primary}20` : `${colors.primary}10`,
                    color: isClearing ? colors.textSecondary : 'rgb(239, 68, 68)',
                    border: `2px solid ${isClearing ? colors.border : 'transparent'}`
                  }}
                  onMouseEnter={(e) => !isClearing && (e.currentTarget.style.backgroundColor = 'rgb(254, 226, 226)')}
                  onMouseLeave={(e) => !isClearing && (e.currentTarget.style.backgroundColor = `${colors.primary}10`)}
                >
                  {isClearing ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⏳</span>
                      Clearing...
                    </>
                  ) : (
                    <>
                      🗑️ Clear All ({filteredNotifications.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
