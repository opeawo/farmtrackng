import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	getAgents,
	getMarketsByState,
	getLivestockTypes,
	appendPriceRow,
	normalisePhone
} from '$lib/server/markets/sheets';
import { unitForProduct } from '$lib/markets/units';

// Today's timestamp in West Africa Time (GMT+1), "YYYY-MM-DD HH:mm:ss".
function nowWat(): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Africa/Lagos',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).format(new Date());
	// en-CA renders as "2026-06-14, 14:30:00"
	return parts.replace(', ', ' ');
}

const GENERIC_REJECT = 'This phone number is not registered. Contact your coordinator.';

interface VerifiedContext {
	verified: true;
	phone: string;
	state: string;
	name: string;
	markets: string[];
	livestockTypes: string[];
}

async function buildContext(phone: string): Promise<VerifiedContext | null> {
	const agents = await getAgents();
	const agent = agents.get(phone);
	if (!agent) return null;
	const [marketsByState, livestockTypes] = await Promise.all([
		getMarketsByState(),
		getLivestockTypes()
	]);
	return {
		verified: true,
		phone,
		state: agent.state,
		name: agent.name,
		markets: marketsByState.get(agent.state) ?? [],
		livestockTypes
	};
}

export const actions: Actions = {
	// Step 1 — check the phone against the agent allowlist.
	verify: async ({ request }) => {
		const form = await request.formData();
		const phoneRaw = String(form.get('phone') || '');
		const phone = normalisePhone(phoneRaw);
		if (!phone) {
			return fail(400, { error: 'Enter a valid Nigerian phone number.', phone: phoneRaw });
		}

		let ctx: VerifiedContext | null;
		try {
			ctx = await buildContext(phone);
		} catch (err) {
			console.error('[submit-livestock-price/verify] sheet error', err);
			return fail(500, { error: 'Could not reach the records. Try again shortly.', phone: phoneRaw });
		}
		if (!ctx) return fail(403, { error: GENERIC_REJECT, phone: phoneRaw });
		return ctx;
	},

	// Step 2 — re-validate everything server-side and append the entry.
	submit: async ({ request }) => {
		const form = await request.formData();
		const phoneRaw = String(form.get('phone') || '');
		const market = String(form.get('market') || '').trim();
		const product = String(form.get('product') || '').trim();
		const priceRaw = String(form.get('price') || '').trim();

		const phone = normalisePhone(phoneRaw);
		if (!phone) return fail(400, { error: 'Session expired. Enter your phone again.', phone: phoneRaw });

		let ctx: VerifiedContext | null;
		try {
			ctx = await buildContext(phone);
		} catch (err) {
			console.error('[submit-livestock-price/submit] sheet error', err);
			return fail(500, { error: 'Could not reach the records. Try again shortly.', phone: phoneRaw });
		}
		if (!ctx) return fail(403, { error: GENERIC_REJECT, phone: phoneRaw });

		const price = Number(priceRaw.replace(/[₦,\s]/g, ''));
		const errors: string[] = [];
		if (!ctx.markets.includes(market)) errors.push('Choose a market in your state.');
		if (!ctx.livestockTypes.includes(product)) errors.push('Choose a livestock type from the list.');
		if (!Number.isFinite(price) || price <= 0)
			errors.push(`Enter a valid price in ₦ ${unitForProduct(product)}.`);

		if (errors.length > 0) {
			return fail(400, { ...ctx, error: errors.join(' '), badMarket: market, badProduct: product, badPrice: priceRaw });
		}

		try {
			// Column order: TimestampWAT | Phone | State | Market | Livestock Type | PriceNgn | Unit
			// The unit is the commodity's bound reporting unit, computed server-side —
			// agents never supply a unit, so a mismatched unit cannot enter the dataset.
			await appendPriceRow([
				nowWat(),
				phone,
				ctx.state,
				market,
				product,
				Math.round(price),
				unitForProduct(product)
			]);
		} catch (err) {
			console.error('[submit-livestock-price/submit] append failed', err);
			return fail(500, { ...ctx, error: 'Could not save the entry. Try again.', badMarket: market, badProduct: product, badPrice: priceRaw });
		}

		return { ...ctx, submitted: true, savedProduct: product, savedMarket: market, savedPrice: Math.round(price) };
	}
};
