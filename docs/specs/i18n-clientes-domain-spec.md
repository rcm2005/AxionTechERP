# Tradução PT→EN — domínio Clientes

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "clientes".

## Arquivos (só estes)

- `src/services/clientes.service.ts`
- `src/hooks/useClientes.ts`
- `src/pages/clientes/ClientesPage.tsx`
- `src/pages/clientes/ClienteDetailPage.tsx`
- `src/components/modais/NovoClienteModal.tsx`
- `src/components/clientes/clientesColumns.tsx`

## O que fazer

Em `clientes.service.ts`: renomeie as funções exportadas — `listarClientes` → `listClients`,
`buscarCliente` → `getClient`, `criarCliente` → `createClient` (se houver mais funções
exportadas no arquivo além dessas três, aplique o mesmo padrão do vocabulário). NÃO renomeie
`filtrarClientes`/`PessoaFiltros`/`Pessoa` se `PessoaFiltros`/`Pessoa` vierem de `@/types` (regra
geral — deixe tipos importados intocados; se `filtrarClientes` for uma função local não-exportada
sem vínculo com o tipo, pode renomear pra `filterClients`, mantendo a lógica igual).

Nos outros 5 arquivos: atualize todo import/chamada das funções renomeadas acima. Renomeie
variáveis locais e parâmetros de função em português pro inglês (ex: `cliente` → `client`,
`clientes` → `clients`, `novoCliente`/`novo` → `newClient`/`created`, `pessoaId` → mantenha se vier
de tipo `@/types`, senão pode renomear). Traduza comentários. NÃO toque em nenhuma string visível
na UI (labels, `toast.show(...)`, `placeholder`, título de página, `emptyMessage`, etc.) — essas
ficam em português exatamente como estão. NÃO renomeie `ClientesPage`, `ClienteDetailPage`,
`NovoClienteModal` (nomes exportados de componente/arquivo, fora de escopo). NÃO toque no
`tenantId`/endereço hardcoded do `NovoClienteModal.tsx` nem em nenhum outro comportamento — só
está mudando nomes, não lógica.
