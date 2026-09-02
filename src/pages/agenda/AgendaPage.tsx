import { useMemo, useState } from 'react';
import { useAgenda, useUsuarios } from '@/hooks/useAgenda';
import { useProcessos } from '@/hooks/useProcessos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card, CardBody } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { AgendaLista } from '@/components/agenda/AgendaLista';
import { NovoEventoAgendaModal } from '@/components/modais/NovoEventoAgendaModal';
import type { AgendaEventoTipo } from '@/types';

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'audiencia', label: 'Audiências' },
  { value: 'reuniao', label: 'Reuniões' },
  { value: 'outro', label: 'Outros' },
];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'agendado', label: 'Agendados' },
  { value: 'realizado', label: 'Realizados' },
  { value: 'cancelado', label: 'Cancelados' },
];

export function AgendaPage() {
  useDocumentTitle('Agenda');

  const [tipo, setTipo] = useState<AgendaEventoTipo | 'todos'>('todos');
  const [status, setStatus] = useState('todos');
  const [responsavel, setResponsavel] = useState('todos');
  const [novoOpen, setNovoOpen] = useState(false);

  const { data: usuarios } = useUsuarios();
  const { data: processos } = useProcessos();
  const {
    data: events,
    loading,
    error,
    reload,
  } = useAgenda({
    tipo,
    status,
    ...(responsavel !== 'todos' ? { responsavel_usuario_id: responsavel } : {}),
  });

  const nomeResponsavel = useMemo(() => {
    const mapa = new Map((usuarios ?? []).map((u) => [u.id, u.name]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [usuarios]);

  const rotuloProcesso = useMemo(() => {
    const mapa = new Map((processos ?? []).map((p) => [p.id, p.numero_cnj]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [processos]);

  const responsavelOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos os responsáveis' },
      ...(usuarios ?? []).map((u) => ({ value: u.id, label: u.name })),
    ],
    [usuarios],
  );

  return (
    <section>
      <PageHead
        title="Agenda"
        subtitle="Audiências, reuniões e compromissos do escritório, agrupados por dia."
        actions={
          <Button variant="primary" onClick={() => setNovoOpen(true)}>
            + Novo compromisso
          </Button>
        }
      />

      <Toolbar>
        <SelectField
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as AgendaEventoTipo | 'todos')}
        />
        <SelectField
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <SelectField
          options={responsavelOptions}
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
        />
      </Toolbar>

      <Card>
        <CardBody>
          {error ? (
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reload}>
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <AgendaLista
              events={events ?? []}
              loading={loading}
              nomeResponsavel={nomeResponsavel}
              rotuloProcesso={rotuloProcesso}
              emptyMessage="Nenhum compromisso encontrado para os filtros selecionados."
            />
          )}
        </CardBody>
      </Card>

      <NovoEventoAgendaModal open={novoOpen} onClose={() => setNovoOpen(false)} onCreated={reload} />
    </section>
  );
}
