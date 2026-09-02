# Tradução PT→EN — domínio Prazos

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "prazos".

## Arquivos (só estes)

- `src/services/prazos.service.ts`
- `src/hooks/usePrazos.ts`
- `src/pages/prazos/PrazosPage.tsx`
- `src/components/modais/NovoPrazoModal.tsx`
- `src/components/prazos/prazosColumns.tsx`
- `src/utils/prazos.ts`

## O que fazer

Em `prazos.service.ts`: renomeie as funções exportadas — `listarPrazos` → `listDeadlines`,
`buscarPrazo` → `getDeadline`, `criarPrazo` → `createDeadline`, `atualizarPrazo` →
`updateDeadline`, `alterarStatusPrazo` → `changeDeadlineStatus`, `excluirPrazo` →
`deleteDeadline`.

Em `utils/prazos.ts`: renomeie as funções/variáveis internas em português pro inglês seguindo o
mesmo vocabulário (ex: qualquer helper `calcularXPrazo`/`prazoVencido` → `calculateXDeadline`/
`isDeadlineOverdue`, mantendo a lógica idêntica). Traduza comentários.

Nos outros 4 arquivos: atualize todo import/chamada das funções renomeadas. Renomeie variáveis
locais e parâmetros em português pro inglês (`prazo` → `deadline`, `prazos` → `deadlines`).
Traduza comentários. NÃO toque em nenhuma string visível na UI — os textos de KPI ("Vencendo em
até 3 dias", "Já vencidos e pendentes"), toasts, `emptyMessage` ficam em português exatamente como
estão. NÃO renomeie `PrazosPage`, `NovoPrazoModal` (fora de escopo). NÃO toque na lógica do
`Alert`/estado de erro adicionado num checkpoint anterior (B26) — só renomeia identificadores.
