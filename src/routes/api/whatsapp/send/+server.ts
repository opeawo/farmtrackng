import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendWhatsAppMessage } from '$lib/utils/whatsapp';

export const POST: RequestHandler = async ({ request }) => {
	const { to, message } = await request.json();

	if (!to || !message) {
		return json({ error: 'Missing required fields: to, message' }, { status: 400 });
	}

	const success = await sendWhatsAppMessage(to, message);

	if (success) {
		return json({ status: 'sent' });
	}

	return json({ error: 'Failed to send message' }, { status: 500 });
};
