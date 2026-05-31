<script lang="ts">
	import { SITE, absoluteUrl, type PageSeo } from '$lib/seo';

	let {
		title,
		titleFull,
		description = SITE.description,
		canonicalPath,
		ogImage = SITE.ogImage,
		ogType = 'website',
		noindex = false
	}: PageSeo = $props();

	const fullTitle = $derived(
		titleFull ?? (title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`)
	);
	const canonical = $derived(canonicalPath ? absoluteUrl(canonicalPath) : SITE.url);
	const ogImageUrl = $derived(absoluteUrl(ogImage));
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	{#if noindex}
		<meta name="robots" content="noindex,nofollow" />
	{:else}
		<meta name="robots" content="index,follow,max-image-preview:large" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImageUrl} />

	<!-- Twitter -->
	<meta name="twitter:card" content={SITE.twitterCard} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>
