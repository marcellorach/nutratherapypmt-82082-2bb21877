
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface MigratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMigrating: boolean;
  migrationResult: any;
  onStartMigration: () => void;
}

const MigratorDialog: React.FC<MigratorDialogProps> = ({
  open,
  onOpenChange,
  isMigrating,
  migrationResult,
  onStartMigration
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Migração de Dados</DialogTitle>
          <DialogDescription>
            Esta operação irá migrar os dados dos arquivos estáticos para o banco de dados Supabase.
            Isso inclui todos os nutracêuticos, suas categorias, condições e relacionamentos.
          </DialogDescription>
        </DialogHeader>
        
        {migrationResult && (
          <div className={`p-3 rounded-md ${migrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="text-sm">{migrationResult.message}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMigrating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onStartMigration}
            disabled={isMigrating}
          >
            {isMigrating ? 'Migrando...' : 'Iniciar Migração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MigratorDialog;
