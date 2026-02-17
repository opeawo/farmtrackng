import { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } from '$env/static/private';

const BASE_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`;

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
	const response = await fetch(`${BASE_URL}/messages`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to,
			type: 'text',
			text: { body: text }
		})
	});

	return response.ok;
}

export async function sendWhatsAppTemplate(
	to: string,
	templateName: string,
	languageCode: string = 'en',
	parameters: string[] = []
): Promise<boolean> {
	const components =
		parameters.length > 0
			? [
					{
						type: 'body',
						parameters: parameters.map((p) => ({ type: 'text', text: p }))
					}
				]
			: [];

	const response = await fetch(`${BASE_URL}/messages`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to,
			type: 'template',
			template: {
				name: templateName,
				language: { code: languageCode },
				components
			}
		})
	});

	return response.ok;
}
