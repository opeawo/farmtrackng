import { sendWhatsAppMessage } from './whatsapp.js';

type Intent = 'price_check' | 'alert_check' | 'greeting' | 'unknown';

function classifyIntent(message: string): Intent {
	const lower = message.toLowerCase();

	if (/hello|hi|hey|good (morning|afternoon|evening)/.test(lower)) return 'greeting';
	if (/price|how much|cost|market|sell|buy/.test(lower)) return 'price_check';
	if (/alert|outbreak|warning|danger/.test(lower)) return 'alert_check';

	return 'unknown';
}

const RESPONSES: Record<Intent, string> = {
	greeting:
		'Welcome to FarmPaddy! 🐄\n\nI can help you with:\n1. Market prices\n2. Disease alerts\n\nFor diagnosis, photo-based help, or veterinary advice, open the FarmPaddy app and tap "Ask Animal AI".',
	price_check:
		'To check market prices, please tell me:\n- What animal? (e.g., cattle, goat, chicken)\n- Which state/market?\n\nExample: "Price of cattle in Lagos"',
	alert_check:
		"I'll check for disease alerts in your area. Please share your location or tell me your state.",
	unknown:
		'I\'m not sure I understand. You can ask me about:\n1. Market prices\n2. Disease alerts\n\nFor health diagnosis or veterinary advice, please use the Animal AI in the FarmPaddy app.'
};

export async function handleIncomingMessage(phone: string, message: string): Promise<void> {
	const intent = classifyIntent(message);
	const response = RESPONSES[intent];
	await sendWhatsAppMessage(phone, response);
}
