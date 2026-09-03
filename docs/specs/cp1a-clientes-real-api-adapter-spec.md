# CP1-A — Clientes adapter: map the real API response onto `Pessoa`

## Bug being fixed

`src/services/clientes.service.ts` does `http.get<Pessoa[]>('/clientes')` — a raw TypeScript
cast with zero field mapping. In real-API mode (`VITE_USE_MOCKS=false`, what `.env.production`
sets) the backend actually returns rows shaped like this (verified live against
`localhost:8090/api/clientes` with a real tenant JWT):

```json
{
  "id": "e42ba128-fe11-46f8-9864-1a2eba9b3014",
  "tenant_id": "81bbe52b-f55b-437b-a929-4f2159dd5482",
  "tipo": "pj",
  "nome": "Silva & Santos Indústria Metalúrgica Ltda",
  "cpf_cnpj": "12.345.678/0001-90",
  "contatos": [
    { "tipo": "email", "valor": "juridico@silvasantos.com.br" },
    { "tipo": "telefone", "valor": "(11) 3344-5566" }
  ],
  "created_at": "2026-08-31T17:19:49.508Z",
  "deleted_at": null
}
```

The frontend's `Pessoa` type (`src/types/pessoa.ts`) expects `razaoSocialOuNome`, `documento`,
`tipoPessoa: 'PF'|'PJ'`, `situacaoCredito`, `status`, `relacao`, `endereco`, etc. None of those
keys exist on the raw response, so the cast produces objects full of `undefined` — the Clientes
table renders blank names/documents and empty pills, `createClient` silently sends the wrong
request body (see below), and `dashboard.service.ts`'s "Clientes & Parceiros" KPI always reads 0
against real data.

Also verified live: `POST /api/clientes` validates the body against this Zod schema (backend
`src/routes/clientes.ts`):

```ts
{
  tipo: z.enum(['pf', 'pj']),
  nome: z.string().min(1),
  cpf_cnpj: z.string().min(11).max(18),
  contatos: z.array({ tipo: z.string().min(1), valor: z.string().min(1) }).default([]),
}
```

`clientes.service.ts`'s current `createClient()` posts the raw frontend `Pessoa` object
(`razaoSocialOuNome`, `tipoPessoa: 'PF'|'PJ'`, `endereco`, etc.) — none of the keys the schema
requires (`tipo`, `nome`, `cpf_cnpj`) are present under those names, so `safeParse` fails and the
real API always returns `400` on client creation today. This spec fixes that too, since it's the
same file, same root cause, and `createClient` is explicitly one of the three functions being
adapted.

The overdue-amount fields are derivable from a second real endpoint, verified live against
`localhost:8090/api/financeiro-lancamentos` (backend table `financeiro_lancamentos`,
`src/db/schema.ts`):

```json
{
  "id": "24ffaa65-d6ae-4ed4-ae2d-0f769f9dbeef",
  "tenant_id": "81bbe52b-f55b-437b-a929-4f2159dd5482",
  "cliente_id": "e42ba128-fe11-46f8-9864-1a2eba9b3014",
  "processo_id": null,
  "contrato_id": "f910926f-daaa-4617-9e0f-5460a5587b74",
  "tipo": "honorario_fixo",
  "valor": "4500.00",
  "percentual_exito": null,
  "status": "pendente",
  "vencimento": "2026-09-10",
  "created_at": "2026-08-31T17:19:49.555Z",
  "deleted_at": null
}
```

`valor` is a decimal string (Postgres `numeric`), `vencimento` is an ISO `YYYY-MM-DD` date string,
`status` is `'pendente' | 'pago' | 'cancelado'`. The route is mounted at
`/api/financeiro-lancamentos` (hyphenated — confirmed in `src/routes/index.ts`:
`fastify.register(financeiroLancamentosRoutes, { prefix: '/financeiro-lancamentos' })`) and
supports `?status=` and `?cliente_id=` query filters, always scoped server-side to the caller's
tenant.

