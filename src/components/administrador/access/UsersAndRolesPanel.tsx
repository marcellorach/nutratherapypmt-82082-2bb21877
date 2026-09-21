import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, Eye, ShieldCheck, UserMinus, KeyRound, Users, LayoutGrid } from 'lucide-react';
import TabAccessPanel from './TabAccessPanel';
import PlatformUsersPanel from './PlatformUsersPanel';
import AccessRequestsPanel from './AccessRequestsPanel';
import RoleViewEditor from '@/components/administrador/priorizacoes/RoleViewEditor';
import PermissionsMatrixPanel from './PermissionsMatrixPanel';
import UserOverridesPanel from './UserOverridesPanel';
import MyPermissionsPanel from './MyPermissionsPanel';

const UsersAndRolesPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          {t('admin.usersAndRoles.title')}
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          {t('admin.usersAndRoles.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            {t('admin.permissions.users.tab')}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCog className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.requests', 'Solicitações de acesso')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.roles', 'Perfis de visualização')}
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.matrix')}
          </TabsTrigger>
          <TabsTrigger value="tab-access" className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.tabAccess')}
          </TabsTrigger>
          <TabsTrigger value="overrides" className="flex items-center gap-2">
            <UserMinus className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.overrides')}
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5" />
            {t('admin.usersAndRoles.tabs.mine')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <PlatformUsersPanel />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <AccessRequestsPanel />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RoleViewEditor />
        </TabsContent>
        <TabsContent value="matrix" className="mt-4">
          <PermissionsMatrixPanel />
        </TabsContent>
        <TabsContent value="tab-access" className="mt-4">
          <TabAccessPanel />
        </TabsContent>
        <TabsContent value="overrides" className="mt-4">
          <UserOverridesPanel />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <MyPermissionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersAndRolesPanel;