import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getEquipment } from '$lib/data/equipment';

export const load: PageLoad = ({ params }) => {
	const item = getEquipment(params.id);
	if (!item) throw error(404, 'Equipment not found');
	return { item };
};
