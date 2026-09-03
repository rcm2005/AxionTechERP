# CP1-B — Financeiro: real API path, response mapping, real "today"

Fixes three bugs discovered while wiring the Financeiro screen and the Dashboard KPI block to the
real backend (`apps/api`, Fastify/Drizzle/Postgres, confirmed live on `localhost:8090` at spec time).
Today `dashboard.service.ts`'s KPI computation routes through `financeiro.service.ts`'s
`listEntries()`, so in real-API mode (`VITE_USE_MOCKS=false`) both the Dashboard KPI block and the
entire Financeiro screen currently throw and render an error state on every single load. This spec
fixes that.

**Rule of this repo**: code, comments, and identifiers are in English from here forward. **User-facing
UI strings stay in Portuguese exactly as they are today** — do not translate any string that renders
in the browser (toasts, labels, titles, `Alert` text, etc.).

**Process constraints — follow exactly:**
- Only use `write_file` / `edit_file`. Do **not** run any shell/build command (no `npm`, `tsc`,
  `git`, nothing).
- Do not create compatibility aliases for old names (no `REFERENCE_DATE` re-exported under a new
  name, no keeping the old broken path as a fallback, etc.). Old names get removed, not shimmed.
- Every "today"/"now" must come from a real `new Date()` call at the point of use. Never hardcode a
  date literal anywhere, including as a "temporary" default.
- Touch only the files listed below. Where a file lists something as out of scope, leave it exactly
  as it is.

---

## Bug 1 — wrong API path

`src/services/financeiro.service.ts` calls `http.get('/financeiro/lancamentos')` and
`http.post('/financeiro/lancamentos', ...)`. The axios client's `baseURL` is `/api` (see
`src/services/http.ts`), so these resolve to `/api/financeiro/lancamentos`, which is a 404.

Confirmed by reading the backend directly: `apps/api/src/routes/index.ts` registers
`await fastify.register(financeiroLancamentosRoutes, { prefix: '/financeiro-lancamentos' })`, and
`apps/api/src/app.ts` mounts that whole router group under `/api`. The real, live route is
`/api/financeiro-lancamentos` — hyphenated, no `/lancamentos` suffix. Verified with a live request
against the running instance (`localhost:8090`): `GET /api/financeiro-lancamentos` with a valid
bearer token returns `200` with a JSON array; the old path returns `404`.

**Fix**: change both call sites' path string from `/financeiro/lancamentos` to
`/financeiro-lancamentos`.

---

## Bug 2 — response shape mismatch

### Real API response shape (verified live, three sample rows shown)

`GET /api/financeiro-lancamentos` returns an array of objects shaped exactly like this (field names
and types are the Drizzle schema, `apps/api/src/db/schema.ts`, table `financeiro_lancamentos`):

```json
[
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
  },
  {
    "id": "09fde7e9-1ccb-4d80-9805-5dbdcd091a5b",
    "tenant_id": "81bbe52b-f55b-437b-a929-4f2159dd5482",
    "cliente_id": "46c8db0c-0b81-4d2e-a36d-db0d11d64c58",
    "processo_id": "f366bf53-94d0-4be7-b145-e414653e89a5",
    "contrato_id": null,
    "tipo": "honorario_exito",
    "valor": "9000.00",
    "percentual_exito": "20.00",
    "status": "pendente",
    "vencimento": "2026-10-05",
    "created_at": "2026-08-31T17:19:49.555Z",
    "deleted_at": null
  },
  {
    "id": "052beb78-e24e-42be-b5ed-ec3c39630dde",
    "tenant_id": "81bbe52b-f55b-437b-a929-4f2159dd5482",
    "cliente_id": "e42ba128-fe11-46f8-9864-1a2eba9b3014",
    "processo_id": "d4603e32-8782-4191-8d39-94f7c016b553",
    "contrato_id": null,
    "tipo": "despesa_processual",
    "valor": "850.00",
    "percentual_exito": null,
    "status": "pago",
    "vencimento": "2026-08-20",
    "created_at": "2026-08-31T17:19:49.555Z",
    "deleted_at": null
  }
]
```

