import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { diseases } from '$lib/data/diseases';
import { livestockTypes } from '$lib/data/livestock-types';
import { nigerianStates } from '$lib/data/markets';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

	const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
		{
			type: 'text',
			text: `${context}\n\nFARMER QUESTION:\n${question || '(no text, see attached photo)'}`
		}
	];

	if (body.imageDataUrl && body.imageDataUrl.startsWith('data:image/')) {
		userContent.push({
			type: 'image_url',
			image_url: { url: body.imageDataUrl }
		});
	}

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: userContent }
			]
		});

		const raw = completion.choices[0]?.message?.content ?? '{}';
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
			priceInfo: typeof parsed.priceInfo === 'string' && parsed.priceInfo.length > 0
				? parsed.priceInfo
				: null,
			sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 4).map(String) : []
		};

		return json(result);
	} catch (err) {
		console.error('[api/ai/query] OpenAI call failed', err);
		return json(
			{ error: 'The AI is unavailable right now. Please try again in a moment.' },
			{ status: 500 }
		);
	}
};
