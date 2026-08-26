import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect, TextArea } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarEvento } from '@/services/agenda.service';
import { db } from '@/mocks';
import type { TipoEvento, PrioridadeEvento } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovaTarefaModal({ open, onClose }: Props) {
  const toast = useToast();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoEvento>('tarefa');
  const [prioridade, setPrioridade] = useState<PrioridadeEvento>('normal');
  const [responsavelId, setResponsavelId] = useState(db.usuarios[0]?.id ?? '');
  const [inicio, setInicio] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tituloError, setTituloError] = useState('');
  const [inicioError, setInicioError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitulo(''); setTipo('tarefa'); setPrioridade('normal');
    setResponsavelId(db.usuarios[0]?.id ?? ''); setInicio('');
    setProcessoId(''); setDescricao('');
    setTituloError(''); setInicioError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    let ok = true;
    if (!titulo.trim()) { setTituloError('Título é obrigatório.'); ok = false; }
    if (!inicio) { setInicioError('Data é obrigatória.'); ok = false; }
    if (!ok) return;
    setSaving(true);
    try {
      await criarEvento({
        titulo: titulo.trim(),
        tipo,
        prioridade,
        responsavelId,
        inicio,
        diaInteiro: true,
        processoId: processoId || undefined,
        descricao: descricao || undefined,
      });
      toast.show('Tarefa criada!');
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
      title="Nova Tarefa / Evento"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <ModalField label="Título" required error={tituloError}>
        <TextInput value={titulo} onChange={(e) => { setTitulo(e.target.value); setTituloError(''); }} placeholder="Título da tarefa" />
      </ModalField>
      <ModalField label="Tipo">
        <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}>
          <option value="tarefa">Tarefa</option>
          <option value="prazo">Prazo</option>
          <option value="audiencia">Audiência</option>
          <option value="reuniao">Reunião</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Prioridade">
        <TextSelect value={prioridade} onChange={(e) => setPrioridade(e.target.value as PrioridadeEvento)}>
          <option value="normal">Normal</option>
          <option value="atencao">Atenção</option>
          <option value="urgente">Urgente</option>
        </TextSelect>
      </ModalField>
      <ModalField label="Responsável" required>
        <TextSelect value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          {db.usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nomeExibicao}</option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Data" required error={inicioError}>
        <TextInput type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); setInicioError(''); }} />
      </ModalField>
      <ModalField label="Processo (opcional)">
        <TextSelect value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
          <option value="">— Nenhum —</option>
          {db.processos.map((p) => (
            <option key={p.id} value={p.id}>{p.numeroCurto} — {p.titulo}</option>
          ))}
        </TextSelect>
      </ModalField>
      <ModalField label="Descrição">
        <TextArea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes opcionais..." />
      </ModalField>
    </Modal>
  );
}
