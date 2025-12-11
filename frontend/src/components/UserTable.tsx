import type  { LDAPUser } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateUserModal } from '@/components/CreateUserModal';
import type { UserFormData } from '@/components/CreateUserModal';
import { useToast } from '@/contexts/ToastContext';
import { ToastDemo } from '@/components/ToastDemo';

interface UserTableProps {
  users: LDAPUser[];
  onRefresh: () => void;
}

export function UserTable({ users, onRefresh }: UserTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, hideToast } = useToast();

  const handleCreateUser = async (userData: UserFormData) => {
    const loadingId = showToast('loading', 'Creando usuario...');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';

    const payload = {
      username: userData.username,
      full_name: userData.fullName,
      password: userData.password,
      email: `${userData.username}@uninet.com`,
    };

    console.log('[DEBUG] Enviando POST a:', `${apiUrl}/api/users/create`);
    console.log('[DEBUG] Payload:', payload);

    try {
      const res = await fetch(`${apiUrl}/api/users/create`, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('[DEBUG] Response status:', res.status);
      console.log('[DEBUG] Response headers:', [...res.headers.entries()]);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al crear usuario');
      }

      hideToast(loadingId);
      showToast('success', `Usuario ${userData.username} creado exitosamente`);
      setIsModalOpen(false);
      onRefresh(); // Recargar lista de usuarios
    } catch (error) {
      hideToast(loadingId);
      showToast('error', error instanceof Error ? error.message : 'Error al crear el usuario');
      throw error;
    }
  };

  const handleEditUser = (user: LDAPUser) => {
    // TODO: Implementar edición de usuario
    console.log('Editar usuario:', user);
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
          {/* Botón crear usuario */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-tech-text hover:bg-tech-textDim text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario LDAP
            </Button>
          </div>

        {/* Tabla de usuarios */}
        <div className="rounded-lg border border-tech-darkBorder overflow-hidden">
          <table className="w-full">
            <thead className="bg-tech-hoverState">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Usuario (UID)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Nombre Completo (CN)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">DN</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-tech-text">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-darkBorder">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-tech-textDim">
                    No hay usuarios creados. Haz clic en &quot;Crear Usuario LDAP&quot; para comenzar.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                <tr key={user.username} className="hover:bg-tech-hoverState transition-colors">
                  <td className="px-4 py-3 text-sm text-tech-text font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-tech-text">{user.full_name}</td>
                  <td className="px-4 py-3 text-sm text-tech-textDim">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-tech-textDim text-xs">{user.dn}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg text-subtle hover:text-tech-text hover:bg-tech-hoverState transition-colors"
                        title="Editar usuario"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 rounded-lg text-subtle hover:text-status-offline hover:bg-status-offline/10 transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>
          {/* Demo de Toast Notifications */}
          <ToastDemo />
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
