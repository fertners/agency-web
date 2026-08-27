'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = Readonly<{ id: number; message: string; kind: ToastKind }>;
type ToastContextValue = Readonly<{
  notify: (message: string, kind?: ToastKind) => void;
}>;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      kind === 'error' ? 7000 : 4000,
    );
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex w-[min(92vw,380px)] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <button
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-lg ${toast.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : toast.kind === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
            key={toast.id}
            onClick={() =>
              setToasts((current) =>
                current.filter((item) => item.id !== toast.id),
              )
            }
            type="button"
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (value === null)
    throw new Error('useToast must be used inside ToastProvider');
  return value;
}
