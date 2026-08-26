# Law ERP by AXION TECH

ERP jurídico para escritórios de advocacia — projeto reconstruído do zero em React 19 + TypeScript + Vite a partir de um protótipo estático de referência.

## Stack

- React 19 + TypeScript + Vite
- React Router 7 (rotas aninhadas, `/processos/:id/:tab`)
- SCSS Modules (design tokens em `src/styles/_tokens.scss`, dois skins: corporate/app e editorial/login)
- Axios (`src/services/http.ts`, ainda não usado — app roda 100% mockado)
- date-fns (agenda/calendário)

## Estrutura

```
src/
  components/ui/       primitivos genéricos (Button, Card, DataTable, KpiCard, ...)
  components/<feature>/ componentes específicos de cada tela
  pages/                uma pasta por rota
  layouts/              AppLayout (sidebar + topbar) e AuthLayout (skin editorial)
  routes/               router.tsx, paths.ts, ProtectedRoute/PublicOnlyRoute
  contexts/             AuthContext (sessão) e ToastContext
  services/             camada de acesso a dados — hoje serve os mocks, pronta para trocar por API real
  mocks/                dados mockados (usuários, clientes, processos, agenda, financeiro)
  types/                tipos de domínio compartilhados
```

## Rodando

```bash
npm install
npm run dev
```

Login mockado: qualquer e-mail/senha não vazios autenticam (ex: `yasmin@silvaassociados.com.br`).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run lint` — oxlint
- `npm run preview` — pré-visualiza a build

## Trocar mocks por API real

Todo acesso a dados passa por `src/services/*.service.ts`, que checam `USE_MOCKS` (`src/services/mockAdapter.ts`, controlado por `VITE_USE_MOCKS`). Para ligar a um backend, implemente os endpoints REST equivalentes e mude `VITE_USE_MOCKS=false` — os componentes e hooks não precisam mudar.
