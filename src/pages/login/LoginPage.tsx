import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME, SUPPORT_EMAIL } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import { DecorativeDots } from './DecorativeDots';
import { ScaleIcon } from './ScaleIcon';
import styles from './LoginPage.module.scss';

interface LocationState {
  from?: Location;
}

export function LoginPage() {
  useDocumentTitle('Entrar');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const state = location.state as LocationState | null;
      const destination = state?.from?.pathname ?? paths.comecarProjetos;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.stage}>
        <DecorativeDots />

        <div className={styles.scaleWrap}>
          <ScaleIcon />
        </div>

        <div className={styles.stageCopy}>
          <p className={styles.eyebrow}>
            {COMPANY_NAME} · SISTEMA JURÍDICO
          </p>
          <h1>
            Equilíbrio
            <br />
            em cada
            <br />
            <em>processo.</em>
          </h1>
          <p className={styles.stageSub}>
            Clientes, prazos, agenda e financeiro do seu escritório, organizados em um único lugar.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>⚖</span>
            <div className={styles.brandText}>
              <span>{APP_NAME}</span>
              <small>{APP_TAGLINE}</small>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <p className={styles.formEyebrow}>Acesso ao sistema</p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                E-mail<sup>*</sup>
              </span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="nome@escritorio.com.br"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                Senha<sup>*</sup>
              </span>
              <div className={styles.passWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eye}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>
            </label>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={styles.btnEnter} disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>

            <p className={styles.forgot}>
              Esqueceu a senha? Fale com o administrador do seu escritório ou escreva para{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </form>

          <div className={styles.support}>
            <p>Ainda não tem um escritório cadastrado?</p>
            <Link to={paths.comecar}>Criar meu ERP</Link>
          </div>

          <div className={styles.support}>
            <p>Precisa de ajuda para acessar? Fale com o suporte.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
