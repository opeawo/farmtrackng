import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI, Type, type Part } from '@google/genai';
import { env } from '$env/dynamic/private';
const { GEMINI_API_KEY, GEMINI_MODEL } = env;
import { diseases } from '$lib/data/diseases';
import { livestockTypes } from '$lib/data/livestock-types';
import { nigerianStates } from '$lib/data/markets';

const MODEL = GEMINI_MODEL || 'gemini-2.0-flash';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface AiQueryBody {
	question?: string;
	species?: string;
	state?: string;
	imageDataUrl?: string;
}

interface AiQueryResult {
	answer: string;
	severity: 'monitor' | 'treat' | 'urgent' | null;
	drugMentioned: boolean;
	priceInfo: string | null;
	sources: string[];
}

const SYSTEM_PROMPT = `You are FarmTrack's Animal AI, a livestock assistant for Nigerian farmers.

Rules:
- Write in plain, simple English. Avoid Latin disease names in the answer (mention common names only).
- If the question is about animal health, classify a severity: "monitor" (watch and wait), "treat" (start home care), or "urgent" (vet needed today / outbreak risk). One sentence reason inside the answer.
- If the question is not health-related (price, husbandry, feed, breeding), set severity to null.
- If you mention or imply a drug name (e.g. oxytetracycline, ivermectin, diminazene), set drugMentioned to true so the app can show a NAFDAC verification warning.
- If asked about prices, use the markets context provided. Be honest: you do not have real-time prices. Suggest the nearest major market and a reasonable price range only if you can ground it; otherwise tell the farmer to call the market directly. Put price guidance in the priceInfo field.
- If you are unsure or the question is outside your knowledge, say "Please consult a registered veterinarian." in the answer.
- The "sources" array is a short list of background topics you drew on (e.g. "Newcastle Disease (FarmTrack disease library)", "Lagos markets (FarmTrack markets data)"). Keep it under 4 items.
- Return ONLY a JSON object with keys: answer, severity, drugMentioned, priceInfo, sources. No prose outside the JSON.`;

const RESPONSE_SCHEMA = {
	type: Type.OBJECT,
	properties: {
		answer: { type: Type.STRING },
		severity: { type: Type.STRING, nullable: true, enum: ['monitor', 'treat', 'urgent'] },
		drugMentioned: { type: Type.BOOLEAN },
		priceInfo: { type: Type.STRING, nullable: true },
		sources: { type: Type.ARRAY, items: { type: Type.STRING } }
	},
	required: ['answer', 'drugMentioned', 'sources'],
	propertyOrdering: ['answer', 'severity', 'drugMentioned', 'priceInfo', 'sources']
};

function buildContext(species?: string, state?: string): string {
	const relevantDiseases = species
		? diseases.filter((d) => d.livestockTypes.includes(species))
		: diseases;

	const diseaseLines = relevantDiseases
		.map((d) => `- ${d.name} (${d.severity}): symptoms — ${d.symptoms.join(', ')}. First aid: ${d.firstAid}`)
		.join('\n');

	const speciesInfo = species
		? livestockTypes.find((t) => t.id === species)
		: null;
	const speciesLine = speciesInfo
		? `Species: ${speciesInfo.name}. Common Nigerian breeds: ${speciesInfo.breeds.join(', ')}. Common diseases: ${speciesInfo.commonDiseases.join(', ')}.`
		: 'Species: not specified.';

	const relevantState = state
		? nigerianStates.find((s) => s.name.toLowerCase() === state.toLowerCase())
		: null;
	const marketsLine = relevantState
		? `${relevantState.name} major livestock markets: ${relevantState.majorMarkets.join('; ')}.`
		: `Nigerian livestock market hubs include: ${nigerianStates
				.slice(0, 6)
				.map((s) => `${s.name} (${s.majorMarkets[0] ?? 'major market'})`)
				.join('; ')}.`;

	return `BACKGROUND KNOWLEDGE
${speciesLine}

Known diseases relevant to this question:
${diseaseLines}

Markets context:
${marketsLine}`;
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
	const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
	if (!match) return null;
	return { mimeType: match[1], data: match[2] };
}

export const POST: RequestHandler = async ({ request }) => {
	let body: AiQueryBody;
	try {
		body = (await request.json()) as AiQueryBody;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const question = (body.question ?? '').trim();
	if (!question && !body.imageDataUrl) {
		return json({ error: 'Please type a question or attach a photo.' }, { status: 400 });
	}

	const context = buildContext(body.species, body.state);

	const parts: Part[] = [
		{ text: `${context}\n\nFARMER QUESTION:\n${question || '(no text, see attached photo)'}` }
	];

	if (body.imageDataUrl) {
		const image = parseImageDataUrl(body.imageDataUrl);
		if (image) parts.push({ inlineData: image });
	}

	try {
		const response = await ai.models.generateContent({
			model: MODEL,
			contents: [{ role: 'user', parts }],
			config: {
				systemInstruction: SYSTEM_PROMPT,
				responseMimeType: 'application/json',
				responseSchema: RESPONSE_SCHEMA,
				temperature: 0.4
			}
		});

		const raw = response.text ?? '{}';
		let parsed: Partial<AiQueryResult> = {};
		try {
			parsed = JSON.parse(raw) as Partial<AiQueryResult>;
		} catch {
			return json(
				{ error: 'The AI returned an unreadable response. Please try again.' },
				{ status: 502 }
			);
		}

		const severity = parsed.severity;
		const result: AiQueryResult = {
			answer: parsed.answer ?? 'Please consult a registered veterinarian.',
			severity:
				severity === 'monitor' || severity === 'treat' || severity === 'urgent'
					? severity
					: null,
			drugMentioned: Boolean(parsed.drugMentioned),
			priceInfo:
				typeof parsed.priceInfo === 'string' && parsed.priceInfo.length > 0
					? parsed.priceInfo
					: null,
			sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 4).map(String) : []
		};

		return json(result);
	} catch (err) {
		console.error('[api/ai/query] Gemini call failed', err);
		return json(
			{ error: 'The AI is unavailable right now. Please try again in a moment.' },
			{ status: 500 }
		);
	}
};
