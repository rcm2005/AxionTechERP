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
