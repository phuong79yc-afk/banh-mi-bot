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
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Commands from './pages/Commands'
import LiquidGlassDemo from './pages/LiquidGlassDemo'
import Maintenance from './pages/Maintenance'
import { useMaintenance } from './hooks/useMaintenance'

function AppRoutes() {
  const { isMaintenanceMode, isChecking } = useMaintenance();

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Đang kiểm tra...</div>
      </div>
    );
  }

  // If in maintenance mode, show only maintenance page
  if (isMaintenanceMode) {
    return <Maintenance />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/support" element={<Support />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/liquid-glass" element={<LiquidGlassDemo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="stats" element={<Statistics />} />
        <Route path="commands" element={<Commands />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PageTransition>
            <AppRoutes />
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
