# PowNed Redactie Agent

AI-gedreven nieuwsmonitor voor de PowNed-redactie — gebouwd door **Note It**.

## Wat doet het?

- **Automatisch nieuws ophalen** uit 23 Nederlandse nieuwsbronnen via RSS-feeds
- **AI-scoring** op basis van de "PowNed-bril": elk artikel krijgt een relevantiescore 0-100%
- **Slimme filtering** op provincie, categorie, score en status
- **Redactie-workflow**: markeer items als Favoriet, Ingepland, Doorgestuurd of Afgewezen
- **Must-have detectie**: items met score 90+ worden bovenaan uitgelicht

## Snelstart

### 1. Installeer dependencies

```bash
npm install
```

### 2. Stel je OpenAI API key in

Bewerk `.env.local`:

```env
OPENAI_API_KEY=sk-jouw-sleutel-hier
OPENAI_MODEL=gpt-4o-mini   # of gpt-4o voor hogere kwaliteit
```

### 3. Start de dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Gebruik

- Klik **Demo** om direct 10 voorbeeldartikelen te laden
- Klik **Scrape bronnen** om echte RSS-feeds te verwerken
- Klik **AI Analyse** om nieuwe artikelen te scoren (vereist OpenAI key)

## Projectstructuur

```
src/
├── app/api/
│   ├── articles/       CRUD + stats API
│   ├── scrape/         RSS-scraping endpoint
│   ├── analyze/        OpenAI analyse endpoint
│   └── seed/           Demo-data loader
├── components/         React dashboard components
├── lib/
│   ├── db/             SQLite database layer
│   ├── ai/             OpenAI integratie + prompts
│   └── scraper/        RSS scraper
└── types/              TypeScript types
data/
├── sources.json        23 Nederlandse nieuwsbronnen
└── powned.db           SQLite database (auto-aangemaakt)
```

---

*Crafted with passion by Note It*
