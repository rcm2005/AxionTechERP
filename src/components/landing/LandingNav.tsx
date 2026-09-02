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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Only reads scrollY (never layout), so it doesn't force reflow on every event.
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Locks background scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

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
          aria-expanded={menuOpen}
          aria-controls="landing-menu-mobile"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={clsx(styles.burgerBar, menuOpen && styles.burgerBarTop)} />
          <span className={clsx(styles.burgerBar, menuOpen && styles.burgerBarBottom)} />
        </button>
      </div>

      {menuOpen && (
        <div id="landing-menu-mobile" className={styles.mobileMenu}>
          {SECTIONS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a href="#acesso" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
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
