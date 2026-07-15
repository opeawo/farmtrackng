<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import PriceVarianceChart from '$lib/components/markets/PriceVarianceChart.svelte';
	import { unitSuffix } from '$lib/markets/units';
	import { RefreshCw, AlertCircle, Share2, Copy, Check, X, ChevronRight } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ListingCategory =
		| 'poultry'
		| 'cattle'
		| 'goat'
		| 'sheep'
		| 'pig'
		| 'fish'
		| 'feed'
		| 'eggs'
		| 'vaccine'
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
		{ id: 'eggs', label: 'Eggs', icon: '🥚' },
		{ id: 'vaccine', label: 'Vaccines', icon: '💉' }
	];

	const CATEGORY_ICON: Record<ListingCategory, string> = {
		poultry: '🐔',
		cattle: '🐄',
		goat: '🐐',
		sheep: '🐑',
		pig: '🐷',
		fish: '🐟',
		eggs: '🥚',
		vaccine: '💉',
		feed: '🌾',
		other: '🐾'
	};

	// Per-livestock bar colour so each chart reads as its own series.
	const CATEGORY_COLOR: Record<ListingCategory, string> = {
		poultry: '#e09f3e',
		cattle: '#2d6a4f',
		goat: '#bc6c25',
		sheep: '#6b9080',
		pig: '#cb6c79',
		fish: '#3a7ca5',
		eggs: '#c9a227',
		vaccine: '#7b6ca8',
		feed: '#84a98c',
		other: '#84a98c'
	};
	// Order livestock charts appear in the "All" overview.
	const CHART_ORDER: ListingCategory[] = ['poultry', 'cattle', 'goat', 'sheep', 'pig', 'fish', 'eggs', 'vaccine'];

	// Seeded from the SSR load so deep links render (and crawl) immediately.
	const initialState = data.q.state || 'all';
	const initialType = (data.q.type as ListingCategory) || 'all';

	let selectedCategory = $state<'all' | ListingCategory>(initialType);
	let selectedState = $state<'all' | string>(initialState);
	let loading = $state(false);
	let refreshed = $state<PricesResponse | null>(null); // client refresh overrides SSR data
	let loadError = $state<string | null>(null);
	let copiedKey = $state<string | null>(null);
	let selected = $state<AggregatedPrice | null>(null); // tapped bar → detail sheet

	// SSR load data, overridden by a manual client refresh when present.
	const response = $derived<PricesResponse | null>(
		refreshed ?? {
			fetchedAt: data.fetchedAt,
			prices: data.prices as AggregatedPrice[],
			stale: data.stale,
			degraded: data.degraded,
			error: data.error
		}
	);

	function medianOf(nums: number[]): number {
		if (!nums.length) return 0;
		const s = [...nums].sort((a, b) => a - b);
		const m = Math.floor(s.length / 2);
		return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
	}

	function categoryLabel(cat: ListingCategory): string {
		return CATEGORY_OPTIONS.find((o) => o.id === cat)?.label ?? (cat === 'other' ? 'Other' : cat);
	}

	interface ProductChart {
		product: string;
		category: ListingCategory;
		label: string; // the variant name itself, e.g. "Broiler - Large"
		icon: string;
		color: string;
		points: AggregatedPrice[]; // one point per state
		median: number;
		min: number;
		max: number;
		maxScale: number;
		count: number; // states represented (= points.length)
		stateCount: number;
	}

	// How many variants to preview per category in the All-categories overview
	// before the rest collapse behind a "view all" link.
	const OVERVIEW_VARIANTS_PER_CATEGORY = 4;

	// One chart per product variant (each type of chicken, egg, etc.) rather than
	// one lumped chart per category — so variants are never mixed together. Each
	// chart plots that single variant's price across states.
	const productCharts = $derived.by<ProductChart[]>(() => {
		if (!response) return [];
		const byProduct = new Map<string, AggregatedPrice[]>();
		for (const p of response.prices) {
			if (p.category === 'feed') continue;
			const arr = byProduct.get(p.product) ?? [];
			arr.push(p);
			byProduct.set(p.product, arr);
		}
		const catRank = (c: ListingCategory) => {
			const i = CHART_ORDER.indexOf(c);
			return i === -1 ? CHART_ORDER.length : i;
		};
		const out: ProductChart[] = [];
		for (const [product, pts] of byProduct) {
			const cat = pts[0].category;
			out.push({
				product,
				category: cat,
				label: product,
				icon: CATEGORY_ICON[cat],
				color: CATEGORY_COLOR[cat],
				points: [...pts].sort((a, b) => b.priceNgn - a.priceNgn),
				median: medianOf(pts.map((p) => p.priceNgn)),
				min: Math.min(...pts.map((p) => p.lowNgn ?? p.priceNgn)),
				max: Math.max(...pts.map((p) => p.highNgn ?? p.priceNgn)),
				maxScale: Math.max(...pts.map((p) => p.highNgn ?? p.priceNgn)),
				count: pts.length,
				stateCount: new Set(pts.map((p) => p.state)).size
			});
		}
		// Group by category (overview order); within a category, most-reported
		// variant first, then most expensive.
		out.sort(
			(a, b) =>
				catRank(a.category) - catRank(b.category) ||
				b.stateCount - a.stateCount ||
				b.median - a.median
		);
		return out;
	});

	// Variant charts for the currently selected category (single-category view).
	const productChartsForSelected = $derived(
		productCharts.filter((c) => c.category === selectedCategory)
	);

	interface OverviewSection {
		category: ListingCategory;
		label: string;
		icon: string;
		charts: ProductChart[]; // capped preview
		variantCount: number; // total variants in this category
	}

	// The All-categories overview: a section per category, previewing its top
	// variants with a link to reveal the rest.
	const overviewSections = $derived.by<OverviewSection[]>(() => {
		const byCat = new Map<ListingCategory, ProductChart[]>();
		for (const c of productCharts) {
			const arr = byCat.get(c.category) ?? [];
			arr.push(c);
			byCat.set(c.category, arr);
		}
		const order = [
			...CHART_ORDER.filter((c) => byCat.has(c)),
			...[...byCat.keys()].filter((c) => !CHART_ORDER.includes(c))
		];
		return order.map((cat) => {
			const charts = byCat.get(cat)!;
			return {
				category: cat,
				label: categoryLabel(cat),
				icon: CATEGORY_ICON[cat],
				charts: charts.slice(0, OVERVIEW_VARIANTS_PER_CATEGORY),
				variantCount: charts.length
			};
		});
	});

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
			refreshed = (await res.json()) as PricesResponse;
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

	function todayIso(): string {
		return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
	}

	function origin(): string {
		return typeof window !== 'undefined' ? window.location.origin : 'https://farmpaddy.com';
	}

	// Deep link to a single price point — the SEO/share URL format:
	// /markets?state=Benue&type=cattle&date=2026-06-17
	function priceUrl(p: AggregatedPrice): string {
		const params = new URLSearchParams({ state: p.state, type: p.category, date: todayIso() });
		return `${origin()}/markets?${params.toString()}`;
	}

	function pageUrl(): string {
		const params = new URLSearchParams();
		if (selectedState !== 'all') params.set('state', selectedState);
		if (selectedCategory !== 'all') params.set('type', selectedCategory);
		const qs = params.toString();
		return `${origin()}/markets${qs ? `?${qs}` : ''}`;
	}

	function shareMessage(p: AggregatedPrice): string {
		return `${p.product} in ${p.state}: ${formatNgn(p.priceNgn)}${unitSuffix(p.category)} (FarmPaddy price index) — ${priceUrl(p)}`;
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
		if (selectedCategory === 'all') url.searchParams.delete('type');
		else url.searchParams.set('type', selectedCategory);
		url.searchParams.delete('date'); // keep the live view's URL clean
		history.replaceState(history.state, '', url);
	}

	$effect(() => {
		// keep the URL in step with the chosen filters for shareable links
		selectedState;
		selectedCategory;
		syncUrl();
	});
