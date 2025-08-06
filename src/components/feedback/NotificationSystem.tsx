import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Provider
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.persistent ? undefined : 5000)
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto remove if not persistent
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ 
  notification, 
  onClose 
}) => {
  const configs = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-success-subtle border-success',
      iconColor: 'text-success'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-destructive-subtle border-destructive',
      iconColor: 'text-destructive'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning-subtle border-warning',
      iconColor: 'text-warning'
    },
    info: {
      icon: Info,
      bgColor: 'bg-info-subtle border-info',
      iconColor: 'text-info'
    }
  };

  const config = configs[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm",
        "bg-card/95 border-border",
        config.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
          )}
          
          {notification.actions && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    action.variant === 'destructive'
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/80"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onClose(notification.id)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// Container
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper hooks
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const notifySuccess = useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string) => {
    addNotification({ type: 'error', title, message, duration: 7000 });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message });
  }, [addNotification]);

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    addNotification
  };
};