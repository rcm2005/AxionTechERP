import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarProcesso } from '@/services/processos.service';
import { db } from '@/mocks';
import { paths } from '@/routes/paths';
import type { AreaJuridica, ProcessoStatus } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoProcessoModal({ open, onClose }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState<AreaJuridica>('civel');
  const [clienteId, setClienteId] = useState(db.clientes[0]?.id ?? '');
  const [parteContraria, setParteContraria] = useState('');
  const [tribunal, setTribunal] = useState('TJSP');
  const [vara, setVara] = useState('');
  const [advogadoId, setAdvogadoId] = useState(db.usuarios[0]?.id ?? '');
  const [valorStr, setValorStr] = useState('');
  const [faseProcessual, setFaseProcessual] = useState('Inicial');
  const [tituloError, setTituloError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitulo(''); setArea('civel'); setClienteId(db.clientes[0]?.id ?? '');
    setParteContraria(''); setTribunal('TJSP'); setVara('');
    setAdvogadoId(db.usuarios[0]?.id ?? ''); setValorStr('');
    setFaseProcessual('Inicial'); setTituloError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    if (!titulo.trim()) { setTituloError('Título é obrigatório.'); return; }
    setSaving(true);
    try {
      const valorCausaCentavos = Math.round(parseFloat(valorStr.replace(',', '.')) * 100) || 0;
      const ts = String(Date.now());
      const novo = await criarProcesso({
        titulo: titulo.trim(),
        area,
        status: 'em_andamento' as ProcessoStatus,
        faseProcessual,
        clienteId,
        parteContraria,
        tribunal,
        vara,
        advogadoId,
        numeroCnj: `${ts.slice(-5)}-00.2026.8.26.0100`,
        numeroCurto: ts.slice(-5),
        valorCausaCentavos,
      });
      toast.show('Processo criado!');
      handleClose();
      navigate(paths.processoTab(novo.id, 'resumo'));
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
      <ModalField label="Título" required error={tituloError}>
        <TextInput value={titulo} onChange={(e) => { setTitulo(e.target.value); setTituloError(''); }} placeholder="Ação de Cobrança" />
      </ModalField>
      <ModalField label="Área Jurídica" required>
        <TextSelect value={area} onChange={(e) => setArea(e.target.value as AreaJuridica)}>
          <option value="civel">Cível</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="tributario">Tributário</option>
          <option value="familia">Família</option>
          <option value="consumidor">Consumidor</option>
          <option value="empresarial">Empresarial</option>
          <option value="penal">Penal</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Cliente" required>
        <TextSelect value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          {db.clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Parte Contrária">
        <TextInput value={parteContraria} onChange={(e) => setParteContraria(e.target.value)} placeholder="Nome da parte contrária" />
      </ModalField>
      <ModalField label="Tribunal">
        <TextInput value={tribunal} onChange={(e) => setTribunal(e.target.value)} placeholder="TJSP" />
      </ModalField>
      <ModalField label="Vara">
        <TextInput value={vara} onChange={(e) => setVara(e.target.value)} placeholder="1ª Vara Cível" />
      </ModalField>
      <ModalField label="Fase Processual">
        <TextInput value={faseProcessual} onChange={(e) => setFaseProcessual(e.target.value)} placeholder="Inicial" />
      </ModalField>
      <ModalField label="Advogado Responsável" required>
        <TextSelect value={advogadoId} onChange={(e) => setAdvogadoId(e.target.value)}>
          {db.usuarios.filter((u) => u.role !== 'financeiro').map((u) => (
            <option key={u.id} value={u.id}>{u.nomeExibicao}</option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Valor da Causa (R$)">
        <TextInput value={valorStr} onChange={(e) => setValorStr(e.target.value)} placeholder="0,00" />
      </ModalField>
    </Modal>
  );
}
