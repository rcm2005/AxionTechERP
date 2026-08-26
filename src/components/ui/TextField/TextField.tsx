import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './TextField.module.scss';

/* ---- TextInput ---- */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} {...props} />;
}

/* ---- TextSelect ---- */
export function TextSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select className={styles.input} {...props}>
      {children}
    </select>
  );
}

/* ---- TextArea ---- */
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={styles.textarea} rows={3} {...props} />;
}
