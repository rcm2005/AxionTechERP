import type { ElementType, ReactNode } from 'react';
import clsx from 'clsx';
import { useReveal } from '@/hooks/useReveal';
import styles from './Reveal.module.scss';

interface RevealProps {
  children: ReactNode;
  /** Atraso em ms — usado para escalonar itens de uma mesma lista. */
  delay?: number;
  /** Tag renderizada (padrão `div`); use `li`, `section` etc. quando fizer sentido semanticamente. */
  as?: ElementType;
  className?: string;
}

/**
 * Wrapper de entrada: aplica fade + deslocamento sutil quando o elemento entra
 * na viewport. Todo o movimento é CSS — o JS só alterna uma classe.
 * Quem prefere menos movimento recebe o conteúdo já revelado (ver useReveal e
 * a media query em Reveal.module.scss).
 */
export function Reveal({ children, delay = 0, as: Tag = 'div', className }: RevealProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={clsx(styles.reveal, revealed && styles.revealed, className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
