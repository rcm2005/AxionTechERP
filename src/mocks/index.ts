import { usuariosMock } from './usuarios.mock';
import { clientesMock } from './clientes.mock';
import { processosMock } from './processos.mock';
import { andamentosMock } from './andamentos.mock';
import { eventosMock } from './eventos.mock';
import { lancamentosMock } from './lancamentos.mock';

export const db = {
  usuarios: usuariosMock,
  clientes: clientesMock,
  processos: processosMock,
  andamentos: andamentosMock,
  eventos: eventosMock,
  lancamentos: lancamentosMock,
};

export * from './usuarios.mock';
