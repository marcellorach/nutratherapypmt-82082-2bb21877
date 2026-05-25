import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_ROLE_VIEW, ROLE_VIEWS, RoleViewConfig, RoleViewId, getRoleView } from '@/config/role-views';

const STORAGE_KEY = 'senex-role-view';

interface RoleViewContextValue {
  view: RoleViewConfig;
  viewId: RoleViewId;
  setViewId: (id: RoleViewId) => void;
  availableViews: RoleViewConfig[];
}

const RoleViewContext = createContext<RoleViewContextValue | undefined>(undefined);

const isValidId = (v: string | null): v is RoleViewId =>
  !!v && ROLE_VIEWS.some((rv) => rv.id === v);

export const RoleViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewId, setViewIdState] = useState<RoleViewId>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROLE_VIEW;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidId(stored) ? stored : DEFAULT_ROLE_VIEW;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, viewId);
    }
  }, [viewId]);

  const value = useMemo<RoleViewContextValue>(
    () => ({
      viewId,
      view: getRoleView(viewId),
      setViewId: setViewIdState,
      availableViews: ROLE_VIEWS,
    }),
    [viewId],
  );

  return <RoleViewContext.Provider value={value}>{children}</RoleViewContext.Provider>;
};

export const useRoleView = (): RoleViewContextValue => {
  const ctx = useContext(RoleViewContext);
  if (!ctx) throw new Error('useRoleView must be used within RoleViewProvider');
  return ctx;
};