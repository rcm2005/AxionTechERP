# CP2-B — Copilot: real intimação analyzer, replacing the fake chat

`src/pages/copilot/CopilotPage.tsx` today is a static `keywords.some(...)` matcher over a hardcoded
`MOCK_RESPONSES` array. Two of those canned responses are actively dangerous to the product's
pitch: one quotes plan prices (`Pro — R$ 49/mês`) that do not match what `PlanosPage.tsx` actually
charges (`Standard Pro` is `R$ 149/mês`); the flagship "demo" response claims *"Seu ERP jurídico
foi gerado"* with an `<iframe>` pointing at a static `/demos/law-erp/login.html` — which directly
contradicts this project's own `docs/rd/MANIFESTO.md` §0/ADR 0001 (the product configures a
pre-built vertical template, it never "generates" a bespoke ERP per client; see also X-04 "dado
fabricado apresentado como real").

This spec replaces the whole page with a real feature: paste the text of an intimação (a legal
notice), call a real backend endpoint that extracts the fatal deadline and shows its counting
math, and let the lawyer explicitly review and confirm before anything is persisted. Nothing here
is a demo or a simulation — every state shown must be backed by a real response or a real error,
never a scripted one.

**Rule of this repo**: code, comments, and identifiers are in English from here forward.
**User-facing UI strings stay in Portuguese exactly as elsewhere in the app** — every string a
user reads on screen must be Portuguese, matching the tone already used in `NovoPrazoModal.tsx`
and the other jurídico screens (`Prazos`, `Processos`).

## Process constraints — follow exactly

- Only use `write_file` / `edit_file`. Do **not** run any shell/build command (no `npm`, `tsc`,
  `git`, nothing) — you have no shell tool available for this task; do not attempt `mkdir`/`npm`/
  `npx` even if something seems to require it, it does not.
- Do not create compatibility aliases for old names or old behavior. `MOCK_RESPONSES`, the
  `getMockResponse`/`simulateDelay` helpers, the `PreviewLink`/`preview` concept, and the
  `/demos/law-erp/` iframe are deleted entirely — not kept as a fallback, not commented out.
- Touch only the files listed under "Files touched" below. Where a file lists something as out of
  scope, leave it exactly as it is.
- Do not `git add`/`git commit`. Leave the changes as an uncommitted diff in the working tree.

---

## 1. New file — `src/services/copilot.service.ts`

Mirrors the existing pattern in `src/services/onboarding.service.ts` (Portuguese type names for
wire-contract data, English function names, `http` client with the shared `/api` baseURL from
`src/services/http.ts`).

**Important — path prefix.** `http`'s `baseURL` is already `/api` (see `http.ts`). The real route
is `POST /api/copilot/analisar-intimacao`, so the call here must use the path
`'/copilot/analisar-intimacao'` (no leading `/api`) — the same double-prefix mistake was made and
fixed once already in this codebase (`financeiro.service.ts`, see `docs/rd/BARRIERS.md` B29's
sibling bug in the CP1-B spec) — do not repeat it.

Write exactly this contract (it is the real, already-agreed backend response shape — do not
rename any of these fields, they are not part of the ongoing internal-code English-translation
effort, they are the live wire contract):

