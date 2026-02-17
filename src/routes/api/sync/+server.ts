import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/utils/db';

interface SyncAction {
	id: string;
	table: string;
	data: Record<string, unknown>;
	action: 'insert' | 'update' | 'delete';
}

export const POST: RequestHandler = async ({ request }) => {
	const { actions } = (await request.json()) as { actions: SyncAction[] };

	if (!actions || !Array.isArray(actions)) {
		return json({ error: 'Invalid sync payload' }, { status: 400 });
	}

	const results: { id: string; success: boolean; error?: string }[] = [];

	for (const action of actions) {
		try {
			if (action.action === 'insert') {
				const { error } = await supabase.from(action.table).insert(action.data);
				results.push({ id: action.id, success: !error, error: error?.message });
			} else if (action.action === 'update') {
				const { id: recordId, ...updateData } = action.data;
				const { error } = await supabase.from(action.table).update(updateData).eq('id', recordId);
				results.push({ id: action.id, success: !error, error: error?.message });
			} else if (action.action === 'delete') {
				const { error } = await supabase.from(action.table).delete().eq('id', action.data.id);
				results.push({ id: action.id, success: !error, error: error?.message });
			}
		} catch (e) {
			results.push({ id: action.id, success: false, error: 'Unknown error' });
		}
	}

	return json({ results });
};
