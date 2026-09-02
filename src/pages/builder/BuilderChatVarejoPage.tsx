import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import * as onboardingService from '@/services/onboarding.service';
import styles from './BuilderChatPage.module.scss';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos do Onboarding Varejo
// ─────────────────────────────────────────────────────────────────────────────

export type TipoResposta = 'unica' | 'multipla';

export interface OpcaoPergunta {
  id: string;
  rotulo: string;
}

export interface PerguntaVarejo {
  id: string;
  rotuloCurto: string;
  texto: string;
  porQue: string;
  tipo: TipoResposta;
  opcoes: OpcaoPergunta[];
  pular?: (respostas: RespostasVarejo) => boolean;
}

export type RespostasVarejo = Record<string, string | string[]>;

type Fase = 'pergunta' | 'reflexao' | 'fim';

interface Mensagem {
  id: number;
  autor: 'usuario' | 'assistente';
  texto: string;
  porQue?: string;
  variante?: 'erro';
}

// ─────────────────────────────────────────────────────────────────────────────
// As 12 Perguntas do Vertical Varejo / Comércio (R13)
// ─────────────────────────────────────────────────────────────────────────────

export const PERGUNTAS_VAREJO: PerguntaVarejo[] = [
  {
    id: 'canal_venda',
    rotuloCurto: 'Canais de venda',
    texto: 'O negócio opera com loja física, e-commerce, marketplace, ou alguma combinação desses canais?',
    porQue: 'Define a arquitetura central do sistema (PDV, e-commerce ou hubs de integração) e o controle unificado de estoque para evitar overselling.',
    tipo: 'unica',
    opcoes: [
      { id: 'loja_fisica', rotulo: 'Só loja física' },
      { id: 'fisica_online', rotulo: 'Loja física + online' },
      { id: 'online', rotulo: 'Só online/marketplace' },
    ],
  },
  {
    id: 'segmento',
    rotuloCurto: 'Segmento',
    texto: 'Qual é o segmento/nicho do varejo? (moda/vestuário, alimentação/mercearia, eletrônicos, farmácia, materiais de construção, pet, outro)',
    porQue: 'Determina regras específicas de estoque, como grade de cor e tamanho, controle de validade e lote ou unidades de medida compostas.',
    tipo: 'unica',
    opcoes: [
      { id: 'moda', rotulo: 'Moda / Vestuário' },
      { id: 'alimentacao', rotulo: 'Alimentação / Mercearia' },
      { id: 'eletronicos', rotulo: 'Eletrônicos' },
      { id: 'farmacia', rotulo: 'Farmácia' },
      { id: 'materiais_construcao', rotulo: 'Materiais de construção' },
      { id: 'pet', rotulo: 'Pet' },
      { id: 'outro', rotulo: 'Outro' },
    ],
  },
  {
    id: 'regime_tributario',
    rotuloCurto: 'Regime tributário',
    texto: 'Qual é o regime tributário da empresa? (Simples Nacional, Lucro Presumido, Lucro Real, MEI)',
    porQue: 'Define a engine fiscal do sistema, o cálculo correto de tributos (DAS vs. PIS/COFINS/IRPJ) e conformidade com a Reforma Tributária.',
    tipo: 'unica',
    opcoes: [
      { id: 'simples', rotulo: 'Simples Nacional' },
      { id: 'presumido', rotulo: 'Lucro Presumido' },
      { id: 'real', rotulo: 'Lucro Real' },
      { id: 'mei', rotulo: 'MEI' },
    ],
  },
  {
    id: 'documento_fiscal',
    rotuloCurto: 'Documento fiscal',
    texto: 'O negócio emite qual tipo de documento fiscal no ponto de venda? (NFC-e, SAT-CF-e, NF-e para pessoa jurídica, cupom fiscal legado)',
    porQue: 'Configura o módulo fiscal do PDV e a homologação necessária para emissão de vendas conforme as regras do seu estado.',
    tipo: 'unica',
    opcoes: [
      { id: 'nfce', rotulo: 'NFC-e' },
      { id: 'sat_cfe', rotulo: 'SAT-CF-e' },
      { id: 'nfe', rotulo: 'NF-e para pessoa jurídica' },
      { id: 'cupom_legado', rotulo: 'Cupom fiscal legado' },
    ],
  },
  {
    id: 'perfil_cliente',
    rotuloCurto: 'Perfil do cliente',
    texto: 'A loja vende para consumidor final (B2C), para outras empresas (B2B), ou para os dois?',
    porQue: 'Diferencia os fluxos de venda e tributação entre NFC-e simplificada para pessoa física e NF-e completa com CNPJ e regras de Substituição Tributária.',
    tipo: 'unica',
    opcoes: [
      { id: 'b2c', rotulo: 'Consumidor final (B2C)' },
      { id: 'b2b', rotulo: 'Outras empresas (B2B)' },
      { id: 'ambos', rotulo: 'Ambos (B2C e B2B)' },
    ],
  },
  {
    id: 'estoque',
    rotuloCurto: 'Operação de estoque',
    texto: 'A loja trabalha com estoque próprio ou opera em consignação/dropshipping?',
    porQue: 'Configura a gestão de mercadorias próprias, de terceiros (consignação) ou envio direto por fornecedor (dropshipping) e seus reflexos fiscais.',
    tipo: 'unica',
    opcoes: [
      { id: 'proprio', rotulo: 'Estoque próprio' },
      { id: 'consignacao', rotulo: 'Consignação' },
      { id: 'dropshipping', rotulo: 'Dropshipping' },
      { id: 'misto', rotulo: 'Misto' },
    ],
  },
  {
    id: 'crediario',
    rotuloCurto: 'Crediário próprio',
    texto: 'A loja oferece crediário próprio (carnê, parcelamento no próprio caixa)?',
    porQue: 'Ativa o módulo de contas a receber com parcelamento próprio, controle de inadimplência e régua de cobrança.',
    tipo: 'unica',
    opcoes: [
      { id: 'sim', rotulo: 'Sim' },
      { id: 'nao', rotulo: 'Não' },
    ],
  },
  {
    id: 'formas_pagamento',
    rotuloCurto: 'Formas de pagamento',
    texto: 'Quais formas de pagamento serão aceitas no PDV? (dinheiro, cartão débito/crédito, Pix, vale-refeição/alimentação, cheque)',
    porQue: 'Mapeia as integrações de recebimento (TEF, Pix QR Code, convênios) para garantir a conciliação financeira do fechamento de caixa.',
    tipo: 'multipla',
    opcoes: [
      { id: 'dinheiro', rotulo: 'Dinheiro' },
      { id: 'cartao', rotulo: 'Cartão (débito/crédito)' },
      { id: 'pix', rotulo: 'Pix' },
      { id: 'vale', rotulo: 'Vale-refeição / Alimentação' },
      { id: 'cheque', rotulo: 'Cheque' },
    ],
  },
  {
    id: 'multiplas_filiais',
    rotuloCurto: 'Múltiplas filiais',
    texto: 'A loja tem mais de um depósito ou filial?',
    porQue: 'Habilita múltiplos centros de estoque, transferências entre lojas e emissão de notas fiscais de remessa e retorno.',
    tipo: 'unica',
    opcoes: [
      { id: 'sim', rotulo: 'Sim' },
      { id: 'nao', rotulo: 'Não' },
    ],
  },
  {
    id: 'xml_fornecedor',
    rotuloCurto: 'Importação de XML',
    texto: 'A loja usa fornecedores que enviam XML de NF-e de entrada? Quer importar esses XMLs automaticamente?',
    porQue: 'Permite a importação automatizada de DANFE/XML de entrada para cadastro ágil de produtos e atualização de custos.',
    tipo: 'unica',
    opcoes: [
      { id: 'sim', rotulo: 'Sim' },
      { id: 'nao', rotulo: 'Não' },
    ],
  },
  {
    id: 'fidelidade',
    rotuloCurto: 'Programa de fidelidade',
    texto: 'A loja tem ou quer ter programa de fidelidade (pontos, cashback, desconto acumulado por CPF)?',
    porQue: 'Ativa o módulo de CRM e fidelização integrado ao PDV para acúmulo de pontos ou cashback por CPF.',
    tipo: 'unica',
    opcoes: [
      { id: 'sim', rotulo: 'Sim' },
      { id: 'nao', rotulo: 'Não' },
    ],
  },
  {
    id: 'marketplaces',
    rotuloCurto: 'Marketplaces',
    texto: 'Quais marketplaces a loja opera ou planeja operar? (Mercado Livre, Amazon, Shopee, Americanas, Magalu, outro)',
    porQue: 'Configura as integrações com APIs de cada marketplace para sincronização bidirecional de catálogo, estoque e pedidos.',
    tipo: 'multipla',
    pular: (respostas: RespostasVarejo) => respostas.canal_venda === 'loja_fisica',
    opcoes: [
      { id: 'mercado_livre', rotulo: 'Mercado Livre' },
      { id: 'amazon', rotulo: 'Amazon' },
      { id: 'shopee', rotulo: 'Shopee' },
      { id: 'americanas', rotulo: 'Americanas' },
      { id: 'magalu', rotulo: 'Magalu' },
      { id: 'outro', rotulo: 'Outro' },
    ],
  },
];

