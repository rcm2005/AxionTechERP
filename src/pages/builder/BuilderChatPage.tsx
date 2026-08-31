import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowUp, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CORES_MARCA } from '@/config/coresMarca';
import { paths } from '@/routes/paths';
import type { DadosOnboarding } from '@/services/auth.service';
import * as onboardingService from '@/services/onboarding.service';
import { classificarPedido, normalizar } from './verticalMatch';
import styles from './BuilderChatPage.module.scss';

// ─────────────────────────────────────────────────────────────────────────────
// Máquina de estados
//
// O chat NÃO é uma ilusão: cada fase abaixo é um estado real, com uma pergunta,
// uma validação e uma transição. As validações são as mesmas do wizard antigo
// (`src/pages/onboarding/OnboardingPage.tsx`) — se mudarem lá, mude aqui.
// ─────────────────────────────────────────────────────────────────────────────

type Fase =
  | 'pedido'
  | 'confirmarFallback'
  | 'nomeEscritorio'
  | 'cnpjOuCpf'
  | 'corPrimaria'
  | 'modulos'
  | 'adminNome'
  | 'adminEmail'
  | 'adminPassword'
  | 'revisao'
  | 'gerando'
  | 'pronto'
  | 'erro'
  | 'encerrado';

/** Fases em que a caixa de texto aceita resposta livre. */
const FASES_TEXTO: ReadonlyArray<Fase> = [
  'pedido',
  'nomeEscritorio',
  'cnpjOuCpf',
  'adminNome',
  'adminEmail',
  'adminPassword',
  'revisao',
];

interface Mensagem {
  id: number;
  autor: 'usuario' | 'assistente';
  texto: string;
  variante?: 'erro';
}

const PERGUNTAS: Partial<Record<Fase, string>> = {
  nomeEscritorio: 'Perfeito. Como se chama o seu escritório?',
  cnpjOuCpf: 'Qual o CNPJ do escritório? Se ainda não tem CNPJ, pode ser o seu CPF.',
  corPrimaria:
    'Escolha a cor da marca. Ela não é decoração: já vai aparecer no login e no dashboard do seu ERP.',
  modulos:
    'Seu escritório atua com contratos consultivos, trabalha com honorário de êxito, os dois, ou nenhum dos dois por enquanto?',
  adminNome: 'E como você se chama? Você vai ser o administrador deste escritório.',
  adminEmail: 'Qual e-mail você vai usar pra entrar?',
  adminPassword: 'Por fim, crie uma senha de no mínimo 8 caracteres.',
};

const PLACEHOLDERS: Partial<Record<Fase, string>> = {
  pedido: 'Ask anything...',
  nomeEscritorio: 'Ex: Silva & Santos Advocacia',
  cnpjOuCpf: '00.000.000/0001-00',
  adminNome: 'Ex: Dra. Ana Ribeiro',
  adminEmail: 'voce@escritorio.com.br',
  adminPassword: 'Mínimo 8 caracteres',
  revisao: 'Ex: muda o e-mail para...',
};

/** Narração exibida enquanto o tenant é criado de verdade. */
const LINHAS_GERACAO = [
  'Entendido! Vamos montar um ERP jurídico personalizado para o seu escritório. 📋',
  'Configurando módulos: Clientes, Processos, Agenda & Prazos e Financeiro...',
  'Gerando a tela de login com a identidade visual do escritório...',
  'Montando o dashboard com KPIs, calendário e fluxo de caixa...',
];

const LINHAS_SUCESSO = [
  'Pronto! Seu ERP jurídico foi gerado 🎉 Ele já inclui tela de login, dashboard, cadastro de clientes, gestão de processos, agenda de prazos/audiências e módulo financeiro.',
  'Veja o preview abaixo — você pode navegar entre as telas.',
];

const ATRASO_LINHA_MS = 850;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Dados = DadosOnboarding & {
  modulos: {
    contratos: boolean;
    honorarioExito: boolean;
  };
};

const DADOS_VAZIOS: Dados = {
  nomeEscritorio: '',
  cnpjOuCpf: '',
  corPrimaria: CORES_MARCA[0].valor,
  modulos: {
    contratos: false,
    honorarioExito: false,
  },
  adminNome: '',
  adminEmail: '',
  adminPassword: '',
};

/**
 * Valida o campo da fase. Retorna a mensagem de erro (que o assistente diz em
 * voz alta) ou `null` se estiver válido. Mesmas regras do wizard antigo.
 */
