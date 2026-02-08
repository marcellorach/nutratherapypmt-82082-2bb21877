import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export const useAccessRequests = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const isAdmin = hasRole('admin');

  const fetchRequests = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as AccessRequest[]);
      setPendingCount((data || []).filter((r: any) => r.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase.rpc('count_pending_access_requests');
      if (error) throw error;
      setPendingCount(data || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_access_request', {
        request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: t('auth.accessRequests.approvedSuccess'),
        variant: 'default',
      });
      
      await fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: t('auth.accessRequests.errorApproving'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('auth.accessRequests.rejectedSuccess'),
        variant: 'default',
      });
      
      await fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: t('auth.accessRequests.errorRejecting'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('access-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'access_requests',
          },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  return {
    requests,
    pendingCount,
    loading,
    approveRequest,
    rejectRequest,
    fetchRequests,
    fetchPendingCount,
  };
};

export const usePendingAccessCount = () => {
  const [count, setCount] = useState(0);
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCount = async () => {
      try {
        const { data, error } = await supabase.rpc('count_pending_access_requests');
        if (error) throw error;
        setCount(data || 0);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchCount();

    const channel = supabase
      .channel('pending-access-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return count;
};
