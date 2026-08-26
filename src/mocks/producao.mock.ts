import type { FichaTecnica, OrdemProducao } from '@/types';

export const fichasTecnicasMock: FichaTecnica[] = [
  {
    id: 'ft-ind-01',
    tenantId: 'tenant-ind-plast',
    codigo: 'FT-BLD-20L',
    produtoAcabadoId: 'prod-ind-05', // Balde Plástico Industrial 20L
    descricao: 'Composição de Injeção - Balde Industrial 20L c/ Alça e Tampa',
    versao: 'v2.1',
    tempoEstimadoMinutos: 45,
    itens: [
      {
        produtoInsumoId: 'prod-ind-01', // Resina PP H-103
        quantidade: 0.85,
        unidade: 'KG',
        perdaPercentual: 1.5,
        observacoes: 'Resina PP Virgem alimentada no silo da injetora',
      },
      {
        produtoInsumoId: 'prod-ind-03', // Masterbatch Azul MB-40
        quantidade: 0.03,
        unidade: 'KG',
        perdaPercentual: 0.5,
        observacoes: 'Dosagem no misturador gravimétrico',
      },
      {
        produtoInsumoId: 'prod-ind-04', // Aditivo Anti-UV UV-990
        quantidade: 0.01,
        unidade: 'KG',
        perdaPercentual: 0.2,
        observacoes: 'Aditivação anti-ressecamento e intempéries',
      },
    ],
    ativo: true,
    observacoes: 'Molde 2 cavidades com câmara quente e robô de extração.',
    criadoEm: '2024-01-25T10:00:00.000Z',
  },
  {
    id: 'ft-ind-02',
    tenantId: 'tenant-ind-plast',
    codigo: 'FT-CX-50L',
    produtoAcabadoId: 'prod-ind-06', // Caixa Organizadora 50L
    descricao: 'Composição de Injeção - Caixa Organizadora 50L c/ Travas',
    versao: 'v1.4',
    tempoEstimadoMinutos: 60,
    itens: [
      {
        produtoInsumoId: 'prod-ind-01', // Resina PP
        quantidade: 1.62,
        unidade: 'KG',
        perdaPercentual: 1.0,
        observacoes: 'PP Clarificado Homopolímero',
      },
      {
        produtoInsumoId: 'prod-ind-04', // Aditivo UV
        quantidade: 0.02,
        unidade: 'KG',
        perdaPercentual: 0.5,
        observacoes: 'Anti-UV e clarificante de alta transparência',
      },
    ],
    ativo: true,
    observacoes: 'Injetora 650 toneladas com ciclo de 42 segundos.',
    criadoEm: '2024-01-26T14:30:00.000Z',
  },
  {
    id: 'ft-ind-03',
    tenantId: 'tenant-ind-plast',
    codigo: 'FT-BOM-50L',
    produtoAcabadoId: 'prod-ind-07', // Bombona Plástica 50L Químicos
    descricao: 'Composição de Sopro e Extrusão - Bombona 50L Homologada',
    versao: 'v3.0',
    tempoEstimadoMinutos: 90,
    itens: [
      {
        produtoInsumoId: 'prod-ind-02', // Resina PEAD GM-9450F
        quantidade: 2.75,
        unidade: 'KG',
        perdaPercentual: 2.0,
        observacoes: 'PEAD GM-9450F de alto peso molecular para cargas perigosas',
      },
      {
        produtoInsumoId: 'prod-ind-03', // Masterbatch Azul
        quantidade: 0.08,
        unidade: 'KG',
        perdaPercentual: 0.5,
        observacoes: 'Masterbatch Azul Royal alta concentração',
      },
      {
        produtoInsumoId: 'prod-ind-04', // Aditivo UV
        quantidade: 0.02,
        unidade: 'KG',
        perdaPercentual: 0.2,
        observacoes: 'Estabilizante anti-UV exterior',
      },
    ],
    ativo: true,
    observacoes: 'Sopradora com programador de parison e teste de estanqueidade 100%.',
    criadoEm: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'ft-ind-04',
    tenantId: 'tenant-ind-plast',
    codigo: 'FT-TMP-50MM',
    produtoAcabadoId: 'prod-ind-08', // Tampa 50mm Cx c/ 1000
    descricao: 'Composição de Injeção Rápida - Tampa Rosca 50mm com Lacre (Cx c/ 1000 un)',
    versao: 'v1.0',
    tempoEstimadoMinutos: 30,
    itens: [
      {
        produtoInsumoId: 'prod-ind-01', // Resina PP
        quantidade: 11.5,
        unidade: 'KG',
        perdaPercentual: 1.0,
        observacoes: 'Molde 16 cavidades com corte de anel inviolável',
      },
      {
        produtoInsumoId: 'prod-ind-03', // Masterbatch Azul
        quantidade: 0.35,
        unidade: 'KG',
        perdaPercentual: 0.5,
        observacoes: 'Coloração azul padrão PoliPlast',
      },
    ],
    ativo: true,
    observacoes: 'Embaladas em caixa de papelão reforçada com liner plástico.',
    criadoEm: '2024-02-02T11:00:00.000Z',
  },
];

