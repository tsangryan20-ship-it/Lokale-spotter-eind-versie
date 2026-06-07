# PowNed Redactie Agent — Deployment Guide (Railway)

> **Waarom Railway?**  
> De app gebruikt SQLite (`better-sqlite3`) — een native Node.js module die op schijf schrijft.  
> Vercel en Netlify zijn serverless en hebben geen persistent filesystem. Railway draait als een gewone server mét volume-mount, waardoor SQLite gewoon werkt.

---

## Stap 1 — GitHub repository aanmaken

1. Ga naar [github.com/new](https://github.com/new) en maak een **private** repository aan (bijv. `powned-redactie-agent`)
2. Ga in de projectmap en voer uit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/JOUWGEBRUIKERSNAAM/powned-redactie-agent.git
   git push -u origin main
   ```

> ⚠️ `.env.local` staat al in `.gitignore` — je API keys en wachtwoord worden **nooit** naar GitHub gepusht.

---

## Stap 2 — Railway project aanmaken

1. Ga naar [railway.app](https://railway.app) en log in (gratis account)
2. Klik **"New Project"** → **"Deploy from GitHub repo"**
3. Selecteer jouw `powned-redactie-agent` repository
4. Railway detecteert automatisch Next.js en start de build

---

## Stap 3 — Environment variables instellen

Ga in Railway naar je service → tabblad **"Variables"** → klik **"New Variable"**:

| Variable | Waarde |
|---|---|
| `GOOGLE_API_KEY` | `AIzaSyAOUmL7SXRhnzALpu6-o9E44Oi24TrNaRw` |
| `GOOGLE_MODEL` | `gemini-2.0-flash` |
| `AUTH_SECRET` | *(genereer een lange willekeurige string, bijv. via [randomkeygen.com](https://randomkeygen.com))* |
| `AUTH_PASSWORD` | `powned2025` *(of kies een nieuw wachtwoord)* |
| `DATA_DIR` | `/data` |

---

## Stap 4 — Persistent volume aanmaken (voor de database)

Zonder volume gaat de SQLite database verloren bij elke herstart.

1. Ga in Railway naar je project → klik **"New"** → **"Volume"**
2. Stel in:
   - **Mount path:** `/data`
   - **Size:** 1 GB (gratis tier volstaat)
3. Koppel het volume aan je service

> Na deze stap wordt `/data/powned.db` permanent bewaard, ook na restarts en deploys.

---

## Stap 5 — Custom domain instellen (optioneel maar aanbevolen)

1. Ga naar je service → tabblad **"Settings"** → **"Networking"**
2. Klik **"Generate Domain"** voor een gratis `*.railway.app` URL (HTTPS automatisch)
3. Of koppel je eigen domein (bijv. `redactie.powned.nl`) via **"Custom Domain"**

---

## Stap 6 — Automatische dagelijkse ingestie (Cron)

De app is uitgerust met twee lagen van autonome scraping:

### A) Ingebouwde server-scheduler (geen extra setup nodig)
Zodra de Railway-server opstart, registreert `src/instrumentation.ts` automatisch een planner die:
- **2 minuten na opstart** een eerste volledige scrape + AI-analyse uitvoert
- **Elke 4 uur** opnieuw scrapet en analyseert

Dit werkt zelfstandig op Railway zonder extra configuratie.

### B) Railway Cron Job (optioneel — voor gegarandeerde dagelijkse runs)

Voor extra zekerheid (bijv. als de server herstart) kun je een Railway Cron Job instellen die de endpoint `GET /api/cron` aanroept:

1. Voeg eerst een `CRON_SECRET` toe in Railway Variables (bijv. `mijn-geheime-sleutel-123`)
2. Ga in Railway naar je project → **"New"** → **"Cron Job"**
3. Stel in:
   - **Schedule:** `0 6,10,14,18 * * *` (dagelijks om 06:00, 10:00, 14:00, 18:00 NL-tijd)
   - **Command:** `curl -s "https://JOUW-APP.railway.app/api/cron?secret=$CRON_SECRET"`
4. Klik **"Deploy"**

> Optioneel: stel `DISABLE_AUTO_PIPELINE=true` in als je de ingebouwde scheduler wil uitzetten en alleen de Railway Cron gebruikt.

---

## Stap 7 — Deployen

Na elke `git push origin main` deployt Railway automatisch de nieuwe versie.

**Handmatig deployen:**  
Railway dashboard → je service → klik **"Deploy"**

---

## Eerste keer opstarten na deploy

1. Open de live URL — je komt op het loginscherm
2. Log in met het wachtwoord dat je in `AUTH_PASSWORD` hebt ingesteld
3. Wacht 2 minuten — de server haalt automatisch de eerste artikelen op en analyseert ze
4. Of klik direct **"🔍 Scrapen"** → **"🧠 AI Analyse"** voor onmiddellijk resultaat

---

## Dagelijks gebruik via WhatsApp

Deel de Railway-URL met het redactieteam. Iedereen met de link + het wachtwoord krijgt direct toegang. Met **"Onthoud mij (30 dagen)"** hoeven redacteuren maar één keer in te loggen — ook op telefoon.

---

## Kosten Railway (gratis tier)

| Resource | Gratis |
|---|---|
| Compute | $5 krediet/maand (voldoende voor licht gebruik) |
| Volume | 1 GB inbegrepen |
| Bandwidth | Onbeperkt |
| HTTPS | Inbegrepen |

Voor zwaarder gebruik (continue scraping, grotere teams): **Hobby plan $5/maand**.

---

## Lokale ontwikkeling

```bash
npm install
npm run dev        # http://localhost:3000
```

Omgevingsvariabelen staan in `.env.local` (wordt niet gecommit).

---

*Gebouwd door [Note It Agency](https://noteit.agency) voor PowNed Redactie*
