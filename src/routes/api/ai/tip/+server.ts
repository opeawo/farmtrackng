// Daily "Tip of the day" generator. One short, practical livestock tip
// for a Nigerian farmer. Optionally personalised by species + state.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';

const { GEMINI_API_KEY, GEMINI_MODEL } = env;
const MODEL = GEMINI_MODEL || 'gemini-flash-latest';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You write the "Tip of the day" shown on the FarmTrack home screen to Nigerian farmers, livestock keepers, and animal health workers.

Write ONE tip per request. Hard rules:
- One or two sentences. Under 30 words total.
- Practical and actionable today — not philosophical.
- Concrete: a specific action, schedule, or check ("Vaccinate broilers against Gumboro at day 14", not "vaccinate your birds regularly").
- Plain English. No Latin disease names in the tip.
- Never invent a drug name, exact dose, or vaccine brand.
- Never give a price.
- If a species is provided, tailor the tip to that species. Otherwise pick whichever species the tip best fits.
- Return ONLY the tip text. No "Tip:" prefix, no quotes, no emoji, no extra commentary.`;

export const POST: RequestHandler = async ({ request }) => {
	let body: { species?: string; state?: string; dayOfYear?: number };
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const speciesLine = body.species ? `Species in focus: ${body.species}.` : 'No species specified.';
	const stateLine = body.state ? `Region: ${body.state}, Nigeria.` : 'Region: Nigeria (general).';
	const seedLine = body.dayOfYear
		? `Variety seed: day ${body.dayOfYear} of the year — pick a tip topic that fits this season (early year = harmattan/dry season; mid year = rains/heat stress; later = harvest/restock).`
		: '';

	const prompt = [speciesLine, stateLine, seedLine, 'Now write the tip.']
		.filter(Boolean)
		.join('\n');

	try {
		const response = await ai.models.generateContent({
			model: MODEL,
			contents: [{ role: 'user', parts: [{ text: prompt }] }],
			config: {
				systemInstruction: SYSTEM_INSTRUCTION,
				temperature: 0.9,
				maxOutputTokens: 80
			}
		});

		const tip = (response.text ?? '').trim().replace(/^["']|["']$/g, '');
		if (!tip) {
			return json({ error: 'No tip generated.' }, { status: 502 });
		}
		return json({ tip });
	} catch (err) {
		console.error('[api/ai/tip] Gemini call failed', err);
		return json({ error: 'Tip unavailable.' }, { status: 500 });
	}
};
