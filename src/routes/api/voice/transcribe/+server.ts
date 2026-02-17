import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const audioFile = formData.get('audio') as File | null;

	if (!audioFile) {
		return json({ error: 'No audio file provided' }, { status: 400 });
	}

	try {
		const transcription = await openai.audio.transcriptions.create({
			file: audioFile,
			model: 'whisper-1',
			language: 'en'
		});

		return json({ text: transcription.text });
	} catch {
		return json({ error: 'Transcription failed' }, { status: 500 });
	}
};
