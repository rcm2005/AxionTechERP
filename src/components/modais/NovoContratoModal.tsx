import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useClientes } from '@/hooks/useClientes';
import { criarContrato } from '@/services/contratos.service';
import { normalizarDecimal } from '@/utils/format';
import type { Contrato } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (contrato: Contrato) => void;
}

const TIPOS = ['consultoria', 'mensal', 'exito', 'parecer'];
const STATUS = ['ativo', 'encerrado', 'cancelado'];

export function NovoContratoModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const { data: clientes } = useClientes();

  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [valor, setValor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState(STATUS[0]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setClienteId('');
    setTitulo('');
    setTipo(TIPOS[0]);
    setValor('');
    setDataInicio('');
    setDataFim('');
    setStatus(STATUS[0]);
    setErros({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validar(): boolean {
    const novos: Record<string, string> = {};
    if (!clienteId) novos.clienteId = 'Selecione o cliente.';
    if (!titulo.trim()) novos.titulo = 'Título é obrigatório.';
    if (!dataInicio) novos.dataInicio = 'Data de início é obrigatória.';
    if (dataFim && dataInicio && dataFim < dataInicio) {
      novos.dataFim = 'A data de término não pode ser anterior ao início.';
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function handleSave() {
    if (!validar()) return;
    setSaving(true);
    try {
      const novo = await criarContrato({
        cliente_id: clienteId,
        titulo: titulo.trim(),
        tipo,
        // `valor` é opcional no contrato do backend — contratos de êxito
        // costumam ser percentuais e ficam sem valor fixo.
        valor: valor.trim() ? normalizarDecimal(valor) : null,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        status,
      });
      toast.show('Contrato cadastrado com sucesso!');
      handleClose();
      onCreated?.(novo);
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
      <ModalField label="Cliente" required error={erros.clienteId}>
        <TextSelect value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecione o cliente…</option>
          {(clientes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.razaoSocialOuNome}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label="Título" required error={erros.titulo}>
        <TextInput
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Assessoria jurídica contenciosa — cível"
        />
      </ModalField>

      <ModalField label="Tipo" required>
        <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </TextSelect>
      </ModalField>

      <ModalField label="Valor (R$) — opcional">
        <TextInput
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="8500.00"
          inputMode="decimal"
        />
      </ModalField>

      <ModalField label="Início da vigência" required error={erros.dataInicio}>
        <TextInput type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
      </ModalField>

      <ModalField label="Término da vigência" error={erros.dataFim}>
        <TextInput type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
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
