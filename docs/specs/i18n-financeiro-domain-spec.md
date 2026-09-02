# Tradução PT→EN — domínio Financeiro

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "financeiro".

## Arquivos (só estes)

- `src/services/financeiro.service.ts`
- `src/hooks/useFinanceiro.ts`
- `src/pages/financeiro/FinanceiroPage.tsx`
- `src/components/modais/NovaCobrancaModal.tsx`
- `src/components/financeiro/contasReceberColumns.tsx`
- `src/components/financeiro/FluxoCaixaCard.tsx`

## O que fazer

Em `financeiro.service.ts`: `Lancamento` (tipo importado de `@/types`) fica intocado. **Já a
interface `ResumoFinanceiro`, declarada localmente neste arquivo (não vem de `@/types`), é segura
pra renomear por inteiro** (é um agregado calculado no cliente a partir de `Lancamento[]`, nunca
serializado direto como request/response) — renomeie pra `FinancialSummary` com campos em inglês:
`receitaCentavos`→`revenueCentavos`, `despesaCentavos`→`expenseCentavos`,
`aReceberCentavos`→`receivableCentavos`, `emAtrasoCentavos`→`overdueCentavos`,
`lucroCentavos`→`profitCentavos`, `qtdTitulosAReceber`→`receivableCount`,
`qtdClientesEmAtraso`→`overdueClientCount`. Renomeie as funções exportadas:
`calcularResumoFinanceiro` → `calculateFinancialSummary`, `listarLancamentos` → `listEntries`,
`buscarResumoFinanceiro` → `getFinancialSummary`, `criarLancamento` → `createEntry`.

Nos outros 5 arquivos: atualize TODOS os usos — imports, chamadas de função, e cada acesso a
campo de `ResumoFinanceiro`/`FinancialSummary` (ex: `resumo.receitaCentavos` vira
`resumo.revenueCentavos`, em todo lugar que aparecer, incluindo `FinanceiroPage.tsx` e
`FluxoCaixaCard.tsx`). Renomeie variáveis locais e parâmetros em português pro inglês
(`lancamento`→`entry`, `lancamentos`→`entries`, `resumo`→`summary`). Traduza comentários. NÃO
toque em nenhuma string visível na UI (labels "Receita do mês", "Despesas", toasts,
`emptyMessage`). NÃO renomeie `FinanceiroPage`, `NovaCobrancaModal`, `FluxoCaixaCard` (nomes
exportados de componente, fora de escopo). NÃO toque no `tenantId`/`db.pessoas` hardcoded do
`NovaCobrancaModal.tsx` nem no `Alert`/estado de erro adicionado num checkpoint anterior (B26) —
só renomeia identificadores, não muda lógica.
