# B25 (parte 1/2) — Topbar consumindo dado real em vez do mock

Corrige achado #2 de `docs/rd/audits/2026-09-02-frota-agy/02-wiring-morto.md` (ver também
`docs/rd/BARRIERS.md` B25): mesmo com um tenant real autenticado (`USE_MOCKS=false`), o seletor de
empresa e o sino de notificações do `Topbar` sempre leem `db.tenants`/`db.lancamentos` (o mock em
memória), nunca o dado real da sessão. Regra do repositório: **nenhum texto visível ao usuário
final muda de idioma** — toda string de UI continua em português, no mesmo tom do resto do
arquivo. Só escreva/edite o arquivo abaixo, com `write_file`/`edit_file` — **sem rodar nenhum
comando de shell** (sem `npm`, sem `tsc`, sem `git`). Não faça `git commit`.

## Contexto que você precisa (já existe no repo, não precisa criar nada novo)

- `src/services/auth.service.ts` já exporta `listarMeusEscritorios(): Promise<EscritorioDaConta[]>`
  (chama `GET /auth/my-tenants` de verdade, escopado no servidor pelo token — não filtra nada no
  cliente). `EscritorioDaConta` tem `{ id, nome, nomeExibicao, corPrimaria, criadoEm }`.
- `src/contexts/AuthContext.tsx` (`useAuth()`) já expõe `tenantBranding: TenantBranding | null`
  (nome/cor real do tenant ATIVO da sessão, populado via `GET /api/tenants/current`) e
  `trocarEscritorio(tenantId: string): Promise<void>` (já faz a troca real de sessão/token —
  mesmo helper que `src/pages/builder/ProjetosPage.tsx` já usa pra trocar de escritório).
- `src/services/financeiro.service.ts` já exporta `listarLancamentos(): Promise<Lancamento[]>`,
  real em ambos os modos (mesmo usado por `FinanceiroPage.tsx`).
- `USE_MOCKS` vem de `src/services/mockAdapter.ts` (`import { USE_MOCKS } from
  '@/services/mockAdapter'`).

## O que mudar em `src/components/layout/Topbar/Topbar.tsx`

**1. Quando `USE_MOCKS` for `true`, não mude nada do comportamento atual** — o Topbar continua
lendo `db.tenants`/`db.lancamentos` exatamente como hoje (é o modo de demo/dev, tá certo assim).
Só o caminho `!USE_MOCKS` precisa mudar.

**2. Nome/lista de empresas (`empresasAcessiveis`/`empresaAtiva`), modo real:**
- Se o usuário tiver 0 ou 1 tenant em `portfolioTenantIds` (o caso comum — usuário de um único
  escritório): não busque lista nenhuma, não mostre dropdown de troca. Mostre só o nome do tenant
  ativo vindo de `tenantBranding?.nomeExibicao` (mesmo campo/fallback já usado com sucesso em
  `src/components/layout/Sidebar/Sidebar.tsx` — copie esse mesmo padrão de fallback:
  `tenantBranding?.nomeExibicao || usuario?.escritorioContabilNome || 'Empresa Ativa'`).
- Se o usuário tiver 2+ tenants em `portfolioTenantIds` (contador com portfólio): busque a lista
  real via `listarMeusEscritorios()` (um `useEffect`/hook simples, dispara quando `!USE_MOCKS` e
  `usuario` existir) e popule o `<select>` com esses dados reais (`id`/`nomeExibicao`). Ao trocar
  a seleção, chame `await trocarEscritorio(novoId)` (do `useAuth()`) em vez de só
  `setEmpresaAtivaId(novoId)` — é isso que troca a sessão de verdade no servidor. Trate falha
  dessa chamada com `toast.show('Não foi possível trocar de empresa.')` (mesmo padrão de toast já
  usado no resto do arquivo).
- Não precisa reproduzir a formatação de `nomeFantasia || razaoSocial` do mock — no modo real use
  só `nomeExibicao` (já vem pronto do backend).

**3. Notificações (`notificacoes`), modo real:** troque a leitura de `db.lancamentos` por uma
chamada real a `listarLancamentos()` (um `useAsync`/efeito simples — importe `useAsync` de
`@/hooks/useAsync` se for usar esse hook, mesmo padrão usado nas páginas de leitura do sistema).
Filtre localmente por `status === 'atrasado'` e por `tenantId === empresaAtivaId` (campo já existe
em `LancamentoFinanceiro`, `src/types/financeiro.ts`), do mesmo jeito que o filtro atual já faz —
só troca a FONTE do array, a lógica de filtro/mapeamento pro formato de notificação
(`titulo`/`meta`/`prioridade`) fica igual. Se a
chamada falhar, não quebre o Topbar — trate como "zero notificações" silenciosamente (não é um
lugar crítico o bastante pra um `Alert` de erro; isso é só o sininho do cabeçalho).

## Fora de escopo (não toque)

O botão "Sair"/lógica de logout no mesmo arquivo já foi corrigido num barrier separado (B26) —
não mexa nessa parte. `dashboard.service.ts` é o outro spec, B25 parte 2, rodando em paralelo num
worktree diferente — não mexa nele.

## Ao terminar

Não rode `npm run build`/`tsc`/testes — isso é feito por fora, depois. Não faça `git add`/`git
commit`/`git push`. Apenas deixe as mudanças como diff não commitado no arquivo acima.
