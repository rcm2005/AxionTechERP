import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useClientes } from '@/hooks/useClientes';
import { createCase } from '@/services/processos.service';
import { CNJ_PLACEHOLDER, applyCnjMask, isCnjValid } from '@/utils/cnj';
import { normalizarDecimal } from '@/utils/format';
import type { Processo } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after successful creation — usually to reload the list. */
  onCreated?: (caseItem: Processo) => void;
}

const PHASES = ['Inicial', 'Instrução', 'Recursal', 'Execução'];
const STATUS = ['Ativo', 'Suspenso', 'Arquivado'];

export function NovoProcessoModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const { data: clients } = useClientes();

  const [clientId, setClientId] = useState('');
  const [cnjNumber, setCnjNumber] = useState('');
  const [court, setCourt] = useState('');
  const [courtDivision, setCourtDivision] = useState('');
  const [caseValue, setCaseValue] = useState('');
  const [phase, setPhase] = useState(PHASES[0]);
  const [status, setStatus] = useState(STATUS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setClientId('');
    setCnjNumber('');
    setCourt('');
    setCourtDivision('');
    setCaseValue('');
    setPhase(PHASES[0]);
    setStatus(STATUS[0]);
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.clientId = 'Selecione o cliente do processo.';
    if (!cnjNumber.trim()) newErrors.cnjNumber = 'Número CNJ é obrigatório.';
    else if (!isCnjValid(cnjNumber)) newErrors.cnjNumber = `Formato inválido. Use ${CNJ_PLACEHOLDER}.`;
    if (!court.trim()) newErrors.court = 'Tribunal é obrigatório.';
    if (!courtDivision.trim()) newErrors.courtDivision = 'Vara é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const newCase = await createCase({
        cliente_id: clientId,
        numero_cnj: cnjNumber.trim(),
        tribunal: court.trim(),
        vara: courtDivision.trim(),
        // Parties are registered on the case screen; the backend accepts [].
        partes: [],
        valor_causa: normalizarDecimal(caseValue),
        fase: phase,
        status,
      });
      toast.show('Processo cadastrado com sucesso!');
      handleClose();
      onCreated?.(newCase);
    } catch {
      toast.show('Não foi possível cadastrar o processo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Processo"
      width="560px"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Cliente" required error={errors.clientId}>
        <TextSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione o cliente…</option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.razaoSocialOuNome}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label={`Número CNJ (${CNJ_PLACEHOLDER})`} required error={errors.cnjNumber}>
        <TextInput
          value={cnjNumber}
          onChange={(e) => setCnjNumber(applyCnjMask(e.target.value))}
          placeholder={CNJ_PLACEHOLDER}
          inputMode="numeric"
        />
      </ModalField>

      <ModalField label="Tribunal" required error={errors.court}>
        <TextInput
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          placeholder="Ex: TJSP, TRT-2, TRF-3"
        />
      </ModalField>

      <ModalField label="Vara" required error={errors.courtDivision}>
        <TextInput
          value={courtDivision}
          onChange={(e) => setCourtDivision(e.target.value)}
          placeholder="Ex: 12ª Vara Cível de São Paulo"
        />
      </ModalField>

      <ModalField label="Valor da Causa (R$)">
        <TextInput
          value={caseValue}
          onChange={(e) => setCaseValue(e.target.value)}
          placeholder="15000.00"
          inputMode="decimal"
        />
      </ModalField>

      <ModalField label="Fase" required>
        <TextSelect value={phase} onChange={(e) => setPhase(e.target.value)}>
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label="Status" required>
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
