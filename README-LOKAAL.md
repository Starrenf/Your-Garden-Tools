# Your Garden Tools lokaal testen (Windows, Mac en Linux)

Dit is de actuele Vite + React-broncode van **Your Garden Tools**, inclusief:
- publieke website met Toro-hero en Liquid Glass-thema;
- gescheiden login, werkplaatsmodule en boekhoudportaal;
- Supabase-authenticatie, rollen en verplichte wachtwoordwijziging;
- klantkaarten, machines, opdrachten en facturatie;
- factuur-PDF's en een voorbereiding voor verzending;
- Websitebeheer met onderhoudsstand (alleen voor `owner`).

## 1. Benodigdheden

- Installeer Node.js 22 LTS of nieuwer (inclusief npm).
- Pak de broncode-ZIP uit in een lokale map, bijvoorbeeld `C:\\Your-Garden-Tools`.
- Open in VS Code de **uitgepakte projectmap** (daar waar `package.json` staat).

## 2. Supabase instellen

Maak een bestand `.env.local` in de projectmap. Je kunt beginnen met de meegeleverde `.env.example`.

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

**macOS / Linux:**
```bash
cp .env.example .env.local
```

Vul in `.env.local` de volgende velden in:
```dotenv
VITE_SUPABASE_URL=https://twllybokauyzfjurqnbr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key uit Supabase Dashboard>
```

Je vindt de sleutel onder **Supabase → Project Settings → API Keys → Publishable key**.
Gebruik hier uitsluitend de `sb_publishable_...` key. Zet **nooit** de
`sb_secret_...` of `service_role`-sleutel in een `VITE_...`-variabele.

> **Belangrijk:** met de productieproject-URL hierboven verbind je je lokale
> site met de échte Supabase-database. Nieuwe klanten, opdrachten, facturen en
> de onderhoudsstand worden dus daadwerkelijk in productie opgeslagen!
> Gebruik fictieve testgegevens en verstuur geen echte facturen vanuit tests.
> Voor volledig gescheiden tests maak je een apart Supabase-testproject met
> hetzelfde schema en configureer je de bijbehorende URL/key.

## 3. Starten

Open een terminal in de uitgepakte projectmap:

```bash
npm install
npm run dev
```

Open de URL die Vite toont, gewoonlijk:

**http://localhost:5173**

Routenavigatie:
- Algemene website: `http://localhost:5173/#/`
- Login: `http://localhost:5173/#/login`
- Werkplaats: `http://localhost:5173/#/werkplaats`
- Boekhouding: `http://localhost:5173/#/boekhouding`

Gebruik de bestaande Supabase Auth-gebruikers om in te loggen. Wachtwoorden
worden niet meegeleverd.

## 4. Website tijdelijk offline zetten

Log in met een `owner`-account en open **Werkplaats → Websitebeheer**.
Zet **Onderhoudsstand** op **AAN** of **UIT**.

De instelling staat in Supabase, dus een lokale wijziging met de
productiedatabase verandert ook de **live website**. De werkplaats en
boekhouding blijven bereikbaar, ook als onderhoud AAN staat.

## 5. Productiebuild testen

```bash
npm run build
npm run preview
```

De build draait de scripts in `scripts/` en reconstrueert delen van de
broncode uit `source-parts/` en `asset-parts/`. Dit hoort bij de huidige
repo-opzet: verwijder die directories niet.

## 6. Problemen oplossen

- **Supabase niet geconfigureerd:** controleer `.env.local` en herstart
  `npm run dev`.
- **Invalid login credentials:** controleer of de gebruiker bestaat onder
  Supabase Authentication → Users en het wachtwoord correct is.
- **Geen klanten/facturen zichtbaar:** controleer de rol van de gebruiker en
  de Row Level Security-regels in Supabase.
- **Onderhoudspagina zichtbaar:** kijk onder Websitebeheer of de onderhoudsstand
  AAN staat. Zonder login blijft de openbare route dan in onderhoud.
- **Poort 5173 al in gebruik:** Vite kiest meestal automatisch een andere
  vrije poort; gebruik de URL in je terminal.

## 7. Bron en rechten

GitHub: https://github.com/Starrenf/Your-Garden-Tools

Deze software is propriëtair; zie `LICENSE`.
De ZIP bevat geen `node_modules`, geen echte `.env.local` en geen
privésleutels of live database-export.
