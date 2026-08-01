import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withRlsContext } from '@/lib/prisma-rls';
import { 
  programStatusLabels,
  programStatusColors,
  formatRelativeDaysFromNow,
} from '@/lib/utils';
import { Prisma, ProgramStatus, ProgramType } from '@prisma/client';
import { ChevronRight } from 'lucide-react';
import { SaveProgramButton } from './SaveProgramButton';

interface ProgramListProps {
  searchParams: {
    concelhoId?: string;
    status?: string | string[];
    programType?: string;
    q?: string;
    page?: string;
  };
}

export async function ProgramList({ searchParams }: ProgramListProps) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const concelhoId = searchParams.concelhoId;
  const statusParam = searchParams.status;
  const programType = searchParams.programType;
  const searchQuery = searchParams.q;
  
  // Construir filtro base
  const where: Prisma.ProgramWhereInput = {};
  
  // Filtro por status
  if (statusParam) {
    const statuses = Array.isArray(statusParam) ? statusParam : [statusParam];
    where.status = { in: statuses as ProgramStatus[] };
  }
  
  // Filtro por tipo de programa
  if (programType && (programType === 'NATIONAL' || programType === 'MUNICIPAL')) {
    where.programType = programType as ProgramType;
  }
  
  // Filtro por texto (título ou entidade)
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { entity: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  
  // Filtro por concelho (geografia)
  if (concelhoId) {
    const concelho = await prisma.concelho.findUnique({
      where: { id: concelhoId },
      select: { name: true },
    });
    
    if (concelho) {
      const geoFilter: Prisma.ProgramWhereInput[] = [
        // Programas nacionais
        { geographies: { some: { level: 'NATIONAL' } } },
        // Programas deste município
        { geographies: { some: { level: 'MUNICIPALITY', municipality: concelho.name } } },
      ];
      
      // Combinar com OR existente se houver
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: geoFilter },
        ];
        delete where.OR;
      } else {
        where.OR = geoFilter;
      }
    }
  }
  
  // Buscar programas
  const programs = await prisma.program.findMany({
    where,
    include: {
      geographies: true,
      sources: true,
      versions: {
        orderBy: { versionDate: 'desc' },
        take: 1,
      },
    },
    orderBy: [
      { status: 'asc' },
      { updatedAt: 'desc' },
    ],
  });

  const savedProgramIds = new Set<string>();
  if (currentUserId && programs.length > 0) {
    const savedPrograms = await withRlsContext(currentUserId, async (tx) =>
      tx.userSavedProgram.findMany({
        where: {
          userId: currentUserId,
          programId: { in: programs.map((program) => program.id) },
        },
        select: { programId: true },
      })
    );
    for (const savedProgram of savedPrograms) {
      savedProgramIds.add(savedProgram.programId);
    }
  }
  
  const total = programs.length;

  if (programs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card">
        <p className="font-display text-lg font-semibold text-ink">
          Sem resultados para estes filtros
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Experimenta alargar a pesquisa: remove um filtro ou pesquisa por
          outro concelho.
        </p>
        <Link href="/apoios" className="btn-secondary mt-6">
          Limpar filtros
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contagem de resultados */}
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? 'programa encontrado' : 'programas encontrados'}
      </p>

      {/* Lista de programas */}
      <div className="space-y-4">
        {programs.map((program) => {
          const latestVerificationDate = program.sources.reduce(
            (latestDate, source) => {
              if (!source.fetchedAt) return latestDate;
              return source.fetchedAt > latestDate ? source.fetchedAt : latestDate;
            },
            program.updatedAt
          );

          return (
            <article
              key={program.id}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition hover:border-primary-200 hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Program type badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}
                    </span>
                    {program.entity && (
                      <>
                        <span className="text-border">•</span>
                        <span className="text-xs text-muted-foreground">{program.entity}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="mt-1">
                    <Link
                      href={`/apoios/${program.slug}`}
                      className="text-lg font-semibold text-ink group-hover:text-primary transition"
                    >
                      {program.title}
                    </Link>
                  </h2>

                  {/* Description */}
                  {program.summary && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
                      {program.summary}
                    </p>
                  )}

                  {/* Geography info */}
                  {program.geographies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {program.geographies.map((geo) => (
                        <span
                          key={geo.id}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {geo.level === 'NATIONAL' ? 'Nacional' : geo.municipality || geo.district}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side info */}
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Estado do apoio
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${programStatusColors[program.status] || 'bg-muted'}`}>
                    {programStatusLabels[program.status] || program.status}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Última verificação: {formatRelativeDaysFromNow(latestVerificationDate)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/apoios/${program.slug}`}
                    className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition"
                  >
                    Ver detalhes
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>

                  <SaveProgramButton
                    slug={program.slug}
                    initialSaved={savedProgramIds.has(program.id)}
                    size="sm"
                  />
                </div>

                <Link
                  href={`/verificar?programa=${program.slug}`}
                  className="inline-flex items-center rounded-lg bg-success-50 px-3 py-1.5 text-sm font-medium text-success-700 transition hover:bg-success-100"
                >
                  Ver se sou elegível
                </Link>
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