The full real enums (confirmed from the Zod schemas in `apps/api/src/routes/financeiro-lancamentos.ts`,
which match the Drizzle column definitions exactly — this is the complete list, not a partial one):

- `tipo`: `'honorario_fixo' | 'honorario_parcelado' | 'honorario_exito' | 'despesa_processual' | 'receita_outra'`
- `status`: `'pendente' | 'pago' | 'cancelado'` — **there is no `'parcial'` status on the backend, ever.**
- `valor`: always a string with exactly 2 decimal digits (Postgres `numeric(14,2)`, e.g. `"4500.00"`,
  never `"4500"` or `"4500.5"` when read back from the DB, though don't assume the decimal part is
  always present when writing the parser — see below).
- `vencimento`: a plain `"YYYY-MM-DD"` string (Postgres `date`), no time component.
- `created_at`: a full ISO-8601 timestamp string.

### Frontend target shape

`src/types/financeiro.ts` defines `LancamentoFinanceiro` (aliased as `Lancamento`). Its
**non-optional** fields are: `id`, `tenantId`, `tipo`, `descricao`, `categoria`, `valorCentavos`,
`emissaoEm`, `vencimento`, `status`, `criadoEm`. Everything else on the interface is optional —
leave optional fields not covered by the mapping table below simply unset (`undefined`), do not
invent values for them.

### What to add: `mapApiEntryToLancamento()`

Add this to `src/services/financeiro.service.ts`. First add a local interface for the raw API row
(do not import/create it anywhere else):

```ts
interface ApiFinanceiroLancamento {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  processo_id: string | null;
  contrato_id: string | null;
  tipo: 'honorario_fixo' | 'honorario_parcelado' | 'honorario_exito' | 'despesa_processual' | 'receita_outra';
  valor: string;
  percentual_exito: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  vencimento: string; // "YYYY-MM-DD"
  created_at: string; // ISO-8601
  deleted_at: string | null;
}
```

#### Centavos parsing — get this exactly right, do not do float math

Parse the integer cents directly out of the decimal string. **Never** do `Math.round(parseFloat(valor) * 100)`
or any float arithmetic — floating point can silently corrupt money values. Split on the decimal
point and combine the integer parts:

```ts
function parseValorToCentavos(valor: string): number {
  const [reaisPart, centavosPartRaw] = valor.split('.');
  const centavosPart = (centavosPartRaw ?? '00').padEnd(2, '0').slice(0, 2);
  return Number(reaisPart) * 100 + Number(centavosPart);
}
```

Worked examples (these are the actual values from the live sample data above — cross-check your
implementation against every one of them):

| input `valor` string | → `valorCentavos` | NOT |
|---|---|---|
| `"4500.00"` | `450000` | NOT `4500000`, NOT `45000` |
| `"9000.00"` | `900000` | NOT `9000000`, NOT `90000` |
| `"850.00"` | `85000` | NOT `850000`, NOT `8500` |
| `"1500.50"` (hypothetical) | `150050` | NOT `150005` |
| `"20"` (hypothetical, no decimal point — defensive case) | `2000` | — |

#### `tipo` → UI `tipo` + `categoria` (full mapping table, this is the complete enum)

`categoria` is a **legibility upgrade**, not a generic rename — derive a specific, readable
Portuguese label per `tipo`, not a copy of the raw enum value:

| raw `tipo` | UI `tipo` | `categoria` |
|---|---|---|
| `honorario_fixo` | `'receita'` | `"Honorário fixo"` |
| `honorario_parcelado` | `'receita'` | `"Honorário parcelado"` |
| `honorario_exito` | `'receita'` | `"Honorário de êxito"` |
| `receita_outra` | `'receita'` | `"Outra receita"` |
| `despesa_processual` | `'despesa'` | `"Despesa processual"` |

