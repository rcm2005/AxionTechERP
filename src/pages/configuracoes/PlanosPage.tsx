import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  HardDrive,
  FolderKanban,
  Bot,
  ShieldCheck,
  Lock,
  RefreshCw,
  Zap,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import { PlanCard, type Plan } from './PlanCard';
import { UpgradeConfirm } from './UpgradeConfirm';
import styles from './PlanosPage.module.scss';

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para explorar a plataforma sem compromisso e iniciar a organização.',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    buttonText: 'Plano Atual',
    highlighted: false,
    current: true,
    features: [
      'Fluxo de Caixa IA básico',
      '1 usuário incluso',
      '3 projetos simultâneos',
      '500 MB armazenamento',
      'Gestão de Clientes e Produtos',
      'Suporte comunitário e base de conhecimento',
    ],
    limits: {
      users: '1',
      storage: '500 MB',
      projects: '3',
      ai: 'Básico (sugestões)',
      support: 'Comunidade',
    },
  },
  {
    id: 'standard-pro',
    name: 'Standard Pro',
    badge: 'Mais Popular',
    description: 'Ideal para PMEs em crescimento e escritórios estruturados.',
    monthlyPrice: 149,
    annualMonthlyPrice: 124,
    buttonText: 'Iniciar 14 dias grátis',
    highlighted: true,
    current: false,
    features: [
      'Fluxo de Caixa IA avançado e preditivo',
      '5 usuários inclusos',
      'Projetos ilimitados',
      '20 GB armazenamento em nuvem',
      'Emissão de notas fiscais (NF-e/NFS-e)',
      'Conciliação bancária automática com OFX',
      'Suporte prioritário via chat e e-mail',
    ],
    limits: {
      users: '5',
      storage: '20 GB',
      projects: 'Ilimitados',
      ai: 'Avançado com previsões',
      support: 'Prioritário (chat e e-mail)',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Escala Total',
    description: 'Para grandes operações corporativas com alta demanda de dados.',
    monthlyPrice: 389,
    annualMonthlyPrice: 323,
    buttonText: 'Selecionar Enterprise',
    highlighted: false,
    current: false,
    features: [
      'Inteligência Artificial completa e Copilot Custom',
      'Usuários ilimitados sem custo adicional',
      'Projetos e arquivos ilimitados',
      '500 GB armazenamento dedicado',
      'Múltiplos CNPJs e filiais centralizadas',
      'Auditoria completa de logs e segurança',
      'Gerente de contas dedicado + SLA 99.9%',
    ],
    limits: {
      users: 'Ilimitado',
      storage: '500 GB',
      projects: 'Ilimitados',
      ai: 'Completa + Copilot Custom',
      support: 'Dedicado 24/7 + SLA',
    },
  },
];

const FAQ_ITEMS = [
  {
    question: 'Como funciona o período de teste de 14 dias grátis?',
    answer:
      'Ao assinar o plano Standard Pro, você tem 14 dias para testar todos os recursos sem cobrança imediata. Se cancelar antes do fim do período, nada será cobrado.',
  },
  {
    question: 'Posso mudar de plano ou cancelar a qualquer momento?',
    answer:
      'Sim! Não exigimos contratos de fidelidade. Você pode fazer upgrade, downgrade ou cancelamento diretamente no painel a qualquer momento.',
  },
  {
    question: 'Como são emitidas as notas fiscais da assinatura?',
    answer:
      'A Nota Fiscal de Serviços (NFS-e) é gerada automaticamente após a confirmação do pagamento e enviada diretamente para o e-mail cadastrado da sua empresa.',
  },
  {
    question: 'Quais são as formas de pagamento disponíveis?',
    answer:
      'Aceitamos Cartão de Crédito (em até 12x no plano anual), PIX (com 5% de desconto adicional) e Boleto Bancário à vista.',
  },
  {
    question: 'O que acontece se eu ultrapassar os limites de armazenamento?',
    answer:
      'Você receberá um aviso proativo com antecedência para expandir seu plano ou adquirir pacotes avulsos de armazenamento sem interromper suas operações diárias.',
  },
];

