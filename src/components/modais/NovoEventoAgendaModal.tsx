import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { Alert } from '@/components/ui/Alert/Alert';
import { useToast } from '@/contexts/ToastContext';
import { useProcessos } from '@/hooks/useProcessos';
import { useUsuarios } from '@/hooks/useAgenda';
import { ScheduleConflictError, createScheduleEvent } from '@/services/agenda.service';
import type { AgendaEvento, AgendaEventoTipo } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When opened from a case, the link is already fixed. */
  processoIdFixo?: string;
  onCreated?: (event: AgendaEvento) => void;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Schedule conflict message returned by the server (HTTP 409). */
  const [conflict, setConflict] = useState('');
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
    setErrors({});
    setConflict('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!responsavelId) newErrors.responsavelId = 'Selecione o responsável.';
    if (!data) newErrors.data = 'Informe a data.';
    if (!hora) newErrors.hora = 'Informe o horário.';
    if (!local.trim()) newErrors.local = 'Informe o local (fórum, sala, link).';
    const minutes = Number(duracao);
    if (!Number.isFinite(minutes) || minutes <= 0) newErrors.duracao = 'Duração deve ser maior que zero.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    setConflict('');
    if (!validate()) return;
    setSaving(true);
    try {
      const newEvent = await createScheduleEvent({
        processo_id: processoId || null,
        responsavel_usuario_id: responsavelId,
        tipo,
        // Input is local; backend operates in ISO/UTC.
        data_hora: new Date(`${data}T${hora}`).toISOString(),
        duracao_minutos: Number(duracao),
        local: local.trim(),
        status,
      });
      toast.show('Compromisso agendado com sucesso!');
      handleClose();
      onCreated?.(newEvent);
    } catch (error) {
      // Schedule conflict is a business validation, not a failure: the server
      // message stays on the form and the user chooses another time.
      if (error instanceof ScheduleConflictError) {
        setConflict(error.message);
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
      {conflict && (
        <Alert tone="danger" title="Conflito de agenda" description={conflict} />
      )}

      <ModalField label="Responsável" required error={errors.responsavelId}>
        <TextSelect value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Selecione o responsável…</option>
          {(usuarios ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
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

      <ModalField label="Data" required error={errors.data}>
        <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </ModalField>

      <ModalField label="Horário" required error={errors.hora}>
        <TextInput type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      </ModalField>

      <ModalField label="Duração (minutos)" required error={errors.duracao}>
        <TextInput
          type="number"
          min={5}
          step={5}
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
        />
      </ModalField>

      <ModalField label="Local" required error={errors.local}>
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