Set `descricao` to the same string as the derived `categoria` (the raw API has no free-text
description/notes field to draw from — do not fabricate one; reusing the specific `categoria` label
for `descricao` is strictly more informative than the old generic mock text was, and is honest about
what data actually exists).

#### `status` → UI `status`

Backend only has `pendente | pago | cancelado`. Derive `'atrasado'` (overdue) yourself; **never
produce `'parcial'`** — there is no backend state that means "partial", so the mapper must never
emit it. Compare dates as plain `"YYYY-MM-DD"` strings (lexicographic comparison is correct for
ISO dates and sidesteps timezone bugs from constructing `Date` objects just to compare them):

```ts
function mapStatus(raw: ApiFinanceiroLancamento, todayIsoDate: string): Lancamento['status'] {
  if (raw.status === 'pago') return 'pago';
  if (raw.status === 'cancelado') return 'cancelado';
  // raw.status === 'pendente' from here on
  return raw.vencimento < todayIsoDate ? 'atrasado' : 'pendente';
}
```

Also remove `'parcial'` from the UI's own vocabulary, not just from what the mapper emits — it is
provably dead already: as of this spec, `'parcial'` appears in exactly two places in the whole
frontend, `src/types/financeiro.ts` (the `StatusLancamento` union) and
`src/utils/statusMaps.ts` (`lancamentoStatusMeta`'s `parcial:` entry), and nowhere else — not in any
mock data, not in `NovaCobrancaModal.tsx`'s status `<select>` (which only offers `pendente` /
`pago` / `atrasado`), not in any other component. Confirm this is still true with a grep for
`'parcial'` (and `"parcial"`) across `src/` before editing; if it turns up anywhere else the sweep
missed, leave the type as-is and just make sure the mapper never emits it — otherwise:

- In `src/types/financeiro.ts`: change
  `export type StatusLancamento = 'pago' | 'pendente' | 'atrasado' | 'cancelado' | 'parcial';`
  to
  `export type StatusLancamento = 'pago' | 'pendente' | 'atrasado' | 'cancelado';`
- In `src/utils/statusMaps.ts`: delete the `parcial: { label: 'Parcial', tone: 'blue' },` line from
  `lancamentoStatusMeta`.

#### Full mapper

```ts
function mapApiEntryToLancamento(raw: ApiFinanceiroLancamento, todayIsoDate: string): Lancamento {
  const categoria = mapCategoria(raw.tipo); // per table above
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    tipo: raw.tipo === 'despesa_processual' ? 'despesa' : 'receita',
    descricao: categoria,
    categoria,
    pessoaId: raw.cliente_id ?? undefined,
    valorCentavos: parseValorToCentavos(raw.valor),
    emissaoEm: raw.created_at,
    vencimento: raw.vencimento,
    status: mapStatus(raw, todayIsoDate),
    criadoEm: raw.created_at,
  };
}
```

(`mapCategoria` is the small helper implementing the `tipo` → `categoria` table above; write it as
a separate function or inline a `switch`/lookup object, implementer's choice — just make sure it's
total over all 5 real `tipo` values, e.g. an exhaustive `switch` with no `default` so a future new
`tipo` value fails to compile rather than silently falling through.)

### Wire it into `listEntries()`

Replace the real-mode branch. Today:

```ts
const { data } = await http.get<Lancamento[]>('/financeiro/lancamentos');
return data;
```

Becomes:

```ts
const { data } = await http.get<ApiFinanceiroLancamento[]>('/financeiro-lancamentos');
const todayIsoDate = new Date().toISOString().slice(0, 10);
return data.map((entry) => mapApiEntryToLancamento(entry, todayIsoDate));
```

### `createEntry()` — path only, do not touch the body shape

