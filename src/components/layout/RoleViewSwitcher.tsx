import React from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoleView } from '@/contexts/RoleViewContext';
import { RoleViewId } from '@/config/role-views';

/**
 * Seletor "Visualizar como…" — só aparece para admin real.
 * NÃO é segurança — é redução de ruído. Ver src/config/role-views.ts.
 */
const RoleViewSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { view, viewId, setViewId, availableViews } = useRoleView();
  const navigate = useNavigate();
  const isPt = i18n.language?.startsWith('pt');

  const handleChange = (next: string) => {
    const id = next as RoleViewId;
    setViewId(id);
    const target = availableViews.find((v) => v.id === id);
    if (target?.defaultRoute) navigate(target.defaultRoute);
  };

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-gray-500" />
      <Select value={viewId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-[210px] text-xs" aria-label={isPt ? 'Visualizar como' : 'View as'}>
          <SelectValue>
            <span className="text-xs">
              {isPt ? 'Ver como: ' : 'View as: '}
              <span className="font-medium">{isPt ? view.label_pt : view.label_en}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableViews.map((v) => (
            <SelectItem key={v.id} value={v.id} className="text-xs">
              <div className="flex flex-col">
                <span className="font-medium">{isPt ? v.label_pt : v.label_en}</span>
                <span className="text-[10px] text-gray-500">
                  {isPt ? v.description_pt : v.description_en}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleViewSwitcher;