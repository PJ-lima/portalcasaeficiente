import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ProgramStatusFilter = "OPEN" | "PLANNED" | "CLOSED" | "UNKNOWN";

function isProgramStatusFilter(value: string): value is ProgramStatusFilter {
  return (["OPEN", "PLANNED", "CLOSED", "UNKNOWN"] as const).includes(
    value as ProgramStatusFilter
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const concelhoId = searchParams.get("concelhoId");
    const statusParam = searchParams.get("status"); // opcional: OPEN|PLANNED|CLOSED|UNKNOWN

    const status =
      statusParam && isProgramStatusFilter(statusParam)
        ? statusParam
        : null;

    let municipalityName: string | null = null;

    // Se foi passado concelhoId, buscar o nome do concelho
    if (concelhoId) {
      const concelho = await prisma.concelho.findUnique({
        where: { id: concelhoId },
        select: { name: true, distrito: { select: { name: true } } },
      });
      municipalityName = concelho?.name ?? null;
    }

    const where: Prisma.ProgramWhereInput = {
      ...(status ? { status } : {}),
    };

    // Se há concelho selecionado, restringir a NACIONAL + esse município.
    if (municipalityName) {
      where.OR = [
        { geographies: { some: { level: "NATIONAL" } } },
        {
          geographies: {
            some: { level: "MUNICIPALITY", municipality: municipalityName },
          },
        },
      ];
    }

    // Buscar programas
    const programs = await prisma.program.findMany({
      where,
      include: {
        geographies: true,
        sources: true,
        versions: { orderBy: { versionDate: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      concelhoId,
      municipalityName,
      count: programs.length,
      programs,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