const MENSAGEM_ABERTURA =
  'Você está no modo de teste do onboarding de varejo — ainda não é o fluxo público. Vou te fazer algumas perguntas de verdade sobre como seu negócio funciona, do jeito que uma consultoria de implantação faria.';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de Formatação e Resumo
// ─────────────────────────────────────────────────────────────────────────────

function obterRotulo(perguntaId: string, valor: string | string[] | undefined): string {
  const pergunta = PERGUNTAS_VAREJO.find((p) => p.id === perguntaId);
  if (!pergunta || valor === undefined) return '—';

  if (Array.isArray(valor)) {
    if (valor.length === 0) return 'Nenhum';
    const rotulos = pergunta.opcoes
      .filter((o) => valor.includes(o.id))
      .map((o) => o.rotulo);
    return rotulos.length > 0 ? rotulos.join(', ') : 'Nenhum';
  }

  const opcao = pergunta.opcoes.find((o) => o.id === valor);
  return opcao ? opcao.rotulo : valor;
}

function gerarResumoTexto(respostas: RespostasVarejo): string {
  const canal = obterRotulo('canal_venda', respostas.canal_venda);
  const seg = obterRotulo('segmento', respostas.segmento);
  const regime = obterRotulo('regime_tributario', respostas.regime_tributario);
  const doc = obterRotulo('documento_fiscal', respostas.documento_fiscal);
  const cliente = obterRotulo('perfil_cliente', respostas.perfil_cliente);
  const est = obterRotulo('estoque', respostas.estoque);
  const pag = obterRotulo('formas_pagamento', respostas.formas_pagamento);
  const filiais = respostas.multiplas_filiais === 'sim' ? 'com múltiplas filiais/depósitos' : 'com filial única';
  const cred = respostas.crediario === 'sim' ? 'com oferta de crediário próprio' : 'sem crediário próprio';

  return `Entendi o perfil da sua operação: você opera com ${canal}, no segmento de ${seg}, enquadrado no ${regime}. Vende para ${cliente} com emissão de ${doc}, operando com ${est} (${filiais}, ${cred}) e aceitando como formas de pagamento: ${pag}.`;
}

