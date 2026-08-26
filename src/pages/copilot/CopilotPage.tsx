import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import clsx from 'clsx';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import styles from './CopilotPage.module.scss';

interface PreviewLink {
  url: string;
  label: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  preview?: PreviewLink;
}

interface LocationState {
  firstMessage?: string;
}

// ── Mock responses ────────────────────────────────────────

interface MockResponse {
  keywords: string[];
  response: string;
  /** Optional sequence of short "building" status lines shown before the final response */
  steps?: string[];
  /** Optional generated-app preview shown under the final response bubble */
  preview?: PreviewLink;
}

const MOCK_RESPONSES: MockResponse[] = [
  {
    keywords: ['oi', 'olá', 'ola', 'hey', 'hello', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'tudo bom'],
    response: 'Olá! Tudo ótimo por aqui, obrigado por perguntar! 😊 Como posso te ajudar hoje?',
  },
  {
    keywords: ['plano', 'planos', 'preço', 'preco', 'valor', 'assinar', 'assinatura', 'upgrade', 'premium'],
    response: 'Temos três planos disponíveis:\n\n• **Starter** — Gratuito, ideal para começar\n• **Pro** — R$ 49/mês, recursos avançados\n• **Enterprise** — Sob consulta, para grandes times\n\nQuer saber mais detalhes sobre algum deles?',
  },
  {
    keywords: ['finance', 'financeiro', 'financeira', 'fatura', 'pagamento', 'cobrança', 'cobranca', 'boleto', 'pix'],
    response: 'Na área financeira você consegue visualizar suas faturas, histórico de pagamentos e gerenciar seu método de pagamento. Posso te ajudar com algo específico sobre sua conta?',
  },
  {
    keywords: ['perfil', 'profile', 'conta', 'dados', 'nome', 'email', 'senha', 'foto'],
    response: 'Você pode editar seu perfil acessando o menu lateral e clicando em "Profile". Lá é possível alterar nome, e-mail, foto e senha. Precisa de ajuda com algum campo específico?',
  },
  {
    keywords: ['erro', 'bug', 'problema', 'falha', 'não funciona', 'nao funciona', 'quebrado'],
    response: 'Entendo que está enfrentando um problema. Para te ajudar melhor, pode descrever com mais detalhes o que está acontecendo? Se possível, informe em qual página o erro ocorre.',
  },
  {
    keywords: ['obrigado', 'obrigada', 'valeu', 'thanks', 'thank you', 'brigado'],
    response: 'Fico feliz em ajudar! 😊 Se tiver mais alguma dúvida, é só chamar.',
  },
  {
    keywords: ['tchau', 'bye', 'até logo', 'ate logo', 'até mais', 'ate mais', 'flw', 'falou'],
    response: 'Até logo! Foi um prazer conversar. Qualquer dúvida, estarei por aqui. 👋',
  },
  {
    keywords: ['axion', 'empresa', 'sobre', 'quem', 'o que é', 'o que e'],
    response: 'A Axion Tech é uma plataforma de gestão inteligente que utiliza IA para simplificar processos do seu negócio. Oferecemos ferramentas de automação, análise financeira e suporte 24/7. Como posso te ajudar?',
  },
  {
    keywords: ['ajuda', 'help', 'suporte', 'support', 'dúvida', 'duvida', 'como'],
    response: 'Claro, estou aqui para ajudar! 🤖 Pode me perguntar sobre:\n\n• Planos e preços\n• Área financeira\n• Configurações de perfil\n• Funcionalidades da plataforma\n\nO que você precisa?',
  },
  // ── Demo: geração de ERP sob demanda ─────────────────────
  {
    keywords: [
      'erp jurídico', 'erp juridico', 'sistema jurídico', 'sistema juridico',
      'erp para escritório', 'erp para escritorio', 'escritório de advocacia',
      'escritorio de advocacia', 'gestão jurídica', 'gestao juridica',
      'sistema para advogado', 'sistema para advogados', 'erp advocacia',
      'law erp', 'erp para advogados', 'software jurídico', 'software juridico',
    ],
    steps: [
      'Entendido! Vamos montar um ERP jurídico personalizado para o seu escritório. 📋',
      'Configurando módulos: Clientes, Processos, Agenda & Prazos e Financeiro...',
      'Gerando a tela de login com a identidade visual do escritório...',
      'Montando o dashboard com KPIs, calendário e fluxo de caixa...',
    ],
    response:
      'Pronto! Seu ERP jurídico foi gerado 🎉\n\nEle já inclui tela de login, dashboard, cadastro de clientes, gestão de processos, agenda de prazos/audiências e módulo financeiro. Veja o preview abaixo — você pode navegar entre as telas.',
    preview: {
      url: '/demos/law-erp/login.html',
      label: 'Abrir Law ERP em tela cheia',
    },
  },
];

const DEFAULT_RESPONSE: MockResponse = {
  keywords: [],
  response:
    'Entendi! Estou processando sua solicitação. No momento estou em modo de demonstração, mas em breve terei acesso completo para te ajudar ainda melhor. Tem mais alguma coisa que posso esclarecer?',
};

const getMockResponse = (userMessage: string): MockResponse => {
  const lower = userMessage.toLowerCase();
  const match = MOCK_RESPONSES.find(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  );
  return match ?? DEFAULT_RESPONSE;
};

const simulateDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function CopilotPage() {
  useDocumentTitle('ERP Copilot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const initialized = useRef(false);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const match = getMockResponse(content);

    // Tempo inicial de pensamento antes de qualquer coisa aparecer
    await simulateDelay(700 + Math.random() * 500);

    // Se houver etapas de construção (ex: geração de ERP), mostra cada uma
    // como uma mensagem curta antes da resposta final.
    if (match.steps?.length) {
      for (const step of match.steps) {
        setMessages((prev) => [...prev, { role: 'assistant', content: step }]);
        await simulateDelay(650 + Math.random() * 450);
      }
    }

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: match.response, preview: match.preview },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const state = location.state as LocationState;
    if (state?.firstMessage) {
      sendMessage(state.firstMessage);
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className={styles.container}>
      <PageHead title="ERP Copilot" subtitle="Assistente IA" />

      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={clsx(
                styles.message,
                msg.role === 'user' ? styles.messageUser : styles.messageAssistant
              )}
            >
              <div className={styles.bubble}>{msg.content}</div>

              {msg.preview && (
                <div className={styles.preview}>
                  <div className={styles.previewFrame}>
                    <iframe
                      src={msg.preview.url}
                      title="Preview do sistema gerado"
                      loading="lazy"
                    />
                  </div>
                  <a
                    className={styles.previewLink}
                    href={msg.preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {msg.preview.label} ↗
                  </a>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className={clsx(styles.message, styles.messageAssistant)}>
              <div className={clsx(styles.bubble, styles.bubbleTyping)}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.inputContainer}>
            <textarea
              ref={textareaRef}
              className={styles.input}
              placeholder="Ask anything..."
              value={input}
              rows={1}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className={styles.button}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              Send
            </button>
          </div>

          <p className={styles.disclaimer}>
            Axion pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CopilotPage;
