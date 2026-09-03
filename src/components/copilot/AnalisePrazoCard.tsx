import { Link } from 'react-router';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Pill } from '@/components/ui/Pill/Pill';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { ROTULO_TIPO_ATO, type AnaliseIntimacao, type NivelConfianca } from '@/services/copilot.service';
import { formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';
import type { Processo, Tone } from '@/types';
import styles from './AnalisePrazoCard.module.scss';

const CONFIANCA_TONE: Record<NivelConfianca, Tone> = {
  alta: 'green',
  media: 'amber',
  baixa: 'red',
};

const CONFIANCA_LABEL: Record<NivelConfianca, string> = {
  alta: 'Confiança alta',
  media: 'Confiança média',
  baixa: 'Confiança baixa',
};

interface Props {
  analise: AnaliseIntimacao;
  processoCorrespondente: Processo | null;
  verificandoProcesso: boolean;
  onRevisarECadastrar: () => void;
  onDescartar: () => void;
}

export function AnalisePrazoCard({
  analise,
  processoCorrespondente,
  verificandoProcesso,
  onRevisarECadastrar,
  onDescartar,
}: Props) {
  const precisaRevisaoManual = analise.tipo_ato === 'desconhecido' || analise.confianca === 'baixa';

  return (
    <Card className={styles.root}>
      <CardBody className={styles.body}>
        {/* CNJ + processo match row — three mutually exclusive states, see spec for rationale */}
        <div className={styles.cnjRow}>
          <span className={styles.cnjNumber}>{analise.numero_cnj ?? 'Número CNJ não identificado'}</span>
          {analise.numero_cnj && verificandoProcesso && (
            <Skeleton width="160px" height="16px" />
          )}
          {analise.numero_cnj && !verificandoProcesso && processoCorrespondente && (
            <Link to={paths.processo(processoCorrespondente.id)} className={styles.processoLink}>
              Ver processo cadastrado →
            </Link>
          )}
          {analise.numero_cnj && !verificandoProcesso && !processoCorrespondente && (
            <span className={styles.processoAusente}>
              Processo não cadastrado —{' '}
              <Link to={paths.processos} className={styles.processoLink}>
                cadastrar?
              </Link>
            </span>
          )}
        </div>

        <div className={styles.metaRow}>
          <div>
            <span className={styles.metaLabel}>Tribunal</span>
            <span className={styles.metaValue}>{analise.tribunal ?? '—'}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Vara</span>
            <span className={styles.metaValue}>{analise.vara ?? '—'}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Ato identificado</span>
            <span className={styles.metaValue}>{ROTULO_TIPO_ATO[analise.tipo_ato]}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Data da intimação</span>
            <span className={styles.metaValue}>
              {analise.data_intimacao ? formatDate(analise.data_intimacao) : '—'}
            </span>
          </div>
        </div>

        {precisaRevisaoManual && (
          <Alert
            tone="warning"
            title="Não consegui identificar o ato com segurança"
            description="Revise os dados abaixo ou informe manualmente antes de cadastrar o prazo."
          />
        )}

        <div className={styles.prazoFatalBlock}>
          <span className={styles.metaLabel}>Prazo fatal</span>
          <div className={styles.prazoFatalRow}>
            <span className={styles.prazoFatalValue}>
              {analise.prazo_fatal ? formatDate(analise.prazo_fatal) : 'Não foi possível calcular'}
            </span>
            <Pill tone={CONFIANCA_TONE[analise.confianca]}>{CONFIANCA_LABEL[analise.confianca]}</Pill>
          </div>
        </div>

        <div className={styles.explicacaoBlock}>
          <span className={styles.metaLabel}>Como o prazo foi contado</span>
          <p className={styles.explicacaoTexto}>{analise.explicacao_contagem}</p>
        </div>

        <p className={styles.disclaimer}>A Axion propõe. O prazo só é registrado quando você confirmar.</p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={onRevisarECadastrar}>
            Revisar e cadastrar prazo
          </Button>
          <Button variant="ghost" onClick={onDescartar}>
            Descartar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