function validar(fase: Fase, valor: string): string | null {
  switch (fase) {
    case 'nomeEscritorio':
      return valor.trim().length > 0
        ? null
        : 'Preciso de um nome pro escritório pra seguir — pode ser o nome que está na placa.';
    case 'cnpjOuCpf':
      return valor.trim().length >= 11
        ? null
        : 'Esse número ficou curto: um CPF tem 11 dígitos e um CNPJ, 14. Pode conferir?';
    case 'adminNome':
      return valor.trim().length > 0 ? null : 'Preciso do seu nome pra criar o usuário administrador.';
    case 'adminEmail':
      return /\S+@\S+\.\S+/.test(valor) ? null : 'Esse e-mail não parece válido. Pode escrever de novo?';
    case 'adminPassword':
      return valor.length >= 8 ? null : 'A senha precisa ter pelo menos 8 caracteres.';
    default:
      return null;
  }
}

/** Próxima fase depois de um campo válido. */
const PROXIMA: Partial<Record<Fase, Fase>> = {
  nomeEscritorio: 'cnpjOuCpf',
  cnpjOuCpf: 'corPrimaria',
  corPrimaria: 'modulos',
  modulos: 'adminNome',
  adminNome: 'adminEmail',
  adminEmail: 'adminPassword',
  adminPassword: 'revisao',
};

