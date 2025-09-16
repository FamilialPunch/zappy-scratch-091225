'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (message: string, options?: { type?: ToastType; duration?: number }) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, options?: { type?: ToastType; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: ToastItem = {
        id,
        message,
        type: options?.type ?? 'info',
        duration: options?.duration ?? 4000,
      };
      setToasts((prev) => [...prev, toast]);
      const timeoutId = window.setTimeout(() => dismiss(id), toast.duration);
      timersRef.current.set(id, timeoutId);
      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string, duration?: number) => show(message, { type: 'success', duration }), [show]);
  const error = useCallback((message: string, duration?: number) => show(message, { type: 'error', duration }), [show]);
  const info = useCallback((message: string, duration?: number) => show(message, { type: 'info', duration }), [show]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, success, error, info, dismiss }),
    [toasts, show, success, error, info, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
