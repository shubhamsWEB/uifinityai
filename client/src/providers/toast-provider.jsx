"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    return () => setMounted(false);
  }, []);
  
  useEffect(() => {
    // Auto-dismiss toasts after their duration
    const timeouts = toasts.map(toast => {
      if (!toast.persistent) {
        return setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration);
      }
      return null;
    });
    
    // Clean up timeouts
    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [toasts]);
  
  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      title: toast.title || 'Notification',
      description: toast.description,
      variant: toast.variant || 'default',
      duration: toast.duration || 5000,
      persistent: toast.persistent || false,
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };
  
  const dismissToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const updateToast = (id, toast) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, ...toast } : t)));
  };
  
  const getToastIcon = (variant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const ToastContainer = () => {
    if (!mounted) return null;
    
    return createPortal(
      <div className="fixed top-0 right-0 p-4 m-4 z-50 flex flex-col items-end space-y-4 max-w-md">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-start gap-3 ${
                toast.variant === 'destructive' ? 'border-red-200 bg-red-50' : 
                toast.variant === 'success' ? 'border-green-200 bg-green-50' : ''
              }`}
            >
              {getToastIcon(toast.variant)}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{toast.title}</h3>
                <p className="text-sm text-gray-700">{toast.description}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>,
      document.body
    );
  };
  
  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        dismissToast,
        updateToast
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};