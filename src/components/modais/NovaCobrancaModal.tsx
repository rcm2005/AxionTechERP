import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarLancamento } from '@/services/financeiro.service';
import { db } from '@/mocks';
import type { TipoLancamento, StatusLancamento } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovaCobrancaModal({ open, onClose }: Props) {
  const toast = useToast();
  const [tipo, setTipo] = useState<TipoLancamento>('receita');
  const [clienteId, setClienteId] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] = useState<StatusLancamento>('pendente');
  const [descError, setDescError] = useState('');
  const [catError, setCatError] = useState('');
  const [vencError, setVencError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTipo('receita'); setClienteId(''); setProcessoId('');
    setDescricao(''); setCategoria(''); setValorStr('');
    setVencimento(''); setStatus('pendente');
    setDescError(''); setCatError(''); setVencError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    let ok = true;
    if (!descricao.trim()) { setDescError('Descrição é obrigatória.'); ok = false; }
    if (!categoria.trim()) { setCatError('Categoria é obrigatória.'); ok = false; }
    if (!vencimento) { setVencError('Vencimento é obrigatório.'); ok = false; }
    if (!ok) return;
    setSaving(true);
    try {
      await criarLancamento({
        tipo,
        descricao: descricao.trim(),
        categoria: categoria.trim(),
        valorCentavos: Math.round(parseFloat(valorStr.replace(',', '.')) * 100) || 0,
        vencimento,
        status,
        clienteId: clienteId || undefined,
        processoId: processoId || undefined,
      });
      toast.show('Lançamento criado!');
      handleClose();
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova Cobrança / Lançamento"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Tipo" required>
        <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoLancamento)}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Descrição" required error={descError}>
        <TextInput value={descricao} onChange={(e) => { setDescricao(e.target.value); setDescError(''); }} placeholder="Honorários" />
      </ModalField>
      <ModalField label="Categoria" required error={catError}>
        <TextInput value={categoria} onChange={(e) => { setCategoria(e.target.value); setCatError(''); }} placeholder="Honorários" />
      </ModalField>
      <ModalField label="Valor (R$)">
        <TextInput value={valorStr} onChange={(e) => setValorStr(e.target.value)} placeholder="0,00" />
      </ModalField>
      <ModalField label="Vencimento" required error={vencError}>
        <TextInput type="date" value={vencimento} onChange={(e) => { setVencimento(e.target.value); setVencError(''); }} />
      </ModalField>
      <ModalField label="Status">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as StatusLancamento)}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Cliente (opcional)">
        <TextSelect value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">— Nenhum —</option>
          {db.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </TextSelect>
      </ModalField>
      <ModalField label="Processo (opcional)">
        <TextSelect value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
          <option value="">— Nenhum —</option>
          {db.processos.map((p) => <option key={p.id} value={p.id}>{p.numeroCurto} — {p.titulo}</option>)}
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
