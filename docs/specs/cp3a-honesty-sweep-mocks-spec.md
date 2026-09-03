# CP3-A (frontend, parte 1/2) — mata as últimas leituras diretas de `@/mocks` alcançáveis com
# tenant real autenticado

Parte do checkpoint CP3-A (varredura de honestidade — achados médios/baixos de
`docs/rd/audits/2026-09-02-frota-agy/02-wiring-morto.md` que os checkpoints anteriores (CP1/CP2)
não tocaram: `Topbar.tsx`, `dashboard.service.ts` e `PlanosPage.tsx`/`UpgradeConfirm.tsx` já foram
corrigidos, não mexa neles). Cinco arquivos ainda importam `db` de `@/mocks` e o leem de forma
**incondicional**, mesmo quando `USE_MOCKS` é `false` (tenant real, backend real) — isso faz a UI
mostrar dado de mock (nomes de empresa fictícios, "clientes" que não existem no tenant real) em
cima de uma sessão real. Regra do repositório: **nenhum texto visível ao usuário final muda de
idioma** — toda string de UI continua em português. **Só escreva/edite os arquivos listados
abaixo, só com `write_file`/`edit_file` — sem rodar nenhum comando de shell** (sem `npm`, sem
`tsc`, sem `git`). Não faça `git commit`. Não deixe nenhum alias de compatibilidade (nome antigo
reexportado "por segurança"). Não invente/fabrique nenhum dado novo — quando não houver dado real
disponível, mostre estado vazio/`'—'`, nunca um valor de exemplo.

`USE_MOCKS` vem de `import { USE_MOCKS } from '@/services/mockAdapter'`, já usado desta forma em
vários arquivos do repo (`Topbar.tsx`, `PlanosPage.tsx`) — copie o mesmo padrão de gate.

---

## 1. `src/components/layout/Sidebar/Sidebar.tsx`

Hoje (linha ~59-62):
```tsx
const activeCompany = useMemo(() => {
  if (!empresaAtivaId) return null;
  return db.tenants.find((t) => t.id === empresaAtivaId);
}, [empresaAtivaId]);
```
Isso só serve pra alimentar o fallback de `companyName` mais abaixo. Troque pra só resolver via
mock quando `USE_MOCKS` for `true`:
```tsx
const activeCompany = useMemo(() => {
  if (!USE_MOCKS || !empresaAtivaId) return null;
  return db.tenants.find((t) => t.id === empresaAtivaId);
}, [empresaAtivaId]);
```
Adicione o import `import { USE_MOCKS } from '@/services/mockAdapter';` junto dos outros imports
do arquivo. Não mude mais nada nesse arquivo — o resto do cálculo de `companyName` (linha ~84-89)
já tem fallback certo (`tenantBranding?.nomeExibicao || activeCompany?.... || usuario?.... ||
'Empresa Ativa'`) e continua funcionando igual, só que agora sem nunca tocar o mock em modo real.

## 2. `src/pages/placeholder/PlaceholderPage.tsx`

Hoje (linha ~134):
```tsx
const activeTenant = db.tenants.find((t) => t.id === empresaAtivaId);
```
Essa página é o placeholder genérico usado hoje só pela rota `/fiscal`. O bloco JSX logo abaixo
(`{activeTenant && (...)}`, mostra nome+CNPJ da empresa ativa) já está condicionado corretamente a
`activeTenant` truthy — só a origem do dado está errada. Troque pra:
```tsx
const activeTenant = USE_MOCKS ? db.tenants.find((t) => t.id === empresaAtivaId) : null;
```
Adicione o import `import { USE_MOCKS } from '@/services/mockAdapter';`. Não mude mais nada nesse
arquivo (não mexa em `MODULES_CONFIG` nem no resto do componente).

## 3. `src/components/modais/NovoClienteModal.tsx`

Hoje (linha ~49):
```tsx
const created = await createClient({
  tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast', // sempre o PRIMEIRO tenant do mock, nunca o ativo
  ...
```
Isso ignora qual empresa está realmente ativa na sessão (`empresaAtivaId` do `useAuth()`) — em
modo mock, criar um cliente enquanto a Empresa B está ativa grava ele incorretamente na Empresa A
(o primeiro tenant do array). Em modo real esse campo nem é usado (`createClient()`, em
`src/services/clientes.service.ts`, já não manda `tenantId` nenhum no payload HTTP real — o
backend deriva o tenant do token JWT), mas o tipo `Pessoa` exige o campo mesmo assim.

