import axios from 'axios';

// API base URL - automatically detects environment
// In development with Vite proxy, use relative path
// In production, use full URL from env var
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false for CORS compatibility
});

// Request interceptor - add auth token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  
  // Bot
  botStatus: '/bot/status',
  botStats: '/bot/stats/enhanced',
  
  // Music
  musicCurrent: '/music/current',
  musicQueue: '/music/queue',
  musicPause: '/music/pause',
  musicResume: '/music/resume',
  musicSkip: '/music/skip',
  musicVolume: '/music/volume',
  musicControl: (guildId: string) => `/music/control/${guildId}`,
  musicLibrary: '/music/library',
  musicSearch: '/music/search',
  musicPinned: '/music/pinned',
  musicPin: '/music/pin',
  
  // Stats
  analytics: '/stats/analytics',
  
  // Commands
  commands: '/commands',
  
  // Data
  users: '/data/users',
  lyrics: '/data/lyrics',
};

export default api;
