# Regras gerais — tradução de código PT→EN (aplicam a todo spec desta iniciativa)

Isto é um checkpoint de uma iniciativa maior de traduzir o código-fonte de português pra inglês,
seguindo boas práticas de programação. Rafael (dono do projeto) definiu o escopo explicitamente:

- **Código** (funções, variáveis, comentários, nomes internos) → inglês.
- **Conteúdo visível pro usuário final** (labels de UI, texto de botão, mensagem de toast/erro,
  placeholder, título de página, qualquer string que aparece renderizada na tela) → **continua em
  português, sem mudar uma letra**. O produto é usado por escritórios de advocacia brasileiros.
- **Contrato de rede (wire)** entre frontend e backend → **fora de escopo deste checkpoint**,
  fica pra uma rodada futura coordenada nos dois repos. Na prática isso significa:
  - **NUNCA renomeie nada importado de `@/types`** (nem o nome do tipo/interface, nem os campos
    dele) — `Pessoa`, `Processo`, `Prazo`, `Contrato`, `AgendaEvento`, `Usuario`, `Tenant`,
    `*Filtros`, `*Input`, e qualquer outro tipo desse diretório ficam EXATAMENTE como estão,
    incluindo todos os campos internos deles (ex: `razaoSocialOuNome`, `tenantId`, `nomeFantasia`
    continuam com esses nomes).
  - **NUNCA renomeie chave de objeto literal que vira corpo de requisição HTTP** (ex: o objeto
    passado pra `http.post(...)`/`http.put(...)`) nem campo lido de uma resposta de API — essas
    chaves são strings JSON reais compartilhadas com o backend.
  - **NUNCA renomeie o nome exportado de componentes de página/modal** (ex: `ClientesPage`,
    `NovoClienteModal`) nem o nome de arquivo — são referenciados por `src/routes/router.tsx`
    (fora do escopo deste dispatch) e ficam pra um checkpoint separado.
- **O que RENOMEAR (fica em inglês)**: nomes de função exportada de service (ex:
  `listarClientes` → `listClients`), variáveis locais, parâmetros de função, comentários,
  docstrings, nomes de função/helper não-exportada, nomes de classe de erro local (não vinda de
  `@/types`). Sempre atualize TODOS os call-sites da função renomeada dentro dos arquivos listados
  no spec (import + toda chamada).

## Vocabulário de domínio (use exatamente estes termos em inglês)

| PT | EN |
|---|---|
| cliente(s) | client(s) |
| processo(s) | case(s) |
| prazo(s) | deadline(s) |
| contrato(s) | contract(s) |
| agenda / evento de agenda | schedule / schedule event |
| lançamento (financeiro) | (financial) entry |
| cobrança | charge |
| escritório | firm |
| usuário | user |
| listar | list |
| buscar | get |
| criar | create |
| atualizar | update |
| excluir / deletar | delete |
| alterar | change |

## Regra de verificação

Depois de renomear uma função exportada, faça uma busca por TODO o texto do nome antigo dentro
dos arquivos listados no spec pra garantir que nenhum call-site ficou pra trás (import
desatualizado quebra o build). Só escreva/edite os arquivos listados no spec — sem rodar nenhum
comando de shell (sem `npm`, sem `tsc`, sem `git`). Não faça `git commit`. Não rode `npm run
build`/`tsc`/testes — isso é feito por fora, depois.
