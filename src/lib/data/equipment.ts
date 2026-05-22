export interface Equipment {
	id: string;
	name: string;
	tagline: string;
	description: string;
	priceNgn: number;
	image: string;
	imageAlt: string;
	features: string[];
	specs: { label: string; value: string }[];
}

// Sales contact — used for the "Buy on WhatsApp" CTA.
export const SALES_WHATSAPP = '2348092678583';

// 30% down payment, balance in installments.
export const DOWN_PAYMENT_PCT = 0.3;

export const equipment: Equipment[] = [
	{
		id: 'poultry-processor',
		name: 'Poultry Processor (Full Line)',
		tagline: 'End-to-end processing for commercial broiler farms',
		description:
			'A complete poultry processing line that takes live birds through scalding, defeathering, evisceration, washing, and chilling — all in one set-up. Built for commercial farms ready to step up from manual processing to a clean, traceable, food-safe operation.',
		priceNgn: 6_490_000,
		image: '/images/equipment/poultry-processing-machine-factory-11765539.jpg',
		imageAlt: 'Industrial poultry processing equipment in operation',
		features: [
			'Handles scalding, defeathering, evisceration and chilling',
			'Stainless steel contact surfaces — food-safe and easy to clean',
			'Suitable for medium and large commercial farms',
			'Installation and operator training included'
		],
		specs: [
			{ label: 'Capacity', value: '300–500 birds/hour' },
			{ label: 'Power', value: '3-phase electric' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Warranty', value: '12 months on parts' }
		]
	},
	{
		id: 'defeathering-machine',
		name: 'Defeathering Machine',
		tagline: 'Pluck a batch of birds clean in under a minute',
		description:
			'A heavy-duty rotating drum lined with rubber plucker fingers that strip feathers off scalded birds in 30–60 seconds. Designed for small and mid-size processors who want speed without the cost of a full line.',
		priceNgn: 1_980_000,
		image: '/images/equipment/stainless-steel-industrial-drum-machine-34397245.jpg',
		imageAlt: 'Stainless steel industrial drum machine',
		features: [
			'Plucks 20–30 birds per cycle',
			'Locally fabricated, easy to service',
			'Replaceable rubber fingers (sold separately)',
			'Mounts on a stand or tabletop'
		],
		specs: [
			{ label: 'Capacity', value: '20–30 birds / 1–2 minutes' },
			{ label: 'Power', value: '1.5–2 HP electric motor' },
			{ label: 'Drum size', value: 'Approx. 65 cm diameter' },
			{ label: 'Warranty', value: '6 months on the motor' }
		]
	},
	{
		id: 'chicken-cutter',
		name: 'Electric Chicken Cutter',
		tagline: 'Portion whole chickens fast and consistently',
		description:
			'An electric bone-cutting machine that portions whole chickens into uniform pieces — wings, drums, thighs, breasts — at the size your customer wants. Stainless steel blades make it food-safe and easy to keep clean between batches.',
		priceNgn: 767_800,
		image: '/images/equipment/raw-chicken-meat-butcher-cutting-6281497.jpg',
		imageAlt: 'Raw chicken being portioned',
		features: [
			'Cuts through bone cleanly — uniform portions every time',
			'Stainless steel blades, removable for cleaning',
			'Adjustable cut size',
			'Built-in safety guard on the blade housing'
		],
		specs: [
			{ label: 'Throughput', value: 'Up to 600 cuts/hour' },
			{ label: 'Power', value: '1.5 kW, single-phase 220V' },
			{ label: 'Blade', value: 'Stainless steel, replaceable' },
			{ label: 'Warranty', value: '6 months on parts' }
		]
	}
];

export function getEquipment(id: string): Equipment | undefined {
	return equipment.find((e) => e.id === id);
}

export function formatNgn(amount: number): string {
	return '₦' + amount.toLocaleString('en-NG');
}

export function downPayment(price: number): number {
	return Math.round(price * DOWN_PAYMENT_PCT);
}

export function balanceAmount(price: number): number {
	return price - downPayment(price);
}

export function whatsappBuyUrl(item: Equipment): string {
	const down = formatNgn(downPayment(item.priceNgn));
	const balance = formatNgn(balanceAmount(item.priceNgn));
	const total = formatNgn(item.priceNgn);
	const message =
		`Hello FarmTrack, I'm interested in buying the ${item.name} (${total}).\n\n` +
		`I'd like to pay the 30% down payment of ${down} and spread the remaining ${balance} in installments.\n\n` +
		`Please send me the next steps.`;
	return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
