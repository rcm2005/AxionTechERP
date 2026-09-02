// Deterministic classification of the initial user message.
//
// HONEST LIMIT: there is no LLM enabled in this environment. This is keyword
// matching on normalized text (lowercase, without accents) — not natural language
// understanding. The goal is only to distinguish three cases:
//
//   'juridico' — user explicitly requested the vertical that actually exists;
//   'outro'    — user named a vertical that does NOT exist (respond with
//                honesty, never pretend we can build one);
//   'generico' — vague or empty request ("I want an ERP"). Since legal is the
//                only existing vertical, we treat as implicit match.

export type ResultadoVertical =
  | { tipo: 'juridico' }
  | { tipo: 'generico' }
  | { tipo: 'outro'; termo: string };

/** Lowercase + no diacritics, so "jurídico" and "juridico" match equally. */
export function normalizar(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Stems (not whole words) to catch inflections: advogado/advogada/
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

// Verticals that this product recognizes by name but does NOT know how to build.
// The label is used in the response ("an ERP for restaurant"), hence the pair.
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

export function classificarPedido(rawText: string): ResultadoVertical {
  const text = normalizar(rawText);
  if (!text) return { tipo: 'generico' };

  // Legal wins over the rest: "law firm that also has a store"
  // is still a law firm.
  if (RADICAIS_JURIDICO.some((r) => text.includes(r))) {
    return { tipo: 'juridico' };
  }

  const other = OUTROS_VERTICAIS.find((v) => text.includes(v.radical));
  if (other) return { tipo: 'outro', termo: other.rotulo };

  return { tipo: 'generico' };
}