**Note, not part of this checkpoint**: `src/services/financeiro.service.ts` separately calls
`http.get('/financeiro/lancamentos')` (wrong path — should be `/financeiro-lancamentos`) with its
own broken field mapping (`Lancamento` type: `valorCentavos`, `pessoaId`, `status: 'atrasado'`,
none of which exist on the real `financeiro_lancamentos` row). That is a distinct, larger adapter
bug affecting the whole Financeiro module and `ClienteDetailPage`'s "Lançamentos Financeiros" tab.
**Do not touch `financeiro.service.ts`, the `Lancamento` type, `listEntries()`, or any
`entriesColumns`/financeiro-tab rendering in this checkpoint** — out of scope, needs its own spec.
This checkpoint talks to `/financeiro-lancamentos` directly, with its own local types, entirely
inside `clientes.service.ts`.

## Operational rules — read before writing anything

- Only use `write_file` / `edit_file`. **Do not run any shell/build/test command** — no `npm`, no
  `tsc`, no `git`, nothing. Validation happens outside this dispatch.
- Do not leave compatibility aliases for old field/column names (e.g. no
  `export const oldName = newName`).
- Do not fabricate any field the backend genuinely doesn't have. Where a field can't be derived
  from real data, remove its UI rendering entirely rather than leaving it `undefined`/blank.
- Make exactly the changes below — do not refactor, rename, or "clean up" anything not listed.
- Do not run `git add` / `git commit`. Leave the changes as an uncommitted diff.

## File 1: `src/types/pessoa.ts`

Widen exactly these three fields from required to optional (they genuinely don't exist on the
backend `clientes` table — no vendor/relationship concept, no registration-status concept, no
address columns at all):

```ts
// before
  relacao: TipoRelacao;
  ...
  endereco: Endereco;
  ...
  status: PessoaStatus;

// after
  relacao?: TipoRelacao;
  ...
  endereco?: Endereco;
  ...
  status?: PessoaStatus;
```

Do not change anything else in this file. `situacaoCredito` and `valorEmAtrasoCentavos` stay
required — they're real, just computed differently now (see File 2).

## File 2: `src/services/clientes.service.ts`

Replace the whole file with the version below. It keeps `filterClients`, `db`/`saveDB`/`http`
imports, and the exported function names/signatures (`listClients`, `getClient`, `createClient`)
unchanged so no caller elsewhere in the app needs to change.

