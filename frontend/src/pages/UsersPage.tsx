import { useState, useEffect } from 'react'
import { UserTable } from '@/components/UserTable'
import { DocentesTable, type DocenteSistema, type DocenteFormData } from '@/components/DocentesTable'
import { useAuth } from '@/contexts/AuthContext'
import { useCarrera } from '@/contexts/CarreraContext'
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

  const apiUrl = import.meta.env.VITE_API_URL || "http://10.12.195.223:4000"

  // Fetch usuarios LDAP (filtrado por carrera si hay una seleccionada)
  const fetchUsers = async () => {
    try {
      // Construir URL con filtro de carrera si aplica
      let url = `${apiUrl}/api/users/list`
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
      const res = await fetch(`${apiUrl}/api/docentes/list`, {
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
    const res = await fetch(`${apiUrl}/api/docentes/create`, {
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
    const res = await fetch(`${apiUrl}/api/docentes/${id}`, {
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
    <div className="space-y-12">
      {/* Tabla de usuarios LDAP */}
      <UserTable users={users} onRefresh={fetchUsers} />

      {/* Tabla de docentes del sistema - Solo visible para admin */}
      {user?.role === 'admin' && (
        <div className="border-t border-white/10 pt-12">
          <DocentesTable
            docentes={docentes}
            onRefresh={fetchDocentes}
            onCreate={handleCreateDocente}
            onDelete={handleDeleteDocente}
          />
        </div>
      )}
    </div>
  )
}
