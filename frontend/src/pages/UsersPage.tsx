import { useState, useEffect } from 'react'
import { UserTable } from '@/components/UserTable'
import { mockUsers } from '@/data/mockData'
import type { LDAPUser } from '@/types'

export function UsersPage() {
  const [users, setUsers] = useState<LDAPUser[]>(mockUsers)

  const fetchUsers = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000'
    try {
      const res = await fetch(`${apiUrl}/api/users/list`)
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

  useEffect(() => {
    fetchUsers()
  }, [])

  return <UserTable users={users} onRefresh={fetchUsers} />
}
