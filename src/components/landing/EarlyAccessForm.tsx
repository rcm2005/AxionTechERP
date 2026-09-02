import { useState, type FormEvent } from 'react';
import { SUPPORT_EMAIL } from '@/config/app';
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
 * WARNING: endpoint does not exist yet. Submitting opens the user's email client
 * with a pre-filled message (mailto:), instead of faking a POST that swallows
 * the data. Replace with a real POST as soon as there is a backend route.
 */
export function EarlyAccessForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vertical, setVertical] = useState<string>(SEGMENTS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError('Diga como podemos te chamar.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Confira o e-mail — parece incompleto.');
      return;
    }

    const label = SEGMENTS.find((v) => v.value === vertical)?.label ?? vertical;
    const subject = `Acesso antecipado — ${label}`;
    const body = [
      `Nome: ${name.trim()}`,
      `E-mail: ${email.trim()}`,
      `Segmento: ${label}`,
      '',
      'Conte em uma linha como o time trabalha hoje:',
    ].join('\n');

    setError(null);
    setSubmitted(true);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  if (submitted) {
    return (
      <div className={styles.sucesso} role="status">
        <p className={styles.sucessoTitulo}>Abrimos seu e-mail com a mensagem pronta.</p>
        <p className={styles.sucessoTexto}>
          Se nada abriu, escreva direto para{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
            {SUPPORT_EMAIL}
          </a>
          . Respondemos em até um dia útil.
        </p>
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

      <button type="submit" className={styles.submit}>
        Entrar na lista
      </button>

      <p className={styles.nota}>
        Sem cartão, sem compromisso. Usamos seu e-mail só para falar sobre o acesso antecipado.
      </p>
    </form>
  );
}