```ts
import { http } from './http';

export type TipoAtoIntimacao =
  | 'contestacao'
  | 'apelacao'
  | 'embargos_declaracao'
  | 'agravo_instrumento'
  | 'contrarrazoes'
  | 'replica'
  | 'desconhecido';

export type NivelConfianca = 'alta' | 'media' | 'baixa';

/** Plain-Portuguese label for each act type — the single source of truth, reused by
 * `AnalisePrazoCard` (display) and by `CopilotPage` (pre-filling `NovoPrazoModal`'s description). */
export const ROTULO_TIPO_ATO: Record<TipoAtoIntimacao, string> = {
  contestacao: 'Contestação',
  apelacao: 'Apelação',
  embargos_declaracao: 'Embargos de Declaração',
  agravo_instrumento: 'Agravo de Instrumento',
  contrarrazoes: 'Contrarrazões',
  replica: 'Réplica',
  desconhecido: 'Ato não identificado',
};

export interface AnaliseIntimacao {
  ok: true;
  numero_cnj: string | null;
  tribunal: string | null;
  vara: string | null;
  tipo_ato: TipoAtoIntimacao;
  data_intimacao: string | null;
  prazo_fatal: string | null;
  confianca: NivelConfianca;
  explicacao_contagem: string;
}

export interface AnaliseIntimacaoFalha {
  ok: false;
  motivo: 'input_suspeito' | 'texto_vazio';
}

export type ResultadoAnaliseIntimacao = AnaliseIntimacao | AnaliseIntimacaoFalha;

/**
 * Calls the real backend analyzer. Deliberately does NOT catch/swallow errors here (unlike
 * `onboarding.service.ts`'s `interpretRequest`) — a thrown error (network failure, the route not
 * being deployed yet, a 500) is a materially different situation from a resolved
 * `{ ok: false, motivo }` response, and the caller (`CopilotPage`) must show a different message
 * for each. Do not add a `USE_MOCKS` branch here — there is no honest local mock for a real legal
 * deadline computation; showing a canned response as if it were real is exactly what this
 * checkpoint exists to remove (see the file header for the ADR 0001 / X-04 context).
 */
export async function analisarIntimacao(texto: string): Promise<ResultadoAnaliseIntimacao> {
  const { data } = await http.post<ResultadoAnaliseIntimacao>('/copilot/analisar-intimacao', { texto });
  return data;
}
```

---

## 2. Edit `src/components/modais/NovoPrazoModal.tsx` — add optional pre-fill support