```ts
import type { Pessoa, PessoaFiltros } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filterClients(clients: Pessoa[], filters: PessoaFiltros): Pessoa[] {
  const search = filters.busca?.trim().toLowerCase();

  return clients.filter((client) => {
    if (search) {
      const target = `${client.razaoSocialOuNome} ${client.nomeFantasia ?? ''} ${client.documento} ${client.email}`.toLowerCase();
      if (!target.includes(search)) return false;
    }
    if (filters.status && filters.status !== 'todos' && client.status !== filters.status) return false;
    if (filters.relacao && filters.relacao !== 'todos' && client.relacao !== filters.relacao) return false;
    if (filters.tipoPessoa && filters.tipoPessoa !== 'todos' && client.tipoPessoa !== filters.tipoPessoa) return false;
    if (filters.situacaoCredito && filters.situacaoCredito !== 'todos' && client.situacaoCredito !== filters.situacaoCredito) return false;
    return true;
  });
}

// --- Real API shapes (apps/api), local to this file — not part of the frontend's @/types contract ---

interface ApiContato {
  tipo: string;
  valor: string;
}

interface ApiCliente {
  id: string;
  tenant_id: string;
  tipo: 'pf' | 'pj';
  nome: string;
  cpf_cnpj: string;
  contatos: ApiContato[];
  created_at: string;
  deleted_at: string | null;
}

interface ApiFinanceiroLancamento {
  id: string;
  cliente_id: string | null;
  valor: string;
  status: 'pendente' | 'pago' | 'cancelado';
  vencimento: string;
}

/** Parses a decimal string like "4500.00" into integer cents, without float rounding error. */
function parseValorToCentavos(valor: string): number {
  const [reais, centavosRaw = '0'] = valor.split('.');
  const centavos = centavosRaw.padEnd(2, '0').slice(0, 2);
  return parseInt(reais, 10) * 100 + parseInt(centavos, 10);
}

/**
 * Sums pending (`status: 'pendente'`) financeiro-lancamentos whose `vencimento` is in the past,
 * grouped by `cliente_id`. Pass `clienteId` to scope the fetch to a single client (used by
 * `getClient`); omit it to fetch tenant-wide (used by `listClients`).
 */
async function fetchOverdueTotalsByClient(clienteId?: string): Promise<Map<string, number>> {
  const params: Record<string, string> = { status: 'pendente' };
  if (clienteId) params.cliente_id = clienteId;

  const { data } = await http.get<ApiFinanceiroLancamento[]>('/financeiro-lancamentos', { params });
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD', comparable lexicographically

  const totals = new Map<string, number>();
  for (const lancamento of data) {
    if (!lancamento.cliente_id) continue;
    if (lancamento.vencimento >= today) continue; // not overdue yet
    const current = totals.get(lancamento.cliente_id) ?? 0;
    totals.set(lancamento.cliente_id, current + parseValorToCentavos(lancamento.valor));
  }
  return totals;
}

/**
 * Maps a raw API `clientes` row onto the frontend `Pessoa` contract. Fields the backend has no
 * column for (relacao, status, endereco, contatoPrincipal, nomeFantasia, segmento, observacoes,
 * limiteCreditoCentavos, inscricaoEstadual, inscricaoMunicipal, isentoIE, atualizadoEm) are
 * intentionally left unset — do not default them to fabricated values.
 */
function mapApiClientToPessoa(api: ApiCliente, overdueCentavos: number): Pessoa {
  const emailContato = api.contatos.find((c) => c.tipo === 'email');
  const telefoneContato = api.contatos.find((c) => c.tipo === 'telefone');
  const whatsappContato = api.contatos.find((c) => c.tipo === 'whatsapp');

  return {
    id: api.id,
    tenantId: api.tenant_id,
    tipoPessoa: api.tipo === 'pf' ? 'PF' : 'PJ',
    razaoSocialOuNome: api.nome,
    documento: api.cpf_cnpj,
    email: emailContato?.valor ?? '',
    telefone: telefoneContato?.valor ?? whatsappContato?.valor ?? '',
    whatsapp: whatsappContato?.valor,
    situacaoCredito: overdueCentavos > 0 ? 'inadimplente' : 'aprovado',
    valorEmAtrasoCentavos: overdueCentavos,
    criadoEm: api.created_at,
  };
}

export async function listClients(filters: PessoaFiltros = {}): Promise<Pessoa[]> {
  if (USE_MOCKS) {
    await delay();
    return filterClients(db.pessoas, filters);
  }
  const { data } = await http.get<ApiCliente[]>('/clientes');
  const overdueTotals = await fetchOverdueTotalsByClient();
  const mapped = data.map((apiClient) =>
    mapApiClientToPessoa(apiClient, overdueTotals.get(apiClient.id) ?? 0),
  );
  // The backend ignores query params on GET /clientes (no filtering support server-side), so
  // filtering has to happen here, client-side, same as the mock path.
  return filterClients(mapped, filters);
}

export async function getClient(id: string): Promise<Pessoa | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.pessoas.find((client) => client.id === id);
  }
  const { data } = await http.get<ApiCliente>(`/clientes/${id}`);
  const overdueTotals = await fetchOverdueTotalsByClient(id);
  return mapApiClientToPessoa(data, overdueTotals.get(id) ?? 0);
}

export async function createClient(
  clientData: Omit<Pessoa, 'id' | 'criadoEm'>,
): Promise<Pessoa> {
  if (USE_MOCKS) {
    await delay(300);
    const created: Pessoa = {
      ...clientData,
      id: `pes-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    db.pessoas.push(created);
    saveDB();
    return created;
  }

  const contatos: ApiContato[] = [];
  if (clientData.email) contatos.push({ tipo: 'email', valor: clientData.email });
  if (clientData.telefone) contatos.push({ tipo: 'telefone', valor: clientData.telefone });
  if (clientData.whatsapp) contatos.push({ tipo: 'whatsapp', valor: clientData.whatsapp });

  const payload = {
    tipo: clientData.tipoPessoa === 'PF' ? 'pf' : 'pj',
    nome: clientData.razaoSocialOuNome,
    cpf_cnpj: clientData.documento,
    contatos,
  };

  const { data } = await http.post<ApiCliente>('/clientes', payload);
  // A brand-new client has no financeiro-lancamentos yet, so it can't be overdue.
  return mapApiClientToPessoa(data, 0);
}
```

## File 3: `src/services/dashboard.service.ts`

One-line change. The backend `clientes` table has no vendor/relationship concept at all — every
row returned by `/api/clientes` is structurally a client of the firm, there is no `fornecedor`
distinction to query. So in real-API mode `relacao` is `undefined` on every `Pessoa` (per File 1),
and the "active clients" count must treat a missing `relacao` as "is a client" rather than
excluding it. Mock-mode records that explicitly set `relacao: 'fornecedor'`/`'transportadora'`
must keep being excluded, same as today.

```ts
// before
  const activeClients = clients.filter((p) => p.relacao === 'cliente' || p.relacao === 'ambos');

