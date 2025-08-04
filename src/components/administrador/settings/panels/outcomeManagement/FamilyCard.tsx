import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { OutcomeFamily } from '@/services/outcome-families-service';

interface FamilyCardProps {
  family: OutcomeFamily;
  outcomesCount: number;
  onEdit: (family: OutcomeFamily) => void;
  onDelete: (family: OutcomeFamily) => void;
}

const FamilyCard: React.FC<FamilyCardProps> = ({
  family,
  outcomesCount,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{family.icon}</span>
            <div>
              <CardTitle className="text-lg">{family.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {outcomesCount} outcome{outcomesCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(family)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(family)}
              disabled={outcomesCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {family.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{family.description}</p>
        </CardContent>
      )}
    </Card>
  );
};

export default FamilyCard;