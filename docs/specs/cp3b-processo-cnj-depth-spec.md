# CP3-B (frontend) — decompose the CNJ number and the deadline-count chain on the case-detail screen

## Context

`ProcessoDetailPage.tsx` is the screen a lawyer stares at longest in the whole app. Today it shows
`caseItem.numero_cnj` as an opaque string (e.g. `0001234-56.2024.8.26.0100`) with no indication of
what tribunal/instância/year it actually encodes beyond the separately-typed `tribunal` free-text
field. It also lists each `Prazo` (deadline) in a flat table with no visibility into *how* its
fatal date was counted — that transparency already exists elsewhere in the app (the Copilot's
`AnalisePrazoCard.tsx`, via its `explicacao_contagem` field) but not here.

A companion backend spec
(`../../../repo-migration/ERP-MVP-AxionTech/docs/specs/cp3b-processo-cnj-depth-backend-spec.md`,
applied to the `ERP-MVP-AxionTech` repo, not this one) makes two additions you will consume here:

1. `GET /processos/:id` now returns an extra field, `cnj_decomposicao`, shaped exactly like
   `CnjDecomposicao` below — a decomposition of `numero_cnj` (tribunal, ano, código de origem)
   that the backend computed via its own grounded `cnj.ts`. **Do not build a tribunal-code lookup
   table in this repo.** The backend already resolved the tribunal name; your job is only to
   render the value it sends, and to degrade gracefully (hide the section) when the field is
   `null` or absent.
2. Every `Prazo` returned by `GET /prazos` (list) and `GET /prazos/:id` now carries
   `explicacao_contagem: string | null` — the same field name and same underlying
   `buildExplicacaoContagem` function the Copilot's `AnaliseIntimacao.explicacao_contagem`
   already uses (see `src/components/copilot/AnalisePrazoCard.tsx` for the established
   presentation this checkpoint must match, not invent a new style for).

**A note on scope, read before you start**: the CNJ number format
(`NNNNNNN-DD.AAAA.J.TR.OOOO`, per Resolução CNJ nº 65/2008) does **not** encode instância/grau as
a separate digit — only tribunal segment/code, ano, and unidade de origem. Do not add an
"instância" or "grau" field anywhere in this checkpoint; there is nothing grounded to put in it.
The three fields below (`tribunal`, `ano`, `codigoOrigem`) are the complete, honest decomposition.

## Process constraints — follow exactly

- Only use `write_file` / `edit_file`. Do **not** run any shell/build command (no `npm`, `tsc`,
  `git`, nothing) — do not attempt `mkdir`/`npm`/`npx` even if something seems to require it, it
  does not. The person who dispatched this will run the build and validate.
- Do not create compatibility aliases for old names or old behavior.
- Do not add a `USE_MOCKS` branch or any client-side CNJ-parsing fallback for
  `cnj_decomposicao` — there is no honest local mock for a backend-computed decomposition (same
  reasoning `copilot.service.ts`'s own header comment already gives for
  `analisarIntimacao`: "there is no honest local mock for a real legal deadline computation").
  In mock mode, `caseItem.cnj_decomposicao` is simply `undefined`, and the section that renders it
  must already handle that (see below) — that is the correct, complete behavior, not a gap to
  fill in.
- Touch only the five files listed below. Where a file's section says something is out of scope,
  leave it exactly as it is.
- Do not `git add` / `git commit`. Leave the changes as an uncommitted diff in the working tree.
- User-facing strings stay Portuguese, matching every other string already on this page. Code,
  comments, and new identifiers you add are English, per this project's standing convention.

---

## 1. `src/types/processo.ts`

Add a new exported interface, placed after `ParteProcesso` and before `Processo`:

```ts
/**
 * Mirrors `CnjDecomposicao` in the backend's `apps/api/src/utils/cnj.ts`
 * exactly (field names included) — that file owns the real CNJ
 * segment/tribunal lookup table and is the only place that ever resolves a
 * tribunal code to a name. This type only describes the shape of the value
 * the backend already computed and sent; do not add a lookup table here.
 */
export interface CnjDecomposicao {
  numeroCnj: string;
  segmentoJustica: string;
  codigoTribunal: string;
  codigoOrigem: string;
  ano: string;
  tribunal: string | null;
}
```

