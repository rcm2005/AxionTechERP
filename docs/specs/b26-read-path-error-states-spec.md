# B26 (parte 2/2) — estado de erro real nas telas de leitura

Corrige achados da auditoria `docs/rd/audits/2026-09-02-frota-agy/05-error-handling-consistency.md`
(ver também `docs/rd/BARRIERS.md` B26, recomendação #2). Hoje, quando uma chamada de rede falha,
essas telas ignoram `error` do hook `useAsync`/`use*` e renderizam listas vazias ou KPIs zerados
como se não houvesse dado — em vez de avisar que é uma falha de rede. Regra do repositório:
**nenhum texto visível ao usuário final muda de idioma** — toda string nova de UI deve ser em
português, no mesmo tom das mensagens de erro já existentes no arquivo (ex.: "Não foi possível
carregar..."). Só escreva/edite os arquivos listados abaixo, com `write_file`/`edit_file` — **sem
rodar nenhum comando de shell** (sem `npm`, sem `tsc`, sem `git`). Não faça `git commit`.

## Arquivo 0 (fazer primeiro): `src/components/ui/Alert/Alert.tsx`

O componente `Alert` hoje só recebe `tone`/`title`/`description`, sem lugar pra um botão de ação.
Adicione uma prop opcional `action?: ReactNode` que, quando presente, renderiza abaixo da
`description` (dentro do mesmo `div.root`, num wrapper próprio, ex. `<div className={styles.action}>{action}</div>`,
só quando `action` estiver definido). Não mude o comportamento nem a assinatura de quem já usa
`Alert` sem essa prop (`NovoEventoAgendaModal.tsx` continua funcionando igual). Se precisar de um
pequeno ajuste de espaçamento em `Alert.module.scss` pra essa nova área de ação (ex. `margin-top`),
pode adicionar uma classe `.action` nova nesse arquivo `.scss`, sem alterar as classes existentes.

## Padrão a aplicar nos 9 arquivos abaixo

Para cada tela: (1) capture também `error` (e `reload`, se o hook já expõe) na desestruturação do
`use*`/`useAsync` correspondente — hoje só `{ data, loading }` é pego; (2) quando `error` estiver
presente (falha real, distinta de "ainda carregando" e de "carregou e a lista/veio vazia de
verdade"), renderize um `Alert` com `tone="danger"`, um `title` curto (ex. `"Erro ao carregar
dados"`) e `description` explicando que é uma falha de comunicação (ex. `"Não foi possível
carregar as informações. Verifique sua conexão e tente novamente."`), com `action={<Button
variant="ghost" onClick={reload}>Tentar novamente</Button>}` quando o hook expuser `reload`; (3)
esse `Alert` de erro substitui o conteúdo normal daquela seção (não empilhe erro + skeleton/lista
vazia ao mesmo tempo) — mas não precisa ocupar a tela inteira: cada card/tabela/seção que depende
de um `use*` específico mostra seu próprio `Alert` no lugar onde hoje mostraria o estado vazio.
Import `Alert` de `@/components/ui/Alert/Alert` (confira o path relativo real usado por outros
imports no mesmo arquivo) e `Button` de `@/components/ui/Button/Button` se ainda não estiverem
importados.

### 1. `src/pages/dashboard/DashboardPage.tsx`
`useDashboard()` hoje só desestrutura `{ data: resumo, loading: loadingResumo }` (linha ~27). Pegue
também `error: erroResumo, reload: recarregarResumo`. A condição que hoje é `loadingResumo ||
!resumo` pra mostrar skeletons deve virar 3 estados: loading → skeletons (como já é); erro → um
`Alert` no lugar da grade de KPIs; sucesso → KPIs normais (como já é).

### 2. `src/pages/clientes/ClientesPage.tsx`
`useClientes(...)` (linha ~45) — hoje `rows={clientes ?? []}` some erro em array vazio. Pegue
`error`/`reload` do hook. Quando houver erro, renderize um `Alert` no lugar da `DataTable` (não
passe `rows=[]` pra tabela mostrar "Nenhum parceiro encontrado" nesse caso).

### 3. `src/pages/clientes/ClienteDetailPage.tsx`
Dois hooks independentes aqui: `useCliente(clienteId)` (linha ~79, hoje renderiza `<EmptyState
title="Parceiro comercial não encontrado." />` quando `cliente` é `undefined` — isso deveria
distinguir "não encontrado de verdade" de "falha de rede": se o hook expuser `error`, mostre
`Alert` de erro nesse caso em vez do `EmptyState` de "não encontrado") e `useAsync(listarLancamentos)`
pros lançamentos financeiros do parceiro (também precisa do mesmo tratamento — `Alert` no lugar da
tabela/KPIs financeiros quando `error` estiver presente).

### 4. `src/pages/processos/ProcessosPage.tsx`
`useProcessos(...)` e `useClientes()` (linhas ~33-42) — mesmo padrão do arquivo 2: erro no lugar da
tabela de processos, não `rows=[]`.

### 5. `src/pages/processos/ProcessoDetailPage.tsx`
Vários hooks (`useProcesso`, `usePrazos`, `useAgenda`, `useUsuarios`, `useCliente`) em torno da
linha ~104. Trate cada seção dependente de um hook separadamente: se `useProcesso` falhar, mostre
`Alert` no lugar de "Processo não encontrado." (mesma distinção erro-vs-não-encontrado do arquivo
3); se `usePrazos`/`useAgenda` falharem, mostre `Alert` na respectiva sub-seção em vez de tabela
vazia sem aviso. Não mude o bloco de `handleMarcarCumprido` (linhas ~78-88) — já está correto (usa
`toast.show`).

### 6. `src/pages/prazos/PrazosPage.tsx`
`usePrazos(...)` (linhas ~62-72) — os KPIs "Vencendo em até 3 dias" e "Já vencidos e pendentes" não
podem mostrar `0` quando é erro de rede (é o achado de maior risco real do relatório). Ao detectar
`error`, mostre um `Alert` no lugar dos KPIs e da tabela, deixando claro que não é "zero prazos
pendentes" e sim falha ao carregar. Não mude `handleMarcarCumprido` (linhas ~74-84, já correto).

### 7. `src/pages/agenda/AgendaPage.tsx`
`useAgenda(...)`, `useUsuarios()`, `useProcessos()` (linhas ~36-46) — mesmo padrão: `Alert` no
lugar de "Nenhum compromisso encontrado" quando `useAgenda` tiver `error`.

### 8. `src/pages/contratos/ContratosPage.tsx`
`useContratos(...)` (linha ~49) — mesmo padrão: `Alert` no lugar de `emptyMessage="Nenhum contrato
encontrado..."` quando houver `error`.

### 9. `src/pages/financeiro/FinanceiroPage.tsx`
`useLancamentos()` (linha ~35) — hoje, se falhar, `lancamentos` vira `undefined` e
`calcularResumoFinanceiro` recebe array vazio, mostrando R$ 0,00 em tudo. Pegue `error`/`reload` e,
quando presente, mostre `Alert` no lugar dos KPIs financeiros e da tabela de contas a receber (não
deixe `calcularResumoFinanceiro` rodar sobre dado vazio nesse caso).

## Fora de escopo (não toque)

`NovoClienteModal.tsx`, `NovaCobrancaModal.tsx`, `Topbar.tsx`, `AuthContext.tsx`,
`ContaPage.tsx` — são o outro spec, B26 parte 1, rodando em paralelo num worktree diferente, não
mexa neles pra evitar conflito. `PlanosPage.tsx`, `UpgradeConfirm.tsx` — achado (a) conforme, fora
de escopo. Não mude nenhum texto visível que já existe hoje, só adicione o novo estado de erro.

## Ao terminar

Não rode `npm run build`/`tsc`/testes — isso é feito por fora, depois. Não faça `git add`/`git
commit`/`git push`. Apenas deixe as mudanças como diff não commitado nos arquivos acima.
