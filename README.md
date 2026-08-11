# Spelkväll (Next.js-version)

Ombyggd i samma stil som KanDuAlla: Next.js App Router + TypeScript +
Supabase, deploy via Vercel. Samma Supabase-projekt/databas som förut
återanvänds rakt av — bara frontend är ombyggd, inget data migreras.

## 1. Installera och kör lokalt

```bash
npm install
cp .env.local.example .env.local
# fyll i NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local
npm run dev
```

Öppna `http://localhost:3000`.

## 2. Miljövariabler

Samma två värden som i det gamla `js/config.js`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Lokalt: `.env.local` (aldrig committad, står i `.gitignore`).
På Vercel: Project Settings → Environment Variables → lägg till båda,
för alla miljöer (Production/Preview/Development).

## 3. Databasen

Ingen ändring behövs i själva schemat — samma tabeller
(`players`, `groups`, `scores`, `game_settings`) och samma RPC-funktioner
(`login_or_create_player`, `my_groups`, `request_group`, `join_group`,
`am_i_admin`, `admin_*`, m.fl.) som redan finns i Supabase-projektet
används av den här koden precis som av den gamla.

`sql/002_record_score.sql` innehåller den säkra `record_score`-funktionen
(server-side poängvalidering + spärr mot att spela om samma dag). Den
funktionen bör redan finnas i databasen sedan tidigare — filen ligger här
bara som dokumentation. Om den av någon anledning saknas, kör filen i
Supabase SQL Editor.

## 4. Ordlistor

`lib/data/words5.ts` och `words6.ts` innehåller de utökade ordlistorna
(4 493 respektive 7 946 ord — cirka 12 respektive 22 år utan upprepning).
`valid5.ts`/`valid6.ts` är giltiga gissningar, `dictionary.ts` används av
Bokstavsjakt, `estimateQuestions.ts` av Uppskatta. Inget av detta behöver
röras.

## 5. Deploy till Vercel

1. Skapa ett nytt repo på GitHub, pusha den här mappen dit.
2. Vercel → Add New → Project → importera repot.
3. Framework preset upptäcks automatiskt som **Next.js** — inga särskilda
   inställningar behövs (till skillnad från gamla statiska Spelkväll som
   krävde "Other").
4. Lägg in miljövariablerna (steg 2) innan första deployen.
5. Deploy.

## 6. Vad som skiljer sig från den gamla vanilla JS-versionen

- Varje skärm är en egen route (`/`, `/topplista`, `/statistik`,
  `/grupper`, `/admin`, `/spel/[gameId]`) istället för `showScreen()`
  som togglade `display:none`.
- Varje minispel är en React-komponent i `components/games/` istället för
  ett objekt med `mount(container, onFinish)` som manipulerade DOM:en
  direkt.
- Spelare/grupp-state ligger i `context/PlayerContext.tsx` och
  `context/GroupContext.tsx` (React Context) istället för globala
  variabler i en IIFE.
- "Redan spelat idag" kollas mot databasen (`lib/useTodayResult.ts`)
  istället för bara `localStorage` — funkar nu även om man byter enhet.
- **Ingen service worker/offline-cache i den här versionen.** Den gamla
  hade en egen cache-first service worker (`sw.js`) som cachade allt
  manuellt — bekvämt, men det var också den som orsakade att uppdaterade
  ordlistor riskerade fastna i cache hos redan installerade spelare om
  man glömde bumpa cache-versionen. Manifestet (`public/manifest.json`)
  finns kvar så appen går att lägga till på hemskärmen, men utan
  offline-stöd. Säg till om ni vill ha tillbaka offline-läge (t.ex. via
  `next-pwa`) så bygger jag på det separat.
