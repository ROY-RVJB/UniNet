import { useState, useEffect } from 'react'
import { UserTable } from '@/components/UserTable'
import { DocentesTable, type DocenteSistema, type DocenteFormData } from '@/components/DocentesTable'
import { useAuth } from '@/contexts/AuthContext'
import { useCarrera } from '@/contexts/CarreraContext'
import { API_BASE_URL } from '@/config/api'
import type { LDAPUser } from '@/types'

// ==========================================
// UsersPage - Gestión de Usuarios
// - Usuarios LDAP (todos ven)
// - Docentes del Sistema (solo admin)
// ==========================================

export function UsersPage() {
  const [users, setUsers] = useState<LDAPUser[]>([])
  const [docentes, setDocentes] = useState<DocenteSistema[]>([])
  const { user } = useAuth()
  const { selectedCarrera, isCarreraReady } = useCarrera()

  // Fetch usuarios LDAP (filtrado por carrera si hay una seleccionada)
  const fetchUsers = async () => {
    try {
      // Construir URL con filtro de carrera si aplica
      let url = `${API_BASE_URL}/api/users/list`
      if (selectedCarrera?.id) {
        url += `?carrera=${selectedCarrera.id}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        console.error('Error fetching users:', res.statusText)
        return
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  // Fetch docentes del sistema
  const fetchDocentes = async () => {
    try {
      const token = localStorage.getItem('uninet_token')
      const res = await fetch(`${API_BASE_URL}/api/docentes/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        // Si no existe el endpoint aún, usar array vacío
        if (res.status === 404) {
          setDocentes([])
          return
        }
        console.error('Error fetching docentes:', res.statusText)
        return
      }
      const data = await res.json()
      setDocentes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching docentes:', err)
      setDocentes([])
    }
  }

  // Crear docente
  const handleCreateDocente = async (data: DocenteFormData) => {
    const token = localStorage.getItem('uninet_token')
    const res = await fetch(`${API_BASE_URL}/api/docentes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || 'Error al crear docente')
    }
  }

  // Eliminar docente
  const handleDeleteDocente = async (id: string) => {
    const token = localStorage.getItem('uninet_token')
    const res = await fetch(`${API_BASE_URL}/api/docentes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || 'Error al eliminar docente')
    }
  }

  // Actualizar docente
  const handleUpdateDocente = async (id: string, data: Partial<DocenteFormData>) => {
    const token = localStorage.getItem('uninet_token')
    const res = await fetch(`${API_BASE_URL}/api/docentes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || 'Error al actualizar docente')
    }
  }

  useEffect(() => {
    // Esperar a que la carrera esté inicializada antes de hacer fetch
    if (!isCarreraReady) {
      return;
    }

    fetchUsers()
    // Solo cargar docentes si es admin
    if (user?.role === 'admin') {
      fetchDocentes()
    }
  }, [user?.role, selectedCarrera?.id, isCarreraReady]) // Re-fetch cuando cambie la carrera

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Tabla de usuarios LDAP - Siempre visible */}
      <UserTable
        users={users}
        onRefresh={fetchUsers}
        carreraCode={selectedCarrera?.id ?? ""}
      />

      {/* Tabla de docentes del sistema - Solo visible para admin */}
      {user?.role === 'admin' && (
        <div className="relative">
          {/* Separador visual mejorado */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <DocentesTable
            docentes={docentes}
            onRefresh={fetchDocentes}
            onCreate={handleCreateDocente}
            onUpdate={handleUpdateDocente}
            onDelete={handleDeleteDocente}
          />
        </div>
      )}
    </div>
  )
}
