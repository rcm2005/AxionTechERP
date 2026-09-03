import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { listClients } from '@/services/clientes.service';
import { createEntry } from '@/services/financeiro.service';
import { USE_MOCKS } from '@/services/mockAdapter';
import { db } from '@/mocks';
import type { TipoLancamento, StatusLancamento } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTipo?: TipoLancamento;
}

export function NovaCobrancaModal({ open, onClose, initialTipo }: Props) {
  const { empresaAtivaId } = useAuth();
  const toast = useToast();
  // `initialTipo` only needs to take effect as this component's *initial* state — the caller
  // (FinanceiroPage.tsx) remounts this component on open by keying it off `initialTipo`, so a
  // plain useState initializer is enough; no effect/ref needed to keep it in sync while open.
  const [tipo, setTipo] = useState<TipoLancamento>(initialTipo ?? 'receita');
  const clientsState = useAsync(() => listClients(), []);

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
      const selectedPerson = db.pessoas.find((person) => person.id === pessoaId);
      await createEntry({
        tenantId: empresaAtivaId,
        tipo,
        descricao: descricao.trim(),
        categoria: categoria.trim(),
        valorCentavos: Math.round(parseFloat(valorStr.replace(',', '.')) * 100) || 0,
        emissaoEm: new Date().toISOString().slice(0, 10),
        vencimento,
        status,
        pessoaId: pessoaId || undefined,
        pessoaNome: selectedPerson ? (selectedPerson.nomeFantasia || selectedPerson.razaoSocialOuNome) : undefined,
        numeroDocumentoFiscal: docFiscal.trim() || undefined,
        criadoEm: new Date().toISOString(),
      });
      toast.show('Lançamento criado com sucesso!');
      handleClose();
      window.location.reload();
    } catch {
      toast.show('Não foi possível cadastrar o lançamento.');
    } finally {
      setSaving(false);
    }
  }

  const filteredPersons = USE_MOCKS
    ? db.pessoas.filter((person) =>
        tipo === 'receita'
          ? person.relacao === 'cliente' || person.relacao === 'ambos'
          : person.relacao === 'fornecedor' || person.relacao === 'ambos' || person.relacao === 'transportadora',
      )
    : (clientsState.data ?? []);

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
          {filteredPersons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.razaoSocialOuNome} ({person.documento})
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
