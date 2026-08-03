# ✅ Fase E: SEO — IMPLEMENTADA

_Executado a 2026-08-03 contra a DB de dev (Supabase `mxsnohz…`), build de produção local na porta 3123._

---

## 📝 Alterações aplicadas

| Ficheiro | O que mudou |
| --- | --- |
| `.env.example` | Documenta `SITE_URL` e `SITE_INDEXABLE` |
| `scripts/check-env.ts` | Valida ambas; `SITE_INDEXABLE=true` sem `SITE_URL` é erro |
| `src/lib/site-url.ts` | **novo** — `getSiteUrl()`, `isIndexable()` |
| `src/lib/seo.ts` | **novo** — `buildMetadata()` (canonical + OG + robots) |
| `src/lib/concelhos.ts` | **novo** — slug, lookup e o predicado de geografia partilhado |
| `src/lib/json-ld.ts` | **novo** — builders de structured data |
| `src/components/seo/JsonLd.tsx` | **novo** — injeção com escaping de `<` |
| `src/app/layout.tsx` | `metadataBase`, `robots` default, `Organization` + `WebSite` |
| `src/app/{page,apoios/page,verificar,sobre,como-funciona}` | metadata via `buildMetadata()` |
| `src/app/{admin,conta,dashboard,perfil}/layout.tsx` | **novos** — `noindex, nofollow` |
| `src/app/not-found.tsx` | `noindex` |
| `src/app/apoios/[slug]/page.tsx` | metadata via helper, JSON-LD, links para páginas de concelho |
| `src/app/apoios/concelho/[slug]/page.tsx` | **nova rota** |
| `src/app/robots.ts`, `src/app/sitemap.ts` | **novos** |
| `src/components/programs/ProgramList.tsx` | usa `programGeographyFilter()` |
| `src/components/layout/Footer.tsx` | removidos 3 links 404 |
| `public/og-image.png` | **novo** — 1200×630 a partir do logo horizontal |

---

## 🔒 A descoberta que define o desenho

O branch `staging` gera **Production Deployments** na Vercel, portanto `NODE_ENV` e
`VERCEL_ENV` valem `production` em staging **e** em produção. Nenhum dos dois
distingue os ambientes.

O único discriminador é a flag explícita `SITE_INDEXABLE`, cuja ausência bloqueia.
Pôr `SITE_INDEXABLE=true` **só** no projeto Vercel de produção real, com domínio ativo.

⚠️ `robots.txt` e `sitemap.xml` são gerados no build (`○ Static`), tal como o
`metadataBase`. Mudar `SITE_URL`/`SITE_INDEXABLE` na Vercel exige **redeploy** —
editar a env var não chega.

---

## 🧪 Resultados

### 1. Build

```
npm run build
```

- `/robots.txt` → `○ Static`
- `/sitemap.xml` → `○ Static`, revalidate `1h`
- `/apoios/concelho/[slug]` → `ƒ Dynamic` — confirma que não há tentativa de
  geração estática (o `ProgramList` chama `auth()`, o que força render dinâmico)
- `npx tsc --noEmit` e `npx eslint src` sem output

### 2. Modo staging (sem `SITE_INDEXABLE`)

| Verificação | Resultado |
| --- | --- |
| `curl /robots.txt` | `User-Agent: *` / `Disallow: /` ✅ |
| `curl /sitemap.xml` | `<urlset>` vazio ✅ |

### 3. Modo indexável (`SITE_INDEXABLE=true SITE_URL=http://localhost:3123`)

| Verificação | Resultado |
| --- | --- |
| `robots.txt` | `Allow: /` + `Disallow: /api` + `Host:` + linha `Sitemap:` ✅ |
| `sitemap.xml` | 306 `<loc>` — 5 estáticos, 300 programas, 1 concelho ✅ |
| Rotas privadas no sitemap | 0 ocorrências de `/admin`, `/conta`, `/dashboard`, `/perfil`, `/api`, `/termos`, `/privacidade`, `/contactos` ✅ |
| Canonical em `/apoios/concelho/cascais` | `http://localhost:3123/apoios/concelho/cascais` (absoluto) ✅ |
| `og:image` | `http://localhost:3123/og-image.png` — absoluto, prova que o `metadataBase` resolveu ✅ |
| `og-image.png` | `200 image/png 429568` ✅ |
| `/perfil`, `/conta`, `/conta/dossier`, `/conta/favoritos` | `noindex, nofollow` ✅ |
| `/admin`, `/dashboard` | 307 do middleware, nunca servem HTML a um crawler ✅ |

