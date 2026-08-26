import type { Andamento } from '@/types';

export const andamentosMock: Andamento[] = [
  {
    id: 'a1',
    processoId: 'p1',
    data: '2026-08-18',
    titulo: 'Prazo cadastrado',
    descricao: 'Apresentar manifestação sobre documentos da parte contrária.',
  },
  {
    id: 'a2',
    processoId: 'p1',
    data: '2026-08-14',
    titulo: 'Documento protocolado',
    descricao: 'Petição intermediária enviada ao tribunal.',
  },
  {
    id: 'a3',
    processoId: 'p1',
    data: '2026-08-05',
    titulo: 'Distribuição',
    descricao: 'Processo distribuído para a 2ª Vara Cível.',
  },
  {
    id: 'a4',
    processoId: 'p2',
    data: '2026-08-10',
    titulo: 'Audiência de instrução realizada',
    descricao: 'Oitiva de testemunhas concluída sem incidentes.',
  },
  {
    id: 'a5',
    processoId: 'p2',
    data: '2026-06-10',
    titulo: 'Distribuição',
    descricao: 'Processo distribuído para a 4ª Vara Cível.',
  },
  {
    id: 'a6',
    processoId: 'p3',
    data: '2026-08-12',
    titulo: 'Réplica protocolada',
    descricao: 'Manifestação sobre a contestação apresentada.',
  },
  {
    id: 'a7',
    processoId: 'p4',
    data: '2026-08-01',
    titulo: 'Penhora deferida',
    descricao: 'Juízo deferiu penhora de bens em nome da parte executada.',
  },
  {
    id: 'a8',
    processoId: 'p5',
    data: '2026-08-09',
    titulo: 'Audiência designada',
    descricao: 'Audiência de instrução marcada para 21/08 às 10h.',
  },
];