export function BuilderChatPage() {
  useDocumentTitle('Criar meu ERP');
  const { criarEscritorio, tenantBranding } = useAuth();
  const navigate = useNavigate();

  const [fase, setFase] = useState<Fase>('pedido');
  const [dados, setDados] = useState<Dados>(DADOS_VAZIOS);
  const [entrada, setEntrada] = useState('');
  const [verticalPedido, setVerticalPedido] = useState<string | null>(null);
  const [, setTentativasRevisao] = useState<number>(0);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 0,
      autor: 'assistente',
      texto:
        'Oi! Me conta em uma frase que tipo de ERP você precisa e eu monto agora. Hoje eu tenho o vertical jurídico pronto de verdade.',
    },
  ]);

  const proximoId = useRef(1);
  const geracaoIniciada = useRef(false);
  const fimDaLista = useRef<HTMLDivElement>(null);

  const dizer = useCallback((autor: Mensagem['autor'], texto: string, variante?: 'erro') => {
    setMensagens((atual) => [...atual, { id: proximoId.current++, autor, texto, variante }]);
  }, []);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, fase]);

  /** Faz a pergunta da próxima fase e entra nela. */
  const irPara = useCallback(
    (proxima: Fase) => {
      const pergunta = PERGUNTAS[proxima];
      if (pergunta) {
        dizer('assistente', pergunta);
      } else if (proxima === 'revisao') {
        dizer('assistente', 'Confere se está tudo certo antes de eu criar o escritório de verdade.');
      }
      setFase(proxima);
    },
    [dizer]
  );

  // ── Geração + criação real do tenant ──────────────────────────────────────
  const executarGeracao = useCallback(
    async (dadosFinais: Dados) => {
      for (const linha of LINHAS_GERACAO) {
        await esperar(ATRASO_LINHA_MS);
        dizer('assistente', linha);
      }
      try {
        // Chamada real: cria tenant + usuário admin no Postgres e grava a sessão.
        await criarEscritorio(dadosFinais);
      } catch (err) {
        const detalhe = err instanceof Error ? err.message : 'erro desconhecido';
        dizer(
          'assistente',
          `Não consegui criar o escritório: ${detalhe}. Nada foi perdido — seus dados continuam preenchidos aqui.`,
          'erro'
        );
        setFase('erro');
        return;
      }
      for (const linha of LINHAS_SUCESSO) {
        await esperar(ATRASO_LINHA_MS);
        dizer('assistente', linha);
      }
      setFase('pronto');
    },
    [criarEscritorio, dizer]
  );

  useEffect(() => {
    if (fase !== 'gerando' || geracaoIniciada.current) return;
    geracaoIniciada.current = true;
    void executarGeracao(dados);
  }, [fase, dados, executarGeracao]);

  // ── Entrada de texto ──────────────────────────────────────────────────────
  function enviar(event: FormEvent) {
    event.preventDefault();
    const valor = entrada.trim();
    if (!FASES_TEXTO.includes(fase) || !valor) return;

    // A senha é ecoada mascarada — o transcript fica visível na tela.
    dizer('usuario', fase === 'adminPassword' ? '•'.repeat(Math.min(valor.length, 12)) : valor);
    setEntrada('');

    if (fase === 'pedido') {
      void tratarPedido(valor);
      return;
    }

    if (fase === 'revisao') {
      void tratarRevisao(valor);
      return;
    }

    const erro = validar(fase, valor);
    if (erro) {
      dizer('assistente', erro, 'erro');
      return;
    }

    const campo = fase as keyof Dados;
    const atualizados: Dados = { ...dados, [campo]: valor };
    setDados(atualizados);
    irPara(PROXIMA[fase] ?? 'gerando');
  }

  async function tratarPedido(texto: string) {
    const interpretacao = await onboardingService.interpretarPedido(texto);
    let tipo: 'juridico' | 'outro' | 'generico';
    let termo: string | undefined;

    if (interpretacao.disponivel) {
      tipo = interpretacao.tipo;
      termo = interpretacao.termo;
      if (interpretacao.nomeEscritorioSugerido) {
        const sugerido = interpretacao.nomeEscritorioSugerido;
        setDados((d) => ({ ...d, nomeEscritorio: sugerido }));
        setEntrada(sugerido);
      }
    } else {
      const resultadoLocal = classificarPedido(texto);
      tipo = resultadoLocal.tipo;
      termo = resultadoLocal.tipo === 'outro' ? resultadoLocal.termo : undefined;
    }

    if (tipo === 'outro') {
      const termoFinal = termo ?? 'outro setor';
      setVerticalPedido(termoFinal);
      dizer(
        'assistente',
        `Vou ser honesto: hoje a Axion tem um único vertical pronto de verdade, o jurídico. Não existe template de ${termoFinal} — e eu não vou fingir que monto um.`
      );
      dizer(
        'assistente',
        'Dá pra seguir com o template jurídico mesmo assim (você vê tudo funcionando e adapta depois), ou a gente para por aqui. Você escolhe.'
      );
      setFase('confirmarFallback');
      return;
    }

    if (tipo === 'generico') {
      dizer(
        'assistente',
        'Beleza. O vertical que eu monto hoje é o jurídico — vou seguir por ele, que é o que existe de verdade.'
      );
    }

    irPara('nomeEscritorio');
  }

  async function tratarRevisao(textoBruto: string) {
    // 1. Fast-path determinístico, sem rede
    const normalizado = normalizar(textoBruto);
    if (
      /\b(confirma|confirmar|pode confirmar|ta certo|esta certo|isso mesmo|pode criar|manda ver)\b/.test(
        normalizado
      )
    ) {
      confirmarRevisao();
      return;
    }
    if (/\b(recomeca|recomecar|reiniciar|cancelar|do zero)\b/.test(normalizado)) {
      recomecar();
      return;
    }

    // 2. Chamada à IA
    const resultado = await onboardingService.revisarConfirmacao(textoBruto, {
      nomeEscritorio: dados.nomeEscritorio,
      cnpjOuCpf: dados.cnpjOuCpf,
      corPrimaria: dados.corPrimaria,
      adminNome: dados.adminNome,
      adminEmail: dados.adminEmail,
    });

    // 3. Incerto ou falha
    if (!resultado || resultado.intent === 'incerto') {
      setTentativasRevisao((t) => {
        const nova = t + 1;
        if (nova >= 2) {
          dizer(
            'assistente',
            'Não consegui entender essa correção. Você pode usar os botões abaixo, ou me dizer exatamente o que corrigir — por exemplo "muda o e-mail para outro@exemplo.com".'
          );
        } else {
          dizer('assistente', 'Não entendi bem — pode tentar de outro jeito? Ou usa os botões abaixo.');
        }
        return nova;
      });
      return;
    }

    // 4. Intent confirmar
    if (resultado.intent === 'confirmar') {
      confirmarRevisao();
      return;
    }

    // 5. Intent recomecar
    if (resultado.intent === 'recomecar') {
      recomecar();
      return;
    }

    // 6. Intent patch
    if (resultado.intent === 'patch') {
      const patchesValidos: Partial<Record<onboardingService.PatchCampo, string>> = {};

      for (const patch of resultado.patches) {
        if (patch.campo === 'corPrimaria') {
          const corEncontrada = CORES_MARCA.find(
            (c) =>
              c.valor.toLowerCase() === patch.valor.toLowerCase() ||
              c.nome.toLowerCase() === patch.valor.toLowerCase()
          );
          if (corEncontrada) {
            patchesValidos.corPrimaria = corEncontrada.valor;
          }
        } else {
          const erro = validar(patch.campo as Fase, patch.valor);
          if (erro === null) {
            patchesValidos[patch.campo] = patch.valor;
          }
        }
      }

      if (Object.keys(patchesValidos).length === 0) {
        setTentativasRevisao((t) => {
          const nova = t + 1;
          if (nova >= 2) {
            dizer(
              'assistente',
              'Não consegui entender essa correção. Você pode usar os botões abaixo, ou me dizer exatamente o que corrigir — por exemplo "muda o e-mail para outro@exemplo.com".'
            );
          } else {
            dizer('assistente', 'Não entendi bem — pode tentar de outro jeito? Ou usa os botões abaixo.');
          }
          return nova;
        });
        return;
      }

      setDados((d) => ({ ...d, ...patchesValidos }));
      setTentativasRevisao(0);
      dizer('assistente', resultado.resumoAmigavel ?? 'Atualizei os dados.');
    }
  }

  // ── Respostas rápidas ─────────────────────────────────────────────────────
  function escolherCor(valor: string, nome: string) {
    dizer('usuario', nome);
    setDados((d) => ({ ...d, corPrimaria: valor }));
    irPara('modulos');
  }

  function alternarModulo(chave: 'contratos' | 'honorarioExito') {
    setDados((d) => ({ ...d, modulos: { ...d.modulos, [chave]: !d.modulos[chave] } }));
  }

  function confirmarModulos() {
    const rotulos: string[] = [];
    if (dados.modulos.contratos) rotulos.push('Contratos consultivos');
    if (dados.modulos.honorarioExito) rotulos.push('Honorário de êxito');
    dizer('usuario', rotulos.length > 0 ? rotulos.join(' + ') : 'Nenhum módulo extra por enquanto');
    irPara('adminNome');
  }

  function seguirComJuridico() {
    dizer('usuario', 'Seguir com o jurídico');
    irPara('nomeEscritorio');
  }

  function pararPorAqui() {
    dizer('usuario', 'Parar por aqui');
    dizer(
      'assistente',
      `Combinado — melhor não entregar o que não existe. Quando o vertical de ${verticalPedido ?? 'que você pediu'} estiver pronto de verdade, ele aparece aqui.`
    );
    setFase('encerrado');
  }

  function confirmarRevisao() {
    dizer('usuario', 'Confirmar e criar meu ERP');
    setFase('gerando');
  }

  function tentarDeNovo() {
    dizer('usuario', 'Tentar de novo');
    geracaoIniciada.current = false;
    setFase('gerando');
  }

  function recomecar() {
    setDados(DADOS_VAZIOS);
    setVerticalPedido(null);
    setTentativasRevisao(0);
    geracaoIniciada.current = false;
    dizer('assistente', 'Sem problema. Me conta de novo: que tipo de ERP você precisa?');
    setFase('pedido');
  }

  const nomeDoErp = tenantBranding?.nomeExibicao || dados.nomeEscritorio || 'seu ERP';
  const aceitaTexto = FASES_TEXTO.includes(fase);

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
                {msg.texto}
              </div>
            </div>
          ))}

          {fase === 'corPrimaria' && (
            <div className={styles.respostasRapidas} role="group" aria-label="Cor da marca">
              {CORES_MARCA.map((cor) => (
                <button
                  key={cor.valor}
                  type="button"
                  className={styles.swatchBtn}
                  onClick={() => escolherCor(cor.valor, cor.nome)}
                >
                  <span className={styles.swatch} style={{ background: cor.valor }} />
                  {cor.nome}
                </button>
              ))}
            </div>
          )}

          {fase === 'modulos' && (
            <div className={styles.respostasRapidas} role="group" aria-label="Módulos do escritório">
              <button
                type="button"
                className={dados.modulos.contratos ? styles.moduloToggleAtivo : styles.moduloToggle}
                aria-pressed={dados.modulos.contratos}
                onClick={() => alternarModulo('contratos')}
              >
                Contratos consultivos
              </button>
              <button
                type="button"
                className={dados.modulos.honorarioExito ? styles.moduloToggleAtivo : styles.moduloToggle}
                aria-pressed={dados.modulos.honorarioExito}
                onClick={() => alternarModulo('honorarioExito')}
              >
                Honorário de êxito
              </button>
              <button type="button" className={styles.btnPrimario} onClick={confirmarModulos}>
                Continuar
              </button>
            </div>
          )}

          {fase === 'confirmarFallback' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnPrimario} onClick={seguirComJuridico}>
                Seguir com o jurídico
              </button>
              <button type="button" className={styles.btnSecundario} onClick={pararPorAqui}>
                Parar por aqui
              </button>
            </div>
          )}

          {fase === 'revisao' && (
            <>
              <div className={styles.linhaAssistente}>
                <div className={styles.balaoAssistente}>
                  <dl className={styles.revisao}>
                    <div>
                      <dt>Escritório</dt>
                      <dd>{dados.nomeEscritorio}</dd>
                    </div>
                    <div>
                      <dt>CNPJ/CPF</dt>
                      <dd>{dados.cnpjOuCpf}</dd>
                    </div>
                    <div>
                      <dt>Cor da marca</dt>
                      <dd className={styles.revisaoCor}>
                        <span className={styles.swatchMini} style={{ background: dados.corPrimaria }} />
                        {CORES_MARCA.find((c) => c.valor === dados.corPrimaria)?.nome}
                      </dd>
                    </div>
                    <div>
                      <dt>Módulos</dt>
                      <dd>
                        {[
                          dados.modulos.contratos && 'Contratos consultivos',
                          dados.modulos.honorarioExito && 'Honorário de êxito',
                        ].filter(Boolean).join(' + ') || 'Nenhum módulo extra'}
                      </dd>
                    </div>
                    <div>
                      <dt>Administrador</dt>
                      <dd>
                        {dados.adminNome} · {dados.adminEmail}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className={styles.respostasRapidas}>
                <button type="button" className={styles.btnPrimario} onClick={confirmarRevisao}>
                  Confirmar e criar meu ERP
                </button>
                <button type="button" className={styles.btnSecundario} onClick={recomecar}>
                  Recomeçar
                </button>
              </div>
            </>
          )}

          {fase === 'erro' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnPrimario} onClick={tentarDeNovo}>
                Tentar de novo
              </button>
              <button type="button" className={styles.btnSecundario} onClick={recomecar}>
                Recomeçar
              </button>
            </div>
          )}

          {fase === 'encerrado' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnSecundario} onClick={recomecar}>
                Recomeçar
              </button>
            </div>
          )}

          {fase === 'gerando' && (
            <div className={styles.linhaAssistente}>
              <div className={styles.digitando} aria-label="Gerando">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {fase === 'pronto' && (
            <section className={styles.preview} aria-label="Preview do ERP gerado">
              <header className={styles.previewBarra}>
                <span className={styles.previewPonto} />
                <span className={styles.previewPonto} />
                <span className={styles.previewPonto} />
                <span className={styles.previewTitulo}>{nomeDoErp}</span>
              </header>
              <iframe
                className={styles.previewFrame}
                src={paths.dashboard}
                title={`Preview do ERP de ${nomeDoErp}`}
              />
              <button
                type="button"
                className={styles.previewLink}
                onClick={() => navigate(paths.dashboard)}
              >
                Abrir {nomeDoErp} em tela cheia
                <ExternalLink size={14} aria-hidden="true" />
              </button>
            </section>
          )}

          <div ref={fimDaLista} />
        </div>
      </div>

      <div className={styles.rodape}>
        <form className={styles.composer} onSubmit={enviar}>
          <input
            className={styles.campo}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder={PLACEHOLDERS[fase] ?? 'Aguarde...'}
            type={fase === 'adminPassword' ? 'password' : 'text'}
            autoComplete={fase === 'adminPassword' ? 'new-password' : 'off'}
            disabled={!aceitaTexto}
            aria-label={PERGUNTAS[fase] ?? 'Mensagem'}
          />
          <button
            type="submit"
            className={styles.enviar}
            disabled={!aceitaTexto || entrada.trim().length === 0}
            aria-label="Enviar"
          >
            {fase === 'adminPassword' ? <Check size={16} /> : <ArrowUp size={16} />}
          </button>
        </form>
        <p className={styles.aviso}>Axion pode cometer erros. Verifique informações importantes.</p>
      </div>
    </div>
  );
}