The modal currently only supports a *fixed* processo (`processoIdFixo`, which hides the selector
entirely — used when opened from a case's own detail page) or a fully blank form. The Copilot flow
needs a third mode: the processo selector stays visible and editable (the AI's CNJ match can be
wrong — the lawyer must be able to correct it), but every field starts pre-filled with the
analyzer's proposed values.

Add a new optional prop, `initialValues`, without changing anything about the existing
`processoIdFixo` behavior (both existing callers, `ProcessoDetailPage.tsx` and `PrazosPage.tsx`,
pass no `initialValues` and must keep working exactly as today).

**1. Update the imports** — add `useEffect` to the existing `useState` import:
```ts
import { useEffect, useState } from 'react';
```

**2. Add this interface and extend `Props`**, right above the existing `Props` interface:
```ts
export interface NovoPrazoInitialValues {
  processoId?: string;
  description?: string;
  noticeDate?: string | null;
  fatalDeadline?: string | null;
}
```
Then add one field to `Props`:
```ts
interface Props {
  open: boolean;
  onClose: () => void;
  processoIdFixo?: string;
  onCreated?: (deadline: Prazo) => void;
  initialValues?: NovoPrazoInitialValues;
}
```
And destructure it in the function signature:
```ts
export function NovoPrazoModal({ open, onClose, processoIdFixo, onCreated, initialValues }: Props) {
```

**3. Add a re-seed effect.** Place it right after the existing `useState` declarations (after
`const [saving, setSaving] = useState(false);`), before the `reset()` function. Do **not** modify
`reset()` or `handleClose()` — leave both exactly as they are today, this is purely additive:
```ts
// Re-seed every time the modal opens (it stays mounted between opens — the component instance
// is shared across multiple analyses in the Copilot flow, so a plain useState default only
// applies on first mount and would not pick up a new `initialValues` on a later open).
useEffect(() => {
  if (!open) return;
  setProcessoId(initialValues?.processoId ?? processoIdFixo ?? '');
  setDescription(initialValues?.description ?? '');
  setNoticeDate(initialValues?.noticeDate ?? '');
  setFatalDeadline(initialValues?.fatalDeadline ?? '');
  setBusinessDays('');
  setStatus('pendente');
  setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open]);
```

That is the entire change to this file. The rest of the component (validation, `handleSave`,
`createDeadline` call, JSX) is untouched — persistence still only ever happens through this same
existing `handleSave`, triggered by the lawyer clicking "Salvar" in `ModalFooter`, exactly as
today. No new caller of `createDeadline`/`http.post` is introduced anywhere by this spec.

---

## 3. New files — `src/components/copilot/AnalisePrazoCard.tsx` + `.module.scss`

A presentational component. It receives an already-successful analysis (`AnaliseIntimacao`, the
`ok: true` branch only — the caller handles `ok: false` and network-error states separately, this
component never sees those) plus the result of a CNJ→processo lookup the page already performed.

```tsx
import { Link } from 'react-router';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Pill } from '@/components/ui/Pill/Pill';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { ROTULO_TIPO_ATO, type AnaliseIntimacao, type NivelConfianca } from '@/services/copilot.service';
import { formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';
import type { Processo, Tone } from '@/types';
import styles from './AnalisePrazoCard.module.scss';

const CONFIANCA_TONE: Record<NivelConfianca, Tone> = {
  alta: 'green',
  media: 'amber',
  baixa: 'red',
};

const CONFIANCA_LABEL: Record<NivelConfianca, string> = {
  alta: 'Confiança alta',
  media: 'Confiança média',
  baixa: 'Confiança baixa',
};

interface Props {
  analise: AnaliseIntimacao;
  processoCorrespondente: Processo | null;
  verificandoProcesso: boolean;
  onRevisarECadastrar: () => void;
  onDescartar: () => void;
}

export function AnalisePrazoCard({
  analise,
  processoCorrespondente,
  verificandoProcesso,
  onRevisarECadastrar,
  onDescartar,
}: Props) {
  const precisaRevisaoManual = analise.tipo_ato === 'desconhecido' || analise.confianca === 'baixa';

  return (
    <Card className={styles.root}>
      <CardBody className={styles.body}>
        {/* CNJ + processo match row — three mutually exclusive states, see spec for rationale */}
        <div className={styles.cnjRow}>
          <span className={styles.cnjNumber}>{analise.numero_cnj ?? 'Número CNJ não identificado'}</span>
          {analise.numero_cnj && verificandoProcesso && (
            <Skeleton width="160px" height="16px" />
          )}
          {analise.numero_cnj && !verificandoProcesso && processoCorrespondente && (
            <Link to={paths.processo(processoCorrespondente.id)} className={styles.processoLink}>
              Ver processo cadastrado →
            </Link>
          )}
          {analise.numero_cnj && !verificandoProcesso && !processoCorrespondente && (
            <span className={styles.processoAusente}>
              Processo não cadastrado —{' '}
              <Link to={paths.processos} className={styles.processoLink}>
                cadastrar?
              </Link>
            </span>
          )}
        </div>

        <div className={styles.metaRow}>
          <div>
            <span className={styles.metaLabel}>Tribunal</span>
            <span className={styles.metaValue}>{analise.tribunal ?? '—'}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Vara</span>
            <span className={styles.metaValue}>{analise.vara ?? '—'}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Ato identificado</span>
            <span className={styles.metaValue}>{ROTULO_TIPO_ATO[analise.tipo_ato]}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Data da intimação</span>
            <span className={styles.metaValue}>
              {analise.data_intimacao ? formatDate(analise.data_intimacao) : '—'}
            </span>
          </div>
        </div>

        {precisaRevisaoManual && (
          <Alert
            tone="warning"
            title="Não consegui identificar o ato com segurança"
            description="Revise os dados abaixo ou informe manualmente antes de cadastrar o prazo."
          />
        )}

        <div className={styles.prazoFatalBlock}>
          <span className={styles.metaLabel}>Prazo fatal</span>
          <div className={styles.prazoFatalRow}>
            <span className={styles.prazoFatalValue}>
              {analise.prazo_fatal ? formatDate(analise.prazo_fatal) : 'Não foi possível calcular'}
            </span>
            <Pill tone={CONFIANCA_TONE[analise.confianca]}>{CONFIANCA_LABEL[analise.confianca]}</Pill>
          </div>
        </div>

        <div className={styles.explicacaoBlock}>
          <span className={styles.metaLabel}>Como o prazo foi contado</span>
          <p className={styles.explicacaoTexto}>{analise.explicacao_contagem}</p>
        </div>

        <p className={styles.disclaimer}>A Axion propõe. O prazo só é registrado quando você confirmar.</p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={onRevisarECadastrar}>
            Revisar e cadastrar prazo
          </Button>
          <Button variant="ghost" onClick={onDescartar}>
            Descartar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
```

For `AnalisePrazoCard.module.scss`: style `.cnjRow` (flex row, gap, `.cnjNumber` monospace-ish and
bold), `.processoLink` (accent color, matches the `.previewLink` hover pattern already used
elsewhere in this codebase — `color: var(--color-accent)`, hover `var(--color-accent-hover)`),
`.processoAusente` (`color: var(--color-muted)`), `.metaRow` (a responsive grid, e.g.
`grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`, `gap: var(--space-4)`),
`.metaLabel` (small uppercase muted label, `font-size: 11px`, `color: var(--color-muted)`),
`.metaValue` (`color: var(--color-text)`, `font-weight: 600`), `.prazoFatalBlock` (visually the
most prominent block on the card — larger padding, a subtle background using
`var(--color-surface-2)`, rounded via `var(--radius-md)`), `.prazoFatalValue` (large, bold,
`font-size: 20px`), `.explicacaoBlock`/`.explicacaoTexto` (the counting explanation shown
**verbatim** — do not truncate or ellipsis it; `white-space: pre-wrap` in case the backend sends
line breaks; a slightly distinct background/border from the rest of the card so it reads as "the
math", e.g. `border-left: 3px solid var(--color-accent)`, `padding-left: 12px`), `.disclaimer`
(small, muted, centered or left-aligned, same visual weight as the old page's
`.disclaimer` class), `.actions` (flex row, gap, `justify-content: flex-start`). Use the existing
design tokens already used throughout this codebase (`var(--color-*)`, `var(--space-*)`,
`var(--radius-*)`) — do not invent new hex colors.

---

## 4. Rewrite `src/pages/copilot/CopilotPage.tsx`

Delete the entire current contents (the `PreviewLink`/`Message`/`LocationState` interfaces,
`MockResponse`/`MOCK_RESPONSES`/`DEFAULT_RESPONSE`/`getMockResponse`/`simulateDelay`, and the whole
chat-bubble JSX including the `<iframe src={msg.preview.url}>` block) and replace with a paste-and-
analyze form. There is no `firstMessage`/chat-continuation entry point left anywhere in the app
that navigates here with `location.state` (confirmed: `paths.copilot` has exactly one reference in
the whole `src/` tree outside this file, the plain route registration in `src/routes/router.tsx`)
— so the `useLocation`/`LocationState`/`initialized` machinery is also dead and must be deleted,
not preserved.

### State and behavior

```tsx
import { useMemo, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { TextArea } from '@/components/ui/TextField/TextField';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AnalisePrazoCard } from '@/components/copilot/AnalisePrazoCard';
import { NovoPrazoModal, type NovoPrazoInitialValues } from '@/components/modais/NovoPrazoModal';
import { analisarIntimacao, ROTULO_TIPO_ATO, type ResultadoAnaliseIntimacao } from '@/services/copilot.service';
import { listCases } from '@/services/processos.service';
import type { Processo } from '@/types';
import styles from './CopilotPage.module.scss';
```

State needed: `texto` (textarea value), `loading`, `resultado: ResultadoAnaliseIntimacao | null`,
`erroRede: boolean`, `processoCorrespondente: Processo | null`, `verificandoProcesso: boolean`,
`modalAberto: boolean`.

**Submit handler** (`handleAnalisar`), triggered only by a button click — **not** by pressing
Enter in the textarea (this text is often long and multi-line; unlike the old chat, Enter must
just insert a newline, do not attach any `onKeyDown` submit shortcut):
1. Guard: if `!texto.trim() || loading`, return.
2. `setLoading(true)`, `setErroRede(false)`, `setResultado(null)`, `setProcessoCorrespondente(null)`.
3. `try`: call `await analisarIntimacao(texto.trim())`, store it via `setResultado(data)`.
   - If `data.ok && data.numero_cnj`: look up a matching processo. Wrap this in its **own**
     try/catch so a failure here never blows up the whole analysis result — a processo lookup
     failing is a minor degradation (the card still renders, just without the "ver processo
     cadastrado" link), not a fatal error:
     ```ts
     setVerificandoProcesso(true);
     try {
       const cases = await listCases();
       const match = cases.find((c) => c.numero_cnj === data.numero_cnj);
       setProcessoCorrespondente(match ?? null);
     } catch {
       setProcessoCorrespondente(null);
     } finally {
       setVerificandoProcesso(false);
     }
     ```
4. `catch`: `setErroRede(true)` — this branch is for a *thrown* error (network failure, the route
   not being deployed, a 500), which must render a visibly different message than a resolved
   `{ ok: false, motivo }` response (rendered from `resultado` itself, not this flag).
5. `finally`: `setLoading(false)`.

**`handleDescartar`**: clears `texto`, `resultado`, `processoCorrespondente`, `erroRede` back to
their empty/initial values. Does **not** call any service function — it only ever resets local
component state. This is the negative-path action: nothing was ever sent to `createDeadline`
before this point, so there is nothing to undo.

**`initialValuesParaModal`** — computed with `useMemo`, only meaningful when
`resultado?.ok === true`:
```ts
const initialValuesParaModal = useMemo((): NovoPrazoInitialValues | undefined => {
  if (!resultado || !resultado.ok) return undefined;
  return {
    processoId: processoCorrespondente?.id,
    description: ROTULO_TIPO_ATO[resultado.tipo_ato],
    noticeDate: resultado.data_intimacao?.slice(0, 10) ?? null,
    fatalDeadline: resultado.prazo_fatal?.slice(0, 10) ?? null,
  };
}, [resultado, processoCorrespondente]);
```
(The defensive `.slice(0, 10)` guards against the backend ever sending a full ISO timestamp instead
of a bare `"YYYY-MM-DD"` date — `NovoPrazoModal`'s `<input type="date">` fields require the bare
form. `resultado.data_intimacao`/`prazo_fatal` are typed `string | null`, so use optional chaining
before `.slice`.)

**`handleModalCreated`** — passed as `NovoPrazoModal`'s `onCreated`. `NovoPrazoModal` already shows
its own success toast (`toast.show('Prazo cadastrado com sucesso!')` inside `handleSave`) — do
**not** show a second toast here. Just call the same reset as `handleDescartar` (the analysis is
now cadastrado, so return the page to a blank compose state ready for the next intimação).

**Opening the modal**: a small handler, e.g. `() => setModalAberto(true)`, passed as
`AnalisePrazoCard`'s `onRevisarECadastrar`. This must be the *only* thing that button does — it
never itself calls `createDeadline` or any persistence function. Persistence happens exclusively
inside `NovoPrazoModal`'s existing `handleSave`, when the lawyer clicks the modal's own confirm
button after reviewing/editing the pre-filled values.

### Render

- `<PageHead title="Copiloto de Prazos" subtitle="Cole o texto de uma intimação para identificar o prazo fatal, com a contagem explicada." />`
- A `Card`/`CardBody` containing:
  - `<TextArea>` bound to `texto`, a reasonable number of visible rows (e.g. `rows={10}`),
    placeholder: `"Cole aqui o texto da intimação recebida (diário oficial, PJe, e-mail do cartório...)."`
  - A submit `<Button variant="primary" onClick={handleAnalisar} disabled={!texto.trim() || loading}>`,
    label `"Analisando…"` while `loading`, `"Analisar intimação"` otherwise.
- Below the form, one of these mutually-exclusive blocks:
  - **While `loading`**: an honest loading state — do not reintroduce timed/staged fake status
    text like the old `steps` array (that pattern is exactly what made the previous page
    dishonest). A few `Skeleton` lines shaped like the eventual card fields (CNJ row, meta row,
    prazo fatal row) tied to the real in-flight request is enough; there is no multi-phase backend
    signal to reflect (this is a single `POST`, not a streaming endpoint).
  - **Else if `erroRede`**: `<Alert tone="danger" title="Não foi possível analisar agora" description="Falha ao conectar com o serviço de análise. Tente novamente." action={<Button variant="default" onClick={handleAnalisar}>Tentar novamente</Button>} />`
  - **Else if `resultado?.ok === false && resultado.motivo === 'texto_vazio'`**:
    `<Alert tone="warning" title="Texto vazio" description="Cole o texto da intimação antes de analisar." />`
  - **Else if `resultado?.ok === false && resultado.motivo === 'input_suspeito'`**:
    `<Alert tone="warning" title="Não foi possível identificar uma intimação válida" description="O texto colado não parece ser uma intimação processual. Revise o conteúdo e tente novamente." />`
  - **Else if `resultado?.ok === true`**: `<AnalisePrazoCard analise={resultado} processoCorrespondente={processoCorrespondente} verificandoProcesso={verificandoProcesso} onRevisarECadastrar={() => setModalAberto(true)} onDescartar={handleDescartar} />`
- `<NovoPrazoModal open={modalAberto} onClose={() => setModalAberto(false)} initialValues={initialValuesParaModal} onCreated={handleModalCreated} />` — always rendered (not conditionally mounted), so the re-seed `useEffect` added in step 2 fires correctly on every open. Deliberately do **not** pass `processoIdFixo` here — the processo selector must stay visible and editable, only pre-selected, because the AI's CNJ match can be wrong and the lawyer must be able to correct it.

### `CopilotPage.module.scss`

Delete the entire current stylesheet (chat bubbles, `.preview`/`.previewFrame` iframe scaling,
`.bubbleTyping` animation — none of it applies to a form-based page). Replace with a small, page-
level stylesheet: a `.container` with `display: flex; flex-direction: column; gap: var(--space-4);`
(same as today), a `max-width` around 720–780px so the form/card don't stretch full-width on large
screens, and whatever minimal rules the textarea/button layout inside the `Card` needs beyond what
`TextField`/`Button`/`Card` already provide by themselves. Do not duplicate styling that the shared
`Card`/`Button`/`TextArea`/`Alert` components already apply.

---

## Files touched (nothing else)

- `src/services/copilot.service.ts` — new.
- `src/components/copilot/AnalisePrazoCard.tsx` — new.
- `src/components/copilot/AnalisePrazoCard.module.scss` — new.
- `src/components/modais/NovoPrazoModal.tsx` — additive edit only (new prop + one new effect;
  `reset()`/`handleClose()`/`handleSave()`/validation/JSX unchanged).
- `src/pages/copilot/CopilotPage.tsx` — full rewrite.
- `src/pages/copilot/CopilotPage.module.scss` — full rewrite.

## Self-check before finishing (you have no shell — check by reading your own diff)

- Zero remaining occurrences anywhere of: `MOCK_RESPONSES`, `getMockResponse`, `simulateDelay`,
  `/demos/law-erp`, `PreviewLink`.
- Every place that renders `analise.data_intimacao`, `analise.prazo_fatal`, `analise.numero_cnj`,
  `analise.tribunal`, `analise.vara` guards the `null` case (these are all `string | null` in the
  real contract) — no raw interpolation that would print the literal text `"null"`.
- `createDeadline` (from `src/services/prazos.service.ts`) is imported and called in exactly one
  place in the whole diff: inside `NovoPrazoModal.tsx`'s existing `handleSave`. It must not appear
  in `CopilotPage.tsx` or `AnalisePrazoCard.tsx` at all.
- The low-confidence Alert (`tipo_ato === 'desconhecido' || confianca === 'baixa'`) renders
  alongside the rest of the card's real fields — it must never hide or replace fields that *are*
  present, it only adds a warning on top.
