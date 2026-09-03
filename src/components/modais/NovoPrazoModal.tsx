import { useEffect, useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useProcessos } from '@/hooks/useProcessos';
import { createDeadline } from '@/services/prazos.service';
import type { Prazo, PrazoStatus } from '@/types';

export interface NovoPrazoInitialValues {
  processoId?: string;
  description?: string;
  noticeDate?: string | null;
  fatalDeadline?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** When opened from a case, the binding is already fixed. */
  processoIdFixo?: string;
  onCreated?: (deadline: Prazo) => void;
  initialValues?: NovoPrazoInitialValues;
}

export function NovoPrazoModal({ open, onClose, processoIdFixo, onCreated, initialValues }: Props) {
  const toast = useToast();
  const { data: cases } = useProcessos();

  const [processoId, setProcessoId] = useState(processoIdFixo ?? '');
  const [description, setDescription] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [fatalDeadline, setFatalDeadline] = useState('');
  const [businessDays, setBusinessDays] = useState('');
  const [status, setStatus] = useState<PrazoStatus>('pendente');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Re-seed every time the modal opens (it stays mounted between opens — the component instance
  // is shared across multiple analyses in the Copilot flow, so a plain useState default only
  // applies on first mount and would not pick up a new `initialValues` on a later open).
  useEffect(() => {
    if (!open) return;
    setProcessoId(initialValues?.processoId ?? processoIdFixo ?? '');
    setDescription(initialValues?.description ?? '');
    setNoticeDate(initialValues?.noticeDate ?? '');
    setFatalDeadline(initialValues?.fatalDeadline ?? '');
    setBusinessDays('');
    setStatus('pendente');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setProcessoId(processoIdFixo ?? '');
    setDescription('');
    setNoticeDate('');
    setFatalDeadline('');
    setBusinessDays('');
    setStatus('pendente');
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!processoId) newErrors.processoId = 'Selecione o processo.';
    if (!description.trim()) newErrors.description = 'Descreva o ato a ser praticado.';
    if (!fatalDeadline) newErrors.fatalDeadline = 'O prazo fatal é obrigatório.';
    if (noticeDate && fatalDeadline && noticeDate > fatalDeadline) {
      newErrors.fatalDeadline = 'O prazo fatal não pode ser anterior à intimação.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const days = Number(businessDays);
      const newDeadline = await createDeadline({
        processo_id: processoId,
        descricao: description.trim(),
        data_intimacao: noticeDate || null,
        prazo_fatal: fatalDeadline,
        dias_uteis: businessDays && Number.isFinite(days) ? days : null,
        // The UI only produces manual deadlines; 'automatico' is reserved for future
        // publication scraping handled by the backend.
        origem: 'manual',
        status,
      });
      toast.show('Prazo cadastrado com sucesso!');
      handleClose();
      onCreated?.(newDeadline);
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
        <ModalField label="Processo" required error={errors.processoId}>
          <TextSelect value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
            <option value="">Selecione o processo…</option>
            {(cases ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.numero_cnj} — {c.vara}
              </option>
            ))}
          </TextSelect>
        </ModalField>
      )}

      <ModalField label="Descrição do ato" required error={errors.description}>
        <TextInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Contestação, recurso ordinário, manifestação sobre laudo"
        />
      </ModalField>

      <ModalField label="Data da intimação">
        <TextInput
          type="date"
          value={noticeDate}
          onChange={(e) => setNoticeDate(e.target.value)}
        />
      </ModalField>

      <ModalField
        label="PRAZO FATAL — data limite para praticar o ato"
        required
        error={errors.fatalDeadline}
      >
        <TextInput type="date" value={fatalDeadline} onChange={(e) => setFatalDeadline(e.target.value)} />
      </ModalField>

      <ModalField label="Prazo processual (dias úteis)">
        <TextInput
          type="number"
          min={1}
          value={businessDays}
          onChange={(e) => setBusinessDays(e.target.value)}
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
