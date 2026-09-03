import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/services/clientes.service';
import { db } from '@/mocks';
import { paths } from '@/routes/paths';
import type { TipoPessoa, SituacaoCredito } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoClienteModal({ open, onClose }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [razaoSocialOuNome, setRazaoSocialOuNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PJ');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setRazaoSocialOuNome('');
    setTipoPessoa('PJ');
    setDocumento('');
    setTelefone('');
    setEmail('');
    setNameError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!razaoSocialOuNome.trim()) {
      setNameError('Razão social ou nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      const created = await createClient({
        tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast',
        tipoPessoa,
        razaoSocialOuNome: razaoSocialOuNome.trim(),
        documento: documento.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        situacaoCredito: 'aprovado' as SituacaoCredito,
        valorEmAtrasoCentavos: 0,
      });
      toast.show('Parceiro comercial cadastrado com sucesso!');
      handleClose();
      navigate(paths.cliente(created.id));
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
      <ModalField label="Razão Social / Nome Completo" required error={nameError}>
        <TextInput
          value={razaoSocialOuNome}
          onChange={(e) => {
            setRazaoSocialOuNome(e.target.value);
            setNameError('');
          }}
          placeholder="Ex: Indústria Química Paulista S.A."
        />
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
    </Modal>
  );
}
