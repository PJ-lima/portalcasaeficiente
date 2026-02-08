import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed (mínimo) - Portal Casa Eficiente");

  // 1) Criar utilizador de teste
  const testUser = await prisma.user.upsert({
    where: { email: "teste@casaeficiente.pt" },
    update: {
      name: "Utilizador Teste",
      nif: "123456789",
    },
    create: {
      email: "teste@casaeficiente.pt",
      name: "Utilizador Teste",
      nif: "123456789",
      role: "user",
    },
  });

  console.log("✅ Utilizador de teste criado:", testUser.id);

  // 2) Criar dossiê de exemplo para o utilizador de teste
  await prisma.userDossier.upsert({
    where: { userId: testUser.id },
    update: {
      address: "Rua de Exemplo, 123",
      postalCode: "2750-000",
      concelhoId: "lisboa-cascais",
      isMainResidence: true,
      buildingYear: 1990,
      propertyType: "apartamento",
      householdSize: 3,
      annualIncome: 25000,
      hasSocialTariff: false,
      isDisabledPerson: false,
      hasElderly: false,
      energyCertificate: "D",
    },
    create: {
      userId: testUser.id,
      address: "Rua de Exemplo, 123",
      postalCode: "2750-000",
      concelhoId: "lisboa-cascais",
      isMainResidence: true,
      buildingYear: 1990,
      propertyType: "apartamento",
      householdSize: 3,
      annualIncome: 25000,
      hasSocialTariff: false,
      isDisabledPerson: false,
      hasElderly: false,
      energyCertificate: "D",
    },
  });

  console.log("✅ Dossiê de teste criado para user:", testUser.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
