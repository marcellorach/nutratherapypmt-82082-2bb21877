import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { usePendingAccessCount } from '@/hooks/useAccessRequests';

const PendingAccessBadge: React.FC = () => {
  const count = usePendingAccessCount();
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/administrador?tab=access-requests">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('header.pendingRequestsCount', { count })}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PendingAccessBadge;
