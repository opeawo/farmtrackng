<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import { Plus, ExternalLink, RefreshCw, AlertCircle } from 'lucide-svelte';

	type SourceId = 'jiji' | 'poultry-plaza';
	type ListingCategory =
		| 'poultry'
		| 'cattle'
		| 'goat'
		| 'sheep'
		| 'pig'
		| 'fish'
		| 'feed'
		| 'eggs'
		| 'other';

	interface Listing {
		source: SourceId;
		title: string;
		priceNgn: number;
		unit?: string;
		location: string;
		postedAt: string;
		url: string;
		category: ListingCategory;
	}

	interface SourceInfo {
		id: SourceId;
		label: string;
		url: string;
	}

	interface PricesResponse {
		fetchedAt: string;
		sources: SourceInfo[];
		listings: Listing[];
		partialErrors: { source: SourceId; message: string }[];
		stale: boolean;
		error?: string;
	}

	const CATEGORY_OPTIONS: { id: 'all' | ListingCategory; label: string; icon: string }[] = [
		{ id: 'all', label: 'All', icon: '🛒' },
		{ id: 'poultry', label: 'Poultry', icon: '🐔' },
		{ id: 'cattle', label: 'Cattle', icon: '🐄' },
		{ id: 'goat', label: 'Goat', icon: '🐐' },
		{ id: 'sheep', label: 'Sheep', icon: '🐑' },
		{ id: 'pig', label: 'Pig', icon: '🐷' },
		{ id: 'fish', label: 'Fish', icon: '🐟' },
		{ id: 'eggs', label: 'Eggs', icon: '🥚' },
		{ id: 'feed', label: 'Feed', icon: '🌾' }
	];

	const SOURCE_BADGE: Record<SourceId, { label: string; cls: string }> = {
		jiji: { label: 'Jiji', cls: 'bg-accent/10 text-accent border-accent/30' },
		'poultry-plaza': {
			label: 'Poultry Plaza',
			cls: 'bg-[#1877f2]/10 text-[#1877f2] border-[#1877f2]/30'
		}
	};

	let selectedCategory = $state<'all' | ListingCategory>('all');
	let loading = $state(true);
	let response = $state<PricesResponse | null>(null);
	let loadError = $state<string | null>(null);

	const visibleListings = $derived.by(() => {
		if (!response) return [] as Listing[];
		if (selectedCategory === 'all') return response.listings;
		return response.listings.filter((l) => l.category === selectedCategory);
	});

	async function loadPrices() {
		loading = true;
		loadError = null;
		try {
			const res = await fetch('/api/markets/prices');
			const data = (await res.json()) as PricesResponse;
			response = data;
		} catch (err) {
			console.error(err);
			loadError = 'Could not load live prices. Try again in a moment.';
		} finally {
			loading = false;
		}
	}

	function formatNgn(amount: number): string {
		return '₦' + amount.toLocaleString('en-NG');
	}

	function formatFetched(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diffMin = Math.round((now - then) / 60_000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffH = Math.round(diffMin / 60);
		if (diffH < 24) return `${diffH}h ago`;
		const diffD = Math.round(diffH / 24);
		return `${diffD}d ago`;
	}

	onMount(loadPrices);
</script>

<SEO
	title="Nigerian Livestock & Poultry Market Prices"
	description="Live livestock and poultry market prices in Nigeria — pulled daily from Jiji and Poultry Plaza. Broilers, layers, eggs, feed, cattle, goats, sheep and pigs with location and posted date."
	canonicalPath="/markets"
/>

<PageHeader title="Market Prices" />

<div class="px-4 py-4 space-y-4 pb-28">
	<!-- Category filter (horizontal scroll on mobile) -->
	<div class="flex items-center gap-2">
		<div class="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
			{#each CATEGORY_OPTIONS as opt (opt.id)}
				<button
					type="button"
					onclick={() => (selectedCategory = opt.id)}
					class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors {selectedCategory === opt.id
						? 'bg-primary text-white border-primary'
						: 'bg-white text-base-content/70 border-base-300 hover:bg-base-100'}"
				>
					<span class="mr-1">{opt.icon}</span>{opt.label}
				</button>
			{/each}
		</div>
		<button
			type="button"
			onclick={loadPrices}
			disabled={loading}
			class="btn btn-ghost btn-sm gap-1 shrink-0"
			aria-label="Refresh prices"
		>
			<RefreshCw size={14} class={loading ? 'animate-spin' : ''} />
		</button>
	</div>

	<!-- Freshness + sources -->
	{#if response}
		<div class="text-[11px] text-base-content/50 -mt-1 space-y-0.5">
			{#if response.stale}
				<p class="flex items-center gap-1.5">
					<AlertCircle size={12} class="text-warning" />
					<span class="text-warning">Showing cached data</span> — last fetch {formatFetched(response.fetchedAt)}
				</p>
			{:else}
				<p>Last updated {formatFetched(response.fetchedAt)}</p>
			{/if}
			<p>
				Sources: {#each response.sources as s, i (s.id)}{i > 0 ? ' · ' : ''}<a
						href={s.url}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-base-content/80 underline-offset-2 hover:underline">{s.label}</a
					>{/each}
			</p>
			{#if response.partialErrors.length > 0}
				<p class="text-warning">
					Some sources unavailable: {response.partialErrors.map((e) => e.source).join(', ')}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Listings -->
	{#if loading && !response}
		<div class="space-y-2">
			{#each [1, 2, 3, 4] as i (i)}
				<div class="bg-base-200 animate-pulse rounded-xl h-20"></div>
			{/each}
		</div>
	{:else if loadError || (response && response.listings.length === 0)}
		<EmptyState
			title="No live prices yet"
			message={response?.error ?? loadError ?? 'Be the first to submit market prices in your area.'}
			actionLabel="Submit Price"
			actionHref="/markets/submit"
		/>
	{:else if visibleListings.length === 0}
		<div class="text-center py-8 text-sm text-base-content/50">
			No listings in this category right now. Try another filter.
		</div>
	{:else}
		<div class="space-y-2">
			{#each visibleListings as listing (listing.url + listing.title)}
				{@const badge = SOURCE_BADGE[listing.source]}
				<a
					href={listing.url}
					target="_blank"
					rel="noopener noreferrer"
					class="block bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 active:scale-[0.99] transition-transform"
				>
					<div class="flex justify-between items-start gap-3">
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-sm line-clamp-2">{listing.title}</h3>
							<p class="text-xs text-base-content/60 mt-1">{listing.location}</p>
						</div>
						<div class="text-right shrink-0">
							<p class="font-bold text-primary whitespace-nowrap">{formatNgn(listing.priceNgn)}</p>
							{#if listing.unit}<p class="text-[11px] text-base-content/50 whitespace-nowrap">{listing.unit}</p>{/if}
						</div>
					</div>
					<div class="flex items-center justify-between mt-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border {badge.cls}">
							{badge.label}
						</span>
						<span class="text-[11px] text-base-content/40 inline-flex items-center gap-1">
							{listing.postedAt}<ExternalLink size={10} />
						</span>
					</div>
				</a>
			{/each}
		</div>
		<p class="text-[11px] text-center text-base-content/40 pt-2">
			Prices pulled daily from Jiji and Poultry Plaza. Confirm with the seller before relying on them.
		</p>
	{/if}
</div>

<a
	href="/markets/submit"
	class="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#40916c] text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
	aria-label="Submit a price"
>
	<Plus size={24} />
</a>
