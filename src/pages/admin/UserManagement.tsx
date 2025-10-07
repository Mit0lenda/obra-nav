import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCog, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
};

export default function UserManagement() {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');

  // Buscar perfis de usuários
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });

  // Buscar roles dos usuários
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isAdmin,
  });

  // Adicionar role
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Sucesso',
        description: 'Role adicionada com sucesso',
      });
      setSelectedUserId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar role',
        variant: 'destructive',
      });
    },
  });

  // Remover role
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Sucesso',
        description: 'Role removida com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover role',
        variant: 'destructive',
      });
    },
  });

  const handleAddRole = () => {
    if (!selectedUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione um usuário',
        variant: 'destructive',
      });
      return;
    }
    addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const getUserRoles = (userId: string) => {
    return userRoles?.filter((ur) => ur.user_id === userId) || [];
  };

  const getProfileName = (userId: string) => {
    const profile = profiles?.find((p) => p.id === userId);
    return profile?.display_name || userId.substring(0, 8);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie permissões e roles dos usuários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atribuir Role</CardTitle>
          <CardDescription>Adicione permissões para usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.display_name || profile.id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddRole} disabled={addRoleMutation.isPending}>
              <UserCog className="mr-2 h-4 w-4" />
              Adicionar Role
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões</CardTitle>
          <CardDescription>Lista de todos os usuários e suas roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => {
                const roles = getUserRoles(profile.id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.display_name || profile.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {roles.length === 0 ? (
                          <Badge variant="outline">Nenhuma role</Badge>
                        ) : (
                          roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant={
                                role.role === 'admin'
                                  ? 'default'
                                  : role.role === 'moderator'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {role.role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {roles.map((role) => (
                          <Button
                            key={role.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoleMutation.mutate(role.id)}
                            disabled={removeRoleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
