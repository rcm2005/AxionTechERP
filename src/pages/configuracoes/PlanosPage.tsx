import { useNavigate } from 'react-router';
import clsx from 'clsx';
import {
  Users,
  FolderKanban,
  ShieldCheck,
  Lock,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAsync } from '@/hooks/useAsync';
import { paths } from '@/routes/paths';
import { listUsers } from '@/services/usuarios.service';
import { listCases } from '@/services/processos.service';
import { getTenantTrial } from '@/services/tenant.service';
import { PlanCard, type Plan } from './PlanCard';
import { UpgradeConfirm } from './UpgradeConfirm';
import styles from './PlanosPage.module.scss';

const PLANS: Plan[] = [
  {
    id: 'solo',
    name: 'Solo',
    description:
      'Para o advogado autônomo ou escritório enxuto organizar processos, prazos e financeiro em um só lugar.',
    monthlyPrice: 119,
    buttonText: 'Solicitar contratação',
    highlighted: false,
    features: [
      '1 usuário (advogado responsável)',
      'Até 150 processos',
      'Gestão de Processos e Clientes',
      'Agenda, Prazos e Audiências',
      'Contratos e Financeiro',
      'Suporte via e-mail',
    ],
    limits: {
      users: '1',
      processos: 'Até 150',
      support: 'E-mail',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Mais Popular',
    description:
      'Para escritórios com equipe que precisam de mais usuários e volume de processos sem limite.',
    monthlyPrice: 289,
    buttonText: 'Solicitar contratação',
    highlighted: true,
    features: [
      'Até 4 usuários',
      'Processos ilimitados',
      'Gestão de Processos e Clientes',
      'Agenda, Prazos e Audiências',
      'Contratos e Financeiro',
      'Suporte prioritário via e-mail',
    ],
    limits: {
      users: 'Até 4',
      processos: 'Ilimitados',
      support: 'E-mail prioritário',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Sob Medida',
    description:
      'Para escritórios maiores com necessidades específicas de usuários e atendimento — fale com nosso time.',
    monthlyPrice: null,
    buttonText: 'Falar com o time',
    highlighted: false,
    features: [
      'Usuários sob consulta',
      'Processos sob consulta',
      'Gestão de Processos e Clientes',
      'Agenda, Prazos e Audiências',
      'Contratos e Financeiro',
      'Atendimento dedicado para negociar seu contrato',
    ],
    limits: {
      users: 'Sob consulta',
      processos: 'Sob consulta',
      support: 'Dedicado',
    },
  },
];

const FAQ_ITEMS = [
  {
    question: 'Como funciona o período de teste de 14 dias grátis?',
    answer:
      'Ao criar sua conta você tem 14 dias de acesso completo à plataforma, sem precisar de cartão de crédito. Perto do fim do período (ou depois dele), é só enviar uma solicitação de contratação nesta tela que nosso time entra em contato.',
  },
  {
    question: 'Posso mudar de plano ou cancelar a qualquer momento?',
    answer:
      'Sim. Hoje a contratação é feita diretamente com nosso time (ainda não temos checkout automático) — é só entrar em contato para ajustar seu plano ou encerrar quando quiser, sem multa.',
  },
  {
    question: 'Meus dados ficam isolados de outros escritórios?',
    answer:
      'Sim. Cada escritório tem os dados isolados a nível de banco de dados (Row-Level Security), com testes automatizados garantindo esse isolamento — nenhum outro cliente acessa seus processos, clientes ou financeiro.',
  },
  {
    question: 'Quais são as formas de pagamento disponíveis?',
    answer:
      'Depois que você envia sua solicitação de contratação, nosso time combina com você a forma de pagamento (PIX, boleto ou cartão) diretamente — ainda não temos checkout automático dentro da plataforma.',
  },
  {
    question: 'E se eu precisar de mais usuários ou processos do que meu plano permite?',
    answer:
      'É só falar com a gente por aqui — ajustamos seu plano atual ou migramos você para o Pro/Enterprise conforme o escritório cresce.',
  },
];

/**
 * Turns a real `trial_ends_at` (or null) into display state. Returns null when there is no trial
 * data for this tenant (seed/demo tenants, or any tenant that predates trial tracking) — in that
 * case the caller must render nothing, never a fake or default countdown.
 */
function computeTrialStatus(
  trialEndsAt: string | null | undefined
): { label: string; expired: boolean } | null {
  if (!trialEndsAt) return null;
  const msLeft = new Date(trialEndsAt).getTime() - Date.now();
  if (msLeft <= 0) {
    return { label: 'Teste gratuito encerrado', expired: true };
  }
  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return {
    label: `Teste gratuito — ${daysLeft} dia${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'}`,
    expired: false,
  };
}

export function PlanosPage() {
  useDocumentTitle('Assinatura e Planos');
  const navigate = useNavigate();

  const [view, setView] = useState<'plans' | 'upgrade' | 'done'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const trial = useAsync(() => getTenantTrial(), []);
  const usersState = useAsync(() => listUsers(), []);
  const casesState = useAsync(() => listCases(), []);

  const trialStatus = computeTrialStatus(trial.data?.trialEndsAt);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setView('upgrade');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestSuccess = () => {
    setView('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // ── 1. Request Screen ──────────────────────────────────────────
  if (view === 'upgrade' && selectedPlan) {
    return (
      <section className={styles.pageRoot}>
        <PageHead
          title="Solicitar Contratação"
          subtitle={`Envie seus dados para contratar o plano ${selectedPlan.name}`}
        />
        <UpgradeConfirm plan={selectedPlan} onBack={handleBackToPlans} onSuccess={handleRequestSuccess} />
      </section>
    );
  }

  // ── 2. Confirmation Screen ─────────────────────────────────────
  if (view === 'done' && selectedPlan) {
    return (
      <section className={styles.pageRoot}>
        <PageHead title="Assinatura e Planos" subtitle="Gerencie os limites do seu SaaS" />
        <div className={styles.successRoot}>
          <div className={styles.successIconWrapper}>
            <CheckCircle2 size={46} strokeWidth={2.5} />
          </div>

          <h2 className={styles.successTitle}>Solicitação enviada!</h2>
          <p className={styles.successDesc}>
            Recebemos seu interesse no plano <strong>{selectedPlan.name}</strong>. Nosso time vai
            entrar em contato pelo e-mail informado para combinar pagamento e ativação.
          </p>

          <div className={styles.successActions}>
            <Button variant="default" onClick={handleBackToPlans}>
              Ver planos novamente
            </Button>
            <Button variant="primary" onClick={() => navigate(paths.dashboard)}>
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ── 3. Main Plans Screen ────────────────────────────────────────
  return (
    <section className={styles.pageRoot}>
      <PageHead title="Assinatura e Planos" subtitle="Gerencie os limites do seu SaaS" />

      {/* Sua Conta — real data only: real trial countdown (or nothing), real usuário/processo counts */}
      <div className={styles.usageCard}>
        <div className={styles.usageHeader}>
          <div className={styles.usageTitleGroup}>
            <h3 className={styles.usageTitle}>Sua Conta</h3>
            {trialStatus && (
              <span className={clsx(styles.planTag, trialStatus.expired && styles.planTagExpired)}>
                {trialStatus.label}
              </span>
            )}
          </div>
        </div>

        <div className={styles.quotasGrid}>
          <div className={styles.quotaItem}>
            <span className={styles.quotaLabel}>
              <Users size={14} /> Usuários
            </span>
            <span className={styles.quotaBigValue}>
              {usersState.loading
                ? '—'
                : usersState.error
                  ? 'Não foi possível carregar'
                  : usersState.data?.length}
            </span>
          </div>

          <div className={styles.quotaItem}>
            <span className={styles.quotaLabel}>
              <FolderKanban size={14} /> Processos
            </span>
            <span className={styles.quotaBigValue}>
              {casesState.loading
                ? '—'
                : casesState.error
                  ? 'Não foi possível carregar'
                  : casesState.data?.length}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className={styles.plansGrid}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
        ))}
      </div>

      {/* Institutional Benefits and Guarantees — only claims this product can actually back today */}
      <div className={styles.trustSection}>
        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <Lock size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Segurança e isolamento de dados</h4>
            <p>
              Cada escritório tem os dados isolados a nível de banco de dados (Row-Level
              Security), testado — nenhum outro cliente acessa seus processos, clientes ou
              financeiro. Senhas protegidas com hash.
            </p>
          </div>
        </div>

        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <RefreshCw size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Sem fidelidade</h4>
            <p>Fale com a gente para ajustar ou encerrar sua contratação quando quiser, sem multa.</p>
          </div>
        </div>

        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Feito para advocacia brasileira</h4>
            <p>
              Processos organizados pelo número CNJ, com prazos, audiências, contratos e
              financeiro do escritório em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table — only real, shipped modules and the real user/case limits */}
      <div className={styles.comparisonSection}>
        <div className={styles.comparisonHeader}>
          <h2>Comparação Detalhada de Recursos</h2>
          <p>Confira lado a lado os limites de cada plano do Axion ERP</p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Recursos e Capacidade</th>
                <th style={{ width: '22%' }}>Solo</th>
                <th style={{ width: '22%' }} className={styles.highlightCol}>
                  Pro
                </th>
                <th style={{ width: '22%' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Limites</td>
              </tr>
              <tr>
                <td>Usuários</td>
                <td>1 usuário</td>
                <td className={styles.highlightCol}>Até 4 usuários</td>
                <td>Sob consulta</td>
              </tr>
              <tr>
                <td>Processos</td>
                <td>Até 150</td>
                <td className={styles.highlightCol}>Ilimitados</td>
                <td>Sob consulta</td>
              </tr>

              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Módulos Inclusos</td>
              </tr>
              <tr>
                <td>Gestão de Processos e Clientes</td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td className={styles.highlightCol}>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
              </tr>
              <tr>
                <td>Agenda, Prazos e Audiências</td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td className={styles.highlightCol}>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
              </tr>
              <tr>
                <td>Contratos</td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td className={styles.highlightCol}>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
              </tr>
              <tr>
                <td>Financeiro (cobranças e lançamentos)</td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td className={styles.highlightCol}>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
                <td>
                  <span className={styles.checkIcon}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                </td>
              </tr>

              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Suporte</td>
              </tr>
              <tr>
                <td>Canal de suporte</td>
                <td>E-mail</td>
                <td className={styles.highlightCol}>E-mail prioritário</td>
                <td>Atendimento dedicado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <div className={styles.faqHeader}>
          <h3>Perguntas Frequentes sobre Assinatura</h3>
          <p>Tire suas dúvidas antes de assinar ou trocar de plano</p>
        </div>

        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={clsx(styles.faqItem, isOpen && styles.faqOpen)}>
                <button type="button" className={styles.faqQuestion} onClick={() => toggleFaq(idx)}>
                  <span>{item.question}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && <div className={styles.faqAnswer}>{item.answer}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
