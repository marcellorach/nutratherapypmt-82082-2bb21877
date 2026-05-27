import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, Eye } from 'lucide-react';
import AccessRequestsPanel from './AccessRequestsPanel';
import RoleViewEditor from '@/components/administrador/priorizacoes/RoleViewEditor';

const UsersAndRolesPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          {t('admin.usersAndRoles.title', 'Usuários & Perfis')}
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          {t(
            'admin.usersAndRoles.subtitle',
            'Aprovação de acesso à plataforma e configuração dos perfis de visualização (camada declarativa que filtra a sidebar — não é segurança).',
          )}
        </p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCog className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.requests', 'Solicitações de acesso')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.roles', 'Perfis de visualização')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <AccessRequestsPanel />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RoleViewEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersAndRolesPanel;