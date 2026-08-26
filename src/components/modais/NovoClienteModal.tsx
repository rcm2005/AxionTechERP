import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarCliente } from '@/services/clientes.service';
import { db } from '@/mocks';
import type { TipoPessoa, ClienteStatus, SituacaoFinanceira } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoClienteModal({ open, onClose }: Props) {
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PF');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavelId, setResponsavelId] = useState(db.usuarios[0]?.id ?? '');
  const [status, setStatus] = useState<ClienteStatus>('ativo');
  const [nomeError, setNomeError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setNome(''); setTipoPessoa('PF'); setDocumento('');
    setTelefone(''); setEmail(''); setResponsavelId(db.usuarios[0]?.id ?? '');
    setStatus('ativo'); setNomeError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    if (!nome.trim()) { setNomeError('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      await criarCliente({
        nome: nome.trim(),
        tipoPessoa,
        documento,
        telefone,
        email,
        responsavelId,
        status,
        situacaoFinanceira: 'sem_lancamentos' as SituacaoFinanceira,
        valorEmAtrasoCentavos: 0,
      });
      toast.show('Cliente criado com sucesso!');
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Cliente"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Nome" required error={nomeError}>
        <TextInput value={nome} onChange={(e) => { setNome(e.target.value); setNomeError(''); }} placeholder="Nome completo ou razão social" />
      </ModalField>
      <ModalField label="Tipo de Pessoa" required>
        <TextSelect value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Documento">
        <TextInput value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder={tipoPessoa === 'PF' ? 'CPF 000.000.000-00' : 'CNPJ 00.000.000/0001-00'} />
      </ModalField>
      <ModalField label="Telefone">
        <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
      </ModalField>
      <ModalField label="E-mail">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
      </ModalField>
      <ModalField label="Responsável" required>
        <TextSelect value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          {db.usuarios.filter((u) => u.role !== 'financeiro').map((u) => (
            <option key={u.id} value={u.id}>{u.nomeExibicao}</option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Status">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as ClienteStatus)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="prospect">Prospect</option>
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
