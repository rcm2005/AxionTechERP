export const paths = {
  login: '/login',
  dashboard: '/dashboard',
  copilot: '/copilot',
  vendas: '/vendas',
  compras: '/compras',
  estoque: '/estoque',
  financeiro: '/financeiro',
  fiscal: '/fiscal',
  clientes: '/clientes',
  cliente: (id: string) => `/clientes/${id}`,
  configuracoes: '/configuracoes',
  // Rotas legadas para compatibilidade
  processos: '/processos',
  processo: (id: string) => `/processos/${id}`,
  processoTab: (id: string, tab: string) => `/processos/${id}/${tab}`,
  agenda: '/agenda',
} as const;

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
