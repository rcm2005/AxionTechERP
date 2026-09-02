# B26 (parte 1/2) — catch nos modais de escrita + resiliência de logout

Corrige achados da auditoria `docs/rd/audits/2026-09-02-frota-agy/05-error-handling-consistency.md`
(ver também `docs/rd/BARRIERS.md` B26). Regra do repositório: **nenhum texto visível ao usuário
final muda de idioma** — toda string de UI (toasts, labels, títulos de Alert) continua em
português exatamente no padrão já usado no resto do arquivo. Só é permitido escrever/editar os
arquivos listados abaixo, com `write_file`/`edit_file` — **sem rodar nenhum comando de shell**
(sem `npm`, sem `tsc`, sem `git`). Não faça `git commit`.

## Arquivo 1: `src/components/modais/NovoClienteModal.tsx`

Achado: `handleSave` só tem `try { ... } finally { setSaving(false); }`, sem `catch` — se
`criarCliente(...)` falhar, a exceção vira unhandled rejection e nada é avisado ao usuário.

Adicione um bloco `catch` entre o `try` e o `finally` existentes, seguindo exatamente o padrão já
usado em `src/components/modais/NovoProcessoModal.tsx` (`catch { toast.show('Não foi possível
cadastrar o processo.') }`) — mesma estrutura, mesmo import de `toast` (confira se `toast` já está
importado nesse arquivo; se não estiver, importe do mesmo módulo que `NovoProcessoModal.tsx` usa).
Mensagem aqui: `'Não foi possível cadastrar o cliente.'`. Não mude mais nada nesse arquivo — não
mexa no `tenantId` hardcoded nem no endereço fixo (achados separados, fora de escopo aqui).

## Arquivo 2: `src/components/modais/NovaCobrancaModal.tsx`

Mesmo problema: `handleSave` só tem `try { ... } finally { setSaving(false); }`, sem `catch`.

Adicione bloco `catch` com `toast.show('Não foi possível cadastrar o lançamento.')`, mesmo padrão
do arquivo 1. Não mexa em mais nada nesse arquivo (nem no `tenantId` hardcoded, nem no
`window.location.reload()`, nem na fonte de `db.pessoas` — fora de escopo aqui).

## Arquivo 3: `src/components/layout/Topbar/Topbar.tsx`

Achado: o botão "Sair" chama `onClick={() => { setMenuAberto(false); void logout(); }}`. Se
`logout()` rejeitar, o erro é descartado silenciosamente pelo `void` e a UI não reage — o usuário
pode continuar preso na sessão. Troque para uma função `async` que espera `logout()` e ignora
qualquer erro dela (o cleanup local de sessão precisa acontecer de qualquer forma — ver arquivo 4,
onde isso é garantido dentro do próprio `logout()`). Exemplo do padrão esperado:

```tsx
onClick={() => {
  setMenuAberto(false);
  void (async () => {
    try {
      await logout();
    } catch {
      // cleanup local de sessão já é garantido dentro do próprio logout() (ver AuthContext)
    }
  })();
}}
```

Não mexa em mais nada nesse arquivo (os achados de `db.tenants`/`db.lancamentos` mockados são um
barrier separado, B25, fora de escopo aqui).

## Arquivo 4: `src/contexts/AuthContext.tsx`

Achado: se a chamada de rede do `logout()` falhar, a exceção é lançada **antes** de limpar
`localStorage`/estado local — a sessão local nunca é encerrada mesmo que o usuário queira sair.
Localize a função `logout` (ou o método equivalente exposto pelo contexto que os componentes acima
chamam como `logout()`) e garanta que a limpeza local (o que hoje limpa `localStorage` e reseta o
estado de sessão/usuário) rode num bloco `finally`, não só no caminho de sucesso — para que o
usuário sempre consiga deslogar localmente mesmo se o servidor estiver fora do ar. Reproduza o
padrão: `try { await <chamada de rede de logout> } finally { <limpeza local que já existe hoje> }`.
Preserve o comportamento de sucesso atual (não mude nada do que já funciona quando a chamada de
rede funciona). Não mude a assinatura pública de `logout()` nem quem a consome.

Não mexa nos dois blocos `catch` vazios de `getTenantConfig()` (linhas ~94-96 e ~127-129) — achado
de severidade Média, fora de escopo aqui.

## Arquivo 5: `src/pages/builder/ContaPage.tsx`

Achado: a função `sair()` (chamada pelo botão de logout dessa tela) tem `try { await logout();
navigate(...); } finally { setSaindo(false); }`, sem `catch` — mesma classe de bug do arquivo 3.
Já que o arquivo 4 agora garante que `logout()` nunca lança (limpeza local sempre roda em
`finally`), o comportamento real deve ficar assim: adicione um `catch` vazio (ou que apenas ignore
o erro) entre o `try` e o `finally`, e mantenha a chamada de `navigate(...)` **fora** do `try` (ou
repita-a no `catch`) para que a navegação para a tela de login aconteça mesmo se, por algum motivo
inesperado, `logout()` ainda lançar. Não mude mais nada nesse arquivo.

## Fora de escopo (não toque)

`PlanosPage.tsx`, `UpgradeConfirm.tsx`, `Sidebar.tsx`, `CopilotPage.tsx`, qualquer arquivo de
página de leitura (`DashboardPage.tsx`, `ClientesPage.tsx` etc. — são o outro spec, B26 parte 2,
rodando em paralelo num worktree diferente, não mexa neles pra evitar conflito).

## Ao terminar

Não rode `npm run build`/`tsc`/testes — isso é feito por fora, depois. Não faça `git add`/`git
commit`/`git push`. Apenas deixe as mudanças como diff não commitado nos 5 arquivos acima.
