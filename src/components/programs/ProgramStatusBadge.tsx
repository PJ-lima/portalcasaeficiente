import { AlertTriangle } from 'lucide-react';
import {
  isCautionaryStatus,
  programStatusColors,
  programStatusLabels,
} from '@/lib/utils';

type Size = 'sm' | 'md';

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

/**
 * Estado do apoio. Os estados de cautela (dotação esgotada, suspenso,
 * cancelado, pagamentos em atraso) levam ícone para não passarem despercebidos
 * ao lado de um "aberto" verde.
 */
export function ProgramStatusBadge({
  status,
  size = 'sm',
  className = '',
}: {
  status: string;
  size?: Size;
  className?: string;
}) {
  const label = programStatusLabels[status] ?? status;
  const colors = programStatusColors[status] ?? 'bg-muted';
  const cautionary = isCautionaryStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colors} ${className}`}
    >
      {cautionary && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {label}
    </span>
  );
}
