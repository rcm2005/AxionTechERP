// Classificação determinística da primeira mensagem do usuário.
//
// LIMITE HONESTO: não há LLM ligado neste ambiente. Isto é busca por palavra-
// chave sobre texto normalizado (minúsculo, sem acento) — não é compreensão de
// linguagem natural. O objetivo é apenas separar três casos:
//
//   'juridico' — o usuário pediu explicitamente o vertical que existe;
//   'outro'    — o usuário nomeou um vertical que NÃO existe (responder com
//                honestidade, nunca fingir que dá pra montar);
//   'generico' — pedido vago ou vazio ("quero um ERP"). Como jurídico é o
//                único vertical existente, tratamos como match implícito.

export type ResultadoVertical =
  | { tipo: 'juridico' }
  | { tipo: 'generico' }
  | { tipo: 'outro'; termo: string };

/** minúsculas + sem diacríticos, pra "jurídico" e "juridico" baterem igual. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Radicais (não palavras inteiras) pra pegar flexões: advogado/advogada/
// advogados, juridico/juridica, etc.
const RADICAIS_JURIDICO = [
  'juridic',
  'advocacia',
  'advogad',
  'escritorio de advocacia',
  'direito',
  'processual',
  'forense',
  'law firm',
  'oab',
];

// Verticais que este produto reconhece pelo nome mas NÃO sabe montar.
// O rótulo é usado na resposta ("um ERP para restaurante"), por isso o par.
const OUTROS_VERTICAIS: ReadonlyArray<{ radical: string; rotulo: string }> = [
  { radical: 'loja', rotulo: 'varejo' },
  { radical: 'varejo', rotulo: 'varejo' },
  { radical: 'comercio', rotulo: 'comércio' },
  { radical: 'mercado', rotulo: 'mercado' },
  { radical: 'padaria', rotulo: 'padaria' },
  { radical: 'restaurante', rotulo: 'restaurante' },
  { radical: 'hotel', rotulo: 'hotelaria' },
  { radical: 'pousada', rotulo: 'hotelaria' },
  { radical: 'agro', rotulo: 'agronegócio' },
  { radical: 'fazenda', rotulo: 'agronegócio' },
  { radical: 'clinica', rotulo: 'saúde' },
  { radical: 'consultorio', rotulo: 'saúde' },
  { radical: 'saude', rotulo: 'saúde' },
  { radical: 'odonto', rotulo: 'odontologia' },
  { radical: 'dentista', rotulo: 'odontologia' },
  { radical: 'farmacia', rotulo: 'farmácia' },
  { radical: 'petshop', rotulo: 'petshop' },
  { radical: 'pet shop', rotulo: 'petshop' },
  { radical: 'escola', rotulo: 'educação' },
  { radical: 'curso', rotulo: 'educação' },
  { radical: 'academia', rotulo: 'academia' },
  { radical: 'salao', rotulo: 'salão de beleza' },
  { radical: 'barbearia', rotulo: 'barbearia' },
  { radical: 'oficina', rotulo: 'oficina mecânica' },
  { radical: 'mecanic', rotulo: 'oficina mecânica' },
  { radical: 'construtora', rotulo: 'construção civil' },
  { radical: 'construcao', rotulo: 'construção civil' },
  { radical: 'imobiliaria', rotulo: 'imobiliária' },
  { radical: 'transportadora', rotulo: 'transporte' },
  { radical: 'logistica', rotulo: 'logística' },
  { radical: 'industria', rotulo: 'indústria' },
  { radical: 'fabrica', rotulo: 'indústria' },
  { radical: 'ecommerce', rotulo: 'e-commerce' },
  { radical: 'e-commerce', rotulo: 'e-commerce' },
  { radical: 'contabilidade', rotulo: 'contabilidade' },
  { radical: 'contabil', rotulo: 'contabilidade' },
];

export function classificarPedido(textoBruto: string): ResultadoVertical {
  const texto = normalizar(textoBruto);
  if (!texto) return { tipo: 'generico' };

  // Jurídico ganha do resto: "escritório de advocacia que também tem loja"
  // continua sendo um escritório de advocacia.
  if (RADICAIS_JURIDICO.some((r) => texto.includes(r))) {
    return { tipo: 'juridico' };
  }

  const outro = OUTROS_VERTICAIS.find((v) => texto.includes(v.radical));
  if (outro) return { tipo: 'outro', termo: outro.rotulo };

  return { tipo: 'generico' };
}