Add one field to the existing `Processo` interface, directly after `numero_cnj: string;`:

```ts
  /**
   * Present only on the response from `GET /processos/:id` (not the list
   * endpoint), and only when `numero_cnj` matched the CNJ shape server-side —
   * `null` if the backend couldn't parse it, `undefined` in mock mode (no
   * local mock for this, see `processos.service.ts`) or when this Processo
   * came from the list endpoint. Always guard with optional chaining before
   * reading into it, never assume presence.
   */
  cnj_decomposicao?: CnjDecomposicao | null;
```

Nothing else in this file changes. `ProcessoInput` (`Omit<Processo, 'id' | 'created_at' |
'updated_at'>`) will pick up the new optional field automatically — that is fine, it is never sent
on create/update (the backend ignores unknown fields on write, and no write path in this repo sets
it).

---

## 2. `src/types/prazo.ts`

Add one field to the existing `Prazo` interface, directly after `dias_uteis?: number | null;`:

```ts
  /**
   * Human-readable Portuguese explanation of the business-day count behind
   * `prazo_fatal` (which holidays/recess days were excluded, etc.) —
   * computed server-side by the same `buildExplicacaoContagem` function the
   * Copilot's `AnaliseIntimacao.explicacao_contagem` uses (see
   * `src/components/copilot/AnalisePrazoCard.tsx`); same field name, same
   * authoring function, deliberately, so the two screens never disagree.
   * `null` when `data_intimacao` or `dias_uteis` is missing on this prazo
   * (nothing to reconstruct); `undefined` in mock mode.
   */
  explicacao_contagem?: string | null;
```

Nothing else in this file changes.

---

## 3. `src/pages/processos/ProcessoDetailPage.tsx`

### 3a. Add local state for the selected deadline row

`useMemo` and `useState` are already imported at the top of this file — no new import needed for
this part. Add this line among the existing `useState` declarations (right after
`const [savingDeadlineId, setSavingDeadlineId] = useState<string>();`):

```ts
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string>();
```

Add this derived value among the existing `useMemo` declarations (after `urgentDeadlines`, before
`async function handleMarcarCumprido`):

```ts
  const selectedDeadline = useMemo(
    () => (deadlines ?? []).find((deadline) => deadline.id === selectedDeadlineId),
    [deadlines, selectedDeadlineId],
  );
```

### 3b. Add the "Número CNJ decodificado" section

Insert this new `<Card>` immediately after the closing `</div>` of `.headerGrid` and before the
`<Card className={styles.secao}>` that has `<CardHead title="Partes do processo" />`:

```tsx
      {caseItem.cnj_decomposicao && (
        <Card className={styles.secao}>
          <CardHead title="Número CNJ decodificado" />
          <CardBody>
            {/* No "instância/grau" field: the CNJ number format (Resolução CNJ
                65/2008) does not encode it — only tribunal segment/code, ano
                and unidade de origem are derivable from the number itself. */}
            <div className={styles.infoGrid}>
              <Info label="Tribunal">{caseItem.cnj_decomposicao.tribunal ?? 'Não identificado'}</Info>
              <Info label="Ano de ajuizamento">{caseItem.cnj_decomposicao.ano}</Info>
              <Info label="Código da unidade de origem">{caseItem.cnj_decomposicao.codigoOrigem}</Info>
            </div>
          </CardBody>
        </Card>
      )}
```

This reuses the page's own existing `styles.infoGrid` (the same grid class already used in the
header `Card`) and the page's own existing local `Info` component (defined at the bottom of this
same file) — do not create new components or new grid CSS for this block. When
`caseItem.cnj_decomposicao` is `null` or `undefined` (malformed `numero_cnj`, or mock mode), the
whole section is simply not rendered — that is the intended graceful degradation, not a bug to
work around.

### 3c. Wire row-click on the Prazos table and add the expanded explanation panel

Find this exact block (inside the "Prazos" `<Card>`):

```tsx
        {deadlinesError ? (
          <CardBody>
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reloadDeadlines}>
                  Tentar novamente
                </Button>
              }
            />
          </CardBody>
        ) : (
          <DataTable
            columns={deadlinesColumns}
            rows={deadlines ?? []}
            getRowId={(deadline) => deadline.id}
            loading={loadingDeadlines}
            emptyMessage="Nenhum prazo cadastrado para este processo."
          />
        )}
```

