import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Exemplo: criar um programa inicial
  const program = await prisma.program.create({
    data: {
      slug: 'exemplo-programa',
      title: 'Programa Exemplo',
      entity: 'Câmara Municipal',
      programType: 'MUNICIPAL',
      status: 'OPEN',
      summary: 'Resumo do programa exemplo',
      officialUrl: 'https://example.org',
      versions: {
        create: [
          {
            versionDate: new Date(),
            rawText: 'Texto bruto da versão inicial',
            rulesJson: { rules: [] },
          },
        ],
      },
      geographies: {
        create: [
          {
            level: 'MUNICIPALITY',
            district: 'Distrito Exemplo',
            municipality: 'Concelho Exemplo',
            parish: 'Freguesia Exemplo',
          },
        ],
      },
      sources: {
        create: [
          {
            sourceType: 'MUNICIPAL_SITE',
            sourceUrl: 'https://example.org/source',
            fetchedAt: new Date(),
            contentHash: 'hash-exemplo',
            rawPayload: { example: true },
          },
        ],
      },
    },
    include: {
      versions: true,
      geographies: true,
      sources: true,
    },
  });

  console.log('✅ Seed created program:', program.slug);
  console.log('   - ID:', program.id);
  console.log('   - Versions:', program.versions.length);
  console.log('   - Geographies:', program.geographies.length);
  console.log('   - Sources:', program.sources.length);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
