# Launch Pilot

**Il futuro del tuo ristorante inizia qui**

Piattaforma SaaS per creare studi di prefattibilità economica e finanziaria per ristoranti con UX guidata, KPI visuali, simulazioni, cash flow e report PDF.

## Stack

- Next.js, React, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security
- Recharts
- Stripe Checkout
- PDF export con jsPDF/html2canvas
- Deploy Vercel

## Avvio locale

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Configurazione

1. Copia `.env.example` in `.env.local`.
2. Inserisci chiavi Supabase e Stripe.
3. Per un progetto Supabase nuovo esegui `supabase/schema.sql` nel SQL editor Supabase.
4. Per un database Supabase già creato, applica in ordine `supabase/migrations/20260517_align_operational_model.sql` e poi `supabase/migrations/20260517_explicit_data_api_grants.sql`.
5. Configura su Vercel le stesse variabili ambiente.

Nota Supabase: le migrazioni includono `GRANT` espliciti per `authenticated` e `service_role`, necessari per esporre le tabelle del schema `public` alla Data API con RLS attivo.

## Moduli inclusi

- Dashboard KPI con semaforo sostenibilità.
- Workflow guidato in 10 step.
- Investimenti con IVA, categorie e ammortamenti.
- Finanziamenti con rata, DSCR e simulazione bancaria.
- Personale, incluso personale stagionale, costi variabili e acquisti dettagliati.
- Scenari operativi con capienza annua, pranzo/cena, occupazione e ticket medio.
- Workflow confermabile per step con costi collegati.
- Break even dinamico e tabella redditività.
- Cash flow mensile e alert liquidità.
- AI Advisor rule-based pronto per evoluzione LLM.
- Login, registrazione e recupero password tramite Supabase.
- Endpoint Stripe checkout e report API.

## Prossimi step prodotto

- Persistenza completa delle modifiche su Supabase.
- Area Super Admin con gestione clienti.
- Webhook Stripe per aggiornare `subscription_status`.
- PDF server-side multi-pagina con template brandizzato.
- Motore AI collegato ai dati reali del progetto.
