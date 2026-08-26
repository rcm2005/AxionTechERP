import { Check, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button/Button';
import styles from './PlanCard.module.scss';

export interface Plan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  buttonText: string;
  highlighted?: boolean;
  current?: boolean;
  features: string[];
  limits: {
    usuarios: string;
    armazenamento: string;
    projetos: string;
    ia: string;
    suporte: string;
  };
}

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, billingCycle, onSelect }: PlanCardProps) {
  const isAnnual = billingCycle === 'annual';
  const displayPrice = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const isFree = plan.monthlyPrice === 0;

  return (
    <div
      className={clsx(
        styles.card,
        plan.highlighted && styles.highlighted,
        plan.current && styles.current,
      )}
    >
      {/* Badges superiores */}
      {plan.highlighted && (
        <span className={styles.topBadge}>
          <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
          {plan.badge || 'Mais Popular'}
        </span>
      )}
      {plan.current && !plan.highlighted && (
        <span className={styles.currentBadge}>Plano Atual</span>
      )}

      {/* Cabeçalho */}
      <div className={styles.header}>
        <h3 className={styles.planName}>{plan.name}</h3>
        <p className={styles.planDesc}>{plan.description}</p>
      </div>

      {/* Preço */}
      <div className={styles.priceWrapper}>
        <div className={styles.priceRow}>
          {isFree ? (
            <span className={styles.priceFree}>Grátis</span>
          ) : (
            <>
              <span className={styles.currency}>R$</span>
              <span className={styles.priceAmount}>{displayPrice}</span>
              <span className={styles.period}>/mês</span>
            </>
          )}
        </div>

        {!isFree && (
          <span
            className={clsx(styles.billingNote, isAnnual && styles.discounted)}
          >
            {isAnnual
              ? `Faturado R$ ${displayPrice * 12} /ano (-17% OFF)`
              : 'Faturado mensalmente'}
          </span>
        )}
        {isFree && (
          <span className={styles.billingNote}>Sem prazo de expiração</span>
        )}
      </div>

      {/* Ação */}
      <div className={styles.ctaWrapper}>
        {plan.current ? (
          <Button variant="ghost" disabled style={{ opacity: 0.85, cursor: 'default' }}>
            ✓ Plano Atual
          </Button>
        ) : (
          <Button
            variant={plan.highlighted ? 'primary' : 'default'}
            onClick={() => onSelect(plan)}
          >
            {plan.buttonText}
          </Button>
        )}
      </div>

      {/* Recursos inclusos */}
      <div className={styles.featuresSection}>
        <span className={styles.featuresTitle}>O que está incluso:</span>
        <ul className={styles.featureList}>
          {plan.features.map((feature, idx) => (
            <li key={idx} className={styles.featureItem}>
              <span
                className={clsx(
                  styles.iconCheck,
                  plan.highlighted && styles.green,
                )}
              >
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