export const ordensProducaoMock: OrdemProducao[] = [
  {
    id: 'op-ind-01',
    tenantId: 'tenant-ind-plast',
    numeroOP: 'OP-2024-001',
    fichaTecnicaId: 'ft-ind-01',
    status: 'em_producao',
    quantidadePlanejada: 1000,
    quantidadeProduzida: 650,
    dataInicio: '2024-03-28T07:30:00.000Z',
    custos: {
      materiaPrimaCentavos: 792000,
      maoDeObraCentavos: 250000,
      custosIndiretosCentavos: 50000,
      totalCentavos: 1092000,
    },
    lote: 'LOT-202403-B20-01',
    responsavelNome: 'Eng. Roberto Vasconcelos',
    observacoes: 'Lote prioritário para atendimento da distribuidora química Sul Clean.',
    criadoEm: '2024-03-27T16:00:00.000Z',
  },
  {
    id: 'op-ind-02',
    tenantId: 'tenant-ind-plast',
    numeroOP: 'OP-2024-002',
    fichaTecnicaId: 'ft-ind-03',
    status: 'planejada',
    quantidadePlanejada: 500,
    quantidadeProduzida: 0,
    dataInicio: '2024-04-02T08:00:00.000Z',
    custos: {
      materiaPrimaCentavos: 1261000,
      maoDeObraCentavos: 420000,
      custosIndiretosCentavos: 80000,
      totalCentavos: 1761000,
    },
    lote: 'LOT-202404-BOM-01',
    responsavelNome: 'Eng. Roberto Vasconcelos',
    observacoes: 'Aguardando liberação de turno na extrusora sopradora S-02.',
    criadoEm: '2024-03-29T10:15:00.000Z',
  },
  {
    id: 'op-ind-03',
    tenantId: 'tenant-ind-plast',
    numeroOP: 'OP-2024-003',
    fichaTecnicaId: 'ft-ind-02',
    status: 'concluida',
    quantidadePlanejada: 800,
    quantidadeProduzida: 800,
    dataInicio: '2024-03-20T08:00:00.000Z',
    dataFim: '2024-03-24T17:00:00.000Z',
    custos: {
      materiaPrimaCentavos: 1088000,
      maoDeObraCentavos: 360000,
      custosIndiretosCentavos: 60000,
      totalCentavos: 1508000,
    },
    lote: 'LOT-202403-CX50-09',
    responsavelNome: 'Marcos Silveira (Supervisor Turno A)',
    observacoes: 'Produção concluída dentro dos padrões de conformidade dimensional.',
    criadoEm: '2024-03-19T14:00:00.000Z',
  },
  {
    id: 'op-ind-04',
    tenantId: 'tenant-ind-plast',
    numeroOP: 'OP-2024-004',
    fichaTecnicaId: 'ft-ind-04',
    status: 'planejada',
    quantidadePlanejada: 50,
    quantidadeProduzida: 0,
    dataInicio: '2024-04-05T07:00:00.000Z',
    custos: {
      materiaPrimaCentavos: 494500,
      maoDeObraCentavos: 180000,
      custosIndiretosCentavos: 40000,
      totalCentavos: 714500,
    },
    lote: 'LOT-202404-TMP-03',
    responsavelNome: 'Eng. Roberto Vasconcelos',
    observacoes: 'Injeção de tampas com molde de 16 cavidades canal quente.',
    criadoEm: '2024-03-30T11:00:00.000Z',
  },
  {
    id: 'op-ind-05',
    tenantId: 'tenant-ind-plast',
    numeroOP: 'OP-2024-005',
    fichaTecnicaId: 'ft-ind-01',
    status: 'cancelada',
    quantidadePlanejada: 200,
    quantidadeProduzida: 0,
    dataInicio: '2024-03-15T08:00:00.000Z',
    dataFim: '2024-03-15T09:30:00.000Z',
    custos: {
      materiaPrimaCentavos: 0,
      maoDeObraCentavos: 0,
      totalCentavos: 0,
    },
    lote: 'LOT-202403-B20-CAN',
    responsavelNome: 'Marcos Silveira',
    observacoes: 'Cancelada por readequação de matriz no turno matutino.',
    criadoEm: '2024-03-15T07:45:00.000Z',
  },
];
