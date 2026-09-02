# B25 (parte 2/2) — dashboard.service.ts funcionando em modo API real

Corrige achado #3 de `docs/rd/audits/2026-09-02-frota-agy/02-wiring-morto.md` (ver também
`docs/rd/BARRIERS.md` B25): `buscarResumoDashboard()` lança `throw new Error('Integração com API
real ainda não implementada.')` sempre que `USE_MOCKS` é `false` — a tela inicial do ERP quebra
completamente pra qualquer tenant real. Só escreva/edite o arquivo abaixo, com
`write_file`/`edit_file` — **sem rodar nenhum comando de shell** (sem `npm`, sem `tsc`, sem
`git`). Não faça `git commit`.

## Arquivo: `src/services/dashboard.service.ts`

Não precisa de nenhum endpoint novo no backend — todo dado já está disponível via serviços que já
funcionam em modo real hoje:
- `listarClientes()` de `./clientes.service` — retorna `Pessoa[]`, mesmo tipo/contrato nos dois
  modos (mock e real). Tem os campos `relacao`, `situacaoCredito`, `valorEmAtrasoCentavos` que
  esta função já usa.
- `listarLancamentos()` de `./financeiro.service` — retorna `LancamentoFinanceiro[]`, mesmo
  contrato nos dois modos. `calcularResumoFinanceiro`, já importado neste arquivo, já sabe
  processar esse array.

Reescreva `buscarResumoDashboard()` assim: remova o `throw` de `!USE_MOCKS` e o bloco `if
(USE_MOCKS) { ... } else { throw }`. No lugar, tanto pro caminho mock quanto pro real, monte os
dados chamando `await listarLancamentos()` e `await listarClientes()` (em vez de ler `db.lancamentos`/
`db.pessoas` diretamente) — essas duas funções já sabem decidir mock vs real sozinhas por dentro,
então o resto da lógica de cálculo dos KPIs e alertas (a parte que já existe, usando
`calcularResumoFinanceiro`, filtrando `clientesAtivos`/`clientesInadimplentes`) continua
EXATAMENTE igual, só troca a fonte de `db.lancamentos` → `await listarLancamentos()` e de
`db.pessoas` → `await listarClientes()`.

**O KPI de "Clientes & Parceiros"** usa hoje `db.pessoas.length` como "cadastros totais" — troque
pelo `.length` do array retornado por `listarClientes()`.

**Remova completamente o alerta de estoque** (`produtosAbaixoMinimo`/`alerta-estoque`, o bloco que
lê `db.produtos`) — o sistema não tem tela nem serviço de gestão de estoque real (achado próprio
da auditoria, item 3 do relatório), esse alerta nunca deveria aparecer fora do modo mock. Delete
esse bloco inteiro, incluindo a leitura de `db.produtos.filter(...)`.

`delay()` (a chamada no topo da função) pode continuar como está — é inofensiva nos dois modos.

## Fora de escopo (não toque)

`Topbar.tsx` é o outro spec, B25 parte 1, rodando em paralelo num worktree diferente — não mexa
nele. `DashboardPage.tsx` já foi corrigido num barrier separado (B26, consumo de `error`/`reload`)
e não precisa de nenhuma mudança adicional — essa função só passa a retornar dado real em vez de
lançar exceção, o consumidor já trata sucesso/erro corretamente.

## Ao terminar

Não rode `npm run build`/`tsc`/testes — isso é feito por fora, depois. Não faça `git add`/`git
commit`/`git push`. Apenas deixe as mudanças como diff não commitado no arquivo acima.
