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
