import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { Alert } from '@/components/ui/Alert/Alert';
import { useToast } from '@/contexts/ToastContext';
import { useProcessos } from '@/hooks/useProcessos';
import { useUsuarios } from '@/hooks/useAgenda';
import { ConflitoAgendaError, criarAgendaEvento } from '@/services/agenda.service';
import type { AgendaEvento, AgendaEventoTipo } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Quando aberto a partir de um processo, o vínculo já vem fixado. */
  processoIdFixo?: string;
  onCreated?: (evento: AgendaEvento) => void;
}

export function NovoEventoAgendaModal({ open, onClose, processoIdFixo, onCreated }: Props) {
  const toast = useToast();
  const { data: processos } = useProcessos();
  const { data: usuarios } = useUsuarios();

  const [processoId, setProcessoId] = useState(processoIdFixo ?? '');
  const [responsavelId, setResponsavelId] = useState('');
  const [tipo, setTipo] = useState<AgendaEventoTipo>('audiencia');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('09:00');
  const [duracao, setDuracao] = useState('60');
  const [local, setLocal] = useState('');
  const [status, setStatus] = useState('agendado');
  const [erros, setErros] = useState<Record<string, string>>({});
  /** Mensagem de conflito de horário devolvida pelo servidor (HTTP 409). */
  const [conflito, setConflito] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setProcessoId(processoIdFixo ?? '');
    setResponsavelId('');
    setTipo('audiencia');
    setData('');
    setHora('09:00');
    setDuracao('60');
    setLocal('');
    setStatus('agendado');
    setErros({});
    setConflito('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validar(): boolean {
    const novos: Record<string, string> = {};
    if (!responsavelId) novos.responsavelId = 'Selecione o responsável.';
    if (!data) novos.data = 'Informe a data.';
    if (!hora) novos.hora = 'Informe o horário.';
    if (!local.trim()) novos.local = 'Informe o local (fórum, sala, link).';
    const minutos = Number(duracao);
    if (!Number.isFinite(minutos) || minutos <= 0) novos.duracao = 'Duração deve ser maior que zero.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function handleSave() {
    setConflito('');
    if (!validar()) return;
    setSaving(true);
    try {
      const novo = await criarAgendaEvento({
        processo_id: processoId || null,
        responsavel_usuario_id: responsavelId,
        tipo,
        // O input é local; o backend trabalha em ISO/UTC.
        data_hora: new Date(`${data}T${hora}`).toISOString(),
        duracao_minutos: Number(duracao),
        local: local.trim(),
        status,
      });
      toast.show('Compromisso agendado com sucesso!');
      handleClose();
      onCreated?.(novo);
    } catch (erro) {
      // Conflito de horário é validação de negócio, não falha: a mensagem do
      // servidor fica no formulário e o usuário escolhe outro horário.
      if (erro instanceof ConflitoAgendaError) {
        setConflito(erro.message);
      } else {
        toast.show('Não foi possível agendar o compromisso.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Compromisso"
      width="560px"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} confirmLabel="Agendar" />}
    >
      {conflito && (
        <Alert tone="danger" title="Conflito de agenda" description={conflito} />
      )}

      <ModalField label="Responsável" required error={erros.responsavelId}>
        <TextSelect value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Selecione o responsável…</option>
          {(usuarios ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label="Tipo" required>
        <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value as AgendaEventoTipo)}>
          <option value="audiencia">Audiência</option>
          <option value="reuniao">Reunião</option>
          <option value="outro">Outro</option>
        </TextSelect>
      </ModalField>

      {!processoIdFixo && (
        <ModalField label="Processo vinculado">
          <TextSelect value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
            <option value="">Sem vínculo com processo</option>
            {(processos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero_cnj} — {p.vara}
              </option>
            ))}
          </TextSelect>
        </ModalField>
      )}

      <ModalField label="Data" required error={erros.data}>
        <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </ModalField>

      <ModalField label="Horário" required error={erros.hora}>
        <TextInput type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      </ModalField>

      <ModalField label="Duração (minutos)" required error={erros.duracao}>
        <TextInput
          type="number"
          min={5}
          step={5}
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
        />
      </ModalField>

      <ModalField label="Local" required error={erros.local}>
        <TextInput
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Ex: Fórum João Mendes — Sala 1204, ou link da videoconferência"
        />
      </ModalField>

      <ModalField label="Status" required>
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="agendado">Agendado</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
