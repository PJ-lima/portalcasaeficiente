# Seed Geográfico

Este ficheiro popula a base de dados com a estrutura geográfica de Portugal (distritos e concelhos).

## 📊 Dados

- **20 Distritos** (incluindo Açores e Madeira)
- **308 Concelhos** de Portugal Continental, Açores e Madeira

## 🚀 Como usar

### Executar o seed

```bash
npx tsx prisma/seed_geo.ts
```

### Verificar os dados

```bash
# Contar distritos
npx prisma studio
# ou via CLI
psql $DATABASE_URL -c "SELECT COUNT(*) FROM distritos;"

# Contar concelhos
psql $DATABASE_URL -c "SELECT COUNT(*) FROM concelhos;"
```

## 🔍 Endpoint de pesquisa

O endpoint `/api/concelhos/search` permite pesquisar concelhos:

```bash
# Pesquisar por "cas"
curl "http://localhost:3000/api/concelhos/search?q=cas"

# Resultado:
# - Cascais (Lisboa)
# - Castelo Branco (Castelo Branco)
# - Castelo de Paiva (Aveiro)
# - Castelo de Vide (Portalegre)
# - Castro Daire (Viseu)
# - Castro Marim (Faro)
# - Castro Verde (Beja)
```

### Testar o endpoint

```bash
node scripts/test-concelhos-search.js cas
```

## 🏗️ Estrutura

### Modelo Distrito

```typescript
{
  id: string;        // ex: 'lisboa', 'porto'
  name: string;      // ex: 'Lisboa', 'Porto'
  concelhos: Concelho[];
}
```

### Modelo Concelho

```typescript
{
  id: string;        // ex: 'lisboa-cascais', 'porto-porto'
  name: string;      // ex: 'Cascais', 'Porto'
  distritoId: string;
  distrito: Distrito;
}
```

## ⚠️ Notas importantes

### IDs dos concelhos

Os IDs seguem o padrão `{distritoId}-{slug(concelhoName)}`:

- `lisboa-cascais` → Cascais (Lisboa)
- `porto-porto` → Porto (Porto)
- `acores-calheta-acores` → Calheta (Açores)
- `madeira-calheta-madeira` → Calheta (Madeira)

### Nomes únicos

O schema tem `name @unique` na tabela `concelhos`. Isto funciona porque:

- Concelhos com o mesmo nome em distritos diferentes têm sufixos: "Calheta (Açores)" vs "Calheta (Madeira)"
- Concelhos com o mesmo nome em Açores: "Lagoa (Açores)"
- Isto evita colisões mantendo a simplicidade

### Upsert vs Insert

O script usa `upsert()` para evitar duplicações:

- Se executares múltiplas vezes, **não cria duplicados**
- Atualiza os dados existentes se necessário
- Seguro para re-execução

## 🧹 Limpar dados

Se quiseres recomeçar do zero:

```typescript
// Descomentar no seed_geo.ts
await prisma.concelho.deleteMany();
await prisma.distrito.deleteMany();
```

Ou via CLI:

```bash
npx prisma migrate reset --force
npx tsx prisma/seed_geo.ts
```

## 🔧 Performance

O endpoint de pesquisa está otimizado:

- ✅ Índice em `concelhos.name`
- ✅ Índice em `concelhos.distrito_id`
- ✅ Pesquisa case-insensitive
- ✅ Limit de 20 resultados
- ✅ Ordenação alfabética

```sql
-- Índices criados automaticamente pelo Prisma
CREATE INDEX "concelhos_distrito_id_idx" ON "concelhos"("distrito_id");
```

## 📝 Exemplos de uso

### No código

```typescript
// Pesquisar concelhos
const concelhos = await prisma.concelho.findMany({
  where: {
    name: {
      contains: 'cas',
      mode: 'insensitive'
    }
  },
  include: {
    distrito: true
  },
  take: 20
});

// Obter concelho específico
const concelho = await prisma.concelho.findUnique({
  where: { id: 'lisboa-cascais' },
  include: { distrito: true }
});

// Obter todos os concelhos de um distrito
const concelhosLisboa = await prisma.concelho.findMany({
  where: { distritoId: 'lisboa' },
  orderBy: { name: 'asc' }
});
```
