# CP3-A (frontend, parte 2/2) — troca 4 "botões decorativos" por comportamento real

Parte do checkpoint CP3-A (varredura de honestidade — achados médios/baixos de
`docs/rd/audits/2026-09-02-frota-agy/02-wiring-morto.md` que os checkpoints anteriores não
tocaram). Quatro pedaços independentes entre si (podem ser implementados em qualquer ordem), cada
um trocando um elemento de UI que hoje só finge fazer algo (toast falso, link morto, `mailto:`)
por um comportamento real. Regra do repositório: **nenhum texto visível ao usuário final muda de
idioma** — toda string de UI nova continua em português, no mesmo tom do resto do arquivo. **Só
escreva/edite os arquivos listados abaixo, só com `write_file`/`edit_file` — sem rodar nenhum
comando de shell** (sem `npm`, sem `tsc`, sem `git`). Não faça `git commit`. Não deixe nenhum
alias de compatibilidade. Não invente/fabrique nenhum dado — toda contagem/lista vem de dado real
já carregado ou de uma chamada real nova, nunca um valor de exemplo hardcoded.

---

## 1. `src/pages/clientes/ClientesPage.tsx` — botão "Exportar" é só um toast falso

Hoje (linha ~42):
```tsx
<Button onClick={() => toast.show('Relatório de parceiros exportado!')}>Exportar</Button>
```
Isso não gera arquivo nenhum. A lista `clients` (já carregada e já filtrada pela busca, via
`useClientes`) tem tudo que precisa pra virar um CSV real, baixado de verdade pelo navegador — sem
depender de nenhuma rota de backend nova.

