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
}

export function UserTable({ users }: UserTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, hideToast } = useToast();

  const handleCreateUser = async (userData: UserFormData) => {
    const loadingId = showToast('loading', 'Creando usuario...');

    try {
      // TODO: Conectar con API backend
      console.log('Crear usuario LDAP:', {
        uid: userData.username,
        cn: userData.fullName,
        password: userData.password,
        gid: parseInt(userData.group),
      });

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Aquí iría la llamada real al backend
      // await fetch('/api/users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     uid: userData.username,
      //     cn: userData.fullName,
      //     password: userData.password,
      //     gid: parseInt(userData.group),
      //   }),
      // });

      hideToast(loadingId);
      showToast('success', `Usuario ${userData.username} creado exitosamente`);
    } catch (error) {
      hideToast(loadingId);
      showToast('error', 'Error al crear el usuario');
      throw error;
    }
  };

  const handleEditUser = (user: LDAPUser) => {
    // TODO: Implementar edición de usuario
    console.log('Editar usuario:', user);
  };

  const handleDeleteUser = (user: LDAPUser) => {
    // TODO: Implementar eliminación de usuario
    console.log('Eliminar usuario:', user);
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">UID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Nombre Común (CN)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Home Directory</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Grupo (GID)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-tech-text">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-tech-text">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-darkBorder">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-tech-hoverState transition-colors">
                  <td className="px-4 py-3 text-sm text-tech-textDim">{user.uid}</td>
                  <td className="px-4 py-3 text-sm text-tech-text">{user.cn}</td>
                  <td className="px-4 py-3 text-sm text-tech-textDim">{user.homeDir}</td>
                  <td className="px-4 py-3 text-sm text-tech-textDim">
                    {user.group} ({user.gid})
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-status-online/20 text-status-online'
                          : 'bg-tech-textDim/20 text-tech-textDim'
                      }`}
                    >
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
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
              ))}
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