Replace it with:

```tsx
        {deadlinesError ? (
          <CardBody>
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reloadDeadlines}>
                  Tentar novamente
                </Button>
              }
            />
          </CardBody>
        ) : (
          <>
            <DataTable
              columns={deadlinesColumns}
              rows={deadlines ?? []}
              getRowId={(deadline) => deadline.id}
              loading={loadingDeadlines}
              emptyMessage="Nenhum prazo cadastrado para este processo."
              onRowClick={(deadline) =>
                setSelectedDeadlineId((current) => (current === deadline.id ? undefined : deadline.id))
              }
            />
            {selectedDeadline && (
              <CardBody className={styles.explicacaoBlock}>
                <span className={styles.infoLabel}>
                  Como o prazo foi contado — {selectedDeadline.descricao}
                </span>
                {selectedDeadline.explicacao_contagem ? (
                  <p className={styles.explicacaoTexto}>{selectedDeadline.explicacao_contagem}</p>
                ) : (
                  <p className={styles.explicacaoIndisponivel}>
                    Contagem detalhada não disponível para este prazo (faltam data de intimação ou
                    dias úteis cadastrados).
                  </p>
                )}
              </CardBody>
            )}
          </>
        )}
```

`DataTable` (`src/components/ui/DataTable/DataTable.tsx`) already accepts an `onRowClick` prop —
you are not modifying that component, only passing a new prop to an existing usage of it. Clicking
a row toggles the panel open/closed (clicking the same row again closes it; clicking a different
row switches to it). The existing "Cumprir" quick-action button inside
`src/components/prazos/prazosColumns.tsx` already calls `e.stopPropagation()` on click — this was
already defensively written before this checkpoint, so it correctly continues to not trigger
`onRowClick` after this change; do not touch that file.

Do not modify `src/components/prazos/prazosColumns.tsx` or `src/components/ui/DataTable/DataTable.tsx`
— both are shared with other screens (e.g. the standalone Prazos list page) and are out of scope.

---

## 4. `src/pages/processos/ProcessoDetailPage.module.scss`

Add these three new classes at the end of the file. `.explicacaoTexto` is copied verbatim (same
declarations) from `src/components/copilot/AnalisePrazoCard.module.scss`'s own `.explicacaoTexto`
rule — this checkpoint's whole point is visual consistency with the Copilot's already-established
transparency presentation, not a new style:

```scss
.explicacaoBlock {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  border-top: 1px solid var(--color-line);
}

.explicacaoTexto {
  white-space: pre-wrap;
  border-left: 3px solid var(--color-accent);
  padding-left: 12px;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--color-text);
  background: var(--color-surface-2);
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  padding-right: var(--space-3);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.explicacaoIndisponivel {
  margin: 0;
  font-size: 13px;
  color: var(--color-muted);
}
```

Nothing else in this file changes — `.infoGrid`/`.infoItem`/`.infoLabel`/`.infoValue` (reused by
step 3b above) already exist and are untouched.

---

## What "done" looks like

- `src/types/processo.ts`: new `CnjDecomposicao` interface, `Processo` gains one optional field.
- `src/types/prazo.ts`: `Prazo` gains one optional field.
- `src/pages/processos/ProcessoDetailPage.tsx`: new state/derived value, a new "Número CNJ
  decodificado" `Card` (rendered only when data is present), the Prazos `DataTable` gains
  `onRowClick`, and a new expandable "Como o prazo foi contado" panel appears below it when a row
  is selected.
- `src/pages/processos/ProcessoDetailPage.module.scss`: three new classes, copied/adapted from the
  Copilot's own established pattern.
- `src/services/processos.service.ts`, `src/services/prazos.service.ts`,
  `src/components/prazos/prazosColumns.tsx`, `src/components/ui/DataTable/DataTable.tsx`: all
  byte-identical to before — no changes needed in any of them for this checkpoint.
- A case whose `numero_cnj` doesn't decompose (backend sent `cnj_decomposicao: null`) or whose
  `Processo` came from a code path without the field at all: the page renders normally, simply
  without the CNJ-decoded section — never a crash, never a blank page.
- A prazo without `explicacao_contagem` (backend sent `null`): clicking its row still opens the
  panel, showing the "not available" message instead of a blank or broken area.
