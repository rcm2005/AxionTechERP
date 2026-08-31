import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { paths } from '@/routes/paths';
import styles from './LandingNav.module.scss';

const SECTIONS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#produto', label: 'O produto' },
  { href: '#verticais', label: 'Verticais' },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    // Só lê scrollY (nunca layout), então não força reflow a cada evento.
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Trava o scroll do fundo enquanto o menu mobile está aberto.
  useEffect(() => {
    if (!menuAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [menuAberto]);

  return (
    <header className={clsx(styles.header, scrolled && styles.scrolled)}>
      <div className={styles.inner}>
        <a href="#topo" className={styles.brand} aria-label="Axion Tech — início">
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.brandName}>
            Axion<span className={styles.brandDim}>&nbsp;Tech</span>
          </span>
        </a>

        <nav className={styles.links} aria-label="Seções da página">
          {SECTIONS.map((item) => (
            <a key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to={paths.login} className={styles.ghost}>
            Entrar
          </Link>
          <a href="#acesso" className={styles.cta}>
            Acesso antecipado
          </a>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={menuAberto}
          aria-controls="landing-menu-mobile"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span className={clsx(styles.burgerBar, menuAberto && styles.burgerBarTop)} />
          <span className={clsx(styles.burgerBar, menuAberto && styles.burgerBarBottom)} />
        </button>
      </div>

      {menuAberto && (
        <div id="landing-menu-mobile" className={styles.mobileMenu}>
          {SECTIONS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setMenuAberto(false)}
            >
              {item.label}
            </a>
          ))}
          <a href="#acesso" className={styles.mobileCta} onClick={() => setMenuAberto(false)}>
            Acesso antecipado
          </a>
          <Link to={paths.login} className={styles.mobileLink}>
            Entrar
          </Link>
        </div>
      )}
    </header>
  );
}
