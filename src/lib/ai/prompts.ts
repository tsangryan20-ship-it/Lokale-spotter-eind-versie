export const POWNED_SYSTEM_PROMPT = `Je bent de AI-filter voor de PowNed-redactie. PowNed is een Nederlandse publieke omroep bekend om zijn uitgesproken, soms provocerende stijl.

PowNed is geïnteresseerd in items die:
- SENSATIONEEL zijn: ophef, schandalen, ongelofelijke situaties
- CONFLICT bevatten: ruzies, confrontaties, boze burgers
- POLITIEKE OPHEF veroorzaken: beleid dat mislukt, politici in de problemen
- VIRAAL kunnen gaan: grappig, bizar, ongelofelijk
- 112-nieuws: ernstige incidenten, overvallen, aanslagen, liquidaties
- MAATSCHAPPELIJKE SPANNING: asielzoekers (Ter Apel), protesten, discriminatie-discussies
- ENTERTAINMENT/JUICE: celebrity drama, tv-roddels, bekende Nederlanders
- LIFESTYLE-OPHEF: fatbikes, bloot/boerkini-discussies, woke-nieuws, sexuele intimidatie

PowNed is NIET geïnteresseerd in:
- Droge economische rapporten zonder conflict
- Buitenlands nieuws zonder duidelijke Nederlandse link
- Wetenschappelijk nieuws zonder maatschappelijke ophef
- Sportnieuws (tenzij schandaal)

Scoringsgids:
- 90-100: Must-have PowNed-item, onmiddellijk oppakken
- 70-89: Sterk PowNed-item, zeer relevant
- 50-69: Potentieel interessant, nader onderzoek waard
- 30-49: Marginaal relevant
- 0-29: Niet relevant voor PowNed

Geef ALTIJD een JSON-antwoord:
{
  "score": <0-100>,
  "summary": "<vlijmscherpe samenvatting in PowNed-stijl, max 2 zinnen>",
  "angle": "<PowNed-insteek: welke vragen moet de verslaggever stellen? Wie moeten we spreken?>",
  "categories": [<"112-alarm"|"viraal"|"politiek"|"juice-entertainment"|"conflict-ophef"|"algemeen">],
  "provinces": [<provincienamen of "Nationaal">],
  "tags": [<3-6 relevante tags>],
  "city": "<exacte stad/gemeente of null>",
  "lat": <breedtegraad als getal of null>,
  "lng": <lengtegraad als getal of null>
}`;

export const AUDIO_SYSTEM_PROMPT = `Je bent een AI die audiotranscripties analyseert op nieuwswaarde voor PowNed.
Analyseer de transcriptie op:
1. Stressniveau van de spreker (0-100)
2. Relevantie voor PowNed (0-100)
3. Controversiële onderwerpen (asiel, fatbikes, politiek, misdaad, ophef)
4. Wie spreekt (anoniem aanduiden als Spreker 1, Spreker 2 etc.)

Geef een JSON-antwoord:
{
  "sentiment_score": <0-100, waarbij 100 = maximale opwinding/stress>,
  "stress_detected": <true/false>,
  "powned_relevance": <0-100>,
  "summary": "<samenvatting van wat er gezegd wordt>",
  "trigger_alert": <true indien stress > 70 EN relevantie > 60>,
  "alert_reason": "<reden voor alert of null>",
  "topics": [<gevonden controversiële onderwerpen>]
}`;

export function buildAnalysisPrompt(title: string, description: string, url: string): string {
  return `Analyseer voor de PowNed-redactie:

TITEL: ${title}
BESCHRIJVING: ${description.slice(0, 2000)}
URL: ${url}

Geef je analyse in het gevraagde JSON-formaat. Bepaal ook de exacte locatie (stad + coördinaten) als die in de tekst herkenbaar is.`;
}

export interface FeedbackExample {
  article_title: string;
  feedback_type: 'hit' | 'miss';
  reason: string | null;
  score_at_time: number;
}

export function buildFewShotSection(examples: FeedbackExample[]): string {
  if (examples.length === 0) return '';
  const hits = examples.filter(e => e.feedback_type === 'hit').slice(0, 6);
  const misses = examples.filter(e => e.feedback_type === 'miss').slice(0, 6);
  let section = '\n\n## REDACTIE KALIBRATIE (leer hiervan — recente feedback van de redactie):';
  if (hits.length) {
    section += '\n\n✅ Goed ingeschat (redactie bevestigde dit als PowNed-waardig):';
    hits.forEach(h => { section += `\n- "${h.article_title}" (score gegeven: ${h.score_at_time})`; });
  }
  if (misses.length) {
    section += '\n\n❌ Fout ingeschat (redactie markeerde dit als NIET PowNed-waardig):';
    misses.forEach(m => {
      section += `\n- "${m.article_title}" (score gegeven: ${m.score_at_time})`;
      if (m.reason) section += ` — reden: ${m.reason}`;
    });
  }
  return section;
}

export function buildAnalysisPromptWithFewShot(
  title: string, description: string, url: string, examples: FeedbackExample[]
): string {
  return buildAnalysisPrompt(title, description, url) + buildFewShotSection(examples);
}

export function buildAudioPrompt(transcript: string): string {
  return `Analyseer deze audiotranscriptie voor de PowNed-redactie:

TRANSCRIPTIE:
${transcript.slice(0, 4000)}

Geef je analyse in het gevraagde JSON-formaat.`;
}
