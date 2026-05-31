// Site-wide SEO constants. Per-page overrides are passed to <SEO /> in each route.

export const SITE = {
	name: 'FarmTrack',
	tagline: 'Animal AI, market prices, and equipment for Nigerian farmers',
	description:
		'FarmTrack is a mobile-first companion for Nigerian farmers and animal health workers. Ask the AI about livestock health, check live market prices for poultry and cattle, and shop processing equipment with 30% down.',
	url: 'https://farmtrack.ng',
	locale: 'en_NG',
	// 1200x630 social-share image lives at this path; until a proper one is
	// created, the 512px maskable icon is referenced as a best-available fallback.
	ogImage: '/icons/icon-512.png',
	twitterCard: 'summary_large_image',
	publisher: 'FastForward Livestock Venture Studio'
};

export function absoluteUrl(path: string): string {
	if (path.startsWith('http')) return path;
	const trimmed = path.startsWith('/') ? path : `/${path}`;
	return `${SITE.url}${trimmed}`;
}

export interface PageSeo {
	title?: string; // page-specific; SITE.name is appended automatically unless full=true
	titleFull?: string; // use exactly as given, do not append site name
	description?: string;
	canonicalPath?: string; // path without origin; e.g. "/marketplace"
	ogImage?: string; // absolute or path
	ogType?: 'website' | 'article' | 'product';
	noindex?: boolean;
}
