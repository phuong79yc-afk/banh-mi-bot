import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'
import MainLayout from './layouts/MainLayout'
import Landing from './pages/Landing'
import Documentation from './pages/Documentation'
import Support from './pages/Support'
import Demo from './pages/Demo'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MusicPlayer from './pages/MusicPlayer'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Commands from './pages/Commands'
import Library from './pages/Library'
import LiquidGlassDemo from './pages/LiquidGlassDemo'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* SVG Defs for Liquid Glass Filters */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="0" 
            height="0" 
            style={{ position: 'absolute', overflow: 'hidden' }}
            colorInterpolationFilters="sRGB"
          >
            <defs id="liquid-glass-svg-defs"></defs>
          </svg>
          
          <PageTransition>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/support" element={<Support />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/liquid-glass" element={<LiquidGlassDemo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="music" element={<MusicPlayer />} />
                <Route path="library" element={<Library />} />
                <Route path="stats" element={<Statistics />} />
                <Route path="commands" element={<Commands />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