// after
  const activeClients = clients.filter(
    (p) => !p.relacao || p.relacao === 'cliente' || p.relacao === 'ambos',
  );
```

Do not change the `delinquentClients` line, the KPI/alert construction below it, or anything else
in this file — once `clientes.service.ts` is fixed, `situacaoCredito`/`valorEmAtrasoCentavos` are
always real, non-fabricated values, so that existing filter is already correct.

## File 4: `src/components/clientes/clientesColumns.tsx`

Remove the `relacao` and `status` column definitions entirely — the backend has no column for
either, so they always render blank/undefined in real-API mode. Remove the now-unused imports
(`Pill`, `pessoaStatusMeta`, `tipoRelacaoMeta`) that only those two columns used;
`situacaoCreditoMeta` stays (still used by the `credito` column).

Resulting file:

```tsx
import type { Column } from '@/components/ui/DataTable/DataTable';
import type { Pessoa } from '@/types';
import { situacaoCreditoMeta } from '@/utils/statusMaps';
import styles from './clientesColumns.module.scss';

export const clientesColumns: Column<Pessoa>[] = [
  {
    key: 'cliente',
    header: 'Parceiro / Razão Social',
    render: (client) => (
      <div>
        <div className={styles.nome}>{client.razaoSocialOuNome}</div>
        <div className={styles.muted}>
          {client.nomeFantasia ? `${client.nomeFantasia} • ` : ''}
          {client.documento}
        </div>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (client) => (client.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'),
  },
  {
    key: 'contato',
    header: 'Contato',
    render: (client) => (
      <div>
        {client.telefone}
        <br />
        <span className={styles.muted}>{client.email}</span>
      </div>
    ),
  },
  {
    key: 'credito',
    header: 'Situação Crédito',
    render: (client) => {
      const meta = situacaoCreditoMeta[client.situacaoCredito] ?? { label: client.situacaoCredito, tone: 'neutral' };
      return <span className={styles[`tone-${meta.tone}`]}>{meta.label}</span>;
    },
  },
];
```

## File 5: `src/pages/clientes/ClientesPage.tsx`

The "Status" and "Relação" filter dropdowns filter on fields the real backend doesn't have — in
real-API mode they'd silently do nothing (there's no matching data to filter against). Remove
both selects and their state, and stop passing `status`/`relacao` to `useClientes`. Keep the
search input as-is (it still works — `busca` filters on real `razaoSocialOuNome`/`documento`/
`email`).

- Delete the `STATUS_OPTIONS` and `RELACAO_OPTIONS` arrays.
- Delete the `status`/`relation` `useState` declarations and their setters.
- Delete the two `<SelectField ...>` elements for status and relação in the `<Toolbar>`.
- Change the `useClientes` call from
  `useClientes({ busca: debouncedSearch, status, relacao: relation })` to
  `useClientes({ busca: debouncedSearch })`.
- Remove the now-unused `PessoaStatus`, `TipoRelacao` type import if nothing else in the file
  uses them.

Nothing else in this file changes (imports for `SelectField`, `Toolbar`, `SearchInput` etc. stay,
`SelectField` may still be imported even if this file no longer uses it only if something else in
the file needs it — check before deleting the import; if this file has no other `SelectField`
usage after this change, remove that import too).

## File 6: `src/pages/clientes/ClienteDetailPage.tsx`

Only touch the **header info grid**, the **KPI row**, and the **"cadastro" tab body**. Do not
touch the `entriesColumns` array, `listEntries` import/usage, `totalRevenue`/`totalPending`/
`totalOverdue` computations, the "financeiro" tab, or the tab-switcher structure — those depend on
`financeiro.service.ts`, which is a separate, already-broken adapter out of scope here (see top of
this spec).

**Header info grid** — remove the "Status Cadastral" and "Relação Comercial" and "Segmento"
`infoItem` blocks (fields the backend doesn't have). Keep "Situação de Crédito", "Telefone",
"E-mail". Also remove the now-unused `statusMeta`/`relationMeta` local consts and the
`pessoaStatusMeta`/`tipoRelacaoMeta` imports (keep `situacaoCreditoMeta` and
`lancamentoStatusMeta`, both still used).

```tsx
// before
  const statusMeta = pessoaStatusMeta[client.status] ?? { label: client.status, tone: 'neutral' };
  const creditMeta = situacaoCreditoMeta[client.situacaoCredito] ?? { label: client.situacaoCredito, tone: 'neutral' };
  const relationMeta = tipoRelacaoMeta[client.relacao] ?? { label: client.relacao, tone: 'neutral' };

// after
  const creditMeta = situacaoCreditoMeta[client.situacaoCredito] ?? { label: client.situacaoCredito, tone: 'neutral' };
```

```tsx
// before (inside styles.infoGrid)
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status Cadastral</span>
              <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Relação Comercial</span>
              <Pill tone={relationMeta.tone}>{relationMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Situação de Crédito</span>
              <Pill tone={creditMeta.tone}>{creditMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Segmento</span>
              <span className={styles.infoValue}>{client.segmento ?? '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{client.telefone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{client.email}</span>
            </div>

// after
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Situação de Crédito</span>
              <Pill tone={creditMeta.tone}>{creditMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{client.telefone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{client.email}</span>
            </div>
```

**KPI row** — remove the "Limite de Crédito" `KpiCard` (backend has no credit-limit column, this
always rendered "Ilimitado" fabricated text against real data):

```tsx
// before
        <div className={styles.kpis}>
          <KpiCard
            label="Limite de Crédito"
            value={client.limiteCreditoCentavos ? formatBRL(client.limiteCreditoCentavos) : 'Ilimitado'}
          />
          {entriesError ? (

// after
        <div className={styles.kpis}>
          {entriesError ? (
```

**"cadastro" tab body** — every field in it (`inscricaoEstadual`, `isentoIE`,
`inscricaoMunicipal`, `contatoPrincipal`, `endereco`, `observacoes`) is absent from the real
backend. Replace the whole tab body with an honest `EmptyState` (the component is already
imported in this file) instead of rendering undefined fields:

```tsx
// before
          {tab === 'cadastro' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '16px 0' }}>
              <div>
                <strong>Inscrição Estadual:</strong> {client.inscricaoEstadual ?? (client.isentoIE ? 'Isento' : 'Não informada')}
              </div>
              {client.inscricaoMunicipal && (
                <div>
                  <strong>Inscrição Municipal:</strong> {client.inscricaoMunicipal}
                </div>
              )}
              {client.contatoPrincipal && (
                <div>
                  <strong>Contato Principal:</strong> {client.contatoPrincipal.nome} ({client.contatoPrincipal.cargo ?? 'Contato'})
                </div>
              )}
              <div>
                <strong>Endereço:</strong> {client.endereco.logradouro}, {client.endereco.numero} {client.endereco.complemento ?? ''}
              </div>
              <div>
                <strong>Bairro / Cidade:</strong> {client.endereco.bairro} - {client.endereco.cidade}/{client.endereco.uf}
              </div>
              <div>
                <strong>CEP:</strong> {client.endereco.cep}
              </div>
              {client.observacoes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Observações:</strong> {client.observacoes}
                </div>
              )}
            </div>
          )}

// after
          {tab === 'cadastro' && (
            <EmptyState title="Nenhum dado cadastral adicional disponível para este cliente." />
          )}
```

Do not touch anything else in the file — leave `TABS`, the tab-switcher buttons, the tab labels,
and the "financeiro" tab exactly as they are.

## File 7: `src/components/modais/NovoClienteModal.tsx`

The create form currently collects `nomeFantasia`, `relacao`, `segmento`, `status`, and sends a
hardcoded fake `endereco` object — none of which the backend's `createClienteSchema` accepts or
persists (see the schema at the top of this spec). With File 2's new `createClient()`, these
values are silently dropped when building the real request payload. Leaving the input fields in
place means the user fills them in, believes they were saved, and they vanish — exactly the
fabricated-data pattern this checkpoint exists to remove. Delete the fields that don't map to
anything real; keep the ones that do (`razaoSocialOuNome`, `tipoPessoa`, `documento`, `telefone`,
`email`).

- Delete the `nomeFantasia`, `relacao`, `segmento`, `status` `useState` declarations and their
  setters.
- Delete their corresponding lines inside `reset()`.
- Delete the hardcoded `endereco: { cep: '01001-000', ... }` block from the `createClient(...)`
  call, and the `nomeFantasia`, `relacao`, `segmento`, `status` keys in that same call. Keep
  `tenantId`, `tipoPessoa`, `razaoSocialOuNome`, `documento`, `telefone`, `email`,
  `situacaoCredito: 'aprovado' as SituacaoCredito`, `valorEmAtrasoCentavos: 0` — those stay
  exactly as they are (a brand-new client genuinely has no credit issues yet, that's not
  fabricated, it's the correct default).
- Delete the `ModalField` blocks for "Nome Fantasia", "Relação Comercial", and "Segmento / Ramo".
- Delete the `ModalField` block for "Status Cadastral".
- Remove the now-unused `TipoRelacao`, `PessoaStatus` imports from the `@/types` import line;
  keep `TipoPessoa`, `SituacaoCredito`.

Do not change the modal's title, the required-name validation, the toast messages, or anything
else in this file.

## Out of scope — do not touch these files

- `src/services/financeiro.service.ts`, `src/types` `Lancamento`, `entriesColumns` in
  `ClienteDetailPage.tsx`, the "Lançamentos Financeiros" tab — separate, already-broken adapter
  (wrong endpoint path, unrelated field mismatch), needs its own checkpoint/spec.
- `src/mocks/*.ts` — mock fixtures are unaffected by this change (all touched fields were already
  optional-safe or stay populated in mock mode).
- `src/utils/statusMaps.ts` — leave `pessoaStatusMeta`/`tipoRelacaoMeta` exported even though
  this checkpoint removes their last call sites; do not delete them from this file.
- Anything under `apps/api` (backend) — this checkpoint is frontend-only.
- Any other page/component not explicitly listed above.

## When done

Do not run `npm run build`, `tsc`, `oxlint`, or any test/shell command — that happens outside this
dispatch. Do not `git add` or `git commit`. Leave every change above as an uncommitted diff in the
working tree.
