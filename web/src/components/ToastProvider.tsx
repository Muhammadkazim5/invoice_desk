import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from '../hooks/useToast';

interface ToastMessage {
  id: number;
  text: string;
  variant: 'success' | 'error';
}

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeouts = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (text: string, variant: 'success' | 'error' = 'success') => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, text, variant }]);
      const timeout = setTimeout(() => dismiss(id), 4000);
      timeouts.current.set(id, timeout);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <span>{toast.text}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