### 4. Rota de concelho

| Caso | Esperado | Obtido |
| --- | --- | --- |
| `/apoios/concelho/cascais` (tem apoio municipal) | 200 | 200 ✅ |
| `/apoios/concelho/lisboa` (sem apoio municipal) | 307 → `/apoios?concelhoId=` | `307 → /apoios?concelhoId=lisboa-lisboa` ✅ |
| `/apoios/concelho/nao-existe` | 404 | 404 ✅ |

### 5. JSON-LD

Todos os blocos passaram `JSON.parse` e nenhum contém `</script`:

| Página | Tipos |
| --- | --- |
| `/` | `Organization`, `WebSite` |
| `/apoios` | + `BreadcrumbList` |
| `/apoios/concelho/cascais` | + `CollectionPage`, `BreadcrumbList` |
| `/apoios/<slug>` | + `GovernmentService`, `BreadcrumbList` |

Escaping testado com payload de injeção:

```
{"description":"texto </script><img src=x onerror=alert(1)> fim"}
```

Não contém `</script>`, e faz `JSON.parse` com o texto original intacto. ✅

### 6. `env:check`

| Cenário | Resultado |
| --- | --- |
| `SITE_INDEXABLE=yes` | erro: `must be exactly "true" or "false"` ✅ |
| `SITE_INDEXABLE=true` sem `SITE_URL` | erro: `requires SITE_URL to be set` ✅ |
| dev sem nenhuma das duas | aviso de opcionais, `OK (dev)` ✅ |

---

## ⚠️ Decisões e limitações assumidas

1. **Sem `ItemList` em `/apoios`.** A lista visível depende dos filtros aplicados
   dentro do `ProgramList`; reconstruí-la na página obrigaria a duplicar essa
   lógica, e um `ItemList` que não corresponda ao ecrã é pior do que nenhum. O
   `ItemList` vive nas páginas de concelho, onde a query é determinística.
2. **Sem `ProgramFilters` na página de concelho.** Esse componente faz
   `router.push('/apoios?…')` hardcoded e lê o concelho de `useSearchParams()`,
   mas aqui o concelho é segmento de path — o primeiro clique num filtro deitaria
   fora o âmbito. Há um link "Ver todos os filtros para X →" em vez disso. Dar-lhe
   uma prop `basePath` é follow-up.
3. **Um predicado de geografia só.** `programGeographyFilter()` em
   `src/lib/concelhos.ts` é usado pelo `ProgramList` e pelas páginas de concelho.
   O matching de `municipality` é igualdade exata contra `Concelho.name` — foi
   confirmado na DB de dev que os valores batem certo (1 distinto, 1 exato, 0
   falhados). Se os scrapers começarem a escrever variantes não normalizadas, o
   sítio para corrigir é esse — e a correção vale logo para todos os consumidores.
4. **Só 1 página de concelho hoje (Cascais).** É o único concelho com geografia
   `MUNICIPALITY` na base. O número cresce com o inventário (Fase D), sem tocar em
   código.
5. **`GovernmentService` não tem rich result no Google.** Serve clareza de
   entidade para crawling e citação por assistentes, não enhancement visual.
6. **`robots.txt` só bloqueia `/api`.** As rotas privadas ficam crawláveis de
   propósito: um `Disallow` impede o crawler de descarregar a página e, portanto,
   de ver o `noindex` que lá está — o URL acabaria indexado sem snippet se fosse
   linkado de fora. Com o crawl permitido, o `noindex` é respeitado e o URL sai
   do índice. `/api` é a excepção porque não serve HTML onde pôr a meta tag.
7. **O sitemap não é partido em ficheiros.** Um `console.warn` dispara acima de
   45 000 URL; o limite duro do Google são 50 000. A essa escala é preciso
   `generateSitemaps()`.

---

## 🔜 Follow-ups

- **Bloqueante antes de produção:** `/termos`, `/privacidade` e `/contactos` não
  existem — os links foram removidos do footer. A política de privacidade é
  obrigatória (o site tem contas de utilizador).
- `opengraph-image.tsx` dinâmico por programa (título + estado) — a imagem
  estática atual serve todas as páginas.
- `basePath` no `ProgramFilters`, para poder filtrar dentro da página de concelho.
- Submeter o sitemap ao Search Console quando o domínio existir.
