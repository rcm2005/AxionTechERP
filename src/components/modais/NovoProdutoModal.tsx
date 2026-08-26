import { useState } from 'react';
import { Modal, ModalField, ModalFooter } from '@/components/ui/Modal/Modal';
import { TextInput, TextSelect, TextArea } from '@/components/ui/TextField/TextField';
import { useToast } from '@/contexts/ToastContext';
import { criarProduto } from '@/services/estoque.service';
import { db } from '@/mocks';
import type { TipoProduto, UnidadeMedida, ProdutoStatus } from '@/types';
import styles from './NovoProdutoModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NovoProdutoModal({ open, onClose }: Props) {
  const toast = useToast();
  const [sku, setSku] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ean, setEan] = useState('');
  const [tipo, setTipo] = useState<TipoProduto>('PA');
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('UN');
  const [custoStr, setCustoStr] = useState('');
  const [precoStr, setPrecoStr] = useState('');
  const [estoqueAtualStr, setEstoqueAtualStr] = useState('0');
  const [estoqueMinimoStr, setEstoqueMinimoStr] = useState('10');
  const [ncm, setNcm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState<ProdutoStatus>('ativo');

  const [skuError, setSkuError] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [ncmError, setNcmError] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setSku('');
    setNome('');
    setDescricao('');
    setEan('');
    setTipo('PA');
    setUnidadeMedida('UN');
    setCustoStr('');
    setPrecoStr('');
    setEstoqueAtualStr('0');
    setEstoqueMinimoStr('10');
    setNcm('');
    setCategoria('');
    setStatus('ativo');
    setSkuError('');
    setNomeError('');
    setNcmError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    let ok = true;
    if (!sku.trim()) {
      setSkuError('Código SKU é obrigatório.');
      ok = false;
    }
    if (!nome.trim()) {
      setNomeError('Nome do produto é obrigatório.');
      ok = false;
    }
    if (!ncm.trim()) {
      setNcmError('NCM é obrigatório para conformidade fiscal.');
      ok = false;
    }
    if (!ok) return;

    setSaving(true);
    try {
      const custoCentavos = Math.round(parseFloat(custoStr.replace(',', '.')) * 100) || 0;
      const precoCentavos = Math.round(parseFloat(precoStr.replace(',', '.')) * 100) || 0;
      const estoqueAtualNum = parseFloat(estoqueAtualStr) || 0;
      const estoqueMinimoNum = parseFloat(estoqueMinimoStr) || 0;

      await criarProduto({
        tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast',
        sku: sku.trim().toUpperCase(),
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        ean: ean.trim() || undefined,
        tipo,
        unidadeMedida,
        ncm: ncm.trim(),
        custoMedio: custoCentavos,
        precoSugerido: precoCentavos,
        estoqueAtual: estoqueAtualNum,
        estoqueMinimo: estoqueMinimoNum,
        categoria: categoria.trim() || 'Geral',
        status,
      });

      toast.show('Produto cadastrado com sucesso!');
      handleClose();
      window.location.reload();
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err);
      toast.show('Erro ao cadastrar produto no estoque.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Produto / SKU"
      width="580px"
      footer={<ModalFooter onCancel={handleClose} onConfirm={handleSave} loading={saving} />}
    >
      <div className={styles.grid2}>
        <ModalField label="Código SKU" required error={skuError}>
          <TextInput
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              setSkuError('');
            }}
            placeholder="Ex: PA-CX-50L"
          />
        </ModalField>

        <ModalField label="Tipo do Item" required>
          <TextSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoProduto)}>
            <option value="PA">Produto Acabado (PA)</option>
            <option value="MP">Matéria-Prima (MP)</option>
            <option value="Consumo">Uso & Consumo</option>
            <option value="Embalagem">Embalagem</option>
            <option value="Servico">Mão de Obra / Serviço</option>
          </TextSelect>
        </ModalField>
      </div>

      <ModalField label="Nome do Produto / Descrição Curta" required error={nomeError}>
        <TextInput
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setNomeError('');
          }}
          placeholder="Ex: Caixa Organizadora Plástica 50L c/ Travas"
        />
      </ModalField>

      <ModalField label="Descrição Detalhada">
        <TextArea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Especificações técnicas, dimensões, material ou detalhes construtivos..."
        />
      </ModalField>

      <div className={styles.grid2}>
        <ModalField label="Código EAN / Barras">
          <TextInput
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            placeholder="Ex: 7891234560012"
          />
        </ModalField>

        <ModalField label="NCM (Fiscal)" required error={ncmError}>
          <TextInput
            value={ncm}
            onChange={(e) => {
              setNcm(e.target.value);
              setNcmError('');
            }}
            placeholder="Ex: 3923.10.90"
          />
        </ModalField>
      </div>

      <div className={styles.grid2}>
        <ModalField label="Unidade de Medida" required>
          <TextSelect
            value={unidadeMedida}
            onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
          >
            <option value="UN">UN - Unidade</option>
            <option value="KG">KG - Quilograma</option>
            <option value="CX">CX - Caixa</option>
            <option value="MT">MT - Metro</option>
            <option value="LT">LT - Litro</option>
            <option value="PAR">PAR - Par</option>
            <option value="M2">M² - Metro Quadrado</option>
            <option value="M3">M³ - Metro Cúbico</option>
            <option value="TON">TON - Tonelada</option>
            <option value="PC">PC - Peça</option>
            <option value="ROLO">ROLO - Rolo</option>
          </TextSelect>
        </ModalField>

        <ModalField label="Categoria">
          <TextInput
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ex: Embalagens Plásticas"
          />
        </ModalField>
      </div>

      <div className={styles.grid2}>
        <ModalField label="Custo Médio Unitário (R$)">
          <TextInput
            value={custoStr}
            onChange={(e) => setCustoStr(e.target.value)}
            placeholder="0,00"
          />
        </ModalField>

        <ModalField label="Preço de Venda Sugerido (R$)">
          <TextInput
            value={precoStr}
            onChange={(e) => setPrecoStr(e.target.value)}
            placeholder="0,00"
          />
        </ModalField>
      </div>

      <div className={styles.grid2}>
        <ModalField label="Estoque Físico Inicial" required>
          <TextInput
            type="number"
            value={estoqueAtualStr}
            onChange={(e) => setEstoqueAtualStr(e.target.value)}
            placeholder="0"
          />
        </ModalField>

        <ModalField label="Estoque Mínimo">
          <TextInput
            type="number"
            value={estoqueMinimoStr}
            onChange={(e) => setEstoqueMinimoStr(e.target.value)}
            placeholder="10"
          />
        </ModalField>
      </div>

      <ModalField label="Status do SKU">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as ProdutoStatus)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="fora_de_linha">Fora de linha</option>
        </TextSelect>
      </ModalField>
    </Modal>
  );
}
