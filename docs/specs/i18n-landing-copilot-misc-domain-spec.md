# Translation PT→EN — Landing/Copilot/Misc domain

Read `docs/specs/pt-en-translation-rules.md` first (general rules + vocabulary) and follow
everything there. This spec only lists the scope specific to this domain.

## Files (only these)

- `src/pages/landing/LandingPage.tsx`
- `src/components/landing/LandingNav.tsx`
- `src/components/landing/EarlyAccessForm.tsx`
- `src/components/landing/InterviewPanel.tsx`
- `src/pages/copilot/CopilotPage.tsx`
- `src/pages/placeholder/PlaceholderPage.tsx`

`src/components/landing/Reveal.tsx` already has fully English identifiers — skip it, no changes
needed.

## Very important — this is marketing copy, not app data

Every file below defines local arrays/objects of landing-page or chat copy. The **string values**
(headlines, body text, labels, button text, chat replies) are real user-facing Portuguese content
— never translate or reword the string values themselves. What you ARE translating is the object
**keys**/field names used to hold that content (e.g. `titulo` → `title`), since those are just
internal identifiers, never serialized or sent over the network — this is the "local
interface/const representing client-only computed or static data" exception from the rules file.

## LandingPage.tsx

Rename these local consts and their field names (update every place that reads them in this same
file):
- `CAMINHOS` → `PATHS`, fields `rotulo` → `label`, `titulo` → `title`, `texto` → `text`, `tom` →
  `tone` (keep the literal union values `'problema'`/`'axion'` as-is — they're internal enum
  values, not rendered).
- `PASSOS` → `STEPS`, fields `numero` → `number`, `titulo` → `title`, `texto` → `text`.
- `MODULOS` → `MODULES`, fields `Icone` → `Icon`, `titulo` → `title`, `texto` → `text`.
- `VERTICAIS` → `VERTICALS`, fields `nome` → `name`, `estado` → `status`, `ativo` → `active`,
  `texto` → `text`.

Rename local variables inside the `useEffect` (scroll-behavior effect): `raiz` → `root`, `anterior`
→ `previous`. Translate the two comments above that `useEffect` and the `{/* ... */}` JSX section
comments (Hero, Posicionamento, Como funciona, Vertical jurídica, Verticais / roadmap, CTA) into
English. Leave every rendered string (headings, body copy, button labels, footer) in Portuguese —
unchanged, letter for letter.

## LandingNav.tsx

Rename `menuAberto`/`setMenuAberto` → `menuOpen`/`setMenuOpen` (update every use, including the
`aria-expanded`/`aria-controls`/`onClick` references). Rename `anterior` (in the body-scroll-lock
effect) → `previous`. Translate the two comments (`// Só lê scrollY...`, `// Trava o scroll do
fundo...`). Leave rendered strings (`Entrar`, `Acesso antecipado`, aria-labels) in Portuguese.

## EarlyAccessForm.tsx

Rename local state: `nome`/`setNome` → `name`/`setName`, `erro`/`setErro` → `error`/`setError`,
`enviado`/`setEnviado` → `submitted`/`setSubmitted`. `email`/`vertical` are already English.
Rename `VERTICAIS` → `SEGMENTS` (its `value`/`label` fields are already English). Rename local
variables inside `handleSubmit`: `assunto` → `subject`, `corpo` → `body`. Translate the two
comments (the `EMAIL_RE` one and the JSDoc block above the component). Leave every rendered
string (labels, placeholders, error messages, button text) in Portuguese, and leave the mailto
subject/body content strings themselves in Portuguese (they're the actual email sent).

## InterviewPanel.tsx

Rename `TROCA` → `EXCHANGE`, its fields `de` → `from`, `texto` → `text` (keep the literal values
`'axion'`/`'usuario'` used for `de`/`from` as internal tags, but you may translate the tag
`'usuario'` → `'user'` since it is never rendered directly — it's only compared against in
`msg.de === 'axion'`, update that comparison too if you rename the tag). Rename `CONFIG` →
`APPLIED_CONFIG` (avoid clashing with any other `CONFIG` import — verify there is no name
collision in this file first), its fields `modulo` → `module`, `detalhe` → `detail`. Translate the
JSDoc comment at the top. Leave rendered strings in Portuguese.

## CopilotPage.tsx

Identifiers here are already English (`Message`, `PreviewLink`, `MockResponse`, `sendMessage`,
`handleKeyDown`, `handleTextareaChange`, etc.) — no renames needed. Just translate the remaining
Portuguese comments: `// ── Mock responses ──`, `// ── Demo: geração de ERP sob demanda ──`, `//
Tempo inicial de pensamento antes de qualquer coisa aparecer`, `// Se houver etapas de construção
(ex: geração de ERP), mostra cada uma / // como uma mensagem curta antes da resposta final.`.
Leave every string inside `MOCK_RESPONSES`/`DEFAULT_RESPONSE` (keywords and response text) in
Portuguese — that is real chat copy, including the keyword-matching strings which must keep their
Portuguese words to keep matching real user input.

## PlaceholderPage.tsx

Rename the local `ModuloConfig` interface → `ModuleConfig` (this is local static UI-config data,
never serialized — safe to rename in full), with fields `titulo` → `title`, `subtitulo` →
`subtitle`, `descricao` → `description`, `funcionalidades` → `features` (keep `icon`/`tag` as
they already are). Rename `MODULOS_CONFIG` → `MODULES_CONFIG`. Rename local variables/props:
`moduloOverride` (prop) → `moduleOverride` (also update `PlaceholderPageProps`), `moduloKey` →
`moduleKey`, `empresaAtiva` → `activeTenant` (this one is a local `db.tenants.find(...)` result,
not from `useAuth()` — safe to rename). Leave `empresaAtivaId` from `useAuth()` untouched (see the
AuthContext exception in `docs/specs/i18n-config-tenant-layout-domain-spec.md` — same rule applies
here: `AuthContext.tsx` is out of scope for every domain until all its consumers are translated).
Leave every rendered string (module titles, descriptions, feature bullets) in Portuguese.
