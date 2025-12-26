import { useState, useEffect } from 'react'
import { UserTable } from '@/components/UserTable'
import { DocentesTable } from '@/components/DocentesTable'
import { useAuth } from '@/contexts/AuthContext'
import { useCarrera } from '@/contexts/CarreraContext'
import type { LDAPUser } from '@/types'

// ==========================================
// UsersPage - Gestión de Usuarios
// - Usuarios LDAP (todos ven)
// - Docentes del Sistema (solo admin)
// ==========================================

// Mapeo de IDs de carrera (frontend) a códigos LDAP (backend)
const CARRERA_TO_LDAP_CODE: Record<string, string> = {
  'carrera-administracion': '5001',
  'carrera-contabilidad': '5002',
  'carrera-derecho': '5003',
  'carrera-ecoturismo': '5004',
  'carrera-inicial': '5005',
  'carrera-matematicas': '5006',
  'carrera-primaria': '5007',
  'carrera-enfermeria': '5008',
  'carrera-agroindustrial': '5009',
  'carrera-sistemas': '5010',
  'carrera-forestal': '5011',
  'carrera-veterinaria': '5012',
}

interface Docente {
  id: string
  username: string
  full_name: string | null
  email: string | null
  carreras: Array<{ id: string; nombre: string }>
  created_at: string
  active: boolean
}

interface DocenteFormData {
  username: string
  full_name: string
  email: string
  password: string
  carreras: string[]
}

export function UsersPage() {
  const [users, setUsers] = useState<LDAPUser[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const { user } = useAuth()
  const { selectedCarrera } = useCarrera()

  const apiUrl = import.meta.env.VITE_API_URL || "http://10.12.195.223:4000"

  // Fetch usuarios LDAP (filtrados por carrera seleccionada)
  const fetchUsers = async () => {
    try {
      // Obtener código LDAP de la carrera seleccionada
      const carreraCode = selectedCarrera ? CARRERA_TO_LDAP_CODE[selectedCarrera.id] : null
      
      // Si no hay carrera seleccionada, no mostrar usuarios
      if (!carreraCode) {
        setUsers([])
        return
      }
      
      const res = await fetch(`${apiUrl}/api/users/list?carrera=${carreraCode}`)
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
    fetchUsers()
    // Solo cargar docentes si es admin
    if (user?.role === 'admin') {
      fetchDocentes()
    }
  }, [user?.role, selectedCarrera]) // Recargar cuando cambie la carrera o el rol

  return (
    <div className="space-y-12">
      {/* Tabla de usuarios LDAP */}
      {selectedCarrera && (
        <UserTable 
          users={users} 
          onRefresh={fetchUsers} 
          carreraCode={CARRERA_TO_LDAP_CODE[selectedCarrera.id] || "5010"}
        />
      )}
      
      {!selectedCarrera && (
        <div className="text-center text-white/50 py-12">
          Selecciona una carrera para gestionar usuarios
        </div>
      )}

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
