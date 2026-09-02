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
// State machine
//
// The chat is NOT an illusion: each phase below is a real state, with a question,
// a validation, and a transition. Validations match the legacy wizard
// (`src/pages/onboarding/OnboardingPage.tsx`) — if they change there, change here.
// ─────────────────────────────────────────────────────────────────────────────

type Phase =
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

/** Phases in which the text input accepts freeform answers. */
const TEXT_PHASES: ReadonlyArray<Phase> = [
  'pedido',
  'nomeEscritorio',
  'cnpjOuCpf',
  'adminNome',
  'adminEmail',
  'adminPassword',
  'revisao',
];

interface Message {
  id: number;
  author: 'user' | 'assistant';
  text: string;
  variant?: 'error';
}

const QUESTIONS: Partial<Record<Phase, string>> = {
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

const PLACEHOLDERS: Partial<Record<Phase, string>> = {
  pedido: 'Ask anything...',
  nomeEscritorio: 'Ex: Silva & Santos Advocacia',
  cnpjOuCpf: '00.000.000/0001-00',
  adminNome: 'Ex: Dra. Ana Ribeiro',
  adminEmail: 'voce@escritorio.com.br',
  adminPassword: 'Mínimo 8 caracteres',
  revisao: 'Ex: muda o e-mail para...',
};

/** Narration displayed while the tenant is actually being created. */
const GENERATION_LINES = [
  'Entendido! Vamos montar um ERP jurídico personalizado para o seu escritório. 📋',
  'Configurando módulos: Clientes, Processos, Agenda & Prazos e Financeiro...',
  'Gerando a tela de login com a identidade visual do escritório...',
  'Montando o dashboard com KPIs, calendário e fluxo de caixa...',
];

const SUCCESS_LINES = [
  'Pronto! Seu ERP jurídico foi gerado 🎉 Ele já inclui tela de login, dashboard, cadastro de clientes, gestão de processos, agenda de prazos/audiências e módulo financeiro.',
  'Veja o preview abaixo — você pode navegar entre as telas.',
];

const LINE_DELAY_MS = 850;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FormData = DadosOnboarding & {
  modulos: {
    contratos: boolean;
    honorarioExito: boolean;
  };
};

const EMPTY_FORM_DATA: FormData = {
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
 * Validates the phase field. Returns the error message (which the assistant speaks)
 * or `null` if valid. Same rules as the old wizard.
 */
function validateField(phase: Phase, value: string): string | null {
  switch (phase) {
    case 'nomeEscritorio':
      return value.trim().length > 0
        ? null
        : 'Preciso de um nome pro escritório pra seguir — pode ser o nome que está na placa.';
    case 'cnpjOuCpf':
      return value.trim().length >= 11
        ? null
        : 'Esse número ficou curto: um CPF tem 11 dígitos e um CNPJ, 14. Pode conferir?';
    case 'adminNome':
      return value.trim().length > 0 ? null : 'Preciso do seu nome pra criar o usuário administrador.';
    case 'adminEmail':
      return /\S+@\S+\.\S+/.test(value) ? null : 'Esse e-mail não parece válido. Pode escrever de novo?';
    case 'adminPassword':
      return value.length >= 8 ? null : 'A senha precisa ter pelo menos 8 caracteres.';
    default:
      return null;
  }
}

/** Next phase after a valid field. */
const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
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

  const [phase, setPhase] = useState<Phase>('pedido');
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
  const [input, setInput] = useState('');
  const [requestedVertical, setRequestedVertical] = useState<string | null>(null);
  const [, setReviewAttempts] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      author: 'assistant',
      text:
        'Oi! Me conta em uma frase que tipo de ERP você precisa e eu monto agora. Hoje eu tenho o vertical jurídico pronto de verdade.',
    },
  ]);

  const nextId = useRef(1);
  const generationStarted = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((author: Message['author'], text: string, variant?: 'error') => {
    setMessages((current) => [...current, { id: nextId.current++, author, text, variant }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, phase]);

  /** Asks the question for the next phase and transitions into it. */
  const goToPhase = useCallback(
    (next: Phase) => {
      const question = QUESTIONS[next];
      if (question) {
        addMessage('assistant', question);
      } else if (next === 'revisao') {
        addMessage('assistant', 'Confere se está tudo certo antes de eu criar o escritório de verdade.');
      }
      setPhase(next);
    },
    [addMessage]
  );

  // ── Generation + real tenant creation ─────────────────────────────────────
  const executeGeneration = useCallback(
    async (finalData: FormData) => {
      for (const line of GENERATION_LINES) {
        await wait(LINE_DELAY_MS);
        addMessage('assistant', line);
      }
      try {
        // Real call: creates tenant + admin user in Postgres and stores the session.
        await criarEscritorio(finalData);
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'erro desconhecido';
        addMessage(
          'assistant',
          `Não consegui criar o escritório: ${detail}. Nada foi perdido — seus dados continuam preenchidos aqui.`,
          'error'
        );
        setPhase('erro');
        return;
      }
      for (const line of SUCCESS_LINES) {
        await wait(LINE_DELAY_MS);
        addMessage('assistant', line);
      }
      setPhase('pronto');
    },
    [criarEscritorio, addMessage]
  );

  useEffect(() => {
    if (phase !== 'gerando' || generationStarted.current) return;
    generationStarted.current = true;
    void executeGeneration(formData);
  }, [phase, formData, executeGeneration]);

  // ── Text input ────────────────────────────────────────────────────────────
  function handleSend(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!TEXT_PHASES.includes(phase) || !value) return;

    // Password is echoed masked — transcript remains visible on screen.
    addMessage('user', phase === 'adminPassword' ? '•'.repeat(Math.min(value.length, 12)) : value);
    setInput('');

    if (phase === 'pedido') {
      void handleRequest(value);
      return;
    }

    if (phase === 'revisao') {
      void handleReview(value);
      return;
    }

    const error = validateField(phase, value);
    if (error) {
      addMessage('assistant', error, 'error');
      return;
    }

    const field = phase as keyof FormData;
    const updated: FormData = { ...formData, [field]: value };
    setFormData(updated);
    goToPhase(NEXT_PHASE[phase] ?? 'gerando');
  }

  async function handleRequest(text: string) {
    const interpretation = await onboardingService.interpretRequest(text);
    let type: 'juridico' | 'outro' | 'generico';
    let term: string | undefined;

    if (interpretation.disponivel) {
      type = interpretation.tipo;
      term = interpretation.termo;
      if (interpretation.nomeEscritorioSugerido) {
        const suggested = interpretation.nomeEscritorioSugerido;
        setFormData((d) => ({ ...d, nomeEscritorio: suggested }));
        setInput(suggested);
      }
    } else {
      const localResult = classificarPedido(text);
      type = localResult.tipo;
      term = localResult.tipo === 'outro' ? localResult.termo : undefined;
    }

    if (type === 'outro') {
      const finalTerm = term ?? 'outro setor';
      setRequestedVertical(finalTerm);
      addMessage(
        'assistant',
        `Vou ser honesto: hoje a Axion tem um único vertical pronto de verdade, o jurídico. Não existe template de ${finalTerm} — e eu não vou fingir que monto um.`
      );
      addMessage(
        'assistant',
        'Dá pra seguir com o template jurídico mesmo assim (você vê tudo funcionando e adapta depois), ou a gente para por aqui. Você escolhe.'
      );
      setPhase('confirmarFallback');
      return;
    }

    if (type === 'generico') {
      addMessage(
        'assistant',
        'Beleza. O vertical que eu monto hoje é o jurídico — vou seguir por ele, que é o que existe de verdade.'
      );
    }

    goToPhase('nomeEscritorio');
  }

  async function handleReview(rawText: string) {
    // 1. Deterministic fast-path, no network
    const normalized = normalizar(rawText);
    if (
      /\b(confirma|confirmar|pode confirmar|ta certo|esta certo|isso mesmo|pode criar|manda ver)\b/.test(
        normalized
      )
    ) {
      handleConfirmReview();
      return;
    }
    if (/\b(recomeca|recomecar|reiniciar|cancelar|do zero)\b/.test(normalized)) {
      handleRestart();
      return;
    }

    // 2. AI call
    const result = await onboardingService.reviewConfirmation(rawText, {
      nomeEscritorio: formData.nomeEscritorio,
      cnpjOuCpf: formData.cnpjOuCpf,
      corPrimaria: formData.corPrimaria,
      adminNome: formData.adminNome,
      adminEmail: formData.adminEmail,
    });

    // 3. Uncertain or failure
    if (!result || result.intent === 'incerto') {
      setReviewAttempts((t) => {
        const next = t + 1;
        if (next >= 2) {
          addMessage(
            'assistant',
            'Não consegui entender essa correção. Você pode usar os botões abaixo, ou me dizer exatamente o que corrigir — por exemplo "muda o e-mail para outro@exemplo.com".'
          );
        } else {
          addMessage('assistant', 'Não entendi bem — pode tentar de outro jeito? Ou usa os botões abaixo.');
        }
        return next;
      });
      return;
    }

    // 4. Intent confirm
    if (result.intent === 'confirmar') {
      handleConfirmReview();
      return;
    }

    // 5. Intent restart
    if (result.intent === 'recomecar') {
      handleRestart();
      return;
    }

    // 6. Intent patch
    if (result.intent === 'patch') {
      const validPatches: Partial<Record<onboardingService.PatchCampo, string>> = {};

      for (const patch of result.patches) {
        if (patch.campo === 'corPrimaria') {
          const foundColor = CORES_MARCA.find(
            (c) =>
              c.valor.toLowerCase() === patch.valor.toLowerCase() ||
              c.nome.toLowerCase() === patch.valor.toLowerCase()
          );
          if (foundColor) {
            validPatches.corPrimaria = foundColor.valor;
          }
        } else {
          const error = validateField(patch.campo as Phase, patch.valor);
          if (error === null) {
            validPatches[patch.campo] = patch.valor;
          }
        }
      }

      if (Object.keys(validPatches).length === 0) {
        setReviewAttempts((t) => {
          const next = t + 1;
          if (next >= 2) {
            addMessage(
              'assistant',
              'Não consegui entender essa correção. Você pode usar os botões abaixo, ou me dizer exatamente o que corrigir — por exemplo "muda o e-mail para outro@exemplo.com".'
            );
          } else {
            addMessage('assistant', 'Não entendi bem — pode tentar de outro jeito? Ou usa os botões abaixo.');
          }
          return next;
        });
        return;
      }

      setFormData((d) => ({ ...d, ...validPatches }));
      setReviewAttempts(0);
      addMessage('assistant', result.resumoAmigavel ?? 'Atualizei os dados.');
    }
  }

  // ── Quick responses ───────────────────────────────────────────────────────
  function handleSelectColor(value: string, name: string) {
    addMessage('user', name);
    setFormData((d) => ({ ...d, corPrimaria: value }));
    goToPhase('modulos');
  }

  function handleToggleModule(key: 'contratos' | 'honorarioExito') {
    setFormData((d) => ({ ...d, modulos: { ...d.modulos, [key]: !d.modulos[key] } }));
  }

  function handleConfirmModules() {
    const labels: string[] = [];
    if (formData.modulos.contratos) labels.push('Contratos consultivos');
    if (formData.modulos.honorarioExito) labels.push('Honorário de êxito');
    addMessage('user', labels.length > 0 ? labels.join(' + ') : 'Nenhum módulo extra por enquanto');
    goToPhase('adminNome');
  }

  function handleProceedWithLegal() {
    addMessage('user', 'Seguir com o jurídico');
    goToPhase('nomeEscritorio');
  }

  function handleStopHere() {
    addMessage('user', 'Parar por aqui');
    addMessage(
      'assistant',
      `Combinado — melhor não entregar o que não existe. Quando o vertical de ${requestedVertical ?? 'que você pediu'} estiver pronto de verdade, ele aparece aqui.`
    );
    setPhase('encerrado');
  }

  function handleConfirmReview() {
    addMessage('user', 'Confirmar e criar meu ERP');
    setPhase('gerando');
  }

  function handleTryAgain() {
    addMessage('user', 'Tentar de novo');
    generationStarted.current = false;
    setPhase('gerando');
  }

  function handleRestart() {
    setFormData(EMPTY_FORM_DATA);
    setRequestedVertical(null);
    setReviewAttempts(0);
    generationStarted.current = false;
    addMessage('assistant', 'Sem problema. Me conta de novo: que tipo de ERP você precisa?');
    setPhase('pedido');
  }

  const erpName = tenantBranding?.nomeExibicao || formData.nomeEscritorio || 'seu ERP';
  const acceptsText = TEXT_PHASES.includes(phase);

  return (
    <div className={styles.pagina}>
      <div className={styles.transcript}>
        <div className={styles.coluna}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.author === 'user' ? styles.linhaUsuario : styles.linhaAssistente}
            >
              <div
                className={
                  msg.author === 'user'
                    ? styles.balaoUsuario
                    : msg.variant === 'error'
                      ? styles.balaoErro
                      : styles.balaoAssistente
                }
              >
                {msg.text}
              </div>
            </div>
          ))}

          {phase === 'corPrimaria' && (
            <div className={styles.respostasRapidas} role="group" aria-label="Cor da marca">
              {CORES_MARCA.map((cor) => (
                <button
                  key={cor.valor}
                  type="button"
                  className={styles.swatchBtn}
                  onClick={() => handleSelectColor(cor.valor, cor.nome)}
                >
                  <span className={styles.swatch} style={{ background: cor.valor }} />
                  {cor.nome}
                </button>
              ))}
            </div>
          )}

          {phase === 'modulos' && (
            <div className={styles.respostasRapidas} role="group" aria-label="Módulos do escritório">
              <button
                type="button"
                className={formData.modulos.contratos ? styles.moduloToggleAtivo : styles.moduloToggle}
                aria-pressed={formData.modulos.contratos}
                onClick={() => handleToggleModule('contratos')}
              >
                Contratos consultivos
              </button>
              <button
                type="button"
                className={formData.modulos.honorarioExito ? styles.moduloToggleAtivo : styles.moduloToggle}
                aria-pressed={formData.modulos.honorarioExito}
                onClick={() => handleToggleModule('honorarioExito')}
              >
                Honorário de êxito
              </button>
              <button type="button" className={styles.btnPrimario} onClick={handleConfirmModules}>
                Continuar
              </button>
            </div>
          )}

          {phase === 'confirmarFallback' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnPrimario} onClick={handleProceedWithLegal}>
                Seguir com o jurídico
              </button>
              <button type="button" className={styles.btnSecundario} onClick={handleStopHere}>
                Parar por aqui
              </button>
            </div>
          )}

          {phase === 'revisao' && (
            <>
              <div className={styles.linhaAssistente}>
                <div className={styles.balaoAssistente}>
                  <dl className={styles.revisao}>
                    <div>
                      <dt>Escritório</dt>
                      <dd>{formData.nomeEscritorio}</dd>
                    </div>
                    <div>
                      <dt>CNPJ/CPF</dt>
                      <dd>{formData.cnpjOuCpf}</dd>
                    </div>
                    <div>
                      <dt>Cor da marca</dt>
                      <dd className={styles.revisaoCor}>
                        <span className={styles.swatchMini} style={{ background: formData.corPrimaria }} />
                        {CORES_MARCA.find((c) => c.valor === formData.corPrimaria)?.nome}
                      </dd>
                    </div>
                    <div>
                      <dt>Módulos</dt>
                      <dd>
                        {[
                          formData.modulos.contratos && 'Contratos consultivos',
                          formData.modulos.honorarioExito && 'Honorário de êxito',
                        ].filter(Boolean).join(' + ') || 'Nenhum módulo extra'}
                      </dd>
                    </div>
                    <div>
                      <dt>Administrador</dt>
                      <dd>
                        {formData.adminNome} · {formData.adminEmail}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className={styles.respostasRapidas}>
                <button type="button" className={styles.btnPrimario} onClick={handleConfirmReview}>
                  Confirmar e criar meu ERP
                </button>
                <button type="button" className={styles.btnSecundario} onClick={handleRestart}>
                  Recomeçar
                </button>
              </div>
            </>
          )}

          {phase === 'erro' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnPrimario} onClick={handleTryAgain}>
                Tentar de novo
              </button>
              <button type="button" className={styles.btnSecundario} onClick={handleRestart}>
                Recomeçar
              </button>
            </div>
          )}

          {phase === 'encerrado' && (
            <div className={styles.respostasRapidas}>
              <button type="button" className={styles.btnSecundario} onClick={handleRestart}>
                Recomeçar
              </button>
            </div>
          )}

          {phase === 'gerando' && (
            <div className={styles.linhaAssistente}>
              <div className={styles.digitando} aria-label="Gerando">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {phase === 'pronto' && (
            <section className={styles.preview} aria-label="Preview do ERP gerado">
              <header className={styles.previewBarra}>
                <span className={styles.previewPonto} />
                <span className={styles.previewPonto} />
                <span className={styles.previewPonto} />
                <span className={styles.previewTitulo}>{erpName}</span>
              </header>
              <iframe
                className={styles.previewFrame}
                src={paths.dashboard}
                title={`Preview do ERP de ${erpName}`}
              />
              <button
                type="button"
                className={styles.previewLink}
                onClick={() => navigate(paths.dashboard)}
              >
                Abrir {erpName} em tela cheia
                <ExternalLink size={14} aria-hidden="true" />
              </button>
            </section>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.rodape}>
        <form className={styles.composer} onSubmit={handleSend}>
          <input
            className={styles.campo}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[phase] ?? 'Aguarde...'}
            type={phase === 'adminPassword' ? 'password' : 'text'}
            autoComplete={phase === 'adminPassword' ? 'new-password' : 'off'}
            disabled={!acceptsText}
            aria-label={QUESTIONS[phase] ?? 'Mensagem'}
          />
          <button
            type="submit"
            className={styles.enviar}
            disabled={!acceptsText || input.trim().length === 0}
            aria-label="Enviar"
          >
            {phase === 'adminPassword' ? <Check size={16} /> : <ArrowUp size={16} />}
          </button>
        </form>
        <p className={styles.aviso}>Axion pode cometer erros. Verifique informações importantes.</p>
      </div>
    </div>
  );
}