The `createEntry()` function's real-mode branch also calls the wrong path
(`http.post<Lancamento>('/financeiro/lancamentos', entryData)`); fix that one string to
`/financeiro-lancamentos` too, same as the GET. **Do not** attempt to map `entryData` (which is in
the frontend's `Lancamento` shape) into the backend's write shape (`{tipo, valor, status,
vencimento, ...}` with the raw enum and a decimal-string `valor`) — that reverse mapping is a
separate, out-of-scope problem (the create flow through `NovaCobrancaModal.tsx` is tracked
elsewhere). Leave `createEntry()`'s body and return-type generic exactly as they are apart from the
one path string; do not rename or restructure the function.

---

## Bug 3 — hardcoded fake "today"

`src/config/app.ts` defines:

```ts
// Data usada como "hoje" enquanto os dados forem mockados — troque por
// `new Date().toISOString()` quando um backend real fornecer os dados.
export const REFERENCE_DATE = '2026-08-18';
```

That comment is the plan; execute it now. Delete both the comment and the export entirely from
`src/config/app.ts`.

There are **four** consumers to fix — one more than the two importers, because
`FinanceiroPage.tsx` has its own separate, unrelated `REFERENCE_DATE` local `const` that happens to
share the name (it does not import from `config/app.ts` — check the top of the file, there's no such
import there). Fix all four:

1. **`src/config/app.ts`** — delete the `REFERENCE_DATE` export (and its now-orphaned comment).

2. **`src/pages/dashboard/DashboardPage.tsx`** — remove
   `import { REFERENCE_DATE } from '@/config/app';`. Change
   `subtitle={\`Visão geral da operação em ${formatLongDate(REFERENCE_DATE)}.\`}`
   to
   `subtitle={\`Visão geral da operação em ${formatLongDate(new Date().toISOString())}.\`}`.

3. **`src/components/financeiro/FluxoCaixaCard.tsx`** — remove
   `import { REFERENCE_DATE } from '@/config/app';`. Change
   `const monthLabel = formatMonthYear(REFERENCE_DATE);`
   to
   `const monthLabel = formatMonthYear(new Date().toISOString());`.

4. **`src/pages/financeiro/FinanceiroPage.tsx`** — this file's `REFERENCE_DATE` is the *local*
   module-level `const REFERENCE_DATE = new Date('2026-08-18');` (near the top, after the imports,
   before the `BreakdownRow` type). Delete that line entirely. Inside the `filteredEntries`
   `useMemo` (the one that currently does `const refMs = REFERENCE_DATE.getTime();` and
   `date <= REFERENCE_DATE`), add `const today = new Date();` as the first line of the callback
   (right after the `if (period === 'todos') return all;` early return, or before it — either is
   fine as long as it only runs when actually needed), and replace every remaining use of
   `REFERENCE_DATE` in that block with `today`. This matches the existing pattern already used
   elsewhere in this codebase for "real current date" — see `today: Date = new Date()` in
   `src/utils/prazos.ts`'s `classifyDeadline` — so no new convention is being invented here.

After all four edits, grepping the whole `src/` tree for `REFERENCE_DATE` must return **zero**
matches.

---

## Summary of files touched

- `src/services/financeiro.service.ts` — path fixes (GET + POST), new `ApiFinanceiroLancamento`
  interface, new `parseValorToCentavos` / `mapCategoria` / `mapStatus` / `mapApiEntryToLancamento`
  helpers, `listEntries()` rewritten to fetch-then-map.
- `src/types/financeiro.ts` — drop `'parcial'` from `StatusLancamento` (unless the grep check above
  finds a live consumer elsewhere, in which case leave it).
- `src/utils/statusMaps.ts` — drop the now-invalid `parcial:` entry from `lancamentoStatusMeta` (only
  if the above type edit was made — the two must move together, or neither).
- `src/config/app.ts` — delete `REFERENCE_DATE`.
- `src/pages/dashboard/DashboardPage.tsx` — real date instead of `REFERENCE_DATE`.
- `src/components/financeiro/FluxoCaixaCard.tsx` — real date instead of `REFERENCE_DATE`.
- `src/pages/financeiro/FinanceiroPage.tsx` — real date instead of its own local `REFERENCE_DATE`.

Nothing else. No shell commands. No compatibility aliases. No new hardcoded dates.
