// Dynamic sitemap covering the public surface of FarmPaddy.
// Includes each marketplace item so search engines can index them individually.

import type { RequestHandler } from './$types';
import { SITE, absoluteUrl } from '$lib/seo';
import { equipment } from '$lib/data/equipment';

interface SitemapEntry {
	path: string;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority: number;
}

const STATIC_PAGES: SitemapEntry[] = [
	{ path: '/', changefreq: 'daily', priority: 1.0 },
	{ path: '/ai', changefreq: 'weekly', priority: 0.9 },
	{ path: '/marketplace', changefreq: 'weekly', priority: 0.9 },
	{ path: '/markets', changefreq: 'daily', priority: 0.9 },
	{ path: '/about', changefreq: 'monthly', priority: 0.5 },
	{ path: '/terms', changefreq: 'yearly', priority: 0.3 },
	{ path: '/privacy', changefreq: 'yearly', priority: 0.3 }
];

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ fetch }) => {
	const today = new Date().toISOString().slice(0, 10);

	// One indexable deep link per (state, livestock) price point so search
	// engines can discover /markets?state=…&type=… pages.
	let priceEntries: SitemapEntry[] = [];
	try {
		const res = await fetch('/api/markets/prices');
		const data = (await res.json()) as {
			prices?: { state: string; category: string }[];
		};
		const seen = new Set<string>();
		for (const p of data.prices ?? []) {
			if (!p.state || !p.category || p.category === 'feed') continue;
			const key = `${p.state}|${p.category}`;
			if (seen.has(key)) continue;
			seen.add(key);
			priceEntries.push({
				path: `/markets?state=${encodeURIComponent(p.state)}&type=${p.category}`,
				changefreq: 'daily',
				priority: 0.6
			});
		}
	} catch {
		priceEntries = [];
	}

	const entries: SitemapEntry[] = [
		...STATIC_PAGES,
		...equipment.map((item) => ({
			path: `/marketplace/${item.id}`,
			changefreq: 'weekly' as const,
			priority: 0.8
		})),
		...priceEntries
	];

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		entries
			.map(
				(e) =>
					`  <url>\n` +
					`    <loc>${escapeXml(absoluteUrl(e.path))}</loc>\n` +
					`    <lastmod>${today}</lastmod>\n` +
					`    <changefreq>${e.changefreq}</changefreq>\n` +
					`    <priority>${e.priority.toFixed(1)}</priority>\n` +
					`  </url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
	// Silence unused-import warning if SITE ever gets fully tree-shaken.
	void SITE;
};
