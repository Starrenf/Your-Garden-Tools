# Your Garden Tools — Vite + React (Ludo demo)

Deze versie is bijgewerkt voor de demo aan **Ludo Neven** en bevat het gekozen logo in de publieke website en de werkplaatsomgeving.

## Starten
```bash
npm install
npm run dev
```
Open daarna de lokale URL die Vite toont (meestal `http://localhost:5173`).

## Functionaliteit
- Responsive publieke website
- Werkplaatsbeheer via knop **Werkplaats**
- Dashboard
- Klanten
- Machines
- Opdrachten
- Opdrachtstatus
- Werkzaamheden en onderdelen
- Werkbon / factuur printweergave
- Lokale opslag via localStorage
- Gekozen logo geïntegreerd in website en beheeromgeving
- Werkplaatsradio met NPO Radio 1, Radio 2, 3FM, Qmusic, Radio 538, Sky Radio, Radio 10 en Radio Veronica
- Persistente werkplaatsradio die blijft doorspelen bij wisselen van pagina

## Logo's
De alternatieve logo's staan in `public/logos/` zodat eenvoudig kan worden gewisseld als Ludo een andere variant kiest.

## Deployment
Vercel deployment trigger: 29-10-2026.

## Volgende productiestap
Voor echte klantgegevens: authenticatie + centrale database (bijv. Supabase), RLS/beveiliging, server-side factuurnummering en PDF-generatie.
