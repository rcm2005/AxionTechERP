import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { useClientes } from '@/hooks/useClientes';
import { criarProcesso } from '@/services/processos.service';
import { CNJ_PLACEHOLDER, aplicarMascaraCnj, isCnjValido } from '@/utils/cnj';
import { normalizarDecimal } from '@/utils/format';
import type { Processo } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamado após criação bem-sucedida — normalmente para recarregar a lista. */
  onCreated?: (processo: Processo) => void;
}

const FASES = ['Inicial', 'Instrução', 'Recursal', 'Execução'];
const STATUS = ['Ativo', 'Suspenso', 'Arquivado'];

export function NovoProcessoModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const { data: clientes } = useClientes();

  const [clienteId, setClienteId] = useState('');
  const [numeroCnj, setNumeroCnj] = useState('');
  const [tribunal, setTribunal] = useState('');
  const [vara, setVara] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [fase, setFase] = useState(FASES[0]);
  const [status, setStatus] = useState(STATUS[0]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setClienteId('');
    setNumeroCnj('');
    setTribunal('');
    setVara('');
    setValorCausa('');
    setFase(FASES[0]);
    setStatus(STATUS[0]);
    setErros({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validar(): boolean {
    const novos: Record<string, string> = {};
    if (!clienteId) novos.clienteId = 'Selecione o cliente do processo.';
    if (!numeroCnj.trim()) novos.numeroCnj = 'Número CNJ é obrigatório.';
    else if (!isCnjValido(numeroCnj)) novos.numeroCnj = `Formato inválido. Use ${CNJ_PLACEHOLDER}.`;
    if (!tribunal.trim()) novos.tribunal = 'Tribunal é obrigatório.';
    if (!vara.trim()) novos.vara = 'Vara é obrigatória.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function handleSave() {
    if (!validar()) return;
    setSaving(true);
    try {
      const novo = await criarProcesso({
        cliente_id: clienteId,
        numero_cnj: numeroCnj.trim(),
        tribunal: tribunal.trim(),
        vara: vara.trim(),
        // As partes são cadastradas na tela do processo; o backend aceita [].
        partes: [],
        valor_causa: normalizarDecimal(valorCausa),
        fase,
        status,
      });
      toast.show('Processo cadastrado com sucesso!');
      handleClose();
      onCreated?.(novo);
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

      <ModalField label={`Número CNJ (${CNJ_PLACEHOLDER})`} required error={erros.numeroCnj}>
        <TextInput
          value={numeroCnj}
          onChange={(e) => setNumeroCnj(aplicarMascaraCnj(e.target.value))}
          placeholder={CNJ_PLACEHOLDER}
          inputMode="numeric"
        />
      </ModalField>

      <ModalField label="Tribunal" required error={erros.tribunal}>
        <TextInput
          value={tribunal}
          onChange={(e) => setTribunal(e.target.value)}
          placeholder="Ex: TJSP, TRT-2, TRF-3"
        />
      </ModalField>

      <ModalField label="Vara" required error={erros.vara}>
        <TextInput
          value={vara}
          onChange={(e) => setVara(e.target.value)}
          placeholder="Ex: 12ª Vara Cível de São Paulo"
        />
      </ModalField>

      <ModalField label="Valor da Causa (R$)">
        <TextInput
          value={valorCausa}
          onChange={(e) => setValorCausa(e.target.value)}
          placeholder="15000.00"
          inputMode="decimal"
        />
      </ModalField>

      <ModalField label="Fase" required>
        <TextSelect value={fase} onChange={(e) => setFase(e.target.value)}>
          {FASES.map((f) => (
            <option key={f} value={f}>
              {f}
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
