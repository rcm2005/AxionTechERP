import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarCliente } from '@/services/clientes.service';
import { db } from '@/mocks';
import { paths } from '@/routes/paths';
import type { TipoPessoa, TipoRelacao, PessoaStatus, SituacaoCredito } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoClienteModal({ open, onClose }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [razaoSocialOuNome, setRazaoSocialOuNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PJ');
  const [relacao, setRelacao] = useState<TipoRelacao>('cliente');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [segmento, setSegmento] = useState('');
  const [status, setStatus] = useState<PessoaStatus>('ativo');
  const [nomeError, setNomeError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setRazaoSocialOuNome('');
    setNomeFantasia('');
    setTipoPessoa('PJ');
    setRelacao('cliente');
    setDocumento('');
    setTelefone('');
    setEmail('');
    setSegmento('');
    setStatus('ativo');
    setNomeError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!razaoSocialOuNome.trim()) {
      setNomeError('Razão social ou nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      const novo = await criarCliente({
        tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast',
        tipoPessoa,
        relacao,
        razaoSocialOuNome: razaoSocialOuNome.trim(),
        nomeFantasia: nomeFantasia.trim() || undefined,
        documento: documento.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        endereco: {
          cep: '01001-000',
          logradouro: 'Av. Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
        },
        situacaoCredito: 'aprovado' as SituacaoCredito,
        valorEmAtrasoCentavos: 0,
        status,
        segmento: segmento.trim() || undefined,
      });
      toast.show('Parceiro comercial cadastrado com sucesso!');
      handleClose();
      navigate(paths.cliente(novo.id));
    } catch {
      toast.show('Não foi possível cadastrar o cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Parceiro Comercial / Cliente"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Razão Social / Nome Completo" required error={nomeError}>
        <TextInput
          value={razaoSocialOuNome}
          onChange={(e) => {
            setRazaoSocialOuNome(e.target.value);
            setNomeError('');
          }}
          placeholder="Ex: Indústria Química Paulista S.A."
        />
      </ModalField>
      <ModalField label="Nome Fantasia">
        <TextInput
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          placeholder="Ex: Quimex Brasil"
        />
      </ModalField>
      <ModalField label="Relação Comercial" required>
        <TextSelect value={relacao} onChange={(e) => setRelacao(e.target.value as TipoRelacao)}>
          <option value="cliente">Cliente</option>
          <option value="fornecedor">Fornecedor</option>
          <option value="ambos">Cliente & Fornecedor</option>
          <option value="transportadora">Transportadora</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Tipo de Pessoa" required>
        <TextSelect value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}>
          <option value="PJ">Pessoa Jurídica (PJ)</option>
          <option value="PF">Pessoa Física (PF)</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Documento (CNPJ / CPF)">
        <TextInput
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder={tipoPessoa === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
        />
      </ModalField>
      <ModalField label="Telefone / Celular">
        <TextInput
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 3000-0000"
        />
      </ModalField>
      <ModalField label="E-mail Comercial">
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="comercial@empresa.com.br"
        />
      </ModalField>
      <ModalField label="Segmento / Ramo">
        <TextInput
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
          placeholder="Ex: Manufatura & Plásticos"
        />
      </ModalField>
      <ModalField label="Status Cadastral">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as PessoaStatus)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="prospect">Prospect</option>
          <option value="bloqueado">Bloqueado</option>
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
