import type { LDAPUser, UserGroup } from '@/types';
import { Plus, Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CreateUserModal } from '@/components/CreateUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { UserFormData } from '@/components/CreateUserModal';
import type { EditUserFormData } from '@/components/EditUserModal';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

// ==========================================
// UserTable - Estilo Minimalista Vercel
// ==========================================

// Tabs de filtro
type FilterTab = 'todos' | 'alumnos' | 'docentes';

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'alumnos', label: 'Alumnos' },
  { id: 'docentes', label: 'Docentes' },
];

// Colores de rol (solo texto, minimalista)
const roleColors: Record<UserGroup, string> = {
  alumnos: 'text-emerald-400',
  docentes: 'text-amber-400',
};

// Generar iniciales del nombre
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Generar color consistente basado en string
function getAvatarColor(name: string): string {
  const colors = [
    'bg-zinc-700',
    'bg-zinc-600',
    'bg-neutral-700',
    'bg-stone-700',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

interface UserTableProps {
  users: LDAPUser[];
  onRefresh: () => void;
}

export function UserTable({ users, onRefresh }: UserTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<LDAPUser | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<LDAPUser | null>(null);
  const { showToast, hideToast } = useToast();

  // Filtrar usuarios por grupo y búsqueda
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filtro por grupo
    if (activeFilter !== 'todos') {
      result = result.filter(user => user.group === activeFilter);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.username.toLowerCase().includes(query) ||
        (user.full_name?.toLowerCase().includes(query)) ||
        (user.email?.toLowerCase().includes(query))
      );
    }

    return result;
  }, [users, activeFilter, searchQuery]);

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
      setIsCreateModalOpen(false);
      onRefresh();
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al crear el usuario');
      throw error;
    }
  };

  const handleEditUser = (user: LDAPUser) => {
    setUserToEdit(user);
  };

  const handleUpdateUser = async (userData: EditUserFormData) => {
    const loadingId = showToast('loading', 'Actualizando usuario...');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';

    const payload: Record<string, string> = {
      username: userData.username,
      full_name: userData.fullName,
    };

    // Solo incluir password si se proporcionó
    if (userData.password) {
      payload.password = userData.password;
    }

    try {
      const res = await fetch(`${apiUrl}/api/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al actualizar usuario');
      }

      hideToast(loadingId);
      showToast('success', `Usuario ${userData.username} actualizado`);
      onRefresh();
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al actualizar el usuario');
      throw error;
    }
  };

  // Abrir modal de confirmación
  const handleDeleteClick = (user: LDAPUser) => {
    setUserToDelete(user);
  };

  // Ejecutar eliminación real
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const loadingId = showToast('loading', 'Eliminando usuario...');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';

    try {
      const res = await fetch(`${apiUrl}/api/users/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToDelete.username }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al eliminar usuario');
      }

      hideToast(loadingId);
      showToast('success', `Usuario ${userToDelete.username} eliminado`);
      onRefresh();
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al eliminar el usuario');
      throw error; // Re-throw para que el modal sepa que falló
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header minimalista */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Título */}
            <h2 className="text-xl font-semibold text-white">Usuarios</h2>

            {/* Tabs con underline */}
            <div className="flex items-center gap-1">
              {filterTabs.map((tab) => {
                const count = tab.id === 'todos' ? userStats.total : userStats[tab.id];
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      'ml-1.5 text-xs',
                      isActive ? 'text-white/60' : 'text-white/30'
                    )}>
                      {count}
                    </span>
                    {/* Underline activo */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones header */}
          <div className="flex items-center gap-3">
            {/* Search input minimalista */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className={cn(
                  'w-48 pl-9 pr-3 py-1.5 text-sm',
                  'bg-transparent border border-white/10 rounded-lg',
                  'text-white placeholder:text-white/30',
                  'focus:outline-none focus:border-white/30',
                  'transition-colors'
                )}
              />
            </div>

            <button
              onClick={onRefresh}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>
        </div>

        {/* Tabla minimalista */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            {/* Header de tabla */}
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-white/30 text-sm">
                      {searchQuery.trim()
                        ? `Sin resultados para "${searchQuery}"`
                        : users.length === 0
                          ? 'Sin usuarios registrados'
                          : `Sin ${activeFilter} registrados`
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.username}
                    className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Usuario con avatar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar con iniciales */}
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white/70',
                          getAvatarColor(user.full_name || user.username)
                        )}>
                          {getInitials(user.full_name || user.username)}
                        </div>
                        {/* Username mono */}
                        <span className="font-mono text-sm text-white">
                          {user.username}
                        </span>
                      </div>
                    </td>

                    {/* Nombre */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-white/70">
                        {user.full_name || '—'}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-white/40 font-mono">
                        {user.email || '—'}
                      </span>
                    </td>

                    {/* Rol - solo texto coloreado */}
                    <td className="px-4 py-4">
                      {user.group ? (
                        <span className={cn('text-sm font-medium', roleColors[user.group])}>
                          {user.group === 'alumnos' ? 'Alumno' : 'Docente'}
                        </span>
                      ) : (
                        <span className="text-sm text-white/20">—</span>
                      )}
                    </td>

                    {/* Acciones - visibles en hover */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* Modal Editar Usuario */}
      <EditUserModal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        onSubmit={handleUpdateUser}
        user={userToEdit}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        message={`¿Eliminar a ${userToDelete?.username}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
