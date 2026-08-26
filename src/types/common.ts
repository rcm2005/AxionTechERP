export type ID = string;

export type Tone = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'amber' | 'neutral';

export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigoIbge?: string;
}

export interface Contato {
  nome: string;
  cargo?: string;
  email: string;
  telefone: string;
  whatsapp?: string;
}
