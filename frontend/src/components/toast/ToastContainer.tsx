'use client';

import React from 'react';
import { useToastContext } from './ToastProvider';

export default function ToastContainer() {
  const { toasts, dismiss } = useToastContext();

  return (
    <div className="fixed z-[1000] top-4 right-4 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`rounded-lg border shadow-sm px-3 py-2 text-sm flex items-start justify-between gap-3 animate-[fadeIn_150ms_ease-out] ${
            t.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <span className="leading-5">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      ))}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
