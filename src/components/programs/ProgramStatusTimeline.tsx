import { formatDate, programStatusExplanations } from '@/lib/utils';
import { ProgramStatusBadge } from './ProgramStatusBadge';

export type ProgramStatusEventItem = {
  id: string;
  status: string;
  note: string | null;
  sourceUrl: string | null;
  detectedAt: Date | string;
};

/**
 * Histórico de estado do apoio.
 *
 * Existe porque as fontes oficiais publicam sempre e só o estado de hoje:
 * quando um programa é cancelado, a página deixa de dizer que esteve aberto e
 * que houve gente a candidatar-se. Guardar o histórico é o que permite dizer
 * "esteve aberto até X, foi cancelado a Y".
 */
export function ProgramStatusTimeline({
  events,
}: {
  events: ProgramStatusEventItem[];
}) {
  if (events.length === 0) return null;

  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.id} className="relative pl-6">
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${
              index === 0 ? 'bg-primary' : 'bg-border'
            }`}
          />
          {index < events.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-[3px] top-4 h-full w-px bg-border"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <ProgramStatusBadge status={event.status} />
            <time
              className="text-xs text-muted-foreground"
              dateTime={new Date(event.detectedAt).toISOString()}
            >
              {formatDate(event.detectedAt)}
            </time>
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {event.note ?? programStatusExplanations[event.status] ?? ''}
          </p>

          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              Fonte
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}
