import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  /** Fração do elemento que precisa estar visível para disparar (0–1). */
  threshold?: number;
  /** Margem aplicada à viewport, no formato do IntersectionObserver. */
  rootMargin?: string;
}

/**
 * Observa um elemento e retorna `true` a partir do momento em que ele entra na
 * viewport — uma única vez (o observer se desconecta em seguida, para não
 * custar nada durante o resto do scroll).
 *
 * Degrada para `true` imediatamente quando não há IntersectionObserver
 * (SSR/browsers antigos) ou quando o usuário pediu menos movimento, de forma
 * que o conteúdo nunca fique preso invisível.
 */
/**
 * Decide, já no primeiro render, se a animação deve ser pulada por completo —
 * assim o conteúdo nasce visível em vez de aparecer via setState num efeito.
 */
function devePularAnimacao(): boolean {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return true;
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
}: UseRevealOptions = {}) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(devePularAnimacao);

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, revealed]);

  return { ref, revealed };
}