**1a.** Crie um utilitário novo, genérico, em `src/utils/csv.ts` (arquivo novo):
```tsx
/** Escapes a single CSV field: wraps in quotes and doubles internal quotes when the value
 * contains a comma, quote, or newline. */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Builds a CSV string from headers + rows and triggers a real browser download (Blob + object
 * URL). No backend call — the data is whatever the caller already has loaded.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers, ...rows].map((line) =>
    line.map((cell) => escapeCsvField(String(cell))).join(','),
  );
  // BOM (﻿) so Excel opens UTF-8 accented characters correctly.
  const csvContent = '﻿' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

**1b.** Em `ClientesPage.tsx`, importe `downloadCsv` de `@/utils/csv` e
`situacaoCreditoMeta` de `@/utils/statusMaps` (mesmo mapa de labels já usado por
`src/components/clientes/clientesColumns.tsx` pra mostrar a situação de crédito com o texto
certo) e `formatBRL` de `@/utils/format`. Substitua o `onClick` do botão "Exportar" por uma
função:
```tsx
function handleExport() {
  const rows = (clients ?? []).map((client) => [
    client.razaoSocialOuNome,
    client.nomeFantasia ?? '',
    client.tipoPessoa,
    client.documento,
    client.email,
    client.telefone,
    situacaoCreditoMeta[client.situacaoCredito]?.label ?? client.situacaoCredito,
    formatBRL(client.valorEmAtrasoCentavos),
  ]);
  downloadCsv('clientes-axion.csv', [
    'Razão Social / Nome',
    'Nome Fantasia',
    'Tipo',
    'Documento',
    'E-mail',
    'Telefone',
    'Situação de Crédito',
    'Valor em Atraso (R$)',
  ], rows);
  toast.show(`${(clients ?? []).length} parceiro(s) exportado(s) em CSV.`);
}
```
E troque `<Button onClick={() => toast.show('Relatório de parceiros exportado!')}>Exportar</Button>`
por `<Button onClick={handleExport}>Exportar</Button>`. Se a lista `clients` estiver vazia
(`(clients ?? []).length === 0`), ainda assim gere o CSV só com o cabeçalho (não precisa de
tratamento especial) — o toast já vai dizer "0 parceiro(s) exportado(s)", o que é honesto.

---

## 2. `src/components/layout/Topbar/Topbar.tsx` — campo de busca não busca nada

Hoje, `handleSearch` só mostra um toast com o termo digitado (linha ~143-148). Troque por uma
busca real, client-side, contra três fontes já existentes no sistema: clientes, processos e
prazos. Use os serviços já existentes (todos já sabem alternar mock/real sozinhos, não precisa
checar `USE_MOCKS` aqui): `listClients` de `@/services/clientes.service`, `listCases` de
`@/services/processos.service`, `listDeadlines` de `@/services/prazos.service`. Importe também
`useNavigate` de `react-router` e `paths` de `@/routes/paths`.

**2a.** Tipo de resultado e função de busca (adicione dentro do componente, ou como helper
acima dele no mesmo arquivo):
```tsx
interface SearchResult {
  id: string;
  type: 'cliente' | 'processo' | 'prazo';
  label: string;
  sublabel: string;
  path: string;
}
```

**2b.** Estado novo no componente:
```tsx
const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
const [searching, setSearching] = useState(false);
const navigate = useNavigate();
```

**2c.** Troque `handleSearch` por uma busca assíncrona real, disparada no submit do form (Enter ou
clique na lupa) — mantenha o form/input existentes, só troque o que acontece no submit:
```tsx
async function handleSearch(event: FormEvent) {
  event.preventDefault();
  const term = search.trim().toLowerCase();
  if (!term) {
    setSearchResults(null);
    return;
  }
  setSearching(true);
  try {
    const [clients, cases, deadlines] = await Promise.all([
      listClients().catch(() => []),
      listCases().catch(() => []),
      listDeadlines().catch(() => []),
    ]);

    const clientMatches: SearchResult[] = clients
      .filter((c) =>
        c.razaoSocialOuNome.toLowerCase().includes(term) ||
        (c.nomeFantasia ?? '').toLowerCase().includes(term) ||
        c.documento.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term),
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        type: 'cliente' as const,
        label: c.nomeFantasia || c.razaoSocialOuNome,
        sublabel: c.documento,
        path: paths.cliente(c.id),
      }));

    const caseMatches: SearchResult[] = cases
      .filter((p) =>
        p.numero_cnj.toLowerCase().includes(term) ||
        p.tribunal.toLowerCase().includes(term) ||
        p.partes.some((parte) => parte.nome.toLowerCase().includes(term)),
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: 'processo' as const,
        label: p.numero_cnj,
        sublabel: p.tribunal,
        path: paths.processo(p.id),
      }));

    const deadlineMatches: SearchResult[] = deadlines
      .filter((d) => d.descricao.toLowerCase().includes(term))
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        type: 'prazo' as const,
        label: d.descricao,
        sublabel: `Prazo fatal: ${d.prazo_fatal}`,
        path: paths.processoTab(d.processo_id, 'prazos'),
      }));

    setSearchResults([...clientMatches, ...caseMatches, ...deadlineMatches].slice(0, 10));
  } finally {
    setSearching(false);
  }
}