function gerarMensagemLacunas(respostas: RespostasVarejo): string {
  const lacunas: string[] = [];

  // Incondicional: nota fiscal de verdade
  lacunas.push('Emissão de nota fiscal de verdade (NFC-e / NF-e) — hoje o sistema não emite nem transmite notas à SEFAZ.');

  // Estoque em consignação
  if (respostas.estoque === 'consignacao' || respostas.estoque === 'misto') {
    lacunas.push('Controle de estoque em consignação (mercadoria de terceiros sem nota de compra).');
  }

  // Múltiplas filiais
  if (respostas.multiplas_filiais === 'sim') {
    lacunas.push('Gestão de múltiplas lojas/filiais e controle de estoque individualizado com transferências.');
  }

  // Segmento moda
  if (respostas.segmento === 'moda') {
    lacunas.push('Grade de tamanho e cor para vestuário (produtos pai e SKUs filhos).');
  }

  // Marketplaces selecionados
  const mkt = Array.isArray(respostas.marketplaces) ? respostas.marketplaces : [];
  if (mkt.length > 0) {
    lacunas.push('Integração com marketplaces (sincronização de pedidos e anúncios via API/hub).');
  }

  // Crediário próprio
  if (respostas.crediario === 'sim') {
    lacunas.push('Boleto bancário e régua de cobrança automática para crediário.');
  }

  const linhasItens = lacunas.map((l) => `• ${l}`).join('\n');

  return `Com base no diagnóstico da sua operação, aqui está o contrato de honestidade sobre o que o sistema AINDA NÃO faz hoje:\n\n${linhasItens}\n\nO que eu já registro de verdade hoje: cadastro de produto com preço/estoque, e venda com item, cliente e forma de pagamento — inclusive fiado. O resto virou prioridade real, não promessa vazia.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

export function BuilderChatVarejoPage() {
  useDocumentTitle('Onboarding Varejo (Beta) · Axion');

  const [fase, setFase] = useState<Fase>('pergunta');
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [respostas, setRespostas] = useState<RespostasVarejo>({});
  const [selecaoMultipla, setSelecaoMultipla] = useState<string[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 0,
      autor: 'assistente',
      texto: MENSAGEM_ABERTURA,
    },
    {
      id: 1,
      autor: 'assistente',
      texto: PERGUNTAS_VAREJO[0].texto,
      porQue: PERGUNTAS_VAREJO[0].porQue,
    },
  ]);

  const proximoId = useRef(2);
  const fimDaLista = useRef<HTMLDivElement>(null);

  const dizer = useCallback(
    (autor: Mensagem['autor'], texto: string, porQue?: string, variante?: 'erro') => {
      setMensagens((atual) => [
        ...atual,
        { id: proximoId.current++, autor, texto, porQue, variante },
      ]);
    },
    []
  );

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, fase, perguntaAtualIndex]);

  const perguntaAtual = PERGUNTAS_VAREJO[perguntaAtualIndex];

  function avancar(indiceAtual: number, respostasAtualizadas: RespostasVarejo) {
    let proximoIdx = indiceAtual + 1;
    while (
      proximoIdx < PERGUNTAS_VAREJO.length &&
      PERGUNTAS_VAREJO[proximoIdx].pular?.(respostasAtualizadas)
    ) {
      proximoIdx++;
    }

    if (proximoIdx < PERGUNTAS_VAREJO.length) {
      setPerguntaAtualIndex(proximoIdx);
      const proxPergunta = PERGUNTAS_VAREJO[proximoIdx];
      dizer('assistente', proxPergunta.texto, proxPergunta.porQue);
    } else {
      setFase('reflexao');
      const resumo = gerarResumoTexto(respostasAtualizadas);
      dizer('assistente', resumo);
    }
  }

  function responderUnica(opcao: OpcaoPergunta) {
    if (!perguntaAtual) return;
    const novasRespostas: RespostasVarejo = {
      ...respostas,
      [perguntaAtual.id]: opcao.id,
    };
    setRespostas(novasRespostas);
    dizer('usuario', opcao.rotulo);
    avancar(perguntaAtualIndex, novasRespostas);
  }

  function alternarOpcaoMultipla(id: string) {
    setSelecaoMultipla((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );
  }

  function confirmarMultipla() {
    if (!perguntaAtual) return;
    const novasRespostas: RespostasVarejo = {
      ...respostas,
      [perguntaAtual.id]: selecaoMultipla,
    };
    setRespostas(novasRespostas);

    const rotulosEscolhidos = perguntaAtual.opcoes
      .filter((o) => selecaoMultipla.includes(o.id))
      .map((o) => o.rotulo);

    const textoUsuario =
      rotulosEscolhidos.length > 0 ? rotulosEscolhidos.join(', ') : 'Nenhuma das opções';

    dizer('usuario', textoUsuario);
    setSelecaoMultipla([]);
    avancar(perguntaAtualIndex, novasRespostas);
  }

  async function confirmarReflexao() {
    dizer('usuario', 'Confirmar');
    setFase('fim');
    const resultado = await onboardingService.diagnosticoVarejo(respostas);
    if (resultado) {
      const linhasItens = resultado.descobertos.map((d) => `• ${d.descricao}`).join('\n');
      const textoCobertos =
        resultado.cobertos.length > 0
          ? resultado.cobertos.map((c) => c.descricao.charAt(0).toLowerCase() + c.descricao.slice(1)).join(', e ')
          : 'cadastro de produto com preço/estoque, e venda com item, cliente e forma de pagamento — inclusive fiado';
      const msg = `Com base no diagnóstico da sua operação, aqui está o contrato de honestidade sobre o que o sistema AINDA NÃO faz hoje:\n\n${linhasItens}\n\nO que eu já registro de verdade hoje: ${textoCobertos}. O resto virou prioridade real, não promessa vazia.`;
      dizer('assistente', msg);
    } else {
      const msgLacunas = gerarMensagemLacunas(respostas);
      dizer('assistente', msgLacunas);
    }
  }

  function recomecar() {
    setRespostas({});
    setPerguntaAtualIndex(0);
    setSelecaoMultipla([]);
    proximoId.current = 2;
    setMensagens([
      {
        id: 0,
        autor: 'assistente',
        texto: MENSAGEM_ABERTURA,
      },
      {
        id: 1,
        autor: 'assistente',
        texto: PERGUNTAS_VAREJO[0].texto,
        porQue: PERGUNTAS_VAREJO[0].porQue,
      },
    ]);
    setFase('pergunta');
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.transcript}>
        <div className={styles.coluna}>
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              className={msg.autor === 'usuario' ? styles.linhaUsuario : styles.linhaAssistente}
            >
              <div
                className={
                  msg.autor === 'usuario'
                    ? styles.balaoUsuario
                    : msg.variante === 'erro'
                      ? styles.balaoErro
                      : styles.balaoAssistente
                }
              >
                <div>{msg.texto}</div>
                {msg.porQue && (
                  <small
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      fontSize: '12px',
                      color: 'var(--color-muted-2, #6b7280)',
                      borderTop: '1px solid var(--color-line, #e5e7eb)',
                      paddingTop: '6px',
                    }}
                  >
                    💡 <em>Por que importa:</em> {msg.porQue}
                  </small>
                )}
              </div>
            </div>
          ))}

          {/* Camada B: Pergunta de seleção única */}
          {fase === 'pergunta' && perguntaAtual && perguntaAtual.tipo === 'unica' && (
            <div className={styles.respostasRapidas} role="group" aria-label={perguntaAtual.texto}>
              {perguntaAtual.opcoes.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  className={styles.btnSecundario}
                  onClick={() => responderUnica(opcao)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          )}

          {/* Camada B: Pergunta de seleção múltipla */}
          {fase === 'pergunta' && perguntaAtual && perguntaAtual.tipo === 'multipla' && (
            <div className={styles.respostasRapidas} role="group" aria-label={perguntaAtual.texto}>
              {perguntaAtual.opcoes.map((opcao) => {
                const ativo = selecaoMultipla.includes(opcao.id);
                return (
                  <button
                    key={opcao.id}
                    type="button"
                    className={ativo ? styles.moduloToggleAtivo : styles.moduloToggle}
                    aria-pressed={ativo}
                    onClick={() => alternarOpcaoMultipla(opcao.id)}
                  >
                    {opcao.rotulo}
                  </button>
                );
              })}
              <button type="button" className={styles.btnPrimario} onClick={confirmarMultipla}>
                Continuar
              </button>
            </div>
          )}

          {/* Camada C: Reflexão e confirmação */}
          {fase === 'reflexao' && (
            <>
              <div className={styles.linhaAssistente}>
                <div className={styles.balaoAssistente}>
                  <dl className={styles.revisao}>
                    {PERGUNTAS_VAREJO.map((p) => {
                      const pulou = p.pular?.(respostas);
                      const valorExibicao = pulou
                        ? 'Não se aplica (só loja física)'
                        : obterRotulo(p.id, respostas[p.id]);
                      return (
                        <div key={p.id}>
                          <dt>{p.rotuloCurto}</dt>
                          <dd>{valorExibicao}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
              <div className={styles.respostasRapidas}>
                <button type="button" className={styles.btnPrimario} onClick={() => void confirmarReflexao()}>
                  Confirmar
                </button>
                <button type="button" className={styles.btnSecundario} onClick={recomecar}>
                  Recomeçar
                </button>
              </div>
            </>
          )}

          {/* Camada D / Fim: Contrato de lacunas */}
          {fase === 'fim' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnSecundario} onClick={recomecar}>
                Recomeçar do zero
              </button>
            </div>
          )}

          <div ref={fimDaLista} />
        </div>
      </div>

      <div className={styles.rodape}>
        <form className={styles.composer} onSubmit={(e) => e.preventDefault()}>
          <input
            className={styles.campo}
            value=""
            placeholder={
              fase === 'fim'
                ? 'Diagnóstico finalizado. Clique em recomeçar se quiser rodar de novo.'
                : 'Selecione uma opção acima para responder...'
            }
            disabled
            aria-label="Entrada desabilitada"
          />
          <button type="submit" className={styles.enviar} disabled aria-label="Enviar">
            <ArrowUp size={16} />
          </button>
        </form>
        <p className={styles.aviso}>Axion Varejo (Beta) — diagnóstico profundo de implantação.</p>
      </div>
    </div>
  );
}
