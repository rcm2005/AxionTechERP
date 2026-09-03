import { useMemo, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { TextArea } from '@/components/ui/TextField/TextField';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AnalisePrazoCard } from '@/components/copilot/AnalisePrazoCard';
import { NovoPrazoModal, type NovoPrazoInitialValues } from '@/components/modais/NovoPrazoModal';
import { analisarIntimacao, ROTULO_TIPO_ATO, type ResultadoAnaliseIntimacao } from '@/services/copilot.service';
import { listCases } from '@/services/processos.service';
import type { Processo } from '@/types';
import styles from './CopilotPage.module.scss';

export function CopilotPage() {
  useDocumentTitle('Copiloto de Prazos');

  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnaliseIntimacao | null>(null);
  const [erroRede, setErroRede] = useState(false);
  const [processoCorrespondente, setProcessoCorrespondente] = useState<Processo | null>(null);
  const [verificandoProcesso, setVerificandoProcesso] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  async function handleAnalisar() {
    if (!texto.trim() || loading) return;

    setLoading(true);
    setErroRede(false);
    setResultado(null);
    setProcessoCorrespondente(null);

    try {
      const data = await analisarIntimacao(texto.trim());
      setResultado(data);

      if (data.ok && data.numero_cnj) {
        setVerificandoProcesso(true);
        try {
          const cases = await listCases();
          const match = cases.find((c) => c.numero_cnj === data.numero_cnj);
          setProcessoCorrespondente(match ?? null);
        } catch {
          setProcessoCorrespondente(null);
        } finally {
          setVerificandoProcesso(false);
        }
      }
    } catch {
      setErroRede(true);
    } finally {
      setLoading(false);
    }
  }

  function handleDescartar() {
    setTexto('');
    setResultado(null);
    setProcessoCorrespondente(null);
    setErroRede(false);
  }

  const initialValuesParaModal = useMemo((): NovoPrazoInitialValues | undefined => {
    if (!resultado || !resultado.ok) return undefined;
    return {
      processoId: processoCorrespondente?.id,
      description: ROTULO_TIPO_ATO[resultado.tipo_ato],
      noticeDate: resultado.data_intimacao?.slice(0, 10) ?? null,
      fatalDeadline: resultado.prazo_fatal?.slice(0, 10) ?? null,
    };
  }, [resultado, processoCorrespondente]);

  function handleModalCreated() {
    handleDescartar();
  }

  return (
    <div className={styles.container}>
      <PageHead
        title="Copiloto de Prazos"
        subtitle="Cole o texto de uma intimação para identificar o prazo fatal, com a contagem explicada."
      />

      <Card>
        <CardBody className={styles.formBody}>
          <TextArea
            rows={10}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole aqui o texto da intimação recebida (diário oficial, PJe, e-mail do cartório...)."
          />
          <div className={styles.formActions}>
            <Button
              variant="primary"
              onClick={handleAnalisar}
              disabled={!texto.trim() || loading}
            >
              {loading ? 'Analisando…' : 'Analisar intimação'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <CardBody className={styles.loadingBody}>
            <Skeleton width="220px" height="18px" />
            <div className={styles.loadingGrid}>
              <Skeleton height="36px" />
              <Skeleton height="36px" />
              <Skeleton height="36px" />
              <Skeleton height="36px" />
            </div>
            <Skeleton height="64px" />
            <Skeleton height="44px" />
          </CardBody>
        </Card>
      ) : erroRede ? (
        <Alert
          tone="danger"
          title="Não foi possível analisar agora"
          description="Falha ao conectar com o serviço de análise. Tente novamente."
          action={
            <Button variant="default" onClick={handleAnalisar}>
              Tentar novamente
            </Button>
          }
        />
      ) : resultado?.ok === false && resultado.motivo === 'texto_vazio' ? (
        <Alert
          tone="warning"
          title="Texto vazio"
          description="Cole o texto da intimação antes de analisar."
        />
      ) : resultado?.ok === false && resultado.motivo === 'input_suspeito' ? (
        <Alert
          tone="warning"
          title="Não foi possível identificar uma intimação válida"
          description="O texto colado não parece ser uma intimação processual. Revise o conteúdo e tente novamente."
        />
      ) : resultado?.ok === true ? (
        <AnalisePrazoCard
          analise={resultado}
          processoCorrespondente={processoCorrespondente}
          verificandoProcesso={verificandoProcesso}
          onRevisarECadastrar={() => setModalAberto(true)}
          onDescartar={handleDescartar}
        />
      ) : null}

      <NovoPrazoModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        initialValues={initialValuesParaModal}
        onCreated={handleModalCreated}
      />
    </div>
  );
}
