import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { NetworkPage } from '@/pages/NetworkPage'
import { LogsPage } from '@/pages/LogsPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Ruta publica: Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Rutas protegidas con MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        {/* Network y Logs: admin ve todo, docente ve solo su carrera */}
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
