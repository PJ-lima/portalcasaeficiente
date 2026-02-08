import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados completos de distritos e concelhos de Portugal
const distritosData = [
  { id: 'aveiro', name: 'Aveiro', concelhos: ['Águeda', 'Albergaria-a-Velha', 'Anadia', 'Arouca', 'Aveiro', 'Castelo de Paiva', 'Espinho', 'Estarreja', 'Ílhavo', 'Mealhada', 'Murtosa', 'Oliveira de Azeméis', 'Oliveira do Bairro', 'Ovar', 'Santa Maria da Feira', 'São João da Madeira', 'Sever do Vouga', 'Vagos', 'Vale de Cambra'] },
  { id: 'beja', name: 'Beja', concelhos: ['Aljustrel', 'Almodôvar', 'Alvito', 'Barrancos', 'Beja', 'Castro Verde', 'Cuba', 'Ferreira do Alentejo', 'Mértola', 'Moura', 'Odemira', 'Ourique', 'Serpa', 'Vidigueira'] },
  { id: 'braga', name: 'Braga', concelhos: ['Amares', 'Barcelos', 'Braga', 'Cabeceiras de Basto', 'Celorico de Basto', 'Esposende', 'Fafe', 'Guimarães', 'Póvoa de Lanhoso', 'Terras de Bouro', 'Vieira do Minho', 'Vila Nova de Famalicão', 'Vila Verde', 'Vizela'] },
  { id: 'braganca', name: 'Bragança', concelhos: ['Alfândega da Fé', 'Bragança', 'Carrazeda de Ansiães', 'Freixo de Espada à Cinta', 'Macedo de Cavaleiros', 'Miranda do Douro', 'Mirandela', 'Mogadouro', 'Torre de Moncorvo', 'Vila Flor', 'Vimioso', 'Vinhais'] },
  { id: 'castelo-branco', name: 'Castelo Branco', concelhos: ['Belmonte', 'Castelo Branco', 'Covilhã', 'Fundão', 'Idanha-a-Nova', 'Oleiros', 'Penamacor', 'Proença-a-Nova', 'Sertã', 'Vila de Rei', 'Vila Velha de Ródão'] },
  { id: 'coimbra', name: 'Coimbra', concelhos: ['Arganil', 'Cantanhede', 'Coimbra', 'Condeixa-a-Nova', 'Figueira da Foz', 'Góis', 'Lousã', 'Mira', 'Miranda do Corvo', 'Montemor-o-Velho', 'Oliveira do Hospital', 'Pampilhosa da Serra', 'Penacova', 'Penela', 'Soure', 'Tábua', 'Vila Nova de Poiares'] },
  { id: 'evora', name: 'Évora', concelhos: ['Alandroal', 'Arraiolos', 'Borba', 'Estremoz', 'Évora', 'Montemor-o-Novo', 'Mora', 'Mourão', 'Portel', 'Redondo', 'Reguengos de Monsaraz', 'Vendas Novas', 'Viana do Alentejo', 'Vila Viçosa'] },
  { id: 'faro', name: 'Faro', concelhos: ['Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro', 'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão', 'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo', 'Vila Real de Santo António'] },
  { id: 'guarda', name: 'Guarda', concelhos: ['Aguiar da Beira', 'Almeida', 'Celorico da Beira', 'Figueira de Castelo Rodrigo', 'Fornos de Algodres', 'Gouveia', 'Guarda', 'Manteigas', 'Mêda', 'Pinhel', 'Sabugal', 'Seia', 'Trancoso', 'Vila Nova de Foz Côa'] },
  { id: 'leiria', name: 'Leiria', concelhos: ['Alcobaça', 'Alvaiázere', 'Ansião', 'Batalha', 'Bombarral', 'Caldas da Rainha', 'Castanheira de Pêra', 'Figueiró dos Vinhos', 'Leiria', 'Marinha Grande', 'Nazaré', 'Óbidos', 'Pedrógão Grande', 'Peniche', 'Pombal', 'Porto de Mós'] },
  { id: 'lisboa', name: 'Lisboa', concelhos: ['Alenquer', 'Amadora', 'Arruda dos Vinhos', 'Azambuja', 'Cadaval', 'Cascais', 'Lisboa', 'Loures', 'Lourinhã', 'Mafra', 'Odivelas', 'Oeiras', 'Sintra', 'Sobral de Monte Agraço', 'Torres Vedras', 'Vila Franca de Xira'] },
  { id: 'portalegre', name: 'Portalegre', concelhos: ['Alter do Chão', 'Arronches', 'Avis', 'Campo Maior', 'Castelo de Vide', 'Crato', 'Elvas', 'Fronteira', 'Gavião', 'Marvão', 'Monforte', 'Nisa', 'Ponte de Sor', 'Portalegre', 'Sousel'] },
  { id: 'porto', name: 'Porto', concelhos: ['Amarante', 'Baião', 'Felgueiras', 'Gondomar', 'Lousada', 'Maia', 'Marco de Canaveses', 'Matosinhos', 'Paços de Ferreira', 'Paredes', 'Penafiel', 'Porto', 'Póvoa de Varzim', 'Santo Tirso', 'Trofa', 'Valongo', 'Vila do Conde', 'Vila Nova de Gaia'] },
  { id: 'santarem', name: 'Santarém', concelhos: ['Abrantes', 'Alcanena', 'Almeirim', 'Alpiarça', 'Benavente', 'Cartaxo', 'Chamusca', 'Constância', 'Coruche', 'Entroncamento', 'Ferreira do Zêzere', 'Golegã', 'Mação', 'Ourém', 'Rio Maior', 'Salvaterra de Magos', 'Santarém', 'Sardoal', 'Tomar', 'Torres Novas', 'Vila Nova da Barquinha'] },
  { id: 'setubal', name: 'Setúbal', concelhos: ['Alcácer do Sal', 'Alcochete', 'Almada', 'Barreiro', 'Grândola', 'Moita', 'Montijo', 'Palmela', 'Santiago do Cacém', 'Seixal', 'Sesimbra', 'Setúbal', 'Sines'] },
  { id: 'viana-do-castelo', name: 'Viana do Castelo', concelhos: ['Arcos de Valdevez', 'Caminha', 'Melgaço', 'Monção', 'Paredes de Coura', 'Ponte da Barca', 'Ponte de Lima', 'Valença', 'Viana do Castelo', 'Vila Nova de Cerveira'] },
  { id: 'vila-real', name: 'Vila Real', concelhos: ['Alijó', 'Boticas', 'Chaves', 'Mesão Frio', 'Mondim de Basto', 'Montalegre', 'Murça', 'Peso da Régua', 'Ribeira de Pena', 'Sabrosa', 'Santa Marta de Penaguião', 'Valpaços', 'Vila Pouca de Aguiar', 'Vila Real'] },
  { id: 'viseu', name: 'Viseu', concelhos: ['Armamar', 'Carregal do Sal', 'Castro Daire', 'Cinfães', 'Lamego', 'Mangualde', 'Moimenta da Beira', 'Mortágua', 'Nelas', 'Oliveira de Frades', 'Penalva do Castelo', 'Penedono', 'Resende', 'Santa Comba Dão', 'São João da Pesqueira', 'São Pedro do Sul', 'Sátão', 'Sernancelhe', 'Tabuaço', 'Tarouca', 'Tondela', 'Vila Nova de Paiva', 'Viseu', 'Vouzela'] },
  { id: 'acores', name: 'Açores', concelhos: ['Angra do Heroísmo', 'Calheta (Açores)', 'Corvo', 'Horta', 'Lagoa (Açores)', 'Lajes das Flores', 'Lajes do Pico', 'Madalena', 'Nordeste', 'Ponta Delgada', 'Povoação', 'Praia da Vitória', 'Ribeira Grande', 'Santa Cruz da Graciosa', 'Santa Cruz das Flores', 'São Roque do Pico', 'Velas', 'Vila do Porto', 'Vila Franca do Campo'] },
  { id: 'madeira', name: 'Madeira', concelhos: ['Calheta (Madeira)', 'Câmara de Lobos', 'Funchal', 'Machico', 'Ponta do Sol', 'Porto Moniz', 'Porto Santo', 'Ribeira Brava', 'Santa Cruz', 'Santana', 'São Vicente'] },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌍 Seed geografia (distritos + concelhos)");

  // Opcional: limpa tudo e volta a inserir (só se quiseres)
  // await prisma.concelho.deleteMany();
  // await prisma.distrito.deleteMany();

  for (const distrito of distritosData) {
    await prisma.distrito.upsert({
      where: { id: distrito.id },
      update: { name: distrito.name },
      create: { id: distrito.id, name: distrito.name },
    });

    for (const concelhoName of distrito.concelhos) {
      const concelhoId = `${distrito.id}-${slugify(concelhoName)}`;

      // Como tens name UNIQUE, isto evita problemas se o nome já existir
      // Se preferires permitir nomes repetidos, tiramos o @unique no schema depois.
      await prisma.concelho.upsert({
        where: { id: concelhoId },
        update: { name: concelhoName, distritoId: distrito.id },
        create: {
          id: concelhoId,
          name: concelhoName,
          distritoId: distrito.id,
        },
      });
    }
  }

  const distritosCount = await prisma.distrito.count();
  const concelhosCount = await prisma.concelho.count();

  console.log(`✅ Distritos: ${distritosCount}`);
  console.log(`✅ Concelhos: ${concelhosCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed geografia falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
