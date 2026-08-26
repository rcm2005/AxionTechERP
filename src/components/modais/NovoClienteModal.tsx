import { useState, useEffect } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarCliente } from '@/services/clientes.service';
import type { SituacaoFinanceira, TipoPessoa, ClienteStatus } from '@/types';
import { db } from '@/mocks';

interface NovoClienteModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovoClienteModal({ open, onClose }: NovoClienteModalProps) {
  const toast = useToast();
  
  const [nome, setNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PF');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [status, setStatus] = useState<ClienteStatus>('ativo');
  
  const [nomeError, setNomeError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes or opens
  useEffect(() => {
    if (open) {
      setNome('');
      setTipoPessoa('PF');
      setDocumento('');
      setTelefone('');
      setEmail('');
      setResponsavelId(db.usuarios[0]?.id || '');
      setStatus('ativo');
      setNomeError('');
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!nome.trim()) {
      setNomeError('Nome é obrigatório');
      return;
    }
    setNomeError('');
    setLoading(true);

    try {
      await criarCliente({
        nome,
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
      onClose();
    } catch (error) {
      console.error(error);
      toast.show('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Novo Cliente"
      open={open}
      onClose={onClose}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleSave}
          loading={loading}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ModalField label="Nome" required error={nomeError}>
          <TextInput
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo ou Razão Social"
          />
        </ModalField>

        <ModalField label="Tipo de Pessoa" required>
          <TextSelect
            value={tipoPessoa}
            onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}
          >
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </TextSelect>
        </ModalField>

        <ModalField label="Documento">
          <TextInput
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder={
              tipoPessoa === 'PF'
                ? 'CPF 000.000.000-00'
                : 'CNPJ 00.000.000/0001-00'
            }
          />
        </ModalField>

        <ModalField label="Telefone">
          <TextInput
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </ModalField>

        <ModalField label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </ModalField>

        <ModalField label="Responsável">
          <TextSelect
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
          >
            <option value="">Selecione um responsável...</option>
            {db.usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </TextSelect>
        </ModalField>

        <ModalField label="Status">
          <TextSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as ClienteStatus)}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="prospect">Prospect</option>
          </TextSelect>
        </ModalField>
      </div>
    </Modal>
  );
}
