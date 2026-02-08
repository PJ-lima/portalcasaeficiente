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
      <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <p className="text-gray-500">
          Nenhum programa encontrado com os filtros selecionados.
        </p>
        <Link
          href="/apoios"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Limpar filtros
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contagem de resultados */}
      <p className="text-sm text-gray-500">
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
              className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Program type badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}
                    </span>
                    {program.entity && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{program.entity}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="mt-1">
                    <Link
                      href={`/apoios/${program.slug}`}
                      className="text-lg font-semibold text-gray-900 group-hover:text-primary transition"
                    >
                      {program.title}
                    </Link>
                  </h2>

                  {/* Description */}
                  {program.summary && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {program.summary}
                    </p>
                  )}

                  {/* Geography info */}
                  {program.geographies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {program.geographies.map((geo) => (
                        <span
                          key={geo.id}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {geo.level === 'NATIONAL' ? 'Nacional' : geo.municipality || geo.district}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side info */}
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Estado do apoio
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${programStatusColors[program.status] || 'bg-gray-100'}`}>
                    {programStatusLabels[program.status] || program.status}
                  </span>
                  <p className="text-xs text-gray-500">
                    Última verificação: {formatRelativeDaysFromNow(latestVerificationDate)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
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
                  className="inline-flex items-center rounded-lg bg-success/10 px-3 py-1.5 text-sm font-medium text-success transition hover:bg-success/20"
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
