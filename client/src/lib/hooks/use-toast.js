"use client";

import { useState, useEffect } from 'react';

/**
 * Hook for displaying toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    // Auto-dismiss toasts after their duration
    const timeouts = toasts.map(toast => {
      if (!toast.persistent) {
        return setTimeout(() => {
          removeToast(toast.id);
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
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const updateToast = (id, toast) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, ...toast } : t)));
  };
  
  return {
    toasts,
    toast: addToast,
    removeToast,
    updateToast,
  };
}