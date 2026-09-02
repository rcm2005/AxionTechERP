# Translation PT→EN — Config/Tenant/Layout domain

Read `docs/specs/pt-en-translation-rules.md` first (general rules + vocabulary) and follow
everything there. This spec only lists the scope specific to this domain.

## Files (only these)

- `src/services/tenant.service.ts`
- `src/components/layout/Sidebar/Sidebar.tsx`
- `src/components/layout/Topbar/Topbar.tsx`
- `src/pages/configuracoes/PlanosPage.tsx`
- `src/pages/configuracoes/PlanCard.tsx`
- `src/pages/configuracoes/UpgradeConfirm.tsx`

## Critical exception — AuthContext identifiers are OUT OF SCOPE

`src/contexts/AuthContext.tsx` and `src/services/auth.service.ts` were deliberately left with
Portuguese exported names (`usuario`, `empresaAtivaId`, `setEmpresaAtivaId`, `tenantBranding`,
`tenantNavegacao`, `trocarEscritorio`, `criarEscritorio`, `listarMeusEscritorios`,
`EscritorioDaConta`) by a previous translation domain, specifically because the files in *this*
domain still consumed them by those names. **Do not rename anything in `AuthContext.tsx` or
`auth.service.ts`, and do not rename the identifiers above anywhere they are imported/destructured
from `useAuth()` or `auth.service.ts` in the files listed above.** You MAY locally alias `usuario`
to `user` at the point of destructuring for readability (e.g. `const { usuario: user } =
useAuth();`), matching the existing pattern already used in
`src/pages/dashboard/DashboardPage.tsx` — but if you do, update every use of that variable inside
the same file to the alias. Do not alias the other AuthContext fields
(`empresaAtivaId`/`tenantBranding`/`tenantNavegacao`/`setEmpresaAtivaId`/`trocarEscritorio`) — leave
them exactly as `empresaAtivaId`, `tenantBranding`, etc. wherever they appear.

## tenant.service.ts

This file's exported types (`TenantBranding`, `TenantConfig`, `NavItem`, `TenantCurrentResponse`)
mirror the literal JSON returned by `GET /tenants/current` (wire contract) — do **not** rename any
of their fields (`nomeExibicao`, `corPrimaria`, `visivel`, `navegacao`, `itens`). Only translate
comments if any exist. Expect this file to need little or no change.

## Sidebar.tsx

- Rename `ITENS_CANONICOS` → `CANONICAL_ITEMS`.
- Rename local variables inside the component: `empresaAtiva` → `activeCompany` (this is a value
  computed client-side from `db.tenants`, not wire data — safe to rename), `itens` → `items`,
  `resultado` → `result`, `canonico` → `canonicalItem`, `nomeEmpresa` → `companyName`.
- `DEFAULT_SIDEBAR_ITEMS` and the `SidebarNavItem` interface are already English — leave as is.
- Apply the AuthContext exception above to the `useAuth()` destructure on this file's `usuario`,
  `empresaAtivaId`, `tenantBranding`, `tenantNavegacao`.

## Topbar.tsx

- Rename local state: `busca`/`setBusca` → `search`/`setSearch`; `menuAberto`/`setMenuAberto` →
  `userMenuOpen`/`setUserMenuOpen`.
- Rename local variables/consts: `paginaAtual` → `currentPage`, `temPortfolioMultiplo` →
  `hasMultiplePortfolio`, `podeTrocarEmpresa` → `canSwitchCompany`, `empresasAcessiveis` →
  `accessibleCompanies`, `empresaAtiva` → `activeCompany`, `escritorios`/`setEscritorios` →
  `firms`/`setFirms` (per vocabulary: escritório → firm), `ativo` (the effect's cleanup flag) →
  `active`, `nomeEmpresaAtiva` → `activeCompanyName`, `lancamentosReais` → `realEntries`,
  `notificacoes` → `notifications`, the local `lancamentos` inside the `useMemo` → `entries`,
  `novoId` → `newId`, `selecionada` → `selected`.
- `handleSearch` is already English.
- Apply the AuthContext exception above to `usuario`, `empresaAtivaId`, `setEmpresaAtivaId`,
  `tenantBranding`, `trocarEscritorio` from `useAuth()`, and to `listarMeusEscritorios` /
  `EscritorioDaConta` imported from `@/services/auth.service` — leave all of these exactly as they
  are, including every call site inside this file.
- Do not touch any string rendered in the UI (labels, toasts, `aria-label`s) — all stay in
  Portuguese.

## PlanosPage.tsx

Local identifiers here are already English (`billingCycle`, `view`, `selectedPlan`,
`openFaqIndex`, `handleSelectPlan`, `handleBackToPlans`, `handleUpgradeSuccess`, `toggleFaq`,
`PLANS`, `FAQ_ITEMS`). No renames needed — just translate the section comments (`// ── 1. Tela de
Upgrade / Checkout`, `// ── 2. Tela de Sucesso`, `// ── 3. Tela Principal de Planos`, `// Banner de
Limites...`, `// Toggle Mensal / Anual`, `// Grid de Cards dos Planos`, `// Benefícios e Garantias
Institucionais`, `// Tabela de Comparação Detalhada`, `// Categoria 1/2/3/4: ...`, `// Seção FAQ`)
into English. Leave every rendered string (plan names, feature bullets, FAQ text, table content) in
Portuguese — that is real product content.

## PlanCard.tsx

The exported `Plan` interface's `limits` object is local, static UI-config data (never
serialized as a request/response body) — safe to rename in full: `usuarios` → `users`,
`armazenamento` → `storage`, `projetos` → `projects`, `ia` → `ai`, `suporte` → `support`. Update
the one place in `PlanosPage.tsx` that builds these objects (the `PLANS` array's `limits` field)
and the one place in `UpgradeConfirm.tsx`/`PlanosPage.tsx` success screen that reads
`selectedPlan.limits.*` to match. Translate the comments (`// Badges superiores`, `//
Cabeçalho`, `// Preço`, `// Ação`, `// Recursos inclusos`). Leave all rendered strings in
Portuguese.

## UpgradeConfirm.tsx

Local identifiers are already English. Just translate comments (`// Coluna Esquerda: Dados de
Pagamento`, `// Abas de seleção de método`, `// Conteúdo específico de cada forma`, `// Termos`, `//
Coluna Direita: Resumo do Pedido`, `// Form state`) and apply the AuthContext exception to the
`usuario` destructured from `useAuth()` (may alias to `user` locally if you update both use sites,
lines ~34 and ~45). Leave all rendered strings in Portuguese.
