import { useToast } from '@/contexts/ToastContext';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import styles from './AtalhosCard.module.scss';

const ATALHOS = [
  { label: '+ Novo cliente', mensagem: 'Formulário de novo cliente aberto' },
  { label: '+ Novo processo', mensagem: 'Formulário de novo processo aberto' },
  { label: '+ Nova tarefa', mensagem: 'Formulário de nova tarefa aberto' },
  { label: '+ Novo compromisso', mensagem: 'Formulário de novo compromisso aberto' },
];

export function AtalhosCard() {
  const toast = useToast();

  return (
    <Card>
      <CardHead title="Atalhos" />
      <CardBody>
        <div className={styles.grid}>
          {ATALHOS.map((atalho) => (
            <button key={atalho.label} type="button" onClick={() => toast.show(atalho.mensagem)}>
              {atalho.label}
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
