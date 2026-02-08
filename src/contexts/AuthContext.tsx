
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  userRoles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: 'admin' | 'veterinarian' | 'tutor') => boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
            fetchUserRoles(currentSession.user.id);
            
            // Handle post-OAuth domain-based access
            if (event === 'SIGNED_IN') {
              handlePostAuthAccess(currentSession.user);
            }
          }, 0);
        } else {
          setUserProfile(null);
          setUserRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
        fetchUserRoles(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostAuthAccess = async (authUser: User) => {
    const email = authUser.email || '';
    const provider = authUser.app_metadata?.provider;
    
    // Only handle Google OAuth logins (not password-based)
    if (provider !== 'google') return;

    // Check if user already has roles (existing user)
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    if (existingRoles && existingRoles.length > 0) {
      // User already has roles, let them through
      return;
    }

    // @stanford.edu - auto-approve
    if (email.endsWith('@stanford.edu')) {
      await ensureUserProfile(authUser);
      await ensureUserRole(authUser.id, 'user');
      return;
    }

    // @gmail.com or other - check/create access request
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('status')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (existingRequest?.status === 'approved') {
      await ensureUserProfile(authUser);
      await ensureUserRole(authUser.id, 'user');
      return;
    } else if (existingRequest?.status === 'pending') {
      navigate('/access-pending');
      return;
    } else if (existingRequest?.status === 'rejected') {
      navigate('/access-rejected');
      return;
    }

    // No existing request - create one
    await supabase.from('access_requests').insert({
      user_id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    });

    navigate('/access-pending');
  };

  const ensureUserProfile = async (authUser: User) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('profiles').insert({
        user_id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
      });
    }
  };

  const ensureUserRole = async (userId: string, role: string) => {
    await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      setUserRoles(data.map(item => item.role));
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Login realizado com sucesso!',
        variant: 'default',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        toast({
          title: 'Erro ao realizar cadastro',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Verifique seu e-mail para confirmar sua conta.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao realizar cadastro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: 'Desconectado com sucesso',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const hasRole = (role: 'admin' | 'veterinarian' | 'tutor') => {
    return userRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        userRoles,
        loading,
        signIn,
        signUp,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};
