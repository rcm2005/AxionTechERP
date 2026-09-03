# CP2-C (frontend) — honest pricing, real trial, real usage, real lead capture

## Context — what's wrong today, verified against this codebase

`src/pages/configuracoes/PlanosPage.tsx` and `UpgradeConfirm.tsx` are entirely scenic (tracked as
B25/CP2-C in `docs/rd/BARRIERS.md`/`STATUS.md` in the `ERP-MVP-AxionTech` repo). Verified in this
codebase, specifically:

- A permanent, non-expiring `Free` tier at R$0, plus two paid tiers (R$149/mo, R$389/mo) with
  pricing that's being replaced.
- A "Consumo da Conta" panel showing hardcoded fabricated numbers: "142 MB / 500 MB",
  "45 / 100 consultas IA", "2 / 3 projetos" — nothing in this product meters storage or AI usage.
- Feature claims for capabilities that don't exist anywhere in this codebase: NF-e/NFS-e emission
  (confirmed absent — `apps/api` has no fiscal routes; `src/data/catalogoRequisitosVarejo.ts`
  explicitly documents "hoje o sistema não emite nem transmite notas à SEFAZ"; the `/fiscal` route
  in this repo's own router renders `PlaceholderPage`, not a real module — see `router.tsx`), OFX
  bank reconciliation (no such code anywhere), multiple CNPJs per tenant (`apps/api`'s `tenants`
  table has one `cnpj_ou_cpf` column, no multi-CNPJ concept at all), a fixed SLA number (nothing
  tracks or commits to one), and "Copilot Custom" / a custom AI model (`CopilotPage.tsx` is a
  keyword-matched scripted demo chatbot with zero real backend AI call — its own fallback response
  literally says "No momento estou em modo de demonstração").
- `UpgradeConfirm.tsx` has a fake credit-card form with a `setTimeout` simulating a successful
  charge. No payment processor exists in this project.
- The detailed comparison table and the four "trust" cards below the plan grid repeat and expand
  on the same fabricated claims (Múltiplos CNPJs row, Conciliação Bancária row, Emissão de Notas
  Fiscais row, an SLA-hours row, "100% LGPD & Fiscal" claiming Receita Federal compliance a
  placeholder page can't back, and "Ativação Instantânea" claiming instant self-serve resource
  activation that no longer applies once the fake checkout is removed).

Also verified: this product's only real, shipped jurídico modules — routed to actual pages, not
`PlaceholderPage`, in `src/routes/router.tsx` — are **Processos, Prazos, Agenda, Clientes,
Contratos, Financeiro**. `Fiscal` is a placeholder. `Documentos` and `Tarefas` have backend
tables/routes in `apps/api` but no frontend page consumes them anywhere in this repo's router — not
reachable by a user, so not something to claim as delivered. There is no cash-flow forecasting
code, no automatic deadline-calculation wired into any route (`apps/api`'s `prazoLegal.ts` engine
exists and is tested but is not called from any route yet — grep confirms zero references to it
under `apps/api/src/routes`), and no seat/case-count limit is enforced anywhere server-side today
(the new plan tiers below state limits as the commercial offer, not as something the software
currently blocks you from exceeding — same as any SaaS that sells a tier before building the
metering for it).

**Decision made for this checkpoint, stated explicitly so it isn't mistaken for an oversight:**
the old page had a Mensal/Anual billing-cycle toggle with a 17%-off annual price and a further 5%
PIX discount. The brief for this rework gives only flat monthly prices for the three new tiers, no
annual figures. Inventing an annual discount rate that nobody specified would be the exact same
kind of fabricated-number problem this rework exists to fix, so **this spec removes the
monthly/annual toggle entirely** — every plan shows one flat monthly price, full stop. If Rafael
wants an annual option later, that's a separate, deliberate pricing decision with its own real
numbers, not something to backfill here.

**Second decision, also explicit:** with the Free tier gone and no real subscription/plan field
tracked anywhere on a tenant today, there is no honest way to mark any plan card as the tenant's
"current plan" — that data doesn't exist. This spec removes the `current`/"Plano Atual" concept
from the plan cards entirely, rather than hardcoding one plan as current the way the old Free tier
was.

## Operational rules — read before writing anything

- Only use `write_file` / `edit_file`. **Do not run any shell/build/test command** — no `npm`, no
  `tsc`, no `git`, nothing. Validation happens outside this dispatch.
- Do not leave compatibility aliases for old field/prop names.
- Do not fabricate any number, percentage, or claim. Where real data can't be fetched or a limit
  isn't actually enforced anywhere, say so honestly in the copy rather than inventing a figure.
- Make exactly the changes below — do not refactor, rename, or "clean up" anything not listed.
- Do not run `git add` / `git commit`. Leave every change as an uncommitted diff in the working tree.
- This dispatch is frontend-only. A matching backend spec (separate repo, separate dispatch) adds
  a real `trial_ends_at` column on `tenants` and a real `plan_requests` table + `POST
  /plan-requests` route — this spec's frontend code calls those endpoints assuming they exist by
  the time this ships, but does not itself touch any backend file.

## File 1: `src/pages/configuracoes/PlanCard.tsx` — full replacement

Removes the `billingCycle` prop (no more monthly/annual toggle), the `current`/`isFree` concepts,
and adds support for `monthlyPrice: null` (Enterprise's "Fale conosco", no fixed number).

```tsx
import { Check, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button/Button';
import styles from './PlanCard.module.scss';

export interface Plan {
  id: 'solo' | 'pro' | 'enterprise';
  name: string;
  badge?: string;
  description: string;
  /** null = no fixed price shown ("Fale conosco") — never invent a number here. */
  monthlyPrice: number | null;
  buttonText: string;
  highlighted?: boolean;
  features: string[];
  limits: {
    users: string;
    processos: string;
    support: string;
  };
}

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, onSelect }: PlanCardProps) {
  const isCustomPrice = plan.monthlyPrice === null;

  return (
    <div className={clsx(styles.card, plan.highlighted && styles.highlighted)}>
      {plan.highlighted && (
        <span className={styles.topBadge}>
          <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
          {plan.badge || 'Mais Popular'}
        </span>
      )}

      <div className={styles.header}>
        <h3 className={styles.planName}>{plan.name}</h3>
        <p className={styles.planDesc}>{plan.description}</p>
      </div>

      <div className={styles.priceWrapper}>
        <div className={styles.priceRow}>
          {isCustomPrice ? (
            <span className={styles.priceCustom}>Fale conosco</span>
          ) : (
            <>
              <span className={styles.currency}>R$</span>
              <span className={styles.priceAmount}>{plan.monthlyPrice}</span>
              <span className={styles.period}>/mês</span>
            </>
          )}
        </div>
        <span className={styles.billingNote}>
          {isCustomPrice ? 'Preço sob consulta' : 'Cobrança mensal'}
        </span>
      </div>

      <div className={styles.ctaWrapper}>
        <Button variant={plan.highlighted ? 'primary' : 'default'} onClick={() => onSelect(plan)}>
          {plan.buttonText}
        </Button>
      </div>

      <div className={styles.featuresSection}>
        <span className={styles.featuresTitle}>O que está incluso:</span>
        <ul className={styles.featureList}>
          {plan.features.map((feature, idx) => (
            <li key={idx} className={styles.featureItem}>
              <span className={clsx(styles.iconCheck, plan.highlighted && styles.green)}>
                <Check size={12} strokeWidth={3} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## File 2: `src/pages/configuracoes/PlanCard.module.scss`

One rename only — `.priceFree` becomes `.priceCustom` (it now renders "Fale conosco", not
"Grátis"):

```scss
// before
.priceFree {
  font-size: 34px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

// after
.priceCustom {
  font-size: 34px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.5px;
}
```

Leave `.current` and `.currentBadge` rules in the file as-is even though nothing references them
after File 1 — do not delete them, out of scope for this pass. Do not change anything else in this
file.

## File 3: `src/services/tenant.service.ts` — full replacement

Adds `getTenantTrial()`, reading the real `trial_ends_at` field the backend spec adds to
`GET /tenants/current`. Keeps `getTenantConfig()` and its types unchanged.

```ts
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface TenantBranding {
  nomeExibicao: string;
  corPrimaria: string;
}

export interface NavItem {
  id: string;
  label: string;
  visivel: boolean;
}

export interface TenantConfig {
  branding: TenantBranding;
  navegacao: {
    itens: NavItem[];
  };
}

interface TenantCurrentResponse {
  id: string;
  nome: string;
  config: {
    branding: TenantBranding;
    navegacao: {
      itens: NavItem[];
    };
  };
  /** ISO timestamp or null — null means this tenant predates trial tracking (e.g. seed/demo
   * tenants) or was never granted one. Never treat a missing value as "trial active" or
   * "trial expired" with a made-up date — it means "no trial data for this tenant". */
  trial_ends_at: string | null;
}

export async function getTenantConfig(): Promise<{ branding: TenantBranding; navegacao: { itens: NavItem[] } } | null> {
  if (USE_MOCKS) {
    await delay(150);
    return null;
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return data.config;
}

export interface TenantTrial {
  trialEndsAt: string | null;
}

export async function getTenantTrial(): Promise<TenantTrial> {
  if (USE_MOCKS) {
    await delay(150);
    // Mock mode has no persisted trial state — `src/mocks/tenants.mock.ts` models a different,
    // pre-existing multi-tenant-switcher concept unrelated to this backend field. Same convention
    // as `processos.service.ts`'s in-memory store: a value computed relative to "today" so the
    // countdown looks alive during local demos, never persisted, never presented as real data —
    // this branch never runs against a real tenant (gated by USE_MOCKS/VITE_USE_MOCKS).
    const nineDaysFromNow = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    return { trialEndsAt: nineDaysFromNow.toISOString() };
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return { trialEndsAt: data.trial_ends_at };
}
```

## File 4 (new): `src/services/plan-requests.service.ts`

```ts
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface PlanRequestInput {
  plan: 'solo' | 'pro' | 'enterprise';
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
}

/**
 * Persists a "Solicitar contratação" lead — this product has no payment processor, so this is
 * the real, honest replacement for the old fake checkout: it records the request and a human
 * (Rafael) follows up manually. See `apps/api`'s `plan_requests` table / `POST /plan-requests`.
 */
export async function submitPlanRequest(input: PlanRequestInput): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    return;
  }
  await http.post('/plan-requests', {
    plan: input.plan,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    message: input.message,
  });
}
```

## File 5: `src/pages/configuracoes/UpgradeConfirm.tsx` — full replacement

Replaces the fake credit-card/PIX/boleto checkout (fake card number, fake CVV, `setTimeout`
"activation") with a real lead-capture form that calls `submitPlanRequest`. Drops the
`billingCycle` prop (no longer exists on the caller, see File 6).

```tsx
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitPlanRequest } from '@/services/plan-requests.service';
import type { Plan } from './PlanCard';
import styles from './UpgradeConfirm.module.scss';

interface UpgradeConfirmProps {
  plan: Plan;
  onBack: () => void;
  onSuccess: () => void;
}

export function UpgradeConfirm({ plan, onBack, onSuccess }: UpgradeConfirmProps) {
  const { usuario } = useAuth();
  const toast = useToast();

  const [contactName, setContactName] = useState(usuario?.nome ?? '');
  const [contactEmail, setContactEmail] = useState(usuario?.email ?? '');
  const [contactPhone, setContactPhone] = useState(usuario?.telefone ?? '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) {
      toast.show('Preencha nome e e-mail para contato.');
      return;
    }

    setLoading(true);
    try {
      await submitPlanRequest({
        plan: plan.id,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim() || undefined,
        message: message.trim() || undefined,
      });
      onSuccess();
    } catch {
      toast.show('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />
        Voltar para seleção de planos
      </button>

      <form className={styles.checkoutGrid} onSubmit={handleSubmit}>
        {/* Left Column: Contact form */}
        <div className={styles.formPanel}>
          <div>
            <h2 className={styles.panelTitle}>Solicitar contratação</h2>
            <p className={styles.panelSubtitle}>
              Deixe seus dados que nosso time entra em contato para fechar o plano {plan.name}.
            </p>
          </div>

          <div className={styles.formSection}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nome para contato</label>
              <input
                type="text"
                className={styles.input}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>E-mail para contato</label>
              <input
                type="email"
                className={styles.input}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="voce@escritorio.com.br"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Telefone (opcional)</label>
              <input
                type="text"
                className={styles.input}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(11) 90000-0000"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Mensagem (opcional)</label>
              <textarea
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte um pouco sobre seu escritório ou quando prefere ser contatado."
                rows={4}
              />
            </div>
          </div>

          <label className={styles.termsRow}>
            <ShieldCheck size={16} color="var(--tone-green-fg)" />
            <span>Seus dados de contato são usados só para essa negociação, com nosso time.</span>
          </label>
        </div>

        {/* Right Column: Plan summary + submit */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryHeader}>
            <span className={styles.selectedPlanBadge}>Plano Escolhido</span>
            <h3 className={styles.summaryPlanName}>{plan.name}</h3>
            <p className={styles.summaryPlanCycle}>
              {plan.monthlyPrice === null ? 'Preço sob consulta' : `R$ ${plan.monthlyPrice}/mês`}
            </p>
          </div>

          <p className={styles.panelSubtitle}>
            Hoje a contratação é feita diretamente com nosso time — ainda não temos checkout
            automático dentro da plataforma. Ao enviar, alguém do time entra em contato para
            combinar pagamento e ativação.
          </p>

          <Button
            type="submit"
            variant="primary"
            className={styles.confirmBtn}
            disabled={loading}
          >
            {loading ? (
              'Enviando…'
            ) : (
              <>
                <Send size={16} />
                Enviar solicitação
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

## File 6: `src/pages/configuracoes/UpgradeConfirm.module.scss` — full replacement

Drops every class that only existed for the fake card/PIX/boleto/price-breakdown UI (`.paymentTabs`,
`.tabBtn`, `.pixBadge`, `.inputRow`, `.select`, `.pixBox`, `.qrPlaceholder`, `.pixCodeBox`,
`.pixInput`, `.boletoBox`, `.boletoInfo`, `.priceList`, `.priceItem`, `.securityGuarantee`,
`.guaranteeItem`). Keeps everything File 5 still uses, adds `.textarea`.

```scss
@use '@/styles/abstracts' as *;

.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1060px;
  margin: 0 auto;
  padding-bottom: var(--space-7);
}

.backBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast), background-color var(--transition-fast);
  align-self: flex-start;

  &:hover {
    color: var(--color-text);
    background-color: var(--color-surface-2);
  }
}

.checkoutGrid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-6);
  align-items: flex-start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

/* Painel de Contato (Esquerda) */
.formPanel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.panelTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
}

.panelSubtitle {
  font-size: 13px;
  color: var(--color-muted);
  margin: 0;
}

.formSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fieldLabel {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
}

.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(49, 87, 213, 0.15);
  }

  &::placeholder {
    color: var(--color-muted-2);
  }
}

.textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--font-sans);
  resize: vertical;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(49, 87, 213, 0.15);
  }

  &::placeholder {
    color: var(--color-muted-2);
  }
}

/* Checkbox/Notice Row */
.termsRow {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  color: var(--color-muted);
}

/* Resumo do Plano (Direita) */
.summaryPanel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  position: sticky;
  top: 20px;
}

.summaryHeader {
  border-bottom: 1px solid var(--color-line);
  padding-bottom: var(--space-4);
}

.selectedPlanBadge {
  display: inline-block;
  background-color: var(--tone-blue-bg);
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  margin-bottom: 6px;
}

.summaryPlanName {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.summaryPlanCycle {
  font-size: 13px;
  color: var(--color-muted);
  margin: 0;
}

.confirmBtn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 700;
  justify-content: center;
  gap: 8px;
}
```

## File 7: `src/pages/configuracoes/PlanosPage.tsx` — full replacement

```tsx
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
```

Note on hook ordering: `trial`/`usersState`/`casesState` (`useAsync` calls) are declared before the
`view === 'upgrade'`/`view === 'done'` early returns, same position the original file's state
declarations occupied — this is required (`react/rules-of-hooks`, enabled in this repo's
`.oxlintrc.json`) and matches the original file's own structure. Do not move them after an early
return.

## File 8: `src/pages/configuracoes/PlanosPage.module.scss`

Several targeted edits — not a full replacement, this file has more surviving structure than it's
losing.

**1. Remove** the now-unused `.usageMeta` rule entirely (it styled the old
"Renovação automática: Sem expiração" line, which no longer exists):

```scss
// delete this whole block
.usageMeta {
  font-size: 13px;
  color: var(--color-muted);
}
```

**2. Add** a `.planTagExpired` variant right after the existing `.planTag` rule:

```scss
// after .planTag's closing brace, add:
.planTagExpired {
  background-color: var(--tone-red-bg);
  color: var(--tone-red-fg);
  border-color: var(--tone-red-fg);
}
```

**3. Replace** `.quotaHeader` and `.quotaValue` (the old split label/percentage-value row, no
longer used now that `ProgressBar` and its fake percentages are gone) with a single
`.quotaBigValue` rule:

```scss
// before
.quotaHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
}

.quotaLabel {
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.quotaValue {
  color: var(--color-muted);
  font-weight: 500;
}

// after
.quotaLabel {
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}

.quotaBigValue {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text);
}
```

**4. Remove** the entire "Seletor de Ciclo (Mensal / Anual)" block — the toggle is gone (see the
context section above for why):

```scss
// delete this whole section, from the comment through .discountBadge's closing brace
/* Seletor de Ciclo (Mensal / Anual) */
.toggleWrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.toggleContainer {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-line);
  padding: 4px;
  border-radius: var(--radius-pill);
  gap: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.toggleBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: var(--radius-pill);
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-text);
  }

  &.toggleBtnActive {
    background-color: var(--color-accent);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(49, 87, 213, 0.28);
  }
}

.discountBadge {
  background: linear-gradient(135deg, #16865a 0%, #10b981 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.3px;
}
```

**5. Remove** `.crossIcon` (only used by the old "not included" comparison-table rows, all of
which are gone — every module listed in the new table is included in every tier):

```scss
// delete this block
.crossIcon {
  color: var(--color-muted-2);
  display: inline-flex;
  vertical-align: middle;
}
```

**6. Remove** `.successPlanCard` and its nested `.statItem` (the old fake "usuários
inclusos/armazenamento/projetos liberados" resource-activation summary — no longer rendered):

```scss
// delete this whole block
.successPlanCard {
  width: 100%;
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  justify-content: space-around;
  text-align: center;
  margin: var(--space-2) 0;

  .statItem {
    strong {
      display: block;
      font-size: 16px;
      color: var(--color-text);
    }
    span {
      font-size: 12px;
      color: var(--color-muted);
    }
  }
}
```

Leave every other rule in this file untouched (`.pageRoot`, `.usageCard`, `.usageHeader`,
`.usageTitleGroup`, `.usageTitle`, `.planTag`, `.quotasGrid`, `.quotaItem`, `.plansGrid`,
`.trustSection`, `.trustCard`, `.trustIconBox`, `.trustContent`, `.comparisonSection`,
`.comparisonHeader`, `.tableWrapper`, `.comparisonTable` and its nested rules, `.checkIcon`,
`.faqSection`, `.faqHeader`, `.faqList`, `.faqItem`, `.faqQuestion`, `.faqAnswer`, `.successRoot`,
`.successIconWrapper`, `.successTitle`, `.successDesc`, `.successActions`).

## Out of scope — do not touch these files

- Any file under `apps/api` or the `ERP-MVP-AxionTech` repo — separate spec, separate dispatch.
- `src/mocks/tenants.mock.ts` — models a different, pre-existing "Tenant" concept (multi-tenant
  accountant switcher) unrelated to `getTenantTrial()`'s mock branch, which is self-contained
  inside `tenant.service.ts` and does not read from this file.
- `src/hooks/useAsync.ts`, `src/services/usuarios.service.ts`, `src/services/processos.service.ts`
  — already return real data correctly, used as-is, no changes needed.
- `src/contexts/AuthContext.tsx` — not touched; `UpgradeConfirm.tsx` reads `usuario` from
  `useAuth()` exactly as the old file already did, no changes to the context itself.
- `CopilotPage.tsx`, `src/pages/copilot/*` — unrelated to this spec; left as the known scripted
  demo it already is.
- Any other page/component not explicitly listed above.

## When done

Do not run `npm run build`, `tsc -b`, `oxlint`, or any test/shell command — that happens outside
this dispatch. Do not `git add` or `git commit`. Leave every change above as an uncommitted diff in
the working tree.
