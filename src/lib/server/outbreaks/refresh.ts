// The internal outbreak tool: gather recent Nigeria livestock disease
// outbreaks nationwide via Gemini Flash + Google Search grounding, validate
// (never hallucinate — drop any row without a real source URL), and upsert
// into the accumulating dataset. Runs lazily on the first feed load each day.

import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { parseOutbreaks } from './schema';
import { upsertOutbreaks, setLastRefresh } from './store';

const { GEMINI_API_KEY, GEMINI_MODEL } = env;
const MODEL = GEMINI_MODEL || 'gemini-flash-latest';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const DISEASE_FOCUS = [
	'avian influenza (bird flu / HPAI)',
	'Newcastle disease',
	'anthrax',
	'foot and mouth disease',
	'peste des petits ruminants (PPR)',
	'African swine fever',
	'lumpy skin disease',
	'contagious bovine pleuropneumonia (CBPP)',
	'rabies'
].join(', ');

const SYSTEM_INSTRUCTION = `You compile a dataset of RECENT (last ~90 days) animal/livestock disease outbreaks in NIGERIA ONLY, for the FarmPaddy app used by Nigerian farmers.

Use Google Search to find outbreaks reported by, in priority order:
- WOAH WAHIS (World Organisation for Animal Health information system)
- Nigeria NADIS (nadis.online, the national animal disease surveillance system)
- ReliefWeb (reliefweb.int)
- Reputable Nigerian government / news / FAO reports

HARD RULES:
- NIGERIA ONLY. Ignore outbreaks in other countries.
- Only include an outbreak you ACTUALLY found via search. NEVER invent or guess one.
- Every outbreak MUST have a real, working sourceUrl (the exact page you found it on). If you cannot attach a real URL, DROP the item.
- Nigerian livestock only (poultry, cattle, goat, sheep, pig). Ignore crop pests and purely-human diseases unless zoonotic and animal-linked (e.g. anthrax, avian influenza, rabies).
- severity: "urgent" (highly contagious / zoonotic / fast-killing, e.g. HPAI, anthrax, ASF), "treat" (treatable but needs action), "monitor" (low immediate risk).
- summary: ONE plain-language sentence a farmer understands. No jargon.
- state: the Nigerian state. lga: the Local Government Area if known, else null.
- datePosted: when the source reported it (e.g. "May 2026" or a date).
- If you find nothing credible, return exactly: []

OUTPUT: a JSON array ONLY (no prose, no markdown fences). Each element:
{"disease","species","state","lga","severity","summary","datePosted","source","sourceUrl"}
- species: one of poultry|cattle|goat|sheep|pig|other
- source: one of "WOAH WAHIS"|"NADIS"|"ReliefWeb"|"other"`;

const PROMPT = `Prioritise these diseases: ${DISEASE_FOCUS}.
Search now and return the JSON array of recent Nigerian livestock disease outbreaks.`;

// Best-effort per-instance lock to avoid a refresh stampede when several
// first-of-the-day requests hit the same serverless instance at once.
let refreshing = false;

export function isRefreshing(): boolean {
	return refreshing;
}

/**
 * Run the tool: gather → validate → upsert → stamp the refresh marker.
 * Returns the number of validated outbreaks gathered. Throws on Gemini error
 * so the caller can decide whether to surface it (only when the DB is empty).
 */
export async function runRefresh(): Promise<number> {
	refreshing = true;
	try {
		const response = await ai.models.generateContent({
			model: MODEL,
			contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
			config: {
				systemInstruction: SYSTEM_INSTRUCTION,
				tools: [{ googleSearch: {} }],
				temperature: 0.3
			}
		});
		const outbreaks = parseOutbreaks(response.text ?? '');
		await upsertOutbreaks(outbreaks);
		await setLastRefresh(new Date());
		return outbreaks.length;
	} finally {
		refreshing = false;
	}
}
