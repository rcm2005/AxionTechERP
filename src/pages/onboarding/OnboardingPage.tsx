import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import styles from './OnboardingPage.module.scss';

const CORES_MARCA = [
  { nome: 'Azul', valor: '#3157d5' },
  { nome: 'Verde', valor: '#0e7c5a' },
  { nome: 'Dourado', valor: '#c9a24a' },
  { nome: 'Roxo', valor: '#7c4fd6' },
  { nome: 'Vinho', valor: '#a11d4a' },
  { nome: 'Grafite', valor: '#3a3f4b' },
] as const;

interface FormState {
  nomeEscritorio: string;
  cnpjOuCpf: string;
  corPrimaria: string;
  adminNome: string;
  adminEmail: string;
  adminPassword: string;
}

const ETAPAS = ['Escritório', 'Marca', 'Seu acesso', 'Revisão'] as const;

export function OnboardingPage() {
  useDocumentTitle('Criar meu ERP');
  const { criarEscritorio } = useAuth();
  const navigate = useNavigate();

  const [passo, setPasso] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    nomeEscritorio: '',
    cnpjOuCpf: '',
    corPrimaria: CORES_MARCA[0].valor,
    adminNome: '',
    adminEmail: '',
    adminPassword: '',
  });

  function atualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const podeAvancarPasso0 = form.nomeEscritorio.trim().length > 0 && form.cnpjOuCpf.trim().length >= 11;
  const podeAvancarPasso1 = Boolean(form.corPrimaria);
  const podeAvancarPasso2 =
    form.adminNome.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.adminEmail) &&
    form.adminPassword.length >= 8;

  const podeAvancar = [podeAvancarPasso0, podeAvancarPasso1, podeAvancarPasso2, true][passo];

  function handleAvancar(event: FormEvent) {
    event.preventDefault();
    if (!podeAvancar) return;
    setErro(null);
    if (passo < ETAPAS.length - 1) {
      setPasso((p) => p + 1);
    } else {
      void handleCriar();
    }
  }

  async function handleCriar() {
    setSubmitting(true);
    setErro(null);
    try {
      await criarEscritorio(form);
      navigate(paths.dashboard, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar o escritório.');
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Building2 size={17} />
          </span>
          <span className={styles.brandName}>Axion Tech</span>
        </div>

        <div className={styles.progress} aria-label={`Passo ${passo + 1} de ${ETAPAS.length}`}>
          {ETAPAS.map((etapa, i) => (
            <div key={etapa} className={styles.progressItem}>
              <span
                className={
                  i < passo ? styles.dotDone : i === passo ? styles.dotAtivo : styles.dot
                }
              >
                {i < passo ? <Check size={12} /> : i + 1}
              </span>
              <span className={i === passo ? styles.progressLabelAtivo : styles.progressLabel}>
                {etapa}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleAvancar} noValidate>
          {passo === 0 && (
            <fieldset className={styles.step}>
              <legend className={styles.stepTitle}>Como se chama o seu escritório?</legend>
              <p className={styles.stepSub}>
                É o primeiro passo pra montar o seu ERP jurídico — não precisa saber o que vem
                depois, a gente guia o resto.
              </p>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Nome do escritório<sup>*</sup>
                </span>
                <input
                  autoFocus
                  placeholder="Ex: Silva & Santos Advocacia"
                  value={form.nomeEscritorio}
                  onChange={(e) => atualizar('nomeEscritorio', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  CNPJ ou CPF<sup>*</sup>
                </span>
                <input
                  placeholder="00.000.000/0001-00"
                  value={form.cnpjOuCpf}
                  onChange={(e) => atualizar('cnpjOuCpf', e.target.value)}
                />
              </label>
            </fieldset>
          )}

          {passo === 1 && (
            <fieldset className={styles.step}>
              <legend className={styles.stepTitle}>Escolha a cor da sua marca</legend>
              <p className={styles.stepSub}>
                Isso já aparece no seu ERP a partir de agora — não é decoração, é o seu escritório.
              </p>

              <div className={styles.paleta} role="radiogroup" aria-label="Cor da marca">
                {CORES_MARCA.map((cor) => (
                  <button
                    type="button"
                    key={cor.valor}
                    role="radio"
                    aria-checked={form.corPrimaria === cor.valor}
                    className={styles.swatchBtn}
                    onClick={() => atualizar('corPrimaria', cor.valor)}
                  >
                    <span
                      className={styles.swatch}
                      style={{ background: cor.valor }}
                      data-selecionado={form.corPrimaria === cor.valor}
                    >
                      {form.corPrimaria === cor.valor && <Check size={16} color="#fff" />}
                    </span>
                    <span className={styles.swatchLabel}>{cor.nome}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {passo === 2 && (
            <fieldset className={styles.step}>
              <legend className={styles.stepTitle}>Seus dados de acesso</legend>
              <p className={styles.stepSub}>Você vai ser o administrador deste escritório.</p>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Seu nome<sup>*</sup>
                </span>
                <input
                  autoFocus
                  placeholder="Ex: Dra. Ana Ribeiro"
                  value={form.adminNome}
                  onChange={(e) => atualizar('adminNome', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  E-mail<sup>*</sup>
                </span>
                <input
                  type="email"
                  placeholder="voce@escritorio.com.br"
                  value={form.adminEmail}
                  onChange={(e) => atualizar('adminEmail', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Senha<sup>*</sup>
                </span>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.adminPassword}
                  onChange={(e) => atualizar('adminPassword', e.target.value)}
                />
              </label>
            </fieldset>
          )}

          {passo === 3 && (
            <fieldset className={styles.step}>
              <legend className={styles.stepTitle}>Confere se está tudo certo</legend>
              <p className={styles.stepSub}>É só isso — o resto (processos, prazos, financeiro) já vem pronto.</p>

              <dl className={styles.revisao}>
                <div>
                  <dt>Escritório</dt>
                  <dd>{form.nomeEscritorio}</dd>
                </div>
                <div>
                  <dt>CNPJ/CPF</dt>
                  <dd>{form.cnpjOuCpf}</dd>
                </div>
                <div>
                  <dt>Cor da marca</dt>
                  <dd className={styles.revisaoCor}>
                    <span className={styles.swatchMini} style={{ background: form.corPrimaria }} />
                    {CORES_MARCA.find((c) => c.valor === form.corPrimaria)?.nome}
                  </dd>
                </div>
                <div>
                  <dt>Administrador</dt>
                  <dd>
                    {form.adminNome} · {form.adminEmail}
                  </dd>
                </div>
              </dl>
            </fieldset>
          )}

          {erro && (
            <p className={styles.error} role="alert">
              {erro}
            </p>
          )}

          <div className={styles.nav}>
            {passo > 0 ? (
              <button
                type="button"
                className={styles.btnVoltar}
                onClick={() => setPasso((p) => p - 1)}
                disabled={submitting}
              >
                <ArrowLeft size={15} />
                Voltar
              </button>
            ) : (
              <span />
            )}

            <button type="submit" className={styles.btnAvancar} disabled={!podeAvancar || submitting}>
              {submitting
                ? 'Criando...'
                : passo === ETAPAS.length - 1
                  ? 'Criar meu ERP'
                  : 'Continuar'}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </div>
        </form>

        <p className={styles.footerNota}>
          Já tem uma conta?{' '}
          <Link to={paths.login} className={styles.footerLink}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
