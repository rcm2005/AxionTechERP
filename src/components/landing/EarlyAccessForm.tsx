import { useState, type FormEvent } from 'react';
import { SUPPORT_EMAIL } from '@/config/app';
import styles from './EarlyAccessForm.module.scss';

const VERTICAIS = [
  { value: 'advocacia', label: 'Escritório de advocacia' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'agro', label: 'Agronegócio' },
  { value: 'outro', label: 'Outro segmento' },
] as const;

// Checagem deliberadamente frouxa: só evita erro de digitação óbvio. A validação
// que importa acontece quando existir backend — ver "Limitações" no README.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Formulário de acesso antecipado.
 *
 * ATENÇÃO: ainda não existe endpoint. O envio abre o cliente de e-mail do
 * usuário com a mensagem pré-preenchida (mailto:), em vez de fingir um POST que
 * some com os dados. Trocar por um POST real assim que houver rota no backend.
 */
export function EarlyAccessForm() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [vertical, setVertical] = useState<string>(VERTICAIS[0].value);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (nome.trim().length < 2) {
      setErro('Diga como podemos te chamar.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErro('Confira o e-mail — parece incompleto.');
      return;
    }

    const label = VERTICAIS.find((v) => v.value === vertical)?.label ?? vertical;
    const assunto = `Acesso antecipado — ${label}`;
    const corpo = [
      `Nome: ${nome.trim()}`,
      `E-mail: ${email.trim()}`,
      `Segmento: ${label}`,
      '',
      'Conte em uma linha como o time trabalha hoje:',
    ].join('\n');

    setErro(null);
    setEnviado(true);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      assunto,
    )}&body=${encodeURIComponent(corpo)}`;
  }

  if (enviado) {
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
            value={nome}
            onChange={(e) => setNome(e.target.value)}
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
          {VERTICAIS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </label>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
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
