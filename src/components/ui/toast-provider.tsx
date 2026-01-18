import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getIcon = (variant: Toast['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (variant: Toast['variant']): 'success' | 'destructive' | 'warning' | 'info' | 'primary' => {
    if (variant === 'error') return 'destructive';
    return variant;
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-0 right-0 z-[100] flex flex-col gap-2 p-4 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto"
            >
              <Alert
                variant={getVariant(toast.variant)}
                appearance="solid"
                close={true}
                onClose={() => removeToast(toast.id)}
                className="shadow-lg"
              >
                <AlertIcon>{getIcon(toast.variant)}</AlertIcon>
                <AlertTitle>
                  {toast.message}
                  {toast.description && (
                    <p className="text-sm opacity-90 mt-1 font-normal">{toast.description}</p>
                  )}
                </AlertTitle>
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    toast: {
      success: (message: string, options?: { description?: string; duration?: number }) => {
        context.addToast({ variant: 'success', message, ...options });
      },
      error: (message: string, options?: { description?: string; duration?: number }) => {
        context.addToast({ variant: 'error', message, ...options });
      },
      info: (message: string, options?: { description?: string; duration?: number }) => {
        context.addToast({ variant: 'info', message, ...options });
      },
      warning: (message: string, options?: { description?: string; duration?: number }) => {
        context.addToast({ variant: 'warning', message, ...options });
      },
    },
  };
}
