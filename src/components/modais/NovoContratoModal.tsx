import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useClientes } from '@/hooks/useClientes';
import { createContract } from '@/services/contratos.service';
import { normalizarDecimal } from '@/utils/format';
import type { Contrato } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (contract: Contrato) => void;
}

const TYPES = ['consultoria', 'mensal', 'exito', 'parecer'];
const STATUSES = ['ativo', 'encerrado', 'cancelado'];

export function NovoContratoModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const { data: clients } = useClientes();

  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState(STATUSES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setClientId('');
    setTitle('');
    setType(TYPES[0]);
    setValue('');
    setStartDate('');
    setEndDate('');
    setStatus(STATUSES[0]);
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.clientId = 'Selecione o cliente.';
    if (!title.trim()) newErrors.title = 'Título é obrigatório.';
    if (!startDate) newErrors.startDate = 'Data de início é obrigatória.';
    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = 'A data de término não pode ser anterior ao início.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const newContract = await createContract({
        cliente_id: clientId,
        titulo: title.trim(),
        tipo: type,
        // `valor` is optional in the backend contract — contingency contracts
        // are usually percentage-based and do not have a fixed value.
        valor: value.trim() ? normalizarDecimal(value) : null,
        data_inicio: startDate,
        data_fim: endDate || null,
        status,
      });
      toast.show('Contrato cadastrado com sucesso!');
      handleClose();
      onCreated?.(newContract);
    } catch {
      toast.show('Não foi possível cadastrar o contrato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Contrato"
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

      <ModalField label="Título" required error={errors.title}>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Assessoria jurídica contenciosa — cível"
        />
      </ModalField>

      <ModalField label="Tipo" required>
        <TextSelect value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label="Valor (R$) — opcional">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="8500.00"
          inputMode="decimal"
        />
      </ModalField>

      <ModalField label="Início da vigência" required error={errors.startDate}>
        <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </ModalField>

      <ModalField label="Término da vigência" error={errors.endDate}>
        <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </ModalField>

      <ModalField label="Status" required>
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
