import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Neo4jSyncButtonProps {
  studyId?: string;
  onSyncComplete?: (result: any) => void;
}

const Neo4jSyncButton: React.FC<Neo4jSyncButtonProps> = ({ studyId, onSyncComplete }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setLastResult(null);

    try {
      console.log('🔄 [NEO4J SYNC] Starting manual sync...', studyId ? `for study ${studyId}` : 'for all pending triplets');
      
      const { data, error } = await supabase.functions.invoke('sync-study-to-neo4j', {
        body: studyId ? { studyId } : { syncAll: true }
      });

      console.log('🔄 [NEO4J SYNC] Response:', JSON.stringify(data, null, 2));

      if (error) {
        throw error;
      }

      setLastResult(data);
      
      const syncedCount = data?.synced || 0;
      const errors = data?.errors || [];
      
      if (syncedCount > 0) {
        toast({
          title: t('common.success', 'Success'),
          description: `${syncedCount} triplets synchronized to Neo4j`,
        });
      } else if (errors.length > 0) {
        toast({
          title: 'Partial Sync',
          description: `${errors.length} errors occurred during sync`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No Changes',
          description: 'No triplets to synchronize (all already synced or none approved)',
        });
      }

      onSyncComplete?.(data);
    } catch (error: any) {
      console.error('🔄 [NEO4J SYNC] Error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || 'Failed to sync with Neo4j',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className="gap-2"
      >
        {syncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        {syncing ? 'Syncing...' : 'Sync to Neo4j'}
      </Button>
      
      {lastResult && (
        <div className="flex items-center gap-1">
          {lastResult.synced > 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="text-xs">
                {lastResult.synced} synced
              </Badge>
            </>
          ) : lastResult.errors?.length > 0 ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                {lastResult.errors.length} errors
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="text-xs">
              No changes
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default Neo4jSyncButton;
