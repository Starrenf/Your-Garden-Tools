# Supabase frontend contract

De frontend is voorbereid op drie gescheiden ervaringen:

- `#/` — publieke website
- `#/login` — bedrijfslogin
- `#/werkplaats` — werkplaatsmodule
- `#/boekhouding` — read-only boekhoudportaal

## Tijdelijke situatie

Tot Supabase is gekoppeld blijven demo-data en demo-authenticatie actief. Klanten, machines, opdrachten en facturen worden nu nog lokaal gesimuleerd.

## Benodigde Supabase-configuratie

Gebruik in de frontend uitsluitend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Gebruik nooit een service-role/secret key in de browser.

## Gewenste rollen

- `owner` — volledige toegang
- `workshop` — klanten, machines, opdrachten en werkbonnen
- `accountant` — alleen facturen en financiële velden

De uiteindelijke autorisatie moet via Supabase Auth + RLS worden afgedwongen; alleen routes of knoppen verbergen is niet voldoende beveiliging.

## Data die later localStorage vervangt

- customers
- machines
- jobs
- work_entries
- parts
- work_orders
- invoices
- invoice_lines

Radiozender en volume mogen lokaal in de browser opgeslagen blijven.
