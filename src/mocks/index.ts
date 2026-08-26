import type { Usuario, Cliente, Processo, Andamento, EventoAgenda, Lancamento } from '@/types';
import { usuariosMock } from './usuarios.mock';
import { clientesMock } from './clientes.mock';
import { processosMock } from './processos.mock';
import { andamentosMock } from './andamentos.mock';
import { eventosMock } from './eventos.mock';
import { lancamentosMock } from './lancamentos.mock';

const DB_KEY = 'axion_law_erp_db_v1';

export interface DbSchema {
  usuarios: Usuario[];
  clientes: Cliente[];
  processos: Processo[];
  andamentos: Andamento[];
  eventos: EventoAgenda[];
  lancamentos: Lancamento[];
}

function initDB(): DbSchema {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as DbSchema;
    } catch (e) {
      console.error('Erro ao ler DB do LocalStorage, restaurando padrão...');
    }
  }
  const defaultDb: DbSchema = {
    usuarios: usuariosMock,
    clientes: clientesMock,
    processos: processosMock,
    andamentos: andamentosMock,
    eventos: eventosMock,
    lancamentos: lancamentosMock,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
  return defaultDb;
}

export const db: DbSchema = initDB();

export function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export * from './usuarios.mock';
