# Your Garden Tools — React + Vite

Actuele broncode voor de publieke website en de beveiligde werkplaatsmodule
van **Your Garden Tools**.

## Lokaal testen

**Lees eerst [README-LOKAAL.md](README-LOKAAL.md)** voor installatie,
Supabase-configuratie en belangrijke waarschuwingen over testen met de
productiedatabase.

Korte start:

```bash
npm install
npm run dev
```

De website opent standaard op http://localhost:5173.

## Functies

- Responsive publieke website, inclusief onderhoudspagina met aan/uit-schakelaar
- Liquid Glass-huisstijl en Toro-hoofdfoto
- Gescheiden beveiligde werkplaatsmodule en boekhoudportaal
- Supabase Auth, medewerkersrollen en verplichte eerste wachtwoordwijziging
- Intuïtieve klantkaarten met aanpasbare gegevens
- Machines, werkopdrachten en onderdelen
- Facturen, PDF-weergave en beveiligde Supabase-bestandsopslag
- Werkplaatsradio die actief blijft bij navigatie binnen de module

## Technisch

- Vite + React
- Supabase Auth/PostgreSQL/RLS
- `scripts/`: buildstappen en reconstructie van delen van de broncode
- `source-parts/` en `asset-parts/`: nodig voor de build
- Geen wachtwoorden, privé-API-sleutels of database-export in deze repository

## Rechten

Zie [LICENSE](LICENSE): alle rechten voorbehouden.
