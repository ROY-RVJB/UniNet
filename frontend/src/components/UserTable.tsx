import type  { LDAPUser, UserGroup } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Users, GraduationCap, BookOpen } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CreateUserModal } from '@/components/CreateUserModal';
import type { UserFormData } from '@/components/CreateUserModal';
import { useToast } from '@/contexts/ToastContext';

// Tabs de filtro
type FilterTab = 'todos' | 'alumnos' | 'docentes';

const filterTabs: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: 'todos', label: 'Todos', icon: Users },
  { id: 'alumnos', label: 'Alumnos', icon: GraduationCap },
  { id: 'docentes', label: 'Docentes', icon: BookOpen },
];

// Badge de grupo
const groupBadge: Record<UserGroup, { bg: string; text: string; label: string }> = {
  alumnos: { bg: 'bg-lab-sistemas/20', text: 'text-lab-sistemas', label: 'Alumno' },
  docentes: { bg: 'bg-lab-finanzas/20', text: 'text-lab-finanzas', label: 'Docente' },
};

interface UserTableProps {
  users: LDAPUser[];
  onRefresh: () => void;
}

export function UserTable({ users, onRefresh }: UserTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');
  const { showToast, hideToast } = useToast();

  // Filtrar usuarios por grupo
  const filteredUsers = useMemo(() => {
    if (activeFilter === 'todos') return users;
    return users.filter(user => user.group === activeFilter);
  }, [users, activeFilter]);

  // Stats de usuarios
  const userStats = useMemo(() => ({
    total: users.length,
    alumnos: users.filter(u => u.group === 'alumnos').length,
    docentes: users.filter(u => u.group === 'docentes').length,
  }), [users]);

  const handleCreateUser = async (userData: UserFormData) => {
    const loadingId = showToast('loading', 'Creando usuario...');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';

    const payload = {
      username: userData.username,
      full_name: userData.fullName,
      password: userData.password,
      email: `${userData.username}@uninet.com`,
    };

    try {
      const xhr = new XMLHttpRequest();

      await new Promise((resolve, reject) => {
        xhr.open('POST', `${apiUrl}/api/users/create`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ success: true });
            }
          } else {
            reject(new Error(`Error ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = function() {
          reject(new Error('Error de red al crear usuario'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Timeout al crear usuario'));
        };

        xhr.timeout = 35000;
        xhr.send(JSON.stringify(payload));
      });

      hideToast(loadingId);
      showToast('success', `Usuario ${userData.username} creado exitosamente`);
      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al crear el usuario');
      throw error;
    }
  };

  const handleEditUser = (_user: LDAPUser) => {
    // TODO: Implementar edición de usuario
    showToast('loading', 'Edición de usuarios próximamente');
  };

  const handleDeleteUser = async (user: LDAPUser) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${user.username}?`)) return;

    const loadingId = showToast('loading', 'Eliminando usuario...');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';

    try {
      const res = await fetch(`${apiUrl}/api/users/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al eliminar usuario');
      }

      hideToast(loadingId);
      showToast('success', `Usuario ${user.username} eliminado exitosamente`);
      onRefresh(); // Recargar lista de usuarios
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al eliminar el usuario');
    }
  };

  return (
    <>
      <Card className="bg-tech-darkCard border-tech-darkBorder">
        <CardHeader>
          <CardTitle className="text-tech-text">Directorio Activo (OpenLDAP)</CardTitle>
          <CardDescription>
            Gestión de usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header: Tabs + Botón */}
          <div className="flex items-center justify-between">
            {/* Tabs de filtro */}
            <div className="flex items-center gap-1 p-1 bg-tech-hoverState rounded-lg">
              {filterTabs.map((tab) => {
                const Icon = tab.icon;
                const count = tab.id === 'todos' ? userStats.total : userStats[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${activeFilter === tab.id
                        ? 'bg-tech-darkCard text-white'
                        : 'text-tech-textDim hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <span className={`
                      px-1.5 py-0.5 rounded text-xs
                      ${activeFilter === tab.id ? 'bg-white/10' : 'bg-transparent'}
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Botón crear usuario */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-tech-text hover:bg-tech-textDim text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </div>

        {/* Tabla de usuarios */}
        <div className="rounded-lg border border-tech-darkBorder overflow-hidden">
          <table className="w-full">
            <thead className="bg-tech-hoverState">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Nombre Completo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Grupo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-tech-text">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-darkBorder">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-tech-textDim">
                    {users.length === 0
                      ? 'No hay usuarios creados. Haz clic en "Crear Usuario" para comenzar.'
                      : `No hay ${activeFilter === 'alumnos' ? 'alumnos' : 'docentes'} registrados.`
                    }
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const badge = user.group ? groupBadge[user.group] : null;
                  return (
                    <tr key={user.username} className="hover:bg-tech-hoverState transition-colors">
                      <td className="px-4 py-3 text-sm text-tech-text font-medium">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-tech-text">{user.full_name}</td>
                      <td className="px-4 py-3 text-sm text-tech-textDim">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {badge ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-tech-textDim text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg text-tech-textDim hover:text-tech-text hover:bg-tech-hoverState transition-colors"
                            title="Editar usuario"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-lg text-tech-textDim hover:text-status-offline hover:bg-status-offline/10 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
    </Card>

    {/* Modal Crear Usuario */}
    <CreateUserModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleCreateUser}
    />
  </>
  );
}
