# Tradução PT→EN — domínio Dashboard

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "dashboard".

## Arquivos (só estes)

- `src/services/dashboard.service.ts`
- `src/hooks/useDashboard.ts`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/components/dashboard/AlertasCard.tsx`
- `src/components/dashboard/AtalhosCard.tsx`

## O que fazer

Em `dashboard.service.ts`: `Alerta`/`KpiResumo` (tipos importados de `@/types`) ficam intocados.
**A interface `DashboardResumo`, declarada localmente neste arquivo (não vem de `@/types`), é
segura pra renomear por inteiro** (agregado montado no cliente, nunca serializado direto) —
renomeie pra `DashboardSummary`, campos `kpis`→`kpis` (já em inglês, mantenha) e
`alertas`→`alerts`. Renomeie a função exportada `buscarResumoDashboard` → `getDashboardSummary`.

Em `AlertasCard.tsx`: renomeie o componente exportado `AlertasCard` → `AlertsCard` (não é
página/modal referenciada por `router.tsx`, é só importada por `DashboardPage.tsx`, mesmo escopo
deste dispatch) e a interface local `AlertasCardProps` → `AlertsCardProps` com o campo
`alertas`→`alerts`. Variável local `alerta` (no `.map`) → `alert_` ou `item` (evite a palavra
reservada `alert` do browser).

Em `AtalhosCard.tsx`: renomeie o componente exportado `AtalhosCard` → `QuickActionsCard` (mesmo
motivo acima). Renomeie variáveis locais (`novoClienteOpen`→`newClientOpen`,
`novaCobrancaOpen`→`newChargeOpen`).

Em `DashboardPage.tsx` e `useDashboard.ts`: atualize todos os imports/usos renomeados acima
(`AlertasCard`→`AlertsCard`, `AtalhosCard`→`QuickActionsCard`, `buscarResumoDashboard`→
`getDashboardSummary`, `resumo.alertas`→`summary.alerts`, etc.). Renomeie variáveis locais em
português pro inglês. Traduza comentários. NÃO toque em nenhuma string visível na UI ("Alertas
importantes", "Ações Rápidas", "Bom dia"/"Boa tarde"/"Boa noite", toasts, `emptyMessage`). NÃO
renomeie `DashboardPage` (página referenciada por `router.tsx`, fora de escopo).
