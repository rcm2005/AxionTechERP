import type { AgendaEvento, Contrato, Prazo, Processo } from '@/types';

/**
 * Dados de demonstração do núcleo jurídico (mock — só usados com
 * VITE_USE_MOCKS !== 'false').
 *
 * As datas são geradas RELATIVAS ao dia de hoje, não fixas: prazos e agenda só
 * comunicam alguma coisa se houver algo vencendo agora. Com datas fixas a tela
 * de prazos vira uma lista de vencidos poucos dias depois de escrita.
 *
 * Os `cliente_id` apontam para pessoas que já existem em `pessoas.mock.ts` e os
 * `responsavel_usuario_id` para usuários de `usuarios.mock.ts`, para que os
 * joins de nome na UI resolvam.
 */

function diasAPartirDeHoje(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function dataHoraRelativa(dias: number, hora: number, minuto = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

export const processosMock: Processo[] = [
  {
    id: 'proc-1',
    cliente_id: 'pes-ind-c1',
    numero_cnj: '1023456-78.2025.8.26.0100',
    tribunal: 'TJSP',
    vara: '12ª Vara Cível de São Paulo',
    partes: [
      { nome: 'Distribuidora Paulista de Produtos de Limpeza Ltda', papel: 'Autor', cpf_cnpj: '13.482.901/0001-55' },
      { nome: 'Transportes Rota Sul Ltda.', papel: 'Réu' },
    ],
    valor_causa: '185000.00',
    fase: 'Instrução',
    status: 'Ativo',
    created_at: '2025-11-04T13:20:00.000Z',
  },
  {
    id: 'proc-2',
    cliente_id: 'pes-ind-c2',
    numero_cnj: '0008123-45.2024.5.02.0011',
    tribunal: 'TRT-2',
    vara: '11ª Vara do Trabalho de São Paulo',
    partes: [
      { nome: 'Anderson Prado da Costa', papel: 'Reclamante', cpf_cnpj: '318.902.774-10' },
      { nome: 'Indústria Agroquímica Safra Forte Ltda.', papel: 'Reclamado' },
    ],
    valor_causa: '72400.00',
    fase: 'Recursal',
    status: 'Ativo',
    created_at: '2025-06-18T09:05:00.000Z',
  },
  {
    id: 'proc-3',
    cliente_id: 'pes-ind-c3',
    numero_cnj: '5001789-90.2026.4.03.6100',
    tribunal: 'TRF-3',
    vara: '5ª Vara Federal Cível de São Paulo',
    partes: [
      { nome: 'Distribuidora Delta de Utilidades Domésticas Ltda.', papel: 'Impetrante' },
      { nome: 'União Federal (Fazenda Nacional)', papel: 'Impetrado' },
    ],
    valor_causa: '412900.00',
    fase: 'Inicial',
    status: 'Ativo',
    created_at: '2026-03-02T16:40:00.000Z',
  },
  {
    id: 'proc-4',
    cliente_id: 'pes-var-c1',
    numero_cnj: '1099887-12.2023.8.26.0053',
    tribunal: 'TJSP',
    vara: '3ª Vara da Fazenda Pública',
    partes: [
      { nome: 'Construtora Alfa & Engenharia Civil Ltda.', papel: 'Autor' },
      { nome: 'Município de São Paulo', papel: 'Réu' },
    ],
    valor_causa: '1250000.00',
    fase: 'Recursal',
    status: 'Suspenso',
    created_at: '2024-02-27T11:00:00.000Z',
  },
];

export const prazosMock: Prazo[] = [
  {
    id: 'prazo-1',
    processo_id: 'proc-1',
    descricao: 'Contestação à reconvenção apresentada pelo réu',
    data_intimacao: diasAPartirDeHoje(-13),
    prazo_fatal: diasAPartirDeHoje(2),
    dias_uteis: 15,
    origem: 'manual',
    status: 'pendente',
  },
  {
    id: 'prazo-2',
    processo_id: 'proc-2',
    descricao: 'Recurso ordinário contra sentença de 1º grau',
    data_intimacao: diasAPartirDeHoje(-5),
    prazo_fatal: diasAPartirDeHoje(-1),
    dias_uteis: 8,
    origem: 'manual',
    status: 'pendente',
  },
  {
    id: 'prazo-3',
    processo_id: 'proc-3',
    descricao: 'Manifestação sobre informações prestadas pela autoridade coatora',
    data_intimacao: diasAPartirDeHoje(-2),
    prazo_fatal: diasAPartirDeHoje(9),
    dias_uteis: 10,
    origem: 'manual',
    status: 'pendente',
  },
  {
    id: 'prazo-4',
    processo_id: 'proc-1',
    descricao: 'Especificação de provas',
    data_intimacao: diasAPartirDeHoje(-30),
    prazo_fatal: diasAPartirDeHoje(-18),
    dias_uteis: 5,
    origem: 'manual',
    status: 'cumprido',
  },
  {
    id: 'prazo-5',
    processo_id: 'proc-4',
    descricao: 'Contrarrazões de apelação',
    data_intimacao: diasAPartirDeHoje(-45),
    prazo_fatal: diasAPartirDeHoje(-31),
    dias_uteis: 15,
    origem: 'manual',
    status: 'perdido',
  },
];

export const agendaEventosMock: AgendaEvento[] = [
  {
    id: 'agev-1',
    processo_id: 'proc-1',
    responsavel_usuario_id: 'u-ind-admin',
    tipo: 'audiencia',
    data_hora: dataHoraRelativa(1, 14, 0),
    duracao_minutos: 90,
    local: 'Fórum João Mendes Júnior — Sala 1204',
    status: 'agendado',
  },
  {
    id: 'agev-2',
    processo_id: 'proc-2',
    responsavel_usuario_id: 'u-ind-fin',
    tipo: 'audiencia',
    data_hora: dataHoraRelativa(3, 9, 30),
    duracao_minutos: 60,
    local: 'TRT-2 — 11ª Vara do Trabalho (videoconferência)',
    status: 'agendado',
  },
  {
    id: 'agev-3',
    processo_id: null,
    responsavel_usuario_id: 'u-ind-admin',
    tipo: 'reuniao',
    data_hora: dataHoraRelativa(3, 16, 0),
    duracao_minutos: 45,
    local: 'Escritório — Sala de reuniões',
    status: 'agendado',
  },
  {
    id: 'agev-4',
    processo_id: 'proc-3',
    responsavel_usuario_id: 'u-contador',
    tipo: 'outro',
    data_hora: dataHoraRelativa(7, 11, 0),
    duracao_minutos: 30,
    local: 'Protocolo eletrônico — TRF-3',
    status: 'agendado',
  },
  {
    id: 'agev-5',
    processo_id: 'proc-4',
    responsavel_usuario_id: 'u-var-gestor',
    tipo: 'audiencia',
    data_hora: dataHoraRelativa(-4, 13, 30),
    duracao_minutos: 120,
    local: 'Fórum Hely Lopes Meirelles — Sala 502',
    status: 'realizado',
  },
];

export const contratosMock: Contrato[] = [
  {
    id: 'ctr-1',
    cliente_id: 'pes-ind-c1',
    titulo: 'Assessoria jurídica contenciosa — cível',
    tipo: 'mensal',
    valor: '8500.00',
    data_inicio: diasAPartirDeHoje(-210),
    data_fim: diasAPartirDeHoje(155),
    status: 'ativo',
  },
  {
    id: 'ctr-2',
    cliente_id: 'pes-ind-c2',
    titulo: 'Defesa trabalhista — Reclamação 0008123-45.2024',
    tipo: 'exito',
    valor: null,
    data_inicio: diasAPartirDeHoje(-380),
    data_fim: null,
    status: 'ativo',
  },
  {
    id: 'ctr-3',
    cliente_id: 'pes-ind-c3',
    titulo: 'Parecer sobre exclusão do ICMS da base do PIS/COFINS',
    tipo: 'parecer',
    valor: '14000.00',
    data_inicio: diasAPartirDeHoje(-60),
    data_fim: diasAPartirDeHoje(-20),
    status: 'encerrado',
  },
  {
    id: 'ctr-4',
    cliente_id: 'pes-var-c1',
    titulo: 'Consultoria em licitações e contratos públicos',
    tipo: 'consultoria',
    valor: '6200.00',
    data_inicio: diasAPartirDeHoje(-95),
    data_fim: diasAPartirDeHoje(270),
    status: 'ativo',
  },
];
