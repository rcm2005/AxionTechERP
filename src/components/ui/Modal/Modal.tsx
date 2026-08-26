import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button/Button';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Largura customizada, ex: '560px'. Default: 480px */
  width?: string;
  children: ReactNode;
  /** Rodapé do modal — se omitido, renderiza botões padrão via footerActions */
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, width, children, footer }: ModalProps) {
  // Fechar com Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Travar scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={clsx(styles.panel)} style={width ? { width } : undefined}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Fechar"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer !== undefined && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- ModalField helper ---------- */
interface ModalFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function ModalField({ label, required, error, children }: ModalFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

/* ---------- ModalFooter helper ---------- */
interface ModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  loading?: boolean;
}

export function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = 'Salvar',
  loading,
}: ModalFooterProps) {
  return (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onCancel} type="button">
        Cancelar
      </Button>
      <Button variant="primary" onClick={onConfirm} type="button" disabled={loading}>
        {loading ? 'Salvando…' : confirmLabel}
      </Button>
    </div>
  );
}
