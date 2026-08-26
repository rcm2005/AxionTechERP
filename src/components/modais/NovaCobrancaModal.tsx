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
  const [pessoaId, setPessoaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] = useState<StatusLancamento>('pendente');
  const [docFiscal, setDocFiscal] = useState('');
  const [descError, setDescError] = useState('');
  const [catError, setCatError] = useState('');
  const [vencError, setVencError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTipo('receita');
    setPessoaId('');
    setDescricao('');
    setCategoria('');
    setValorStr('');
    setVencimento('');
    setStatus('pendente');
    setDocFiscal('');
    setDescError('');
    setCatError('');
    setVencError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    let ok = true;
    if (!descricao.trim()) {
      setDescError('Descrição é obrigatória.');
      ok = false;
    }
    if (!categoria.trim()) {
      setCatError('Categoria é obrigatória.');
      ok = false;
    }
    if (!vencimento) {
      setVencError('Vencimento é obrigatório.');
      ok = false;
    }
    if (!ok) return;
    setSaving(true);
    try {
      const selectedPessoa = db.pessoas.find((p) => p.id === pessoaId);
      await criarLancamento({
        tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast',
        tipo,
        descricao: descricao.trim(),
        categoria: categoria.trim(),
        valorCentavos: Math.round(parseFloat(valorStr.replace(',', '.')) * 100) || 0,
        emissaoEm: new Date().toISOString().slice(0, 10),
        vencimento,
        status,
        pessoaId: pessoaId || undefined,
        pessoaNome: selectedPessoa ? (selectedPessoa.nomeFantasia || selectedPessoa.razaoSocialOuNome) : undefined,
        numeroDocumentoFiscal: docFiscal.trim() || undefined,
        criadoEm: new Date().toISOString(),
      });
      toast.show('Lançamento criado com sucesso!');
      handleClose();
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  const pessoasFiltradas = db.pessoas.filter((p) =>
    tipo === 'receita'
      ? p.relacao === 'cliente' || p.relacao === 'ambos'
      : p.relacao === 'fornecedor' || p.relacao === 'ambos' || p.relacao === 'transportadora',
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Lançamento Financeiro"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Tipo" required>
        <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoLancamento)}>
          <option value="receita">Receita (Contas a Receber)</option>
          <option value="despesa">Despesa (Contas a Pagar)</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Descrição" required error={descError}>
        <TextInput
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            setDescError('');
          }}
          placeholder="Ex: Faturamento Pedido #1024"
        />
      </ModalField>
      <ModalField label="Categoria" required error={catError}>
        <TextInput
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value);
            setCatError('');
          }}
          placeholder="Ex: Venda de Produtos Acabados"
        />
      </ModalField>
      <ModalField label="Valor (R$)">
        <TextInput
          value={valorStr}
          onChange={(e) => setValorStr(e.target.value)}
          placeholder="0,00"
        />
      </ModalField>
      <ModalField label="Vencimento" required error={vencError}>
        <TextInput
          type="date"
          value={vencimento}
          onChange={(e) => {
            setVencimento(e.target.value);
            setVencError('');
          }}
        />
      </ModalField>
      <ModalField label="Status">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as StatusLancamento)}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
        </TextSelect>
      </ModalField>
      <ModalField label={tipo === 'receita' ? 'Cliente / Pagador' : 'Fornecedor / Beneficiário'}>
        <TextSelect value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
          <option value="">— Nenhum parceiro vinculado —</option>
          {pessoasFiltradas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.razaoSocialOuNome} ({p.documento})
            </option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Documento Fiscal / NF-e (opcional)">
        <TextInput
          value={docFiscal}
          onChange={(e) => setDocFiscal(e.target.value)}
          placeholder="Ex: NF-e 4521"
        />
      </ModalField>
    </Modal>
  );
}
