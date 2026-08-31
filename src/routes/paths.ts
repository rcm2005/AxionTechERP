export const paths = {
  login: '/login',
  comecar: '/comecar',
  comecarArquivos: '/comecar/arquivos',
  comecarConta: '/comecar/conta',
  /** Wizard de onboarding original, preservado como fallback do chat. */
  comecarWizard: '/comecar/wizard',
  dashboard: '/dashboard',
  copilot: '/copilot',
  financeiro: '/financeiro',
  fiscal: '/fiscal',
  clientes: '/clientes',
  cliente: (id: string) => `/clientes/${id}`,
  configuracoes: '/configuracoes',
  // Núcleo jurídico (vertical real do produto)
  processos: '/processos',
  processo: (id: string) => `/processos/${id}`,
  processoTab: (id: string, tab: string) => `/processos/${id}/${tab}`,
  prazos: '/prazos',
  agenda: '/agenda',
  contratos: '/contratos',
} as const;

/**
 * Abas previstas para a tela do processo. Hoje `ProcessoDetailPage` renderiza
 * seções empilhadas e só as fontes com endpoint real (prazos, audiências);
 * esta lista permanece como o alvo para quando andamentos/documentos/tarefas
 * existirem no backend.
 */
export const processoTabs = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'andamentos', label: 'Andamentos' },
  { key: 'prazos', label: 'Prazos' },
  { key: 'audiencias', label: 'Audiências' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'financeiro', label: 'Financeiro' },
] as const;

export type ProcessoTabKey = (typeof processoTabs)[number]['key'];
