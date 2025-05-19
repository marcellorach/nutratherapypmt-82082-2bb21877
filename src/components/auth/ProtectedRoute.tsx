
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'veterinarian' | 'tutor';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    // Componente de carregamento enquanto verifica autenticação
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se um papel específico é requerido, verifica se o usuário o possui
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
