import { useMemo } from 'react';
import styles from './DecorativeDots.module.scss';

type MarkKind = 'dot' | 'plus' | 'square';

interface Mark {
  id: number;
  kind: MarkKind;
  top: number;
  left: number;
  size: number;
  opacity: number;
}

const KINDS: MarkKind[] = ['dot', 'dot', 'dot', 'dot', 'plus', 'dot', 'dot', 'square'];
const COUNT = 46;

function buildMarks(): Mark[] {
  return Array.from({ length: COUNT }, (_, id) => {
    const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
    const size = kind === 'dot' ? Math.random() * 2.4 + 1.4 : Math.random() * 7 + 7;
    return {
      id,
      kind,
      top: Math.random() * 100,
      left: Math.random() * 38,
      size,
      opacity: Math.random() * 0.45 + 0.15,
    };
  });
}

export function DecorativeDots() {
  const marks = useMemo(() => buildMarks(), []);

  return (
    <div className={styles.root} aria-hidden="true">
      {marks.map((mark) => {
        const style = { top: `${mark.top}%`, left: `${mark.left}%`, opacity: mark.opacity };

        if (mark.kind === 'plus') {
          return (
            <span key={mark.id} className={styles.plus} style={{ ...style, fontSize: mark.size }}>
              +
            </span>
          );
        }
        if (mark.kind === 'square') {
          return (
            <span
              key={mark.id}
              className={styles.square}
              style={{ ...style, width: mark.size * 0.5, height: mark.size * 0.5 }}
            />
          );
        }
        return (
          <span
            key={mark.id}
            className={styles.dot}
            style={{ ...style, width: mark.size, height: mark.size }}
          />
        );
      })}
    </div>
  );
}