Troque a fonte do tenant pra vir do contexto de auth, que já é lido neste componente hoje? Não —
adicione a leitura: importe `useAuth` de `@/contexts/AuthContext` e pegue `empresaAtivaId` dele
(`const { empresaAtivaId } = useAuth();` dentro do componente). Troque a linha do payload para:
```tsx
tenantId: empresaAtivaId,
```
Remova o `import { db } from '@/mocks';` deste arquivo — depois dessa troca, nada mais aqui usa
`db`. Não mude mais nada no arquivo (o resto do formulário/validação já está certo).

## 4. `src/components/modais/NovaCobrancaModal.tsx`

Dois problemas independentes neste arquivo, os dois envolvendo `@/mocks`:

**4a. `tenantId` hardcoded** (linha ~67), mesmo problema e mesma correção do item 3 acima:
```tsx
tenantId: db.tenants[0]?.id ?? 'tenant-ind-plast',
```
vira
```tsx
tenantId: empresaAtivaId,
```
Importe `useAuth` de `@/contexts/AuthContext` e pegue `empresaAtivaId` no topo do componente
(`const { empresaAtivaId } = useAuth();`).

**4b. Dropdown de "Cliente/Pagador" ou "Fornecedor" lê `db.pessoas` direto** (linha ~90-94):
```tsx
const filteredPersons = db.pessoas.filter((person) =>
  tipo === 'receita'
    ? person.relacao === 'cliente' || person.relacao === 'ambos'
    : person.relacao === 'fornecedor' || person.relacao === 'ambos' || person.relacao === 'transportadora',
);
```
Em modo real, este dropdown mostra pessoas de mock (que não existem no tenant real) em vez dos
clientes de verdade cadastrados. Troque pra usar o serviço real, que já sabe alternar
mock/real sozinho (`src/services/clientes.service.ts`, `listClients()` — já importado por outras
telas do sistema, ex. `ClientesPage.tsx`). Use o hook `useAsync` (já existe em
`@/hooks/useAsync`, mesmo padrão usado em `src/pages/configuracoes/PlanosPage.tsx`:
`useAsync(() => listUsers(), [])`):

```tsx
const clientsState = useAsync(() => listClients(), []);
```

O backend real (`apps/api`) não modela a distinção cliente/fornecedor/transportadora que o mock
modela via `Pessoa.relacao` — `mapApiClientToPessoa()` (em `clientes.service.ts`) deixa
`relacao` **sem valor nenhum** de propósito pra dado vindo da API real (documentado no comentário
daquela função). Então o filtro por `relacao` só faz sentido em modo mock; em modo real, liste
todos os clientes cadastrados independente do `tipo` escolhido (é a única opção honesta hoje —
não existe outro jeito real de saber quem é "fornecedor"). Substitua o cálculo de
`filteredPersons` por:

```tsx
const filteredPersons = USE_MOCKS
  ? db.pessoas.filter((person) =>
      tipo === 'receita'
        ? person.relacao === 'cliente' || person.relacao === 'ambos'
        : person.relacao === 'fornecedor' || person.relacao === 'ambos' || person.relacao === 'transportadora',
    )
  : (clientsState.data ?? []);
```

Adicione os imports necessários: `import { useAsync } from '@/hooks/useAsync';`,
`import { listClients } from '@/services/clientes.service';`,
`import { USE_MOCKS } from '@/services/mockAdapter';`. **Mantenha** o import de `db` de
`@/mocks` — ele ainda é usado pelo filtro em modo mock (`db.pessoas.find(...)` na função
`handleSave`, que resolve `selectedPerson` pra preencher `pessoaNome` — isso não muda, deixe como
está).

Não mude mais nada neste arquivo por enquanto (`window.location.reload()` ao salvar fica como
está, é comportamento existente e correto — só grosseiro, não desonesto; fora de escopo aqui) —
tem mais uma mudança nesse mesmo arquivo no item 4c abaixo.

