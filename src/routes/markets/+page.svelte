<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { Plus, ExternalLink, RefreshCw, AlertCircle, Facebook } from 'lucide-svelte';

	interface Listing {
		title: string;
		priceNgn: number;
		location: string;
		postedAt: string;
		url: string;
		category: 'poultry' | 'cattle' | 'goat' | 'sheep' | 'pig' | 'fish' | 'other';
	}

	interface PricesResponse {
		fetchedAt: string;
		source: string;
		listings: Listing[];
		stale: boolean;
		error?: string;
	}

	let selectedAnimal = $state('all');
	let loading = $state(true);
	let response = $state<PricesResponse | null>(null);
	let loadError = $state<string | null>(null);

	const filtered = $derived.by(() => {
		if (!response) return [] as Listing[];
		if (selectedAnimal === 'all') return response.listings;
		return response.listings.filter((l) => l.category === selectedAnimal);
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

<PageHeader title="Market Prices" />

<div class="px-4 py-4 space-y-4 pb-28">
	<!-- Filters + freshness -->
	<div class="flex items-center gap-2">
		<select bind:value={selectedAnimal} class="select select-bordered select-sm flex-1">
			<option value="all">All Animals</option>
			{#each livestockTypes as type}
				<option value={type.id}>{type.icon} {type.name}</option>
			{/each}
		</select>
		<button
			type="button"
			onclick={loadPrices}
			disabled={loading}
			class="btn btn-ghost btn-sm gap-1"
			aria-label="Refresh prices"
		>
			<RefreshCw size={14} class={loading ? 'animate-spin' : ''} />
		</button>
	</div>

	{#if response}
		<p class="text-[11px] text-base-content/50 -mt-2 flex items-center gap-1.5">
			{#if response.stale}
				<AlertCircle size={12} class="text-warning" />
				<span class="text-warning">Showing cached data</span> — last fetch {formatFetched(response.fetchedAt)}
			{:else}
				Last updated {formatFetched(response.fetchedAt)} · Source: jiji.ng
			{/if}
		</p>
	{/if}

	<!-- Poultry Plaza external link -->
	<a
		href="https://www.facebook.com/poultryplaza"
		target="_blank"
		rel="noopener noreferrer"
		class="group flex items-center gap-3 bg-gradient-to-br from-[#1877f2]/10 to-[#1877f2]/5 border border-[#1877f2]/20 rounded-2xl p-4 active:scale-[0.99] transition-transform"
	>
		<div class="w-10 h-10 rounded-full bg-[#1877f2]/15 flex items-center justify-center shrink-0">
			<Facebook size={20} class="text-[#1877f2]" />
		</div>
		<div class="flex-1 min-w-0">
			<p class="font-semibold text-sm">Poultry Plaza on Facebook</p>
			<p class="text-xs text-base-content/60">Latest market reports posted by the trader community</p>
		</div>
		<ExternalLink size={16} class="text-base-content/40 group-hover:text-base-content/70" />
	</a>

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
	{:else if filtered.length === 0}
		<div class="text-center py-8 text-sm text-base-content/50">
			No listings in this category right now. Try another filter.
		</div>
	{:else}
		<div class="space-y-2">
			{#each filtered as listing (listing.url)}
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
						<span class="font-bold text-primary whitespace-nowrap">{formatNgn(listing.priceNgn)}</span>
					</div>
					<div class="flex items-center justify-between mt-2">
						<p class="text-[11px] text-base-content/40">{listing.postedAt}</p>
						<span class="text-[11px] text-base-content/40 inline-flex items-center gap-1">
							jiji.ng <ExternalLink size={10} />
						</span>
					</div>
				</a>
			{/each}
		</div>
		<p class="text-[11px] text-center text-base-content/40 pt-2">
			Prices are listing-by-listing from sellers on Jiji. Confirm with the seller before relying on them.
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
