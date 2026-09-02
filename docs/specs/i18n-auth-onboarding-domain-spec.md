# Tradução PT→EN — domínio Auth / Onboarding / Builder

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico deste domínio. **Cuidado extra aqui**: `AuthContext.tsx`
expõe um React Context consumido por praticamente todo o app — NÃO renomeie nenhuma propriedade do
valor retornado pelo `AuthProvider`/`useAuth()` (ex: `usuario`, `login`, `logout`,
`criarEscritorio`, `trocarEscritorio`, `empresaAtivaId`, `setEmpresaAtivaId`, `isAuthenticated`,
`tenantBranding`, `tenantNavegacao`, ou qualquer outra chave do objeto de contexto) — isso teria
efeito em dezenas de arquivos fora deste dispatch. Só toque no que está listado abaixo.

## Arquivos (só estes)

- `src/services/auth.service.ts`
- `src/services/onboarding.service.ts`
- `src/services/usuarios.service.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/login/LoginPage.tsx`
- `src/pages/login/DecorativeDots.tsx`
- `src/pages/login/ScaleIcon.tsx`
- `src/pages/onboarding/OnboardingPage.tsx`
- `src/pages/builder/BuilderChatPage.tsx`
- `src/pages/builder/BuilderChatVarejoPage.tsx`
- `src/pages/builder/ProjetosPage.tsx`
- `src/pages/builder/ContaPage.tsx`
- `src/pages/builder/verticalMatch.ts`
- `src/layouts/AuthLayout.tsx`
- `src/layouts/BuilderLayout.tsx`
- `src/routes/ProtectedRoute.tsx`
- `src/routes/PublicOnlyRoute.tsx`

## O que NÃO tocar (além da regra geral do rules.md)

- **`AuthContext.tsx`**: não renomeie nada que faça parte do objeto retornado pelo Provider (ver
  aviso acima). Pode renomear variáveis/helpers puramente internos que NÃO são retornados no
  contexto (ex: se houver uma função helper local não exportada no objeto de valor, essa pode ser
  renomeada) e comentários.
- **`EscritorioDaConta`** (tipo local em `auth.service.ts`): NÃO renomeie — é usado também em
  `Topbar.tsx`, que não faz parte deste dispatch (evita nome desencontrado entre os dois).
- **`DadosOnboarding`, `InterpretacaoOnboarding`, `RevisaoResultado`, `RequisitoCobertura`,
  `ResultadoCobertura`, `PatchCampo`**: são tipos que espelham o contrato JSON com o backend
  (`criarEscritorio`/`interpretarPedido`/`revisarConfirmacao`/`diagnosticoVarejo` mandam esses
  objetos direto no corpo da requisição) — NÃO renomeie nome nem campos, tratam-se como se
  viessem de `@/types`.
- **`Sessao`, `UsuarioResumo`**: são tipos locais compostos no cliente (não vão direto pro
  request) — **estes SIM podem ser renomeados** por inteiro (nome + campos): `Sessao` →
  `Session` (campo `usuario`→`user` fica igual ao resto do vocabulário), `UsuarioResumo` →
  `UserSummary`.

## O que fazer

**Já confirmado: `AuthContext.tsx` reexpõe `criarEscritorio` e `trocarEscritorio` com o MESMO nome
no valor público do contexto (linhas ~73-75, ~144-155, ~187-188) — por isso `criarEscritorio`,
`trocarEscritorio` e `listarMeusEscritorios` NÃO devem ser renomeadas em lugar nenhum nesta
rodada** (nem em `auth.service.ts`, nem nos imports com `as ...Service`, nem em nenhum arquivo
desta lista) — deixe esses três nomes exatamente como estão. `login`/`logout` já estão em inglês,
mantenha como estão também.

Em `onboarding.service.ts`: renomeie as funções exportadas (nomes de função são sempre seguros,
mesmo quando o tipo de retorno é wire — só o TIPO fica intocado): `interpretarPedido` →
`interpretRequest`, `revisarConfirmacao` → `reviewConfirmation`, `diagnosticoVarejo` →
`getRetailDiagnosis`.

Em `usuarios.service.ts`: renomeie `listarUsuarios` → `listUsers`, e a interface local
`UsuarioResumo` → `UserSummary` (ver exceção acima) com campos traduzidos.

Nos demais arquivos: atualize todos os imports/chamadas renomeadas (respeitando as exceções
acima). Renomeie variáveis locais e parâmetros em português pro inglês. Traduza comentários e
docstrings. NÃO toque em nenhuma string visível na UI (labels, toasts, mensagens de erro, texto de
onboarding). NÃO renomeie `LoginPage`, `OnboardingPage`, `BuilderChatPage`,
`BuilderChatVarejoPage`, `ProjetosPage`, `ContaPage` (páginas referenciadas por `router.tsx`, fora
de escopo).
