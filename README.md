# allt.ax – Ålands lokala sökmotor

allt.ax är en lokal sökmotor och företagsportal för Åland: företagskatalog,
snabb sökning med svensk synonym- och stavfelstolerans, kommun- och
kategorisidor, erbjudanden, evenemang, tydligt märkta sponsrade placeringar,
företagspanel och adminpanel.

> **Obs:** All exempeldata (företag, kampanjer, erbjudanden, evenemang) är
> fiktiv och märkt som demonstration.

## Teknikstack

| Del | Val |
| --- | --- |
| Webbramverk | Next.js 15 (App Router, server actions) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Databas | PostgreSQL 16 + Prisma 6 |
| Sök | PostgreSQL full-text (svenska) + pg_trgm för stavfel, synonymlager i appen |
| Auth | Auth.js (NextAuth v5), credentials + JWT, roller: USER / BUSINESS_OWNER / MODERATOR / ADMIN |
| Kartor | OpenStreetMap + Leaflet (klientkomponent) |
| Tester | Vitest (unit + integration) |

## Kom igång lokalt

Krav: Node 20+, PostgreSQL 14+ (med `pg_trgm`-behörighet).

```bash
# 1. Installera beroenden
npm install

# 2. Skapa databas och användare (exempel)
createuser alltax --pwprompt          # lösenord: alltax_dev
createdb -O alltax alltax

# 3. Miljövariabler
cp .env.example .env                  # justera DATABASE_URL vid behov

# 4. Migrera och seeda exempeldata
npx prisma migrate dev
npm run db:seed

# 5. Starta
npm run dev                           # http://localhost:3000
```

### Demokonton

| Roll | E-post | Lösenord |
| --- | --- | --- |
| Admin | `admin@allt.ax` | `admin123` |
| Företagare (äger El-Karlsson Ab) | `foretag@example.ax` | `foretag123` |
| Användare | `anna@example.ax` | `user123` |

### Kommandon

| Kommando | Gör |
| --- | --- |
| `npm run dev` | Utvecklingsserver |
| `npm run build && npm start` | Produktionsbygge + server |
| `npm test` | Hela testsviten (kräver seedad databas) |
| `npm run db:migrate` | Kör migrationer |
| `npm run db:seed` | Seedar exempeldata (nollställer innehållet) |
| `npm run db:reset` | Släng + migrera + seeda om databasen |
| `npm run lint` | ESLint |

## Arkitektur

```
prisma/
  schema.prisma          # Datamodell (User, Business, Category, Campaign, …)
  migrations/            # SQL-migrationer inkl. sökindex (tsvector + trigram)
  seed.ts                # Fiktiv exempeldata: 16 kommuner, 36 kategorier, 40 företag …
src/
  lib/
    search.ts            # Sökorkestrering: kandidater (FTS + trigram + kategori) → rankning → sponsrat
    ranking.ts           # Organisk rankingmodell (RENA funktioner, enhetstestade)
    campaign-matching.ts # Sponsrad matchning/urval (RENA funktioner, enhetstestade)
    synonyms.ts          # Svenskt synonym-/intentionslager ("bilfix" → bilverkstäder, "öppet nu", "nära mig")
    opening-hours.ts     # Öppettider + "Öppet nu" i Europe/Mariehamn
    csv-import.ts        # CSV-parsning/validering/dubblettkontroll
    auth.ts              # Auth.js-konfiguration + roller
    rate-limit.ts        # In-memory rate limiting (byt till Redis i multi-instans-drift)
    seo.ts               # JSON-LD-byggare (LocalBusiness, Event, BreadcrumbList, …)
  app/
    page.tsx             # Startsida
    sok/                 # Sökresultat (sponsrat + organiskt + filter + karta)
    foretag/             # Kategoriindex, kategorisidor OCH företagsprofiler (/foretag/[slug])
    [kommun]/            # Kommunsidor (/mariehamn, /jomala, …)
    erbjudanden/ evenemang/
    panel/               # Företagspanel: statistik, redigering, erbjudanden, anspråk, annonsförfrågan
    admin/               # Adminpanel: översikt, företag, anspråk, kampanjer, kategorier, sökningar, CSV-import
    api/track/click      # Klickloggning (telefon/webb/e-post/bokning)
tests/                   # Vitest: unit (ranking, kampanjer, synonymer, öppettider, CSV) + integration (sök, spårning, anspråk)
```

### Sök och ranking

1. **Intentionstolkning** (`synonyms.ts`): stavfel/vardagsspråk mappas till
   kategorier, "öppet nu"/"nära mig"/kommun-i-frågan extraheras.
2. **Kandidater**: PostgreSQL `websearch_to_tsquery('swedish', …)` mot en
   viktad `tsvector`-kolumn + trigram-likhet på namn + företag i implicerade
   kategorier.
3. **Organisk rankning** (`ranking.ts`): textrelevans, namnlikhet,
   kategoriträff, geografisk relevans, profilens fullständighet, verifiering
   och aktualitet. **Betalning ingår inte i modellen** – `RankableBusiness`
   saknar medvetet premium-/kampanjfält, vilket testerna låser fast.
4. **Sponsrade platser** (`campaign-matching.ts`): max 2 platser före organiskt,
   endast för relevanta sökningar (sökord/kategori/kommun-matchning), alltid
   märkta "Sponsrad", en plats per företag. Visningar och klick loggas.

Arkitekturen är förberedd för att byta söklager till Meilisearch/Typesense:
hela sökningen går genom `searchBusinesses()` i `src/lib/search.ts`.

### Annonsering & betalningar

Kampanjer skapas/aktiveras manuellt i adminpanelen (MVP). Datamodellen har
`budget`, `price`, `impressionCount`, `clickCount` och kampanjtyper
(sök/kategori/startsida/banner) så att Stripe-fakturering per månad/visning/
klick kan byggas ovanpå utan schemaändringar. Stripe-nycklar är förberedda i
`.env.example` men inga riktiga betalningar är implementerade.

### Säkerhet & GDPR

- Zod-validering av all formulär-/API-input, rollkontroll i varje server action.
- Adminpanelens layout + varje åtgärd kontrollerar rollen server-side.
- Rate limiting på inloggning, registrering, anspråk och klickspårning.
- Audit log för administrativa ändringar.
- Anonymt sessions-id (slumpmässigt UUID i cookie) för statistik – ingen
  exakt platslagring, inga tredjepartscookies. Se `/integritet`.
- Användare kan radera sitt konto själva (`/panel/konto`).
- Inga hemligheter i koden – se `.env.example`.

## Deployment (Vercel + managed PostgreSQL)

1. Skapa en managed PostgreSQL (Neon/Supabase/RDS) och kör
   `npx prisma migrate deploy`.
2. Sätt `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`) och
   `NEXT_PUBLIC_SITE_URL` i Vercel-projektet.
3. Deploya. Sitemap (`/sitemap.xml`) och robots (`/robots.txt`) genereras
   automatiskt.

Kända MVP-avgränsningar: bilduppladdning använder inte S3 ännu (fälten finns i
datamodellen), rate limiting är per process, och e-postnotifieringar saknas.
