import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Mostrar loading mientras se verifica la sesion
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    )
  }

  // Si no esta autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar rol si se especificaron roles permitidos
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Usuario no tiene permiso, redirigir a home
    return <Navigate to="/" replace />
  }

  // Si esta autenticado y tiene permiso, mostrar el contenido
  return <>{children}</>
}