</script>

<SEO
	title={data.seo.title}
	description={data.seo.description}
	canonicalPath={data.seo.canonicalPath}
	ogType={data.seo.ogType ?? 'website'}
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
	{:else if selectedState !== 'all'}
		<!-- One state selected → focused card list -->
		{#if visiblePrices.length === 0}
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
		{/if}
	{:else if selectedCategory !== 'all'}
		<!-- One category selected → a variance chart per variant across states -->
		{#if productChartsForSelected.length === 0}
			<div class="text-center py-8 text-sm text-base-content/50">
				No prices for this category yet.
			</div>
		{:else}
			<div class="space-y-3">
				{#each productChartsForSelected as c (c.product)}
					<div class="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
						<div class="flex items-center justify-between gap-2 mb-1">
							<span class="flex items-center gap-2 min-w-0">
								<span class="text-xl shrink-0">{c.icon}</span>
								<span class="font-bold truncate">{c.label}</span>
							</span>
							<span class="text-xs text-base-content/50 shrink-0">{c.stateCount} states</span>
						</div>
						<p class="text-[11px] text-base-content/50 mb-3">
							Median {formatNgn(c.median)}{unitSuffix(c.category)} · {formatNgn(c.min)}–{formatNgn(
								c.max
							)}
						</p>
						<PriceVarianceChart
							points={c.points}
							color={c.color}
							maxValue={c.maxScale}
							medianValue={c.median}
							onselect={(p) => (selected = p)}
						/>
					</div>
				{/each}
				<p class="text-[10px] text-base-content/40 px-1">
					Dashed line = national median. Tap a bar for details.
				</p>
			</div>
		{/if}
	{:else}
		<!-- All categories → a section per category, one mini chart per variant -->
		<div class="space-y-6">
			{#each overviewSections as sec (sec.category)}
				<div class="space-y-2.5">
					<div class="flex items-center justify-between px-0.5">
						<span class="flex items-center gap-2 min-w-0">
							<span class="text-lg shrink-0">{sec.icon}</span>
							<span class="font-bold text-sm">{sec.label}</span>
						</span>
						<span class="text-[11px] text-base-content/50 shrink-0">
							{sec.variantCount}
							{sec.variantCount === 1 ? 'variant' : 'variants'}
						</span>
					</div>
					{#each sec.charts as c (c.product)}
						<div class="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
							<button
								type="button"
								class="flex items-center justify-between w-full gap-2 mb-2.5"
								onclick={() => (selectedCategory = sec.category)}
							>
								<span class="font-semibold text-sm truncate min-w-0 text-left">{c.label}</span>
								<span class="flex items-center text-[11px] text-base-content/50 shrink-0">
									{formatNgn(c.median)}{unitSuffix(c.category)} · {c.stateCount} states<ChevronRight
										size={13}
									/>
								</span>
							</button>
							<PriceVarianceChart
								points={c.points.slice(0, 7)}
								color={c.color}
								maxValue={c.maxScale}
								medianValue={c.median}
								compact
								onselect={(p) => (selected = p)}
							/>
						</div>
					{/each}
					{#if sec.variantCount > sec.charts.length}
						<button
							type="button"
							class="text-[11px] text-primary font-medium px-1"
							onclick={() => (selectedCategory = sec.category)}
						>
							View all {sec.variantCount} {sec.label} variants →
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if response && response.prices.length > 0}
		<p class="text-[11px] text-center text-base-content/40 pt-2 leading-relaxed">
			FarmPaddy prices are modeled from market data collected daily by our field agents across
			Nigeria. Estimates only — confirm with a seller before relying on them.
		</p>
	{/if}
</div>

<!-- Tap-a-bar detail sheet -->
{#if selected}
	<button
		class="fixed inset-0 z-[55] bg-black/30"
		aria-label="Close details"
		onclick={() => (selected = null)}
	></button>
	<div
		class="fixed left-0 right-0 bottom-0 z-[60] bg-base-100 rounded-t-2xl p-5 pb-24 shadow-2xl space-y-3 max-w-lg mx-auto"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-center gap-2.5 min-w-0">
				<span class="text-2xl shrink-0">{CATEGORY_ICON[selected.category]}</span>
				<div class="min-w-0">
					<p class="font-bold text-sm leading-tight">{selected.product}</p>
					<p class="text-xs text-base-content/60">{selected.state}</p>
				</div>
			</div>
			<button
				type="button"
				onclick={() => (selected = null)}
				class="btn btn-ghost btn-xs btn-circle"
				aria-label="Close"
			>
				<X size={16} />
			</button>
		</div>
		<div class="flex items-end gap-2">
			<span class="text-3xl font-bold text-primary leading-none">{formatNgn(selected.priceNgn)}</span>
			<span class="text-xs text-base-content/50 mb-0.5">{selected.unit}</span>
		</div>
		{#if selected.lowNgn && selected.highNgn}
			<p class="text-xs text-base-content/60">
				Typical range {formatNgn(selected.lowNgn)}–{formatNgn(selected.highNgn)}
			</p>
		{/if}
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border {confidenceClass(
				selected.confidence
			)}"
		>
			{selected.confidence}% accuracy
		</span>
		<div class="flex gap-2 pt-1">
			<button
				type="button"
				class="btn btn-primary btn-sm flex-1 gap-1"
				onclick={() => sharePrice(selected!)}
			>
				<Share2 size={14} /> Share
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-sm gap-1"
				onclick={() => copy(shareMessage(selected!), priceKey(selected!))}
				aria-label="Copy price"
			>
				{#if copiedKey === priceKey(selected)}<Check size={14} class="text-success" />{:else}<Copy
						size={14}
					/>{/if}
			</button>
		</div>
	</div>
{/if}
