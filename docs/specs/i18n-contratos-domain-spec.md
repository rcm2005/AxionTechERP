# Tradução PT→EN — domínio Contratos

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "contratos".

## Arquivos (só estes)

- `src/services/contratos.service.ts`
- `src/hooks/useContratos.ts`
- `src/pages/contratos/ContratosPage.tsx`
- `src/components/modais/NovoContratoModal.tsx`

## O que fazer

Em `contratos.service.ts`: renomeie as funções exportadas — `listarContratos` → `listContracts`,
`buscarContrato` → `getContract`, `criarContrato` → `createContract`, `atualizarContrato` →
`updateContract`, `excluirContrato` → `deleteContract`.

Nos outros 3 arquivos: atualize todo import/chamada das funções renomeadas. Renomeie variáveis
locais e parâmetros em português pro inglês (`contrato` → `contract`, `contratos` → `contracts`).
Traduza comentários. NÃO toque em nenhuma string visível na UI (toasts, `emptyMessage`, títulos).
NÃO renomeie `ContratosPage`, `NovoContratoModal` (fora de escopo).
