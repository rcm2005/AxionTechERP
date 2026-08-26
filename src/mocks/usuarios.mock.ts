import type { Usuario } from '@/types';

export const usuariosMock: Usuario[] = [
  {
    id: 'u1',
    nome: 'Yasmin Santos',
    nomeExibicao: 'Dra. Yasmin Santos',
    iniciais: 'YS',
    email: 'yasmin@silvaassociados.com.br',
    role: 'socio',
    oab: 'OAB/SP 312.456',
    ativo: true,
  },
  {
    id: 'u2',
    nome: 'Carlos Lima',
    nomeExibicao: 'Dr. Carlos Lima',
    iniciais: 'CL',
    email: 'carlos@silvaassociados.com.br',
    role: 'advogado',
    oab: 'OAB/SP 298.741',
    ativo: true,
  },
  {
    id: 'u3',
    nome: 'Ana Ribeiro',
    nomeExibicao: 'Dra. Ana Ribeiro',
    iniciais: 'AR',
    email: 'ana@silvaassociados.com.br',
    role: 'advogado',
    oab: 'OAB/SP 355.019',
    ativo: true,
  },
  {
    id: 'u4',
    nome: 'Bruno Ferreira',
    nomeExibicao: 'Bruno Ferreira',
    iniciais: 'BF',
    email: 'bruno@silvaassociados.com.br',
    role: 'financeiro',
    ativo: true,
  },
];

export const usuarioLogadoMock = usuariosMock[0];