function handleSelectResult(result: SearchResult) {
  setSearchResults(null);
  setSearch('');
  navigate(result.path);
}
```

**2d.** JSX — depois do `<form className={styles.searchForm}>...</form>` existente, adicione um
dropdown de resultados, seguindo exatamente o mesmo padrão visual/estrutural já usado pelo
dropdown de notificações mais abaixo no mesmo arquivo (`{notifOpen && (<div
className={styles.notifDropdown}>...)}`, com header/lista/item/estado vazio) — copie essa
estrutura pro resultado da busca, com classes novas equivalentes (`styles.searchDropdown`,
`styles.searchDropdownList`, `styles.searchDropdownItem`, `styles.searchDropdownEmpty`) ao invés
de reusar as classes de notificação (são dropdowns diferentes, em lugares diferentes da barra).
Algo neste formato:
```tsx
{searchResults !== null && (
  <div className={styles.searchDropdown}>
    {searching ? (
      <div className={styles.searchDropdownEmpty}>Buscando...</div>
    ) : searchResults.length === 0 ? (
      <div className={styles.searchDropdownEmpty}>Nenhum resultado encontrado.</div>
    ) : (
      <ul className={styles.searchDropdownList}>
        {searchResults.map((result) => (
          <li key={`${result.type}-${result.id}`}>
            <button
              type="button"
              className={styles.searchDropdownItem}
              onClick={() => handleSelectResult(result)}
            >
              <span className={styles.searchDropdownLabel}>{result.label}</span>
              <span className={styles.searchDropdownSub}>{result.sublabel}</span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
```
Isso deve ficar dentro do mesmo elemento posicionado (`position: relative`) que envolve o
`<form className={styles.searchForm}>`, pra que o dropdown apareça logo abaixo do campo de busca
— confira no CSS module (`Topbar.module.scss`) se `.searchForm` já tem `position: relative`; se
não tiver, adicione, e adicione as classes novas (`.searchDropdown`, `.searchDropdownList`,
`.searchDropdownItem`, `.searchDropdownLabel`, `.searchDropdownSub`, `.searchDropdownEmpty`)
espelhando as propriedades visuais (fundo, borda, sombra, `position: absolute`, `z-index`,
`border-radius`) já usadas pelo bloco `.notifDropdown` mais abaixo no mesmo arquivo `.scss` — não
precisa ser pixel-perfect idêntico, só consistente com o resto do Topbar.

**2e.** Feche o dropdown ao clicar fora — mesmo padrão que este componente já não tem hoje pros
outros dois dropdowns (notificação/usuário fecham só por re-clique no próprio botão, não por
clique-fora); **não precisa implementar clique-fora aqui** — deixe consistente com o padrão já
existente no arquivo (fechar só ao selecionar um resultado, ou ao apagar o texto de busca).

---

## 3. `src/pages/login/LoginPage.tsx` — "Esqueci minha senha" é um link morto (`href="#"`)

Hoje (linha ~139-141):
```tsx
<a href="#" className={styles.forgot}>
  Esqueci minha senha.
</a>
```
Não existe nenhum fluxo de recuperação de senha neste produto (confirmado: nenhuma rota de
reset/esqueci-senha existe no backend, `apps/api`). Um pouco abaixo, no mesmo arquivo, já existe
um bloco de suporte real:
```tsx
<div className={styles.support}>
  <p>Precisa de ajuda para acessar? Fale com o suporte.</p>
  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
</div>
```
(`SUPPORT_EMAIL` já vem importado de `@/config/app` no topo do arquivo, confirme e reaproveite —
não crie um import novo se já existir). Troque o link morto por um texto honesto, sem link (não é
uma ação clicável nenhuma, é só uma frase de orientação), no mesmo lugar/mesmo estilo visual
(reaproveite a classe `styles.forgot`, só troque a tag de `<a>` pra `<p>` já que não é mais um
link):
```tsx
<p className={styles.forgot}>
  Esqueceu a senha? Fale com o administrador do seu escritório ou escreva para{' '}
  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
</p>
```
Não mude mais nada neste arquivo.

---

## 4. `src/components/landing/EarlyAccessForm.tsx` — só abre `mailto:`, sem persistir nada

Existe uma rota nova no backend pra isso agora, `POST /api/early-access`, aceitando
`{ name: string, email: string, vertical: 'advocacia'|'varejo'|'agro'|'outro' }` e devolvendo
`{ id: string }` no sucesso (`201`). Foi implementada por um spec paralelo no repo `apps/api`
(worktree separada) — assuma que ela já existe no backend real (não precisa criar nada no
backend, isso não é parte deste spec).

**4a.** Crie um serviço novo, `src/services/early-access.service.ts`, seguindo exatamente o
mesmo padrão de `src/services/plan-requests.service.ts` (mock retorna sem chamar rede; modo real
chama `http.post`):
```tsx
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface EarlyAccessInput {
  name: string;
  email: string;
  vertical: string;
}

/**
 * Persists an early-access lead from the landing page. Real POST first — the caller falls back
 * to `mailto:` only if this call fails (network/server down), never as the primary path.
 */
export async function submitEarlyAccess(input: EarlyAccessInput): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    return;
  }
  await http.post('/early-access', input);
}
```

**4b.** Em `EarlyAccessForm.tsx`, importe `submitEarlyAccess` de `@/services/early-access.service`.
Adicione um estado novo `submitting` (`useState(false)`) e um estado `usedFallback`
(`useState(false)`) pra saber, na tela de sucesso, se foi captura real ou fallback por e-mail.
Troque `handleSubmit` (hoje síncrono) por uma versão `async` que tenta o POST real primeiro:

```tsx
async function handleSubmit(event: FormEvent) {
  event.preventDefault();

  if (name.trim().length < 2) {
    setError('Diga como podemos te chamar.');
    return;
  }
  if (!EMAIL_RE.test(email.trim())) {
    setError('Confira o e-mail — parece incompleto.');
    return;
  }

  setError(null);
  setSubmitting(true);
  try {
    await submitEarlyAccess({ name: name.trim(), email: email.trim(), vertical });
    setSubmitted(true);
  } catch {
    // Real capture failed (network/server fora do ar) — cai pro mailto: como plano B, pra não
    // perder o lead por completo.
    const label = SEGMENTS.find((v) => v.value === vertical)?.label ?? vertical;
    const subject = `Acesso antecipado — ${label}`;
    const body = [
      `Nome: ${name.trim()}`,
      `E-mail: ${email.trim()}`,
      `Segmento: ${label}`,
      '',
      'Conte em uma linha como o time trabalha hoje:',
    ].join('\n');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setUsedFallback(true);
    setSubmitted(true);
  } finally {
    setSubmitting(false);
  }
}
```

Remova o comentário de aviso no topo do arquivo (`WARNING: endpoint does not exist yet...`) — não
é mais verdade, atualize pra descrever o comportamento real (POST real primeiro, `mailto:` só
como fallback de falha).

**4c.** Ajuste a tela de sucesso (`if (submitted) { ... }`) pra distinguir os dois casos — texto
honesto em cada um:
```tsx
if (submitted) {
  return (
    <div className={styles.sucesso} role="status">
      {usedFallback ? (
        <>
          <p className={styles.sucessoTitulo}>Abrimos seu e-mail com a mensagem pronta.</p>
          <p className={styles.sucessoTexto}>
            Se nada abriu, escreva direto para{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
              {SUPPORT_EMAIL}
            </a>
            . Respondemos em até um dia útil.
          </p>
        </>
      ) : (
        <>
          <p className={styles.sucessoTitulo}>Recebemos seu interesse!</p>
          <p className={styles.sucessoTexto}>
            Entraremos em contato pelo e-mail informado. Respondemos em até um dia útil.
          </p>
        </>
      )}
    </div>
  );
}
```

**4d.** Desabilite o botão de submit enquanto `submitting` for `true` (mesmo padrão de
`disabled={loading}` já usado em `UpgradeConfirm.tsx`), e troque o texto do botão pra
"Enviando..." nesse estado — reaproveite o texto/estilo já existente do botão (`Entrar na
lista`), só adicione a condição.

---

## Fora de escopo (não toque)

- Não crie nenhum backend pro `/fiscal` (isso está fora do escopo deste checkpoint por completo —
  o módulo continua sem funcionalidade real, só sai da navegação; ver
  `docs/rd/audits/2026-09-02-frota-agy/02-wiring-morto.md` achado #1 e o spec do backend paralelo
  `cp3a-honesty-sweep-backend-spec.md`, no repo `apps/api`).
- Não mude `src/services/plan-requests.service.ts` nem `UpgradeConfirm.tsx` — já corrigidos.
- Não toque em `src/pages/financeiro/FinanceiroPage.tsx`, `NovaCobrancaModal.tsx`,
  `NovoClienteModal.tsx`, `Sidebar.tsx`, `PlaceholderPage.tsx`, `contasReceberColumns.tsx` — outro
  spec (`cp3a-honesty-sweep-mocks-spec.md`), rodando em paralelo numa worktree diferente.

## Ao terminar

Não rode `npm run build`/`tsc`/lint, não faça `git add`/`commit`/`push`. Apenas deixe as mudanças
como diff não commitado nos arquivos acima.
