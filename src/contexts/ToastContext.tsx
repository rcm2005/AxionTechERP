import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import styles from './ToastContext.module.scss';

interface ToastState {
  id: number;
  message: string;
}

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const show = useCallback((message: string) => {
    window.clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), message });
    timeoutRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className={styles.toast} data-show={toast ? 'true' : 'false'} role="status" aria-live="polite">
        {toast?.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
