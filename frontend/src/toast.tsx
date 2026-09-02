import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{ showToast: (message: string, kind?: ToastKind) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  };

  const value = useMemo(() => ({ showToast }), []);
  const style = {
    success: { Icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: 'text-emerald-600' },
    error: { Icon: CircleAlert, classes: 'border-rose-200 bg-rose-50 text-rose-900', icon: 'text-rose-600' },
    info: { Icon: Info, classes: 'border-sky-200 bg-sky-50 text-sky-900', icon: 'text-sky-600' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => {
          const { Icon, classes, icon } = style[toast.kind];
          return (
            <div key={toast.id} className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-lg ${classes}`}>
              <Icon size={20} className={`mt-0.5 shrink-0 ${icon}`} />
              <p className="flex-1 leading-5">{toast.message}</p>
              <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded p-0.5 opacity-60 hover:opacity-100" aria-label="Close notification">
                <X size={17} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
