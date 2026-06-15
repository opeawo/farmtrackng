import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { handleIncomingMessage } from '$lib/utils/whatsapp-bot';

const { WHATSAPP_VERIFY_TOKEN } = env;

export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
		return new Response(challenge, { status: 200 });
	}

	return json({ error: 'Forbidden' }, { status: 403 });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const entry = body?.entry?.[0];
	const changes = entry?.changes?.[0];
	const value = changes?.value;

	if (value?.messages) {
		for (const message of value.messages) {
			const phone = message.from;
			const text = message.text?.body || '';

			if (text) {
				await handleIncomingMessage(phone, text);
			}
		}
	}

	return json({ status: 'ok' });
};
