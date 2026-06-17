<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import { RefreshCw, AlertCircle, Share2, Copy, Check } from 'lucide-svelte';

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

	interface AggregatedPrice {
		product: string;
		category: ListingCategory;
		state: string;
		unit: string;
		priceNgn: number;
		lowNgn?: number;
		highNgn?: number;
		confidence: number;
		sampleSize: number;
	}

	interface PricesResponse {
		fetchedAt: string;
		prices: AggregatedPrice[];
		stale: boolean;
		degraded: boolean;
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
		{ id: 'eggs', label: 'Eggs', icon: '🥚' }
	];

	const CATEGORY_ICON: Record<ListingCategory, string> = {
		poultry: '🐔',
		cattle: '🐄',
		goat: '🐐',
		sheep: '🐑',
		pig: '🐷',
		fish: '🐟',
		eggs: '🥚',
		feed: '🌾',
		other: '🐾'
	};

	let selectedCategory = $state<'all' | ListingCategory>('all');
	let selectedState = $state<'all' | string>('all');
	let loading = $state(true);
	let response = $state<PricesResponse | null>(null);
	let loadError = $state<string | null>(null);
	let copiedKey = $state<string | null>(null);

	const watDate = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Africa/Lagos',
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date());

	const states = $derived.by(() => {
		if (!response) return [] as string[];
		return [...new Set(response.prices.filter((p) => p.category !== 'feed').map((p) => p.state))].sort(
			(a, b) => a.localeCompare(b)
		);
	});

	const visiblePrices = $derived.by(() => {
		if (!response) return [] as AggregatedPrice[];
		return response.prices.filter(
			(p) =>
				p.category !== 'feed' && // feed is not shown on the livestock price board
				(selectedCategory === 'all' || p.category === selectedCategory) &&
				(selectedState === 'all' || p.state === selectedState)
		);
	});

	async function loadPrices() {
		loading = true;
		loadError = null;
		try {
			const res = await fetch('/api/markets/prices');
			response = (await res.json()) as PricesResponse;
		} catch (err) {
			console.error(err);
			loadError = 'Could not load prices. Try again in a moment.';
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
		return `${Math.round(diffH / 24)}d ago`;
	}

	function confidenceClass(c: number): string {
		if (c >= 80) return 'bg-success/10 text-success border-success/30';
		if (c >= 50) return 'bg-warning/10 text-warning border-warning/30';
		return 'bg-error/10 text-error border-error/30';
	}

	function priceKey(p: AggregatedPrice): string {
		return `${p.product}-${p.state}`;
	}

	function shareMessage(p: AggregatedPrice): string {
		return `${p.product} in ${p.state}: ${formatNgn(p.priceNgn)}/kg (FarmPaddy price index) — ${pageUrl()}`;
	}

	function pageUrl(stateParam?: string): string {
		if (typeof window === 'undefined') return 'https://farmpaddy.com/markets';
		const url = new URL(window.location.href);
		const s = stateParam ?? (selectedState !== 'all' ? selectedState : null);
		url.search = '';
		if (s) url.searchParams.set('state', s);
		return url.toString();
	}

	async function copy(text: string, key: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedKey = key;
			setTimeout(() => (copiedKey = key === copiedKey ? null : copiedKey), 1800);
		} catch {
			/* ignore */
		}
	}

	async function sharePrice(p: AggregatedPrice) {
		const text = shareMessage(p);
		const key = priceKey(p);
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: 'FarmPaddy price', text });
				return;
			} catch {
				/* user cancelled or unsupported — fall through */
			}
		}
		window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
		copy(text, key);
	}

	async function sharePage() {
		const text = `FarmPaddy livestock prices${selectedState !== 'all' ? ` for ${selectedState}` : ''} — ${pageUrl()}`;
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: 'FarmPaddy Market Prices', text, url: pageUrl() });
				return;
			} catch {
				/* fall through */
			}
		}
		copy(pageUrl(), 'page');
	}

	function syncUrl() {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (selectedState === 'all') url.searchParams.delete('state');
		else url.searchParams.set('state', selectedState);
		history.replaceState(history.state, '', url);
	}

	$effect(() => {
		// keep the URL in step with the chosen state for shareable links
		selectedState;
		syncUrl();
	});

	onMount(() => {
		const s = new URL(window.location.href).searchParams.get('state');
		if (s) selectedState = s;
		loadPrices();
	});
</script>

<SEO
	title="Nigerian Livestock & Poultry Market Prices"
	description="FarmPaddy's livestock and poultry price index for Nigeria — modeled daily from market data collected by our field agents nationwide. Prices per kg for broilers, layers, cattle, goats, sheep, pigs and more, by state."
	canonicalPath="/markets"
/>

<PageHeader title="Market Prices" />

