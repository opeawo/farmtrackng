import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI, type Part } from '@google/genai';
import { env } from '$env/dynamic/private';
const { GEMINI_API_KEY, GEMINI_MODEL } = env;

const MODEL = GEMINI_MODEL || 'gemini-flash-latest';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const audioFile = formData.get('audio') as File | null;

	if (!audioFile) {
		return json({ error: 'No audio file provided' }, { status: 400 });
	}

	try {
		const buffer = await audioFile.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		const mimeType = audioFile.type || 'audio/webm';

		const parts: Part[] = [
			{ inlineData: { mimeType, data: base64 } },
			{
				text: 'Transcribe this audio verbatim. The speaker is a Nigerian farmer asking about livestock — accept Nigerian English, Pidgin, and code-switching. Return ONLY the transcript text, no preamble, no quotes, no commentary.'
			}
		];

		const response = await ai.models.generateContent({
			model: MODEL,
			contents: [{ role: 'user', parts }],
			config: { temperature: 0 }
		});

		const text = (response.text ?? '').trim();
		return json({ text });
	} catch (err) {
		console.error('[api/voice/transcribe] Gemini call failed', err);
		return json({ error: 'Transcription failed' }, { status: 500 });
	}
};
