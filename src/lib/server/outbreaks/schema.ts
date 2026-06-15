// Shape of a disease outbreak in the accumulating Nigeria dataset.
//
// The internal refresh tool gathers these nationwide via grounded Gemini and
// upserts them into Supabase (see store.ts / refresh.ts). `proximity` is NOT
// stored — it is computed per-user at read time in the feed endpoint, so it
// stays deterministic rather than model-guessed.

import { z } from 'zod';

export const SPECIES = ['poultry', 'cattle', 'goat', 'sheep', 'pig', 'other'] as const;
export const SEVERITIES = ['monitor', 'treat', 'urgent'] as const;
export const SOURCES = ['WOAH WAHIS', 'NADIS', 'ReliefWeb', 'other'] as const;
export const PROXIMITIES = ['your_lga', 'your_state', 'national'] as const;

export type Proximity = (typeof PROXIMITIES)[number];

/** A validated outbreak record as produced by the tool and stored in the DB. */
export const outbreakSchema = z.object({
	disease: z.string().min(1).max(120),
	species: z.enum(SPECIES).catch('other'),
	state: z.string().min(1).max(60),
	lga: z.string().max(80).nullable().catch(null),
	severity: z.enum(SEVERITIES).catch('monitor'),
	summary: z.string().min(1).max(400),
	datePosted: z.string().max(40), // date the source reported it, e.g. "May 2026"
	source: z.enum(SOURCES).catch('other'),
	// Must be a real http(s) URL — this is the guard against fabricated rows.
	sourceUrl: z.string().url()
});

export type Outbreak = z.infer<typeof outbreakSchema>;

/** A stored outbreak plus the server-assigned first-seen timestamp. */
export interface StoredOutbreak extends Outbreak {
	addedAt: string; // ISO timestamp this row was first added by the tool
}

/** What the feed returns to the client: a stored row tagged with proximity. */
export interface FeedOutbreak extends StoredOutbreak {
	proximity: Proximity;
}

export interface OutbreakFeed {
	outbreaks: FeedOutbreak[];
	generatedAt: string;
	insufficient: boolean;
}

/** Stable dedup key for an outbreak — used as the upsert primary key. */
export function outbreakKey(o: Pick<Outbreak, 'disease' | 'state' | 'sourceUrl'>): string {
	return `${o.disease.trim().toLowerCase()}|${o.state.trim().toLowerCase()}|${o.sourceUrl.trim()}`;
}

/**
 * Parse a possibly-messy model/JSON payload into validated outbreaks.
 * Strips ```json fences, tolerates a bare array or `{ outbreaks: [...] }`, and
 * silently drops any row that fails validation (e.g. missing a real sourceUrl)
 * rather than letting a fabricated row through.
 */
export function parseOutbreaks(raw: string): Outbreak[] {
	const cleaned = raw
		.trim()
		.replace(/^```(?:json)?/i, '')
		.replace(/```$/, '')
		.trim();

	let data: unknown;
	try {
		data = JSON.parse(cleaned);
	} catch {
		return [];
	}

	const arr = Array.isArray(data)
		? data
		: Array.isArray((data as { outbreaks?: unknown })?.outbreaks)
			? (data as { outbreaks: unknown[] }).outbreaks
			: [];

	const out: Outbreak[] = [];
	for (const item of arr) {
		const parsed = outbreakSchema.safeParse(item);
		if (parsed.success) out.push(parsed.data);
	}
	return out;
}
