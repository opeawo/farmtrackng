import { sendWhatsAppMessage } from './whatsapp.js';

type Intent = 'price_check' | 'health_help' | 'record_entry' | 'alert_check' | 'greeting' | 'unknown';

function classifyIntent(message: string): Intent {
	const lower = message.toLowerCase();

	if (/hello|hi|hey|good (morning|afternoon|evening)/.test(lower)) return 'greeting';
	if (/price|how much|cost|market|sell|buy/.test(lower)) return 'price_check';
	if (/sick|disease|symptom|health|fever|not eating|dying|dead/.test(lower)) return 'health_help';
	if (/record|bought|sold|fed|vaccin|born|birth/.test(lower)) return 'record_entry';
	if (/alert|outbreak|warning|danger/.test(lower)) return 'alert_check';

	return 'unknown';
}

const RESPONSES: Record<Intent, string> = {
	greeting:
		'Welcome to FarmTrack! 🐄\n\nI can help you with:\n1. Market prices\n2. Animal health\n3. Farm records\n4. Disease alerts\n\nWhat would you like to know?',
	price_check:
		'To check market prices, please tell me:\n- What animal? (e.g., cattle, goat, chicken)\n- Which state/market?\n\nExample: "Price of cattle in Lagos"',
	health_help:
		'I can help with animal health. Please describe:\n- What animal is affected?\n- What symptoms do you see?\n- How long has it been?\n\nFor emergencies, please contact your nearest vet immediately.',
	record_entry:
		'To add a farm record, please visit the FarmTrack app and tap "Add Record". You can use voice recording for quick entries!\n\nOr tell me what happened and I\'ll log it for you.',
	alert_check:
		'I\'ll check for disease alerts in your area. Please share your location or tell me your state.',
	unknown:
		'I\'m not sure I understand. You can ask me about:\n1. Market prices\n2. Animal health\n3. Farm records\n4. Disease alerts\n\nPlease try again or type "help" for more options.'
};

export async function handleIncomingMessage(phone: string, message: string): Promise<void> {
	const intent = classifyIntent(message);
	const response = RESPONSES[intent];
	await sendWhatsAppMessage(phone, response);
}
