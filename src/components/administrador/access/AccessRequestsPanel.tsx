import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, Loader2, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAccessRequests, AccessRequest } from '@/hooks/useAccessRequests';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';

const AccessRequestsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { requests, pendingCount, loading, approveRequest, rejectRequest } = useAccessRequests();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const locale = i18n.language === 'pt' ? ptBR : enUS;

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    await approveRequest(id);
    setApprovingId(null);
  };

  const handleReject = async () => {
    if (!rejectDialog.requestId) return;
    await rejectRequest(rejectDialog.requestId, rejectReason);
    setRejectDialog({ open: false, requestId: null });
    setRejectReason('');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const renderRequestCard = (request: AccessRequest, showActions: boolean) => (
    <Card key={request.id} className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                {request.full_name
                  ? request.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : request.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{request.full_name || request.email}</p>
              <p className="text-xs text-muted-foreground">{request.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('auth.accessRequests.requestedAgo', {
                  time: formatDistanceToNow(new Date(request.requested_at), { locale, addSuffix: true }),
                })}
              </p>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => handleApprove(request.id)}
                disabled={approvingId === request.id}
              >
                {approvingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {t('auth.accessRequests.approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
                onClick={() => setRejectDialog({ open: true, requestId: request.id })}
              >
                <X className="h-4 w-4 mr-1" />
                {t('auth.accessRequests.reject')}
              </Button>
            </div>
          )}

          {!showActions && request.status === 'approved' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('auth.accessRequests.approved')}
            </Badge>
          )}

          {!showActions && request.status === 'rejected' && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              {t('auth.accessRequests.rejected')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            {t('auth.accessRequests.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('auth.accessRequests.description')}</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {pendingCount} {t('auth.accessRequests.pending').toLowerCase()}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {t('auth.accessRequests.pending')}
            {pendingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            {t('auth.accessRequests.approved')}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            {t('auth.accessRequests.rejected')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t('auth.accessRequests.noRequests')}
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(r => renderRequestCard(r, true))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t('auth.accessRequests.noRequests')}
              </CardContent>
            </Card>
          ) : (
            approvedRequests.map(r => renderRequestCard(r, false))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 mt-4">
          {rejectedRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t('auth.accessRequests.noRequests')}
              </CardContent>
            </Card>
          ) : (
            rejectedRequests.map(r => renderRequestCard(r, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectDialog({ open: false, requestId: null });
          setRejectReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('auth.accessRequests.reject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={t('auth.accessRequests.rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, requestId: null });
                setRejectReason('');
              }}
            >
              {t('auth.accessRequests.cancelReject')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
            >
              {t('auth.accessRequests.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessRequestsPanel;
