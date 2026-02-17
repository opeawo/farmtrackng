import { supabase } from './db.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export async function sendVaccinationReminders(): Promise<number> {
	const tomorrow = addDays(new Date(), 1);

	const { data: schedules, error } = await supabase
		.from('vaccination_schedules')
		.select(
			`
			*,
			profiles:user_id (full_name, phone, whatsapp_opted_in),
			livestock:livestock_id (livestock_type, tag_id)
		`
		)
		.eq('completed', false)
		.eq('reminder_sent', false)
		.gte('scheduled_date', startOfDay(tomorrow).toISOString())
		.lte('scheduled_date', endOfDay(tomorrow).toISOString());

	if (error || !schedules) return 0;

	let sent = 0;
	for (const schedule of schedules) {
		const profile = schedule.profiles as { full_name: string; phone: string; whatsapp_opted_in: boolean } | null;
		if (!profile?.whatsapp_opted_in || !profile.phone) continue;

		const livestock = schedule.livestock as { livestock_type: string; tag_id: string } | null;
		const animalInfo = livestock ? `${livestock.livestock_type} (${livestock.tag_id || 'no tag'})` : 'your animal';

		const message =
			`Reminder: ${schedule.vaccine_name} vaccination for ${animalInfo} is scheduled for tomorrow.\n\n` +
			`Disease: ${schedule.disease_target}\n` +
			`Please contact your vet to arrange the vaccination.`;

		const success = await sendWhatsAppMessage(profile.phone, message);
		if (success) {
			await supabase
				.from('vaccination_schedules')
				.update({ reminder_sent: true })
				.eq('id', schedule.id);
			sent++;
		}
	}

	return sent;
}