export function PlanosPage() {
  useDocumentTitle('Assinatura e Planos');
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [view, setView] = useState<'plans' | 'upgrade' | 'done'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

  const handleUpgradeSuccess = () => {
    setView('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // ── 1. Upgrade / Checkout Screen ──────────────────────────────────────────
  if (view === 'upgrade' && selectedPlan) {
    return (
      <section className={styles.pageRoot}>
        <PageHead
          title="Confirmar Assinatura"
          subtitle={`Finalize a contratação do plano ${selectedPlan.name}`}
        />
        <UpgradeConfirm
          plan={selectedPlan}
          billingCycle={billingCycle}
          onBack={handleBackToPlans}
          onSuccess={handleUpgradeSuccess}
        />
      </section>
    );
  }

  // ── 2. Success Screen ─────────────────────────────────────────────────────
  if (view === 'done' && selectedPlan) {
    return (
      <section className={styles.pageRoot}>
        <PageHead
          title="Assinatura e Planos"
          subtitle="Gerencie os limites do seu SaaS"
        />
        <div className={styles.successRoot}>
          <div className={styles.successIconWrapper}>
            <CheckCircle2 size={46} strokeWidth={2.5} />
          </div>

          <h2 className={styles.successTitle}>Upgrade realizado com sucesso!</h2>
          <p className={styles.successDesc}>
            Parabéns! Sua empresa agora conta com o plano{' '}
            <strong>{selectedPlan.name}</strong> (
            {billingCycle === 'annual' ? 'Ciclo Anual' : 'Ciclo Mensal'}).
            Todos os recursos avançados já foram ativados.
          </p>

          <div className={styles.successPlanCard}>
            <div className={styles.statItem}>
              <strong>{selectedPlan.limits.users}</strong>
              <span>Usuários inclusos</span>
            </div>
            <div className={styles.statItem}>
              <strong>{selectedPlan.limits.storage}</strong>
              <span>Armazenamento</span>
            </div>
            <div className={styles.statItem}>
              <strong>{selectedPlan.limits.projects}</strong>
              <span>Projetos liberados</span>
            </div>
          </div>

          <div className={styles.successActions}>
            <Button variant="default" onClick={handleBackToPlans}>
              Ver Detalhes do Plano
            </Button>
            <Button variant="primary" onClick={() => navigate(paths.dashboard)}>
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ── 3. Main Plans Screen ────────────────────────────────────────────
  return (
    <section className={styles.pageRoot}>
      <PageHead
        title="Assinatura e Planos"
        subtitle="Gerencie os limites do seu SaaS"
      />

      {/* Current Account Limits and Usage Banner */}
      <div className={styles.usageCard}>
        <div className={styles.usageHeader}>
          <div className={styles.usageTitleGroup}>
            <h3 className={styles.usageTitle}>Consumo da Conta</h3>
            <span className={styles.planTag}>Plano Atual: Free</span>
          </div>
          <span className={styles.usageMeta}>
            Renovação automática: Sem expiração
          </span>
        </div>

        <div className={styles.quotasGrid}>
          <div className={styles.quotaItem}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaLabel}>
                <Users size={14} /> Usuários
              </span>
              <span className={styles.quotaValue}>1 / 1 (100%)</span>
            </div>
            <ProgressBar percent={100} />
          </div>

          <div className={styles.quotaItem}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaLabel}>
                <HardDrive size={14} /> Armazenamento
              </span>
              <span className={styles.quotaValue}>142 MB / 500 MB (28%)</span>
            </div>
            <ProgressBar percent={28} />
          </div>

          <div className={styles.quotaItem}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaLabel}>
                <FolderKanban size={14} /> Projetos
              </span>
              <span className={styles.quotaValue}>2 / 3 (66%)</span>
            </div>
            <ProgressBar percent={66} />
          </div>

          <div className={styles.quotaItem}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaLabel}>
                <Bot size={14} /> Consultas IA
              </span>
              <span className={styles.quotaValue}>45 / 100 (45%)</span>
            </div>
            <ProgressBar percent={45} />
          </div>
        </div>
      </div>

      {/* Monthly / Annual Toggle */}
      <div className={styles.toggleWrapper}>
        <div className={styles.toggleContainer}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${
              billingCycle === 'monthly' ? styles.toggleBtnActive : ''
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensal
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${
              billingCycle === 'annual' ? styles.toggleBtnActive : ''
            }`}
            onClick={() => setBillingCycle('annual')}
          >
            Anual
            <span className={styles.discountBadge}>-17% OFF</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className={styles.plansGrid}>
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            onSelect={handleSelectPlan}
          />
        ))}
      </div>

      {/* Institutional Benefits and Guarantees */}
      <div className={styles.trustSection}>
        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <Lock size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Segurança Bancária</h4>
            <p>Dados criptografados de ponta a ponta com certificados TLS 1.3 e backups diários.</p>
          </div>
        </div>

        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>100% LGPD & Fiscal</h4>
            <p>Em total conformidade com normas brasileiras de privacidade e exigências da Receita Federal.</p>
          </div>
        </div>

        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <RefreshCw size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Sem Fidelidade</h4>
            <p>Altere ou cancele seu plano a qualquer momento diretamente pelo painel sem multas.</p>
          </div>
        </div>

        <div className={styles.trustCard}>
          <div className={styles.trustIconBox}>
            <Zap size={18} />
          </div>
          <div className={styles.trustContent}>
            <h4>Ativação Instantânea</h4>
            <p>Novos limites de usuários, IA e capacidade são liberados no mesmo segundo da confirmação.</p>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className={styles.comparisonSection}>
        <div className={styles.comparisonHeader}>
          <h2>Comparação Detalhada de Recursos</h2>
          <p>Confira lado a lado todos os limites e funcionalidades de cada plano do Axion ERP</p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Recursos e Capacidade</th>
                <th style={{ width: '22%' }}>Free</th>
                <th style={{ width: '22%' }} className={styles.highlightCol}>
                  Standard Pro
                </th>
                <th style={{ width: '22%' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {/* Category 1: Limits */}
              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Limites e Capacidade</td>
              </tr>
              <tr>
                <td>Usuários simultâneos</td>
                <td>1 usuário</td>
                <td className={styles.highlightCol}>5 inclusos (+ R$ 29/extra)</td>
                <td>Ilimitados</td>
              </tr>
              <tr>
                <td>Armazenamento em nuvem</td>
                <td>500 MB</td>
                <td className={styles.highlightCol}>20 GB</td>
                <td>500 GB dedicado</td>
              </tr>
              <tr>
                <td>Projetos e centros de custo</td>
                <td>Até 3 projetos</td>
                <td className={styles.highlightCol}>Ilimitados</td>
                <td>Ilimitados</td>
              </tr>
              <tr>
                <td>Múltiplos CNPJs / Filiais</td>
                <td>
                  <span className={styles.crossIcon}>
                    <X size={16} />
                  </span>
                </td>
                <td className={styles.highlightCol}>Até 2 CNPJs</td>
                <td>Ilimitados</td>
              </tr>

              {/* Category 2: Artificial Intelligence */}
              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Inteligência Artificial & Copilot</td>
              </tr>
              <tr>
                <td>Fluxo de Caixa IA</td>
                <td>Básico (resumo do mês)</td>
                <td className={styles.highlightCol}>Avançado com projeções a 90 dias</td>
                <td>Preditivo com cenários múltiplos</td>
              </tr>
              <tr>
                <td>Consultas ao Copilot</td>
                <td>100 consultas/mês</td>
                <td className={styles.highlightCol}>Ilimitadas</td>
                <td>Ilimitadas + Modelo Customizado</td>
              </tr>
              <tr>
                <td>Conciliação Bancária Automática</td>
                <td>
                  <span className={styles.crossIcon}>
                    <X size={16} />
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

              {/* Category 3: Modules and Fiscal */}
              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Módulos e Operações</td>
              </tr>
              <tr>
                <td>Gestão Financeira e Contas a Receber</td>
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
                <td>Emissão de Notas Fiscais (NF-e/NFS-e)</td>
                <td>
                  <span className={styles.crossIcon}>
                    <X size={16} />
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
                <td>Exportação de relatórios (PDF/Excel)</td>
                <td>Básico</td>
                <td className={styles.highlightCol}>Avançado e customizado</td>
                <td>Completo + API de Dados</td>
              </tr>

              {/* Category 4: Support */}
              <tr className={styles.categoryHeaderRow}>
                <td colSpan={4}>Suporte e Atendimento</td>
              </tr>
              <tr>
                <td>Canal de suporte</td>
                <td>Comunidade & Central</td>
                <td className={styles.highlightCol}>Chat e E-mail prioritário</td>
                <td>Gerente dedicado + Telefone 24/7</td>
              </tr>
              <tr>
                <td>SLA de Atendimento</td>
                <td>Até 48h</td>
                <td className={styles.highlightCol}>Até 4h úteis</td>
                <td>Menos de 1h garantido</td>
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
              <div
                key={idx}
                className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(idx)}
                >
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