<div class="px-4 py-4 space-y-4 pb-28">
	<!-- Date + state selector -->
	<div class="flex items-center justify-between gap-3">
		<div>
			<p class="text-xs text-base-content/50">Prices for</p>
			<p class="font-semibold text-sm">{watDate}</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={sharePage}
				class="btn btn-ghost btn-sm gap-1"
				aria-label="Share these prices"
			>
				{#if copiedKey === 'page'}<Check size={15} class="text-success" />{:else}<Share2 size={15} />{/if}
			</button>
			<button
				type="button"
				onclick={loadPrices}
				disabled={loading}
				class="btn btn-ghost btn-sm"
				aria-label="Refresh prices"
			>
				<RefreshCw size={15} class={loading ? 'animate-spin' : ''} />
			</button>
		</div>
	</div>

	<select bind:value={selectedState} class="select select-bordered select-sm w-full font-semibold">
		<option value="all">All states</option>
		{#each states as s (s)}
			<option value={s}>{s}</option>
		{/each}
	</select>

	<!-- Category filter -->
	<div class="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
		{#each CATEGORY_OPTIONS as opt (opt.id)}
			<button
				type="button"
				onclick={() => (selectedCategory = opt.id)}
				class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors {selectedCategory ===
				opt.id
					? 'bg-primary text-white border-primary'
					: 'bg-white text-base-content/70 border-base-300 hover:bg-base-100'}"
			>
				<span class="mr-1">{opt.icon}</span>{opt.label}
			</button>
		{/each}
	</div>

	<!-- Freshness -->
	{#if response}
		<div class="text-[11px] text-base-content/50 -mt-1 space-y-0.5">
			{#if response.stale}
				<p class="flex items-center gap-1.5">
					<AlertCircle size={12} class="text-warning" />
					<span class="text-warning">Showing the most recent index</span> — updated {formatFetched(response.fetchedAt)}
				</p>
			{:else}
				<p>Updated {formatFetched(response.fetchedAt)}</p>
			{/if}
			{#if response.degraded}
				<p class="text-warning">Some prices are based on limited recent data.</p>
			{/if}
		</div>
	{/if}

	<!-- Prices -->
	{#if loading && !response}
		<div class="space-y-2">
			{#each [1, 2, 3, 4] as i (i)}
				<div class="bg-base-200 animate-pulse rounded-xl h-24"></div>
			{/each}
		</div>
	{:else if loadError || (response && response.prices.length === 0)}
		<EmptyState
			title="No prices yet"
			message={response?.error ?? loadError ?? 'Prices will appear here as our field agents report them.'}
		/>
	{:else if visiblePrices.length === 0}
		<div class="text-center py-8 text-sm text-base-content/50">
			No prices for this filter. Try another state or category.
		</div>
	{:else}
		<div class="space-y-2">
			{#each visiblePrices as p (priceKey(p))}
				<div class="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
					<div class="flex justify-between items-start gap-3">
						<div class="flex items-start gap-2.5 min-w-0">
							<span class="text-2xl leading-none shrink-0" aria-hidden="true">{CATEGORY_ICON[p.category]}</span>
							<div class="min-w-0">
								<h3 class="font-semibold text-sm line-clamp-2">{p.product}</h3>
								<p class="text-xs text-base-content/60 mt-0.5">{p.state}</p>
							</div>
						</div>
						<div class="text-right shrink-0">
							<p class="font-bold text-primary whitespace-nowrap">{formatNgn(p.priceNgn)}</p>
							<p class="text-[11px] text-base-content/50 whitespace-nowrap">{p.unit}</p>
							{#if p.lowNgn && p.highNgn}
								<p class="text-[10px] text-base-content/40 whitespace-nowrap">
									{formatNgn(p.lowNgn)}–{formatNgn(p.highNgn)}
								</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center justify-between mt-2.5">
						<span
							class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border {confidenceClass(
								p.confidence
							)}"
						>
							{p.confidence}% accuracy
						</span>
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => copy(shareMessage(p), priceKey(p))}
								class="btn btn-ghost btn-xs gap-1 text-base-content/50"
								aria-label="Copy price"
							>
								{#if copiedKey === priceKey(p)}<Check size={13} class="text-success" />{:else}<Copy size={13} />{/if}
							</button>
							<button
								type="button"
								onclick={() => sharePrice(p)}
								class="btn btn-ghost btn-xs gap-1 text-primary"
								aria-label="Share price"
							>
								<Share2 size={13} /> Share
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-[11px] text-center text-base-content/40 pt-2 leading-relaxed">
			FarmPaddy prices are modeled from market data collected daily by our field agents across
			Nigeria. Estimates only — confirm with a seller before relying on them.
		</p>
	{/if}
</div>
