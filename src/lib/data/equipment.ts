export interface Equipment {
	id: string;
	name: string;
	tagline: string;
	description: string;
	priceNgn: number;
	image?: string;
	imageAlt?: string;
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
		image: '/images/equipment/poultry-processor.jpg',
		imageAlt: 'Poultry processing line equipment',
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
		priceNgn: 994_500,
		image: '/images/equipment/defeathering-machine.jpg',
		imageAlt: 'Drum feather plucker with rubber plucker fingers',
		features: [
			'Plucks 5–10 birds per cycle',
			'Locally fabricated, easy to service',
			'Replaceable rubber fingers (sold separately)',
			'Mounts on a stand or tabletop'
		],
		specs: [
			{
				label: 'Bird Capacity',
				value: '5–10 birds per cycle (broilers up to 4 kg / 8.8 lbs each)'
			},
			{
				label: 'Drum Diameter',
				value: '"Big Gun" size – 24–28 inches (600–700 mm) for faster feather removal'
			},
			{
				label: 'Material',
				value: 'Thicker-gauge stainless steel body (min. 1.5 mm / 16 ga) – rust-resistant & rigid'
			},
			{ label: 'Motor Type', value: 'Electric, single-phase (220V/110V available)' },
			{ label: 'Motor Power', value: '1.5 HP – 2 HP (industrial grade, locally sourced)' },
			{
				label: 'Motor Speed',
				value: '1400–1750 RPM (with pulley reduction for optimal feather plucking torque)'
			},
			{
				label: 'Finger Material',
				value: 'High-grade natural rubber or food-safe TPU (UV/heat resistant)'
			},
			{ label: 'Number of Fingers', value: '80–120 (longer life than imported budget models)' },
			{ label: 'Drive System', value: 'V-belt & pulley (easy local repair; no custom parts)' },
			{ label: 'Water Inlet', value: 'Integrated spray bar (continuous rinse – cleaner birds)' },
			{ label: 'Discharge Door', value: 'Spring-loaded or cam-lock (quick release, no tools)' },
			{ label: 'Base Frame', value: 'Heavy-wall square tubing + vibration-dampening rubber feet' },
			{ label: 'Finish', value: 'Industrial powder coat or brushed stainless (no sharp edges)' },
			{ label: 'Dimensions (approx)', value: '900mm L × 700mm W × 1100mm H' },
			{ label: 'Weight', value: '85–110 kg (solid, won’t walk during operation)' },
			{ label: 'Warranty', value: '6 months structural + 3 months motor (local serviceable)' }
		]
	},
	{
		id: 'chicken-cutter',
		name: 'Electric Chicken Cutter',
		tagline: 'Portion whole chickens fast and consistently',
		description:
			'An electric bone-cutting machine that portions whole chickens into uniform pieces — wings, drums, thighs, breasts — at the size your customer wants. Stainless steel blades make it food-safe and easy to keep clean between batches.',
		priceNgn: 450_000,
		image: '/images/equipment/chicken-cutter.jpg',
		imageAlt: 'Electric chicken cutter with blade guard',
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
	},
	{
		id: 'killing-cones',
		name: 'Killing Cones / Bleeding Station (12 birds)',
		tagline: 'Bleed 12 birds at once, cleanly and humanely',
		description:
			'A stainless steel bleeding station with 12 cones that hold birds head-down for a clean, humane kill and full bleed-out. The slanted trough channels blood into one collection point, so your kill area stays tidy and food-safe instead of messy and hard to clean.',
		priceNgn: 350_000,
		features: [
			'12 cones — bleed a full batch at once',
			'Stainless steel, easy to rinse down between batches',
			'Sloped blood trough drains to a single point',
			'Wall-mount or free-standing fabrication'
		],
		specs: [
			{ label: 'Capacity', value: '12 birds per cycle' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Use', value: 'Stunning, killing and bleed-out' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'hot-water-scalder',
		name: 'Hot Water Scalder',
		tagline: 'Loosen feathers fast with controlled hot water',
		description:
			'A heated water tank that holds birds at the right scalding temperature so feathers release easily before plucking. Getting the temperature right is what makes the difference between a clean pluck and torn skin — this tank holds it steady so every batch comes out the same.',
		priceNgn: 390_000,
		features: [
			'Holds water at a steady scalding temperature',
			'Stainless steel tank — food-safe and easy to clean',
			'Sized to feed a small-to-mid feather plucker',
			'Drain tap for quick emptying between sessions'
		],
		specs: [
			{ label: 'Function', value: 'Pre-pluck scalding' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Heating', value: 'Electric element' },
			{ label: 'Warranty', value: '6 months on the heating element' }
		]
	},
	{
		id: 'feather-plucker-3',
		name: 'Feather Plucker (3 birds)',
		tagline: 'Compact plucker for small batches and home use',
		description:
			'A small rotating-drum plucker that cleans up to 3 scalded birds in under a minute. Perfect for backyard farms, small butchers and anyone processing a handful of birds a day who wants to stop plucking by hand.',
		priceNgn: 400_000,
		features: [
			'Plucks up to 3 birds per cycle',
			'Rubber plucker fingers strip feathers in 30–60 seconds',
			'Small footprint — fits a corner of any kill room',
			'Locally fabricated and easy to service'
		],
		specs: [
			{ label: 'Capacity', value: 'Up to 3 birds / cycle' },
			{ label: 'Power', value: 'Single-phase electric motor' },
			{ label: 'Material', value: 'Stainless steel drum' },
			{ label: 'Warranty', value: '6 months on the motor' }
		]
	},
	{
		id: 'feather-plucker-5',
		name: 'Feather Plucker (5–7 birds)',
		tagline: 'Step up your daily throughput without a full line',
		description:
			'A mid-size rotating-drum plucker that cleans 5 to 7 scalded birds per cycle. The right size for a growing farm or busy butcher that has outgrown the 3-bird unit but is not ready for an industrial machine.',
		priceNgn: 600_000,
		features: [
			'Plucks 5–7 birds per cycle',
			'Replaceable rubber fingers (sold separately)',
			'Sturdy frame for daily commercial use',
			'Locally fabricated, easy to service'
		],
		specs: [
			{ label: 'Capacity', value: '5–7 birds / cycle' },
			{ label: 'Power', value: 'Single-phase electric motor' },
			{ label: 'Material', value: 'Stainless steel drum' },
			{ label: 'Warranty', value: '6 months on the motor' }
		]
	},
	{
		id: 'feather-plucker-10',
		name: 'Feather Plucker (10–15 birds)',
		tagline: 'High-volume plucking for busy processing days',
		description:
			'A large rotating-drum plucker that cleans 10 to 15 scalded birds in a single cycle. Built for farms and processors handling high volume who need to keep the line moving without a full processing plant.',
		priceNgn: 950_000,
		features: [
			'Plucks 10–15 birds per cycle',
			'Heavy-duty motor for back-to-back batches',
			'Replaceable rubber fingers (sold separately)',
			'Mounts on a reinforced stand'
		],
		specs: [
			{ label: 'Capacity', value: '10–15 birds / cycle' },
			{ label: 'Power', value: '1.5–2 HP electric motor' },
			{ label: 'Material', value: 'Stainless steel drum' },
			{ label: 'Warranty', value: '6 months on the motor' }
		]
	},
	{
		id: 'feather-plucker-industrial',
		name: 'Industrial Feather Plucker (25–30 birds)',
		tagline: 'Plant-grade plucking for commercial volume',
		description:
			'A heavy-duty industrial drum that strips feathers off 25 to 30 scalded birds in a single 1–2 minute cycle. Designed for commercial processors who want plant-grade throughput as a standalone station, not a full line.',
		priceNgn: 1_400_000,
		features: [
			'Plucks 25–30 birds per cycle',
			'Industrial motor built for all-day operation',
			'Replaceable rubber fingers (sold separately)',
			'Mounts on a heavy-duty stand'
		],
		specs: [
			{ label: 'Capacity', value: '25–30 birds / 1–2 minutes' },
			{ label: 'Power', value: '2 HP+ electric motor' },
			{ label: 'Material', value: 'Stainless steel drum' },
			{ label: 'Warranty', value: '6 months on the motor' }
		]
	},
	{
		id: 'evisceration-table',
		name: 'Evisceration Table',
		tagline: 'A clean, food-safe surface for gutting birds',
		description:
			'A stainless steel work table built for the evisceration stage — gutting plucked birds before washing. The smooth, sloped surface and waste channel keep the area hygienic and easy to wash down, which matters most at the step where contamination is easiest.',
		priceNgn: 295_000,
		features: [
			'Food-grade stainless steel work surface',
			'Sloped top with waste channel for easy clean-down',
			'Sturdy frame at a comfortable working height',
			'Locally fabricated, hard-wearing'
		],
		specs: [
			{ label: 'Function', value: 'Evisceration / gutting station' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Drainage', value: 'Sloped top with waste channel' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'carcass-bath-small',
		name: 'Carcass Bath (Small)',
		tagline: 'Wash and chill birds clean after evisceration',
		description:
			'A stainless steel wash tank for rinsing and cooling gutted birds before packaging. The small size suits backyard and mid-size farms that process modest batches but still want a proper food-safe wash step instead of a bucket.',
		priceNgn: 300_000,
		features: [
			'Food-grade stainless steel tank',
			'Sized for small-to-mid batches',
			'Drain tap for quick water changes',
			'Easy to rinse and keep hygienic'
		],
		specs: [
			{ label: 'Function', value: 'Carcass washing and chilling' },
			{ label: 'Size', value: 'Small' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'carcass-bath-big',
		name: 'Carcass Bath (Big)',
		tagline: 'High-capacity wash and chill for commercial volume',
		description:
			'A large stainless steel wash tank for rinsing and cooling a high volume of gutted birds before packaging. Built for commercial processors who need to keep a fast line moving without birds backing up at the wash step.',
		priceNgn: 650_000,
		features: [
			'Food-grade stainless steel tank',
			'High capacity for commercial batches',
			'Drain tap for quick water changes',
			'Heavy-duty frame for daily use'
		],
		specs: [
			{ label: 'Function', value: 'Carcass washing and chilling' },
			{ label: 'Size', value: 'Large' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'packaging-table',
		name: 'Packaging Table',
		tagline: 'A hygienic surface for weighing and bagging',
		description:
			'A stainless steel work table for the final stage — weighing, portioning and bagging finished birds. The smooth food-safe surface keeps packaging clean and gives your team a proper station instead of working off the floor or a wooden bench.',
		priceNgn: 350_000,
		features: [
			'Food-grade stainless steel work surface',
			'Comfortable height for weighing and bagging',
			'Smooth top wipes down in seconds',
			'Sturdy, hard-wearing frame'
		],
		specs: [
			{ label: 'Function', value: 'Packaging and bagging station' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Use', value: 'Weighing, portioning, bagging' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'drip-hanger',
		name: 'Drip Hanger',
		tagline: 'Hang birds to drain before packaging',
		description:
			'A stainless steel rack for hanging washed birds so excess water drips off before packaging. Draining properly means drier, cleaner packs and longer shelf life — and it frees up your wash tanks for the next batch.',
		priceNgn: 320_000,
		features: [
			'Hangs multiple birds to drain at once',
			'Food-grade stainless steel — no rust',
			'Frees up wash tanks for the next batch',
			'Free-standing, easy to reposition'
		],
		specs: [
			{ label: 'Function', value: 'Post-wash draining' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Format', value: 'Hanging rack' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'drip-table',
		name: 'Drip Table',
		tagline: 'Drain birds on a sloped, food-safe surface',
		description:
			'A stainless steel table with a sloped, perforated top that lets washed birds drain while resting flat before packaging. A good fit for processors who prefer to lay birds out rather than hang them, with a channel that carries water away cleanly.',
		priceNgn: 470_000,
		features: [
			'Sloped, perforated top drains water away',
			'Food-grade stainless steel surface',
			'Lay birds flat to drain before packing',
			'Sturdy frame at a comfortable working height'
		],
		specs: [
			{ label: 'Function', value: 'Post-wash draining' },
			{ label: 'Material', value: 'Food-grade stainless steel' },
			{ label: 'Top', value: 'Sloped and perforated' },
			{ label: 'Warranty', value: '6 months on fabrication' }
		]
	},
	{
		id: 'packaging-scale',
		name: 'Packaging Scale',
		tagline: 'Weigh every pack accurately for fair pricing',
		description:
			'A digital scale for weighing finished birds and portions at the packaging stage, so every pack is priced fairly and consistently. A small but essential tool — accurate weights protect your margin and keep customers trusting your packs.',
		priceNgn: 2_000,
		features: [
			'Clear digital weight display',
			'Right size for weighing birds and portions',
			'Simple to operate — no training needed',
			'Compact, sits on any packaging table'
		],
		specs: [
			{ label: 'Function', value: 'Weighing at packaging' },
			{ label: 'Display', value: 'Digital' },
			{ label: 'Use', value: 'Birds and portions' },
			{ label: 'Power', value: 'Battery / mains' }
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
		`Hello FarmPaddy, I'm interested in buying the ${item.name} (${total}).\n\n` +
		`I'd like to pay the 30% down payment of ${down} and spread the remaining ${balance} in installments.\n\n` +
		`Please send me the next steps.`;
	return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
