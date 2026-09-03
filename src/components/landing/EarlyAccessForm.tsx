import { useState, type FormEvent } from 'react';
import { SUPPORT_EMAIL } from '@/config/app';
import { submitEarlyAccess } from '@/services/early-access.service';
import styles from './EarlyAccessForm.module.scss';

const SEGMENTS = [
  { value: 'advocacia', label: 'Escritório de advocacia' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'agro', label: 'Agronegócio' },
  { value: 'outro', label: 'Outro segmento' },
] as const;

// Deliberately loose check: only prevents obvious typos. The validation
// that matters happens once a backend exists — see "Limitations" in the README.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Early access form.
 *
 * Persists lead via POST /api/early-access first; falls back to mailto: if
 * the backend or network is unavailable so the lead is not lost.
 */
export function EarlyAccessForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vertical, setVertical] = useState<string>(SEGMENTS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError('Diga como podemos te chamar.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Confira o e-mail — parece incompleto.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitEarlyAccess({ name: name.trim(), email: email.trim(), vertical });
      setSubmitted(true);
    } catch {
      // Real capture failed (network/server fora do ar) — cai pro mailto: como plano B, pra não
      // perder o lead por completo.
      const label = SEGMENTS.find((v) => v.value === vertical)?.label ?? vertical;
      const subject = `Acesso antecipado — ${label}`;
      const body = [
        `Nome: ${name.trim()}`,
        `E-mail: ${email.trim()}`,
        `Segmento: ${label}`,
        '',
        'Conte em uma linha como o time trabalha hoje:',
      ].join('\n');
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      setUsedFallback(true);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.sucesso} role="status">
        {usedFallback ? (
          <>
            <p className={styles.sucessoTitulo}>Abrimos seu e-mail com a mensagem pronta.</p>
            <p className={styles.sucessoTexto}>
              Se nada abriu, escreva direto para{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
                {SUPPORT_EMAIL}
              </a>
              . Respondemos em até um dia útil.
            </p>
          </>
        ) : (
          <>
            <p className={styles.sucessoTitulo}>Recebemos seu interesse!</p>
            <p className={styles.sucessoTexto}>
              Entraremos em contato pelo e-mail informado. Respondemos em até um dia útil.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.linha}>
        <label className={styles.campo}>
          <span className={styles.label}>Nome</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Como podemos te chamar"
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.label}>E-mail</span>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="voce@escritorio.com.br"
          />
        </label>
      </div>

      <label className={styles.campo}>
        <span className={styles.label}>Segmento</span>
        <select
          className={styles.input}
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
        >
          {SEGMENTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className={styles.erro} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Enviando...' : 'Entrar na lista'}
      </button>

      <p className={styles.nota}>
        Sem cartão, sem compromisso. Usamos seu e-mail só para falar sobre o acesso antecipado.
      </p>
    </form>
  );
}
