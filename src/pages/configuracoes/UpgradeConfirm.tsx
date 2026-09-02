import { useState } from 'react';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Plan } from './PlanCard';
import styles from './UpgradeConfirm.module.scss';

interface UpgradeConfirmProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  onBack: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

export function UpgradeConfirm({
  plan,
  billingCycle,
  onBack,
  onSuccess,
}: UpgradeConfirmProps) {
  const { usuario: user } = useAuth();
  const toast = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [loading, setLoading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardName, setCardName] = useState(
    user?.nomeExibicao || user?.nome || 'EMPRESA SA'
  );
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('382');
  const [installments, setInstallments] = useState('1');

  const isAnnual = billingCycle === 'annual';
  const monthlyEquivalent = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const subtotalYearly = plan.monthlyPrice * 12;
  const totalPayable = isAnnual ? plan.annualMonthlyPrice * 12 : plan.monthlyPrice;
  const annualDiscountAmount = isAnnual ? subtotalYearly - totalPayable : 0;
  const pixDiscountAmount = paymentMethod === 'pix' ? Math.round(totalPayable * 0.05) : 0;
  const finalTotal = totalPayable - pixDiscountAmount;

  const mockPixCode =
    '00020126580014br.gov.bcb.pix0136a89c927f-9481-4fbb-b58f-2877a3d34f0e5204000053039865802BR5915AXION SAAS ERP6009SAO PAULO62070503***6304E882';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(mockPixCode);
    setCopiedPix(true);
    toast.show('Código PIX copiado para a área de transferência!');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.show('Por favor, aceite os Termos de Serviço para prosseguir.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />
        Voltar para seleção de planos
      </button>

      <form className={styles.checkoutGrid} onSubmit={handleConfirmUpgrade}>
        {/* Left Column: Payment Details */}
        <div className={styles.formPanel}>
          <div>
            <h2 className={styles.panelTitle}>Método de Pagamento</h2>
            <p className={styles.panelSubtitle}>
              Selecione como deseja pagar a assinatura da sua empresa
            </p>
          </div>

          {/* Method selection tabs */}
          <div className={styles.paymentTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                paymentMethod === 'credit_card' ? styles.tabActive : ''
              }`}
              onClick={() => setPaymentMethod('credit_card')}
            >
              <CreditCard size={18} />
              <span>Cartão</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                paymentMethod === 'pix' ? styles.tabActive : ''
              }`}
              onClick={() => setPaymentMethod('pix')}
            >
              <span className={styles.pixBadge}>-5%</span>
              <QrCode size={18} />
              <span>PIX</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                paymentMethod === 'boleto' ? styles.tabActive : ''
              }`}
              onClick={() => setPaymentMethod('boleto')}
            >
              <FileText size={18} />
              <span>Boleto</span>
            </button>
          </div>

          {/* Specific content for each method */}
          {paymentMethod === 'credit_card' && (
            <div className={styles.formSection}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Número do Cartão</label>
                <input
                  type="text"
                  className={styles.input}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nome no Cartão</label>
                <input
                  type="text"
                  className={styles.input}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nome idêntico ao impresso"
                  required
                />
              </div>

              <div className={styles.inputRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Validade</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/AA"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    className={styles.input}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Parcelamento</label>
                <select
                  className={styles.select}
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                >
                  <option value="1">
                    1x de R$ {finalTotal.toFixed(2)} sem juros
                  </option>
                  {isAnnual && (
                    <>
                      <option value="3">
                        3x de R$ {(finalTotal / 3).toFixed(2)} sem juros
                      </option>
                      <option value="6">
                        6x de R$ {(finalTotal / 6).toFixed(2)} sem juros
                      </option>
                      <option value="12">
                        12x de R$ {(finalTotal / 12).toFixed(2)} sem juros
                      </option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {paymentMethod === 'pix' && (
            <div className={styles.pixBox}>
              <div className={styles.qrPlaceholder}>
                <QrCode size={90} color="var(--color-accent)" />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  Aprovação Imediata via PIX
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--color-muted)' }}>
                  Escaneie o QR Code ou copie a chave PIX abaixo para pagar em seu banco.
                </p>
              </div>

              <div className={styles.pixCodeBox}>
                <input
                  type="text"
                  readOnly
                  value={mockPixCode}
                  className={styles.pixInput}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCopyPix}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPix ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>
          )}

          {paymentMethod === 'boleto' && (
            <div className={styles.boletoBox}>
              <FileText size={32} color="var(--color-accent)" />
              <div className={styles.boletoInfo}>
                <h4>Boleto Bancário à Vista</h4>
                <p>
                  O boleto será gerado após a confirmação. O prazo de compensação é de até 2 dias úteis.
                </p>
              </div>
            </div>
          )}

          {/* Terms */}
          <label className={styles.termsRow}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              Concordo com os <strong>Termos de Serviço</strong> e autorizo a renovação automática da assinatura conforme o ciclo contratado.
            </span>
          </label>
        </div>

        {/* Right Column: Order Summary */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryHeader}>
            <span className={styles.selectedPlanBadge}>Plano Escolhido</span>
            <h3 className={styles.summaryPlanName}>{plan.name}</h3>
            <p className={styles.summaryPlanCycle}>
              Ciclo: {isAnnual ? 'Anual (12 meses)' : 'Mensal recorrente'}
            </p>
          </div>

          <div className={styles.priceList}>
            <div className={styles.priceItem}>
              <span>Valor base ({isAnnual ? '12x mensal' : '1 mês'})</span>
              <span>R$ {isAnnual ? subtotalYearly : plan.monthlyPrice},00</span>
            </div>

            {isAnnual && annualDiscountAmount > 0 && (
              <div className={`${styles.priceItem} ${styles.discount}`}>
                <span>Desconto Anual (-17%)</span>
                <span>- R$ {annualDiscountAmount},00</span>
              </div>
            )}

            {paymentMethod === 'pix' && pixDiscountAmount > 0 && (
              <div className={`${styles.priceItem} ${styles.discount}`}>
                <span>Desconto PIX (-5%)</span>
                <span>- R$ {pixDiscountAmount},00</span>
              </div>
            )}

            <div className={styles.priceItem}>
              <span>Impostos e taxas</span>
              <span>Inclusos (NFS-e)</span>
            </div>

            <div className={`${styles.priceItem} ${styles.total}`}>
              <span>Total a Pagar</span>
              <span className={styles.totalAmount}>
                R$ {finalTotal},00
                {isAnnual && (
                  <small
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--color-muted)',
                      textAlign: 'right',
                    }}
                  >
                    (equivale a R$ {monthlyEquivalent}/mês)
                  </small>
                )}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className={styles.confirmBtn}
            disabled={loading}
          >
            {loading ? (
              'Processando ativação…'
            ) : (
              <>
                <Lock size={16} />
                Confirmar e Ativar Plano
              </>
            )}
          </Button>

          <div className={styles.securityGuarantee}>
            <div className={styles.guaranteeItem}>
              <ShieldCheck size={16} color="var(--tone-green-fg)" />
              <span>Garantia incondicional de 14 dias com reembolso total</span>
            </div>
            <div className={styles.guaranteeItem}>
              <Lock size={16} color="var(--color-accent)" />
              <span>Transação criptografada 256-bit com certificação PCI-DSS</span>
            </div>
            <div className={styles.guaranteeItem}>
              <Sparkles size={16} color="var(--color-gold)" />
              <span>Liberação instantânea dos recursos de IA e armazenamento</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