**4c. Suportar abrir o modal já com "Despesa" pré-selecionado** (usado pelo botão "+ Despesa" de
`FinanceiroPage.tsx`, item 6 abaixo — hoje esse botão só mostra um toast falso, "Nova despesa
iniciada", sem abrir nada de verdade). Adicione uma prop opcional `initialTipo`:

```tsx
interface Props {
  open: boolean;
  onClose: () => void;
  initialTipo?: TipoLancamento;
}

export function NovaCobrancaModal({ open, onClose, initialTipo }: Props) {
```

O `useState` de `tipo` continua com o default atual (`useState<TipoLancamento>('receita')`), mas
adicione um efeito que sincroniza `tipo` com `initialTipo` toda vez que o modal abre (o componente
fica montado o tempo todo, só escondido por `open`, então isso precisa ser um efeito, não só o
valor inicial do `useState`):

```tsx
useEffect(() => {
  if (open) {
    setTipo(initialTipo ?? 'receita');
  }
}, [open, initialTipo]);
```

Adicione `useEffect` ao import do React já existente no topo (`import { useState, useEffect } from
'react';`). Não mude a função `reset()` nem `handleClose()` — continuam voltando pro default
`'receita'` ao fechar, é o `useEffect` acima que decide o valor certo toda vez que abre de novo.

## 5. `src/components/financeiro/contasReceberColumns.tsx` + `src/pages/financeiro/FinanceiroPage.tsx`

Hoje `contasReceberColumns.tsx` é um array estático de colunas que resolve o nome do
cliente/pagador direto do mock quando `entry.pessoaNome` vier vazio (linha ~8-13):
```tsx
function getPersonName(entry: Lancamento): string {
  if (entry.pessoaNome) return entry.pessoaNome;
  if (!entry.pessoaId) return '—';
  const person = db.pessoas.find((item) => item.id === entry.pessoaId);
  return person ? (person.nomeFantasia || person.razaoSocialOuNome) : '—';
}
```
Em modo real, `entry.pessoaNome` **nunca** vem preenchido (o mapeador
`mapApiEntryToLancamento()`, em `financeiro.service.ts`, não seta esse campo — só `pessoaId`), e
`db.pessoas` nunca vai ter o cliente certo — o resultado hoje é sempre `'—'` mesmo quando o
lançamento tem um cliente real vinculado. Isso é resolvível de verdade: a lista de clientes reais
já existe via `listClients()`.

**5a.** Em `contasReceberColumns.tsx`, transforme o array estático numa função fábrica que recebe
um mapa de nomes já resolvidos:
```tsx
import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Lancamento } from '@/types';
import { formatBRL, formatDayMonth } from '@/utils/format';
import { lancamentoStatusMeta } from '@/utils/statusMaps';

function getPersonName(entry: Lancamento, clientNameById: Map<string, string>): string {
  if (entry.pessoaNome) return entry.pessoaNome;
  if (!entry.pessoaId) return '—';
  return clientNameById.get(entry.pessoaId) ?? '—';
}

export function getContasReceberColumns(clientNameById: Map<string, string>): Column<Lancamento>[] {
  return [
    {
      key: 'cliente',
      header: 'Cliente / Pagador',
      render: (entry) => getPersonName(entry, clientNameById),
    },
    {
      key: 'docFiscal',
      header: 'Doc. / NF',
      render: (entry) => entry.numeroDocumentoFiscal ?? '—',
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (entry) => entry.descricao,
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      render: (entry) => formatDayMonth(entry.vencimento),
    },
    {
      key: 'valor',
      header: 'Valor',
      align: 'right',
      render: (entry) => formatBRL(entry.valorCentavos),
    },
    {
      key: 'status',
      header: 'Status',
      render: (entry) => {
        const meta = lancamentoStatusMeta[entry.status];
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      },
    },
  ];
}
```
Remova completamente o `import { db } from '@/mocks';` deste arquivo. Mantenha o resto das colunas
idêntico ao que já existe (só copiei acima pra deixar claro o formato final completo do arquivo).

**5b.** Em `FinanceiroPage.tsx`, que hoje importa e usa `contasReceberColumns` como valor estático
(`import { contasReceberColumns } from '@/components/financeiro/contasReceberColumns';` e
`columns={contasReceberColumns}` no `<DataTable>`), busque a lista real de clientes e monte o
mapa de nomes. Adicione:
```tsx
import { useAsync } from '@/hooks/useAsync';
import { listClients } from '@/services/clientes.service';
import { getContasReceberColumns } from '@/components/financeiro/contasReceberColumns';
```
(troque o import antigo de `contasReceberColumns` por este de `getContasReceberColumns`). Dentro
do componente, junto dos outros hooks de dados:
```tsx
const clientsState = useAsync(() => listClients(), []);
const clientNameById = useMemo(() => {
  const map = new Map<string, string>();
  for (const client of clientsState.data ?? []) {
    map.set(client.id, client.nomeFantasia || client.razaoSocialOuNome);
  }
  return map;
}, [clientsState.data]);
```
(`useMemo` já está importado no topo do arquivo — confirme e mantenha). E troque o uso no
`<DataTable>` de `columns={contasReceberColumns}` para `columns={getContasReceberColumns(clientNameById)}`.
Não precisa tratar erro de `clientsState` explicitamente — se falhar, `clientsState.data` fica
`undefined`, o `Map` fica vazio, e a coluna cai no fallback `'—'` já existente (comportamento
honesto: nunca mostra nome errado, só "não sei").

## 6. `src/pages/financeiro/FinanceiroPage.tsx` — botão "+ Despesa" hoje é 100% falso

Hoje (linha ~109):
```tsx
<Button onClick={() => toast.show('Nova despesa iniciada')}>+ Despesa</Button>
```
Isso não abre nada — só mostra um toast e não acontece mais nada. Use o mesmo
`NovaCobrancaModal` que o botão "+ Cobrança" já abre (é o mesmo modal, só com um tipo de
lançamento diferente pré-selecionado — ver item 4c acima, que adiciona a prop `initialTipo`).
Adicione um segundo pedaço de estado pro tipo inicial:
```tsx
const [newEntryTipo, setNewEntryTipo] = useState<'receita' | 'despesa'>('receita');
```
(`useState` já está importado no topo do arquivo). Troque os dois botões do cabeçalho para:
```tsx
<Button
  onClick={() => {
    setNewEntryTipo('despesa');
    setNewChargeOpen(true);
  }}
>
  + Despesa
</Button>
<Button
  variant="primary"
  onClick={() => {
    setNewEntryTipo('receita');
    setNewChargeOpen(true);
  }}
>
  + Cobrança
</Button>
```
E passe o tipo pro modal, no fim do arquivo:
```tsx
<NovaCobrancaModal
  open={newChargeOpen}
  onClose={() => setNewChargeOpen(false)}
  initialTipo={newEntryTipo}
/>
```
Remova o import de `useToast`/a variável `toast` **só se** ela não for mais usada em nenhum outro
lugar do arquivo depois dessa troca — confira antes de remover (é bem provável que não seja usada
em mais nenhum lugar deste arquivo específico, mas confirme lendo o arquivo inteiro antes de
decidir).

---

## Fora de escopo (não toque)

- `src/components/layout/Topbar/Topbar.tsx` já está corrigido pros usos de `db.tenants`/
  `db.lancamentos` (gate por `USE_MOCKS` já existe) — **não mexa nele aqui**, a barra de busca
  desse mesmo arquivo é outro spec (`cp3a-honesty-sweep-features-spec.md`), rodando em paralelo
  numa worktree diferente.
- `src/services/dashboard.service.ts` e `src/pages/configuracoes/PlanosPage.tsx`/
  `UpgradeConfirm.tsx` já foram corrigidos em checkpoints anteriores — não toque.
- Não mexe no *payload shape* que `NovaCobrancaModal.tsx`/`createEntry()`
  (`src/services/financeiro.service.ts`) manda pro backend real — isso é um problema conhecido e
  maior (BARRIERS B29, `financeiro.service.ts`'s write path não bate com o schema real do
  backend), já registrado como checkpoint futuro separado. Aqui só corrija a origem do
  `tenantId`/dropdown de pessoas, nada do formato do restante do payload.
- `src/pages/clientes/ClientesPage.tsx` (botão Exportar), `LoginPage.tsx` (esqueci senha),
  `EarlyAccessForm.tsx` — outro spec (`cp3a-honesty-sweep-features-spec.md`).
- Componentes `Tabs`/`Timeline`/`FieldRow` e `src/mocks/producao.mock.ts`/`src/types/producao.ts`
  — confirmados sem nenhum importador em todo o repo (dead code invisível pro usuário, não é uma
  mentira de UI) — fora de escopo, não toque.

## Ao terminar

Não rode `npm run build`/`tsc`/lint, não faça `git add`/`commit`/`push`. Apenas deixe as mudanças
como diff não commitado nos arquivos acima.
