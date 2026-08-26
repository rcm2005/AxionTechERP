export const paths = {
  login: '/login',
  dashboard: '/dashboard',
  clientes: '/clientes',
  cliente: (id: string) => `/clientes/${id}`,
  processos: '/processos',
  processo: (id: string) => `/processos/${id}`,
  processoTab: (id: string, tab: string) => `/processos/${id}/${tab}`,
  agenda: '/agenda',
  financeiro: '/financeiro',
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
