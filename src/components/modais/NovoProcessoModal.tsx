import { useState, useEffect } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarProcesso } from '@/services/processos.service';
import type { AreaJuridica, ProcessoStatus } from '@/types';
import { db } from '@/mocks';

interface NovoProcessoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function NovoProcessoModal({ open, onClose, onCreated }: NovoProcessoModalProps) {
  const toast = useToast();

  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState<AreaJuridica>('civel');
  const [clienteId, setClienteId] = useState('');
  const [parteContraria, setParteContraria] = useState('');
  const [tribunal, setTribunal] = useState('');
  const [vara, setVara] = useState('');
  const [advogadoId, setAdvogadoId] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [faseProcessual, setFaseProcessual] = useState('');
  
  const [tituloError, setTituloError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo('');
      setArea('civel');
      setClienteId('');
      setParteContraria('');
      setTribunal('');
      setVara('');
      setAdvogadoId('');
      setValorStr('');
      setFaseProcessual('');
      setTituloError('');
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      setTituloError('Título é obrigatório');
      return;
    }
    setTituloError('');
    setLoading(true);

    const valorFormatado = valorStr.replace(/\./g, '').replace(',', '.');
    const valorParsed = parseFloat(valorFormatado);
    const valorCausaCentavos = !isNaN(valorParsed) ? Math.round(valorParsed * 100) : 0;

    try {
      const novo = await criarProcesso({
        titulo,
        area: area as AreaJuridica,
        status: 'em_andamento' as ProcessoStatus,
        faseProcessual,
        clienteId,
        parteContraria,
        tribunal,
        vara,
        advogadoId,
        numeroCnj: `${Date.now()}-00.2026.8.26.0100`.slice(-25),
        numeroCurto: String(Date.now()).slice(-5),
        valorCausaCentavos,
      });

      toast.show('Processo criado!');
      onCreated?.(novo.id);
      onClose();
    } catch (error) {
      console.error(error);
      toast.show('Erro ao criar processo');
    } finally {
      setLoading(false);
    }
  };

  const advogados = db.usuarios.filter(u => u.role !== 'financeiro');

  return (
    <Modal
      title="Novo Processo"
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
        <ModalField label="Título" required error={tituloError}>
          <TextInput
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Ação de Indenização"
          />
        </ModalField>

        <ModalField label="Área Jurídica">
          <TextSelect
            value={area}
            onChange={(e) => setArea(e.target.value as AreaJuridica)}
          >
            <option value="civel">Cível</option>
            <option value="trabalhista">Trabalhista</option>
            <option value="tributario">Tributário</option>
            <option value="familia">Família</option>
            <option value="consumidor">Consumidor</option>
            <option value="empresarial">Empresarial</option>
            <option value="penal">Penal</option>
          </TextSelect>
        </ModalField>

        <ModalField label="Cliente">
          <TextSelect
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Selecione um cliente...</option>
            {db.clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </TextSelect>
        </ModalField>

        <ModalField label="Parte Contrária">
          <TextInput
            value={parteContraria}
            onChange={(e) => setParteContraria(e.target.value)}
            placeholder="Nome da parte contrária"
          />
        </ModalField>

        <ModalField label="Tribunal">
          <TextInput
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            placeholder="TJSP"
          />
        </ModalField>

        <ModalField label="Vara">
          <TextInput
            value={vara}
            onChange={(e) => setVara(e.target.value)}
            placeholder="1ª Vara Cível"
          />
        </ModalField>

        <ModalField label="Advogado Responsável">
          <TextSelect
            value={advogadoId}
            onChange={(e) => setAdvogadoId(e.target.value)}
          >
            <option value="">Selecione um advogado...</option>
            {advogados.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </TextSelect>
        </ModalField>

        <ModalField label="Valor da Causa R$">
          <TextInput
            type="text"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            placeholder="0,00"
          />
        </ModalField>

        <ModalField label="Fase Processual">
          <TextInput
            value={faseProcessual}
            onChange={(e) => setFaseProcessual(e.target.value)}
            placeholder="Inicial"
          />
        </ModalField>
      </div>
    </Modal>
  );
}
