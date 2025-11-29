import type  { LDAPUser } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface UserTableProps {
  users: LDAPUser[];
}

export function UserTable({ users }: UserTableProps) {
  const [newUserName, setNewUserName] = useState('');

  const handleCreateUser = () => {
    // TODO: Implementar creación de usuario LDAP
    console.log('Crear usuario:', newUserName);
    setNewUserName('');
  };

  return (
    <Card className="bg-tech-darkCard border-tech-darkBorder">
      <CardHeader>
        <CardTitle className="text-tech-text">Directorio Activo (OpenLDAP)</CardTitle>
        <CardDescription>
          Gestión de usuarios del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario crear usuario */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Nuevo Alumno (CN)"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="bg-tech-hoverState border-tech-darkBorder text-tech-text"
          />
          <Button
            onClick={handleCreateUser}
            disabled={!newUserName}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
