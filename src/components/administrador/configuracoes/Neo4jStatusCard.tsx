/**
 * Dashboard de Status do Neo4j
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, GitBranch, Clock, RefreshCw, ArrowUpCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface Neo4jStats {
  totalNodes: number;
  totalRelationships: number;
  syncedTriplets: number;
  totalTriplets: number;
  lastSyncTime: string | null;
  isConnected: boolean;
}

const Neo4jStatusCard: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<Neo4jStats>({
    totalNodes: 0,
    totalRelationships: 0,
    syncedTriplets: 0,
    totalTriplets: 0,
    lastSyncTime: null,
    isConnected: false
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const { data: tripletsData, error: tripletsError } = await supabase
        .from('triplet_extractions')
        .select('synced_to_neo4j, synced_at');

      if (tripletsError) throw tripletsError;

      const totalTriplets = tripletsData?.length || 0;
      const syncedTriplets = tripletsData?.filter(t => t.synced_to_neo4j)?.length || 0;
      
      const lastSync = tripletsData
        ?.filter(t => t.synced_at)
        .sort((a, b) => new Date(b.synced_at!).getTime() - new Date(a.synced_at!).getTime())[0];

      try {
        const neo4jResponse = await supabase.functions.invoke('graph-rag-search', {
          body: {
            queryType: 'cypher',
            cypherQuery: 'MATCH (n) RETURN count(n) as nodeCount',
            parameters: {}
          }
        });

        if (!neo4jResponse.error && neo4jResponse.data?.success) {
          const nodeCount = neo4jResponse.data.data?.nodes?.length || 0;
          const relCount = neo4jResponse.data.data?.relationships?.length || 0;
          
          setStats({
            totalNodes: nodeCount,
            totalRelationships: relCount,
            syncedTriplets,
            totalTriplets,
            lastSyncTime: lastSync?.synced_at || null,
            isConnected: true
          });
        } else {
          setStats({
            totalNodes: 0, totalRelationships: 0, syncedTriplets, totalTriplets,
            lastSyncTime: lastSync?.synced_at || null, isConnected: false
          });
        }
      } catch {
        setStats({
          totalNodes: 0, totalRelationships: 0, syncedTriplets, totalTriplets,
          lastSyncTime: lastSync?.synced_at || null, isConnected: false
        });
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('neo4jStatus.loadError'),
        description: error.message || t('neo4jStatus.loadErrorDesc')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('sync-approved-triplets', {
        method: 'POST'
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: `✅ ${t('neo4jStatus.syncStarted')}`,
        description: t('neo4jStatus.syncStartedDesc', { count: response.data?.syncedCount || 0 })
      });

      await loadStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('neo4jStatus.syncError'),
        description: error.message || t('neo4jStatus.syncErrorDesc')
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return t('neo4jStatus.never');
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('neo4jStatus.justNow');
    if (diffMins < 60) return t('neo4jStatus.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('neo4jStatus.hoursAgo', { count: diffHours });
    return t('neo4jStatus.daysAgo', { count: diffDays });
  };

  const syncPercentage = stats.totalTriplets > 0 
    ? Math.round((stats.syncedTriplets / stats.totalTriplets) * 100) 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              {t('neo4jStatus.title')}
            </CardTitle>
            <CardDescription>{t('neo4jStatus.description')}</CardDescription>
          </div>
          <Badge variant={stats.isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            <Activity className={`h-3 w-3 ${stats.isConnected ? 'animate-pulse' : ''}`} />
            {stats.isConnected ? t('neo4jStatus.connected') : t('neo4jStatus.disconnected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background/50 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('neo4jStatus.totalNodes')}</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalNodes.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-background/50 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('neo4jStatus.relations')}</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalRelationships.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 bg-background/50 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('neo4jStatus.syncedTriplets')}</span>
                </div>
                <Badge variant="outline">
                  {stats.syncedTriplets} / {stats.totalTriplets}
                </Badge>
              </div>
              
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncPercentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{t('neo4jStatus.lastSync', { time: formatLastSync(stats.lastSyncTime) })}</span>
                </div>
                <span className="font-medium">{syncPercentage}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={syncNow} disabled={isSyncing || !stats.isConnected} className="flex-1">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('neo4jStatus.syncing')}
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    {t('neo4jStatus.syncNow')}
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={loadStats} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {!stats.isConnected && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ {t('neo4jStatus.notConnectedWarning')}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Neo4jStatusCard;
