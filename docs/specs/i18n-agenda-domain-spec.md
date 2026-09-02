# Tradução PT→EN — domínio Agenda

Leia primeiro `docs/specs/pt-en-translation-rules.md` (regras gerais + vocabulário) e siga tudo lá.
Este spec só lista o escopo específico do domínio "agenda".

## Arquivos (só estes)

- `src/services/agenda.service.ts`
- `src/hooks/useAgenda.ts`
- `src/pages/agenda/AgendaPage.tsx`
- `src/components/modais/NovoEventoAgendaModal.tsx`
- `src/components/agenda/AgendaLista.tsx`

## O que fazer

Em `agenda.service.ts`: renomeie a classe exportada `ConflitoAgendaError` → `ScheduleConflictError`
e as funções exportadas — `listarAgendaEventos` → `listScheduleEvents`, `buscarAgendaEvento` →
`getScheduleEvent`, `criarAgendaEvento` → `createScheduleEvent`, `atualizarAgendaEvento` →
`updateScheduleEvent`, `excluirAgendaEvento` → `deleteScheduleEvent`.

Nos outros 4 arquivos: atualize todo import/chamada/`instanceof` das funções e da classe de erro
renomeadas. Renomeie variáveis locais e parâmetros em português pro inglês (`evento` → `event`,
`eventos` → `events`). Traduza comentários. NÃO toque em nenhuma string visível na UI (o `Alert`
de conflito de agenda, toasts, `emptyMessage` ficam em português). NÃO renomeie `AgendaPage`,
`NovoEventoAgendaModal`, `AgendaLista` (nomes exportados de componente, fora de escopo).
