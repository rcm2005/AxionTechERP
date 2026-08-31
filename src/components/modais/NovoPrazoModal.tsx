import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useProcessos } from '@/hooks/useProcessos';
import { criarPrazo } from '@/services/prazos.service';
import type { Prazo, PrazoStatus } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Quando aberto a partir de um processo, o vínculo já vem fixado. */
  processoIdFixo?: string;
  onCreated?: (prazo: Prazo) => void;
}

export function NovoPrazoModal({ open, onClose, processoIdFixo, onCreated }: Props) {
  const toast = useToast();
  const { data: processos } = useProcessos();

  const [processoId, setProcessoId] = useState(processoIdFixo ?? '');
  const [descricao, setDescricao] = useState('');
  const [dataIntimacao, setDataIntimacao] = useState('');
  const [prazoFatal, setPrazoFatal] = useState('');
  const [diasUteis, setDiasUteis] = useState('');
  const [status, setStatus] = useState<PrazoStatus>('pendente');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setProcessoId(processoIdFixo ?? '');
    setDescricao('');
    setDataIntimacao('');
    setPrazoFatal('');
    setDiasUteis('');
    setStatus('pendente');
    setErros({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validar(): boolean {
    const novos: Record<string, string> = {};
    if (!processoId) novos.processoId = 'Selecione o processo.';
    if (!descricao.trim()) novos.descricao = 'Descreva o ato a ser praticado.';
    if (!prazoFatal) novos.prazoFatal = 'O prazo fatal é obrigatório.';
    if (dataIntimacao && prazoFatal && dataIntimacao > prazoFatal) {
      novos.prazoFatal = 'O prazo fatal não pode ser anterior à intimação.';
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function handleSave() {
    if (!validar()) return;
    setSaving(true);
    try {
      const dias = Number(diasUteis);
      const novo = await criarPrazo({
        processo_id: processoId,
        descricao: descricao.trim(),
        data_intimacao: dataIntimacao || null,
        prazo_fatal: prazoFatal,
        dias_uteis: diasUteis && Number.isFinite(dias) ? dias : null,
        // A UI só produz prazos manuais; 'automatico' é reservado à futura
        // captura de publicações feita pelo backend.
        origem: 'manual',
        status,
      });
      toast.show('Prazo cadastrado com sucesso!');
      handleClose();
      onCreated?.(novo);
    } catch {
      toast.show('Não foi possível cadastrar o prazo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Prazo"
      width="560px"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      {!processoIdFixo && (
        <ModalField label="Processo" required error={erros.processoId}>
          <TextSelect value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
            <option value="">Selecione o processo…</option>
            {(processos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero_cnj} — {p.vara}
              </option>
            ))}
          </TextSelect>
        </ModalField>
      )}

      <ModalField label="Descrição do ato" required error={erros.descricao}>
        <TextInput
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Contestação, recurso ordinário, manifestação sobre laudo"
        />
      </ModalField>

      <ModalField label="Data da intimação">
        <TextInput
          type="date"
          value={dataIntimacao}
          onChange={(e) => setDataIntimacao(e.target.value)}
        />
      </ModalField>

      <ModalField
        label="PRAZO FATAL — data limite para praticar o ato"
        required
        error={erros.prazoFatal}
      >
        <TextInput type="date" value={prazoFatal} onChange={(e) => setPrazoFatal(e.target.value)} />
      </ModalField>

      <ModalField label="Prazo processual (dias úteis)">
        <TextInput
          type="number"
          min={1}
          value={diasUteis}
          onChange={(e) => setDiasUteis(e.target.value)}
          placeholder="Ex: 15"
        />
      </ModalField>

      <ModalField label="Status" required>
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as PrazoStatus)}>
          <option value="pendente">Pendente</option>
          <option value="cumprido">Cumprido</option>
          <option value="perdido">Perdido</option>
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
