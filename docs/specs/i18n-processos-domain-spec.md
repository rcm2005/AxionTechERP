# Tradução PT→EN — domínio Processos (casos jurídicos)

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "processos".

## Arquivos (só estes)

- `src/services/processos.service.ts`
- `src/hooks/useProcessos.ts`
- `src/pages/processos/ProcessosPage.tsx`
- `src/pages/processos/ProcessoDetailPage.tsx`
- `src/components/modais/NovoProcessoModal.tsx`
- `src/components/processos/processosColumns.tsx`
- `src/utils/cnj.ts`

## O que fazer

Em `processos.service.ts`: renomeie as funções exportadas — `listarProcessos` → `listCases`,
`buscarProcesso` → `getCase`, `criarProcesso` → `createCase`, `atualizarProcesso` → `updateCase`,
`excluirProcesso` → `deleteCase`.

Em `cnj.ts`: é um utilitário de formatação/validação do número CNJ (padrão numérico oficial de
processo judicial brasileiro) — renomeie funções/variáveis internas em português pro inglês
(mantendo a sigla "CNJ" como está, é um nome próprio de padrão, não traduz) e comentários. NÃO
mude a lógica de formatação/regex, só nomes.

Nos outros 5 arquivos: atualize todo import/chamada das funções renomeadas. Renomeie variáveis
locais e parâmetros em português pro inglês (ex: `processo` → `case_` só se `case` colidir com a
palavra reservada do JS — prefira `processo` → `caseItem`/`caseData` conforme o contexto,
`processos` → `cases`). Traduza comentários. NÃO toque em nenhuma string visível na UI (labels,
toasts, `emptyMessage`, títulos). NÃO renomeie `ProcessosPage`, `ProcessoDetailPage`,
`NovoProcessoModal` (fora de escopo). NÃO toque no bloco `handleMarcarCumprido` além de renomear
variáveis locais — a lógica e os textos de toast ficam iguais.
