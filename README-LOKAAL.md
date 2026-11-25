# Your Garden Tools lokaal testen (Windows, Mac en Linux)

Dit is de Vite + React-broncode van de publieke website van
**Your Garden Tools**, met Toro-hero en Liquid Glass-thema.

Sinds versie 0.13.0 is dit uitsluitend een informatieve website. De login,
werkplaatsmodule, het boekhoudportaal en de koppeling met Supabase zijn
verwijderd. De website slaat geen klant-, opdracht- of factuurgegevens op en
heeft geen `.env`-instellingen nodig.

## 1. Benodigdheden

- Installeer Node.js 22 LTS of nieuwer (inclusief npm).
- Open in VS Code de projectmap (daar waar `package.json` staat).

## 2. Starten

```bash
npm install
npm run dev
```

Open de URL die Vite toont, gewoonlijk **http://localhost:5173**.

Pagina's:
- Home: `http://localhost:5173/#/`
- Diensten: `http://localhost:5173/#/diensten`
- Werkwijze: `http://localhost:5173/#/werkwijze`
- Contact: `http://localhost:5173/#/contact`

## 3. Productiebuild testen

```bash
npm run build
npm run preview
```

De build draait de scripts in `scripts/` en reconstrueert delen van de
broncode uit `source-parts/` en `asset-parts/`. Dit hoort bij de huidige
repo-opzet: verwijder die directories niet. Het laatste script,
`frontend-v24-public-only.mjs`, houdt alleen de publieke website over.

## 4. Bron en rechten

GitHub: https://github.com/Starrenf/Your-Garden-Tools

Deze software is propriëtair; zie `LICENSE`.
