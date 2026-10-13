<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import PriceTrendChart from '$lib/components/markets/PriceTrendChart.svelte';
	import { CATEGORY_ICON, CATEGORY_COLOR, CATEGORY_LABEL } from '$lib/markets/categories';
	import type { ListingCategory } from '$lib/markets/units';
	import { AlertCircle, Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const HISTORY_START = '2026-07-01';
	// Order category chips appear in.
	const CATEGORY_ORDER: ListingCategory[] = [
		'poultry',
		'cattle',
		'goat',
		'sheep',
		'pig',
		'fish',
		'eggs',
		'feed',
		'vaccine',
		'other'
	];

	const h = $derived(data.history);
	const f = $derived(h?.filters ?? { state: '', market: '', category: '', product: '' });
	const busy = $derived(!!navigating.to);

	function todayWat(): string {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Africa/Lagos',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date());
	}
	function shiftDays(date: string, delta: number): string {
		const d = new Date(`${date}T00:00:00Z`);
		d.setUTCDate(d.getUTCDate() + delta);
		return d.toISOString().slice(0, 10);
	}
	const today = todayWat();

	const PRESETS = [
		{ id: '7d', label: '7 days', days: 7 },
		{ id: '30d', label: '30 days', days: 30 },
		{ id: '90d', label: '90 days', days: 90 },
		{ id: 'all', label: 'All', days: 0 }
	];
	const activePreset = $derived.by(() => {
		if (!h || h.to !== today) return null;
		if (h.from === HISTORY_START) return 'all';
		return PRESETS.find((p) => p.days && h.from === shiftDays(today, -(p.days - 1)))?.id ?? null;
	});

	const categories = $derived(
		CATEGORY_ORDER.filter((c) => (h?.options.productsByCategory[c]?.length ?? 0) > 0)
	);
	const productChoices = $derived.by(() => {
		const byCat = h?.options.productsByCategory ?? {};
		const cats = f.category ? [f.category] : CATEGORY_ORDER;
		return cats.flatMap((c) => byCat[c] ?? []).sort((a, b) => a.localeCompare(b));
	});
	const marketChoices = $derived(f.state ? (h?.options.marketsByState[f.state] ?? []) : []);

	/** Update URL filters (and re-run the load). Any filter change resets paging. */
	function setParams(updates: Record<string, string | null>) {
		const url = new URL(page.url);
		if (!('page' in updates)) url.searchParams.delete('page');
		for (const [k, v] of Object.entries(updates)) {
			if (v) url.searchParams.set(k, v);
			else url.searchParams.delete(k);
		}
		goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function applyPreset(days: number) {
		setParams({ from: days ? shiftDays(today, -(days - 1)) : null, to: null });
	}

	const csvHref = $derived.by(() => {
		const params = new URLSearchParams(data.qs);
		params.delete('page');
		params.set('format', 'csv');
		return `/api/markets/history?${params.toString()}`;
	});

	const totalPages = $derived(h ? Math.max(1, Math.ceil(h.totalRecords / h.pageSize)) : 1);

	function ngn(n: number): string {
		return '₦' + n.toLocaleString('en-NG');
	}
	function day(date: string, withYear = false): string {
		return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NG', {
			day: 'numeric',
			month: 'short',
			...(withYear ? { year: 'numeric' } : {}),
			timeZone: 'UTC'
		});
	}
	function formatFetched(iso: string): string {
		const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffH = Math.round(diffMin / 60);
		if (diffH < 24) return `${diffH}h ago`;
		return `${Math.round(diffH / 24)}d ago`;
	}
	function colorFor(cat: string): string {
		return CATEGORY_COLOR[cat as ListingCategory] ?? CATEGORY_COLOR.other;
	}
</script>

<SEO title={data.seo.title} description={data.seo.description} canonicalPath={data.seo.canonicalPath} />

<PageHeader title="Historical Data" backHref="/markets" />

<div class="px-4 py-4 space-y-4 pb-28">
	<div>
		<p class="font-semibold text-sm">Livestock price history</p>
		<p class="text-xs text-base-content/60">
			Daily market prices since July 2026. Updates automatically as our field agents report prices — usually
			within 15 minutes.
		</p>
	</div>

	<!-- Filters: date range first, then place, then commodity -->
	<section class="space-y-2.5" aria-label="Filters">
		<div class="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
			{#each PRESETS as p (p.id)}
				<button
					type="button"
					onclick={() => applyPreset(p.days)}
					aria-pressed={activePreset === p.id}
					class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors {activePreset ===
					p.id
						? 'bg-primary text-white border-primary'
						: 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200'}"
				>
					{p.label}
				</button>
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<label class="form-control">
				<span class="text-[11px] text-base-content/60 mb-0.5">From</span>
				<input
					type="date"
					class="input input-bordered input-sm w-full"
					min={HISTORY_START}
					max={h?.to ?? today}
					value={h?.from ?? HISTORY_START}
					onchange={(e) => setParams({ from: e.currentTarget.value || null })}
				/>
			</label>
			<label class="form-control">
				<span class="text-[11px] text-base-content/60 mb-0.5">To</span>
				<input
					type="date"
					class="input input-bordered input-sm w-full"
					min={h?.from ?? HISTORY_START}
					max={today}
					value={h?.to ?? today}
					onchange={(e) => setParams({ to: e.currentTarget.value || null })}
				/>
			</label>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<select
				class="select select-bordered select-sm w-full"
				aria-label="State"
				value={f.state}
				onchange={(e) => setParams({ state: e.currentTarget.value || null, market: null })}
			>
				<option value="">All states</option>
				{#each h?.options.states ?? [] as s (s)}
					<option value={s}>{s}</option>
				{/each}
			</select>
			<select
				class="select select-bordered select-sm w-full"
				aria-label="Market"
				value={f.market}
				disabled={!f.state}
				onchange={(e) => setParams({ market: e.currentTarget.value || null })}
			>
				<option value="">{f.state ? 'All markets' : 'Pick a state first'}</option>
				{#each marketChoices as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</div>
		<div class="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
			<button
				type="button"
				onclick={() => setParams({ category: null, product: null })}
				class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors {!f.category
					? 'bg-primary text-white border-primary'
					: 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200'}"
			>
				<span class="mr-1">🛒</span>All
			</button>
			{#each categories as c (c)}
				<button
					type="button"
					onclick={() => setParams({ category: c, product: null })}
					class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors {f.category ===
					c
						? 'bg-primary text-white border-primary'
						: 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200'}"
				>
					<span class="mr-1">{CATEGORY_ICON[c]}</span>{CATEGORY_LABEL[c]}
				</button>
			{/each}
		</div>
		<select
			class="select select-bordered select-sm w-full"
			aria-label="Product"
			value={f.product}
			onchange={(e) => setParams({ product: e.currentTarget.value || null })}
		>
			<option value="">All products</option>
			{#each productChoices as p (p)}
				<option value={p}>{p}</option>
			{/each}
		</select>
	</section>

	{#if h}
		<div class="text-[11px] text-base-content/50 -mt-1 space-y-0.5">
			{#if h.stale}
				<p class="flex items-center gap-1.5">
					<AlertCircle size={12} class="text-warning" />
					<span class="text-warning">Showing the most recent data</span> — updated {formatFetched(h.fetchedAt)}
				</p>
			{:else}
				<p>
					{h.entries.toLocaleString('en-NG')} market entries · {day(h.from, true)} – {day(h.to, true)} · updated
					{formatFetched(h.fetchedAt)}
				</p>
			{/if}
		</div>
	{/if}

	<div class="space-y-4 transition-opacity {busy ? 'opacity-50' : ''}">
		{#if !h || h.entries === 0}
			<EmptyState
				title="No price history for this selection"
				message={h?.error ?? data.error ?? 'Try a wider date range or fewer filters.'}
			/>
		{:else}
			<!-- Headline figures -->
			{#if h.focus}
				{@const s = h.focus}
				<section class="space-y-2">
					<div class="flex items-center gap-2">
						<span class="text-xl">{CATEGORY_ICON[s.category]}</span>
						<div class="min-w-0">
							<p class="font-bold text-sm leading-tight truncate">{s.product}</p>
							<p class="text-[11px] text-base-content/60">
								Prices {s.unit}{f.market ? ` · ${f.market}` : f.state ? ` · ${f.state}` : ' · all states'}
							</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="rounded-xl bg-base-200/60 p-3">
							<p class="text-[11px] text-base-content/60">Average price</p>
							<p class="text-lg font-bold tabular-nums leading-tight">{ngn(s.avgNgn)}</p>
							<p class="text-[10px] text-base-content/50">Median {ngn(s.medianNgn)}</p>
						</div>
						<div class="rounded-xl bg-base-200/60 p-3">
							<p class="text-[11px] text-base-content/60">Latest ({day(s.latestDate)})</p>
							<p class="text-lg font-bold tabular-nums leading-tight">{ngn(s.latestNgn)}</p>
							{#if s.changePct != null}
								<p
									class="text-[10px] font-semibold flex items-center gap-0.5 {s.changePct > 0
										? 'text-error'
										: s.changePct < 0
											? 'text-success'
											: 'text-base-content/50'}"
								>
									{#if s.changePct > 0}<TrendingUp size={11} />{:else if s.changePct < 0}<TrendingDown
											size={11}
										/>{/if}
									{s.changePct > 0 ? '+' : ''}{s.changePct}% over period
								</p>
							{:else}
								<p class="text-[10px] text-base-content/50">Too short a range to compare</p>
							{/if}
						</div>
						<div class="rounded-xl bg-base-200/60 p-3">
							<p class="text-[11px] text-base-content/60">Entries</p>
							<p class="text-lg font-bold tabular-nums leading-tight">{s.entries.toLocaleString('en-NG')}</p>
						</div>
						<div class="rounded-xl bg-base-200/60 p-3">
							<p class="text-[11px] text-base-content/60">Coverage</p>
							<p class="text-lg font-bold tabular-nums leading-tight">
								{s.markets} <span class="text-xs font-semibold">{s.markets === 1 ? 'market' : 'markets'}</span>
							</p>
							<p class="text-[10px] text-base-content/50">{s.states} {s.states === 1 ? 'state' : 'states'}</p>
						</div>
					</div>
				</section>
			{/if}

			<!-- Trend -->
			<section class="space-y-2">
				<div class="flex items-end justify-between gap-2">
					<h2 class="font-bold text-sm">Price trend</h2>
					<p class="text-[10px] text-base-content/50 flex items-center gap-2">
						<span class="inline-flex items-center gap-1"
							><span class="inline-block w-3 h-0.5 rounded bg-base-content/70"></span>Daily median</span
						>
						<span class="inline-flex items-center gap-1"
							><span class="inline-block w-3 h-2 rounded-sm bg-base-content/15"></span>Range</span
						>
						{#if f.product}
							<span class="inline-flex items-center gap-1"
								><span class="inline-block w-3 border-t border-dashed border-base-content/50"></span>Average</span
							>
						{/if}
					</p>
				</div>
				{#if f.product && h.trend[0]}
					<div class="rounded-xl border border-base-300 p-2">
						<PriceTrendChart
							series={h.trend[0]}
							color={colorFor(h.trend[0].category)}
							average={h.focus?.avgNgn}
						/>
					</div>
				{:else}
					<p class="text-[11px] text-base-content/50">
						Most-reported products in this selection. Tap one to focus on it.
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each h.trend as t (t.product)}
							<div class="rounded-xl border border-base-300 p-2">
								<button
									type="button"
									onclick={() => setParams({ product: t.product })}
									class="w-full flex items-center justify-between gap-2 text-left mb-1 hover:text-primary"
								>
									<span class="text-xs font-semibold truncate">{CATEGORY_ICON[t.category]} {t.product}</span>
									<span class="shrink-0 text-[10px] text-base-content/50">{t.unit}</span>
								</button>
								<PriceTrendChart series={t} color={colorFor(t.category)} compact />
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Averages by state / market -->
			{#if h.focus && h.focus.breakdown.length > 0}
				{@const s = h.focus}
				<section class="space-y-2">
					<h2 class="font-bold text-sm">
						{s.product}: averages by {s.breakdownBy}
						<span class="font-normal text-[11px] text-base-content/50">({s.unit})</span>
					</h2>
					<div class="overflow-x-auto rounded-xl border border-base-300">
						<table class="table table-xs">
							<thead>
								<tr>
									<th>{s.breakdownBy === 'state' ? 'State' : 'Market'}</th>
									<th class="text-right">Average · range</th>
									<th class="text-right">Entries</th>
								</tr>
							</thead>
							<tbody>
								{#each s.breakdown as b (b.label)}
									<tr>
										<td class="max-w-[9rem] truncate" title={b.label}>{b.label}</td>
										<td class="text-right tabular-nums">
											<span class="font-semibold">{ngn(b.avgNgn)}</span>
											<span class="block text-[10px] text-base-content/50 whitespace-nowrap"
												>{ngn(b.lowNgn)}–{ngn(b.highNgn)}</span
											>
										</td>
										<td class="text-right tabular-nums text-base-content/60">{b.sampleSize}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			<!-- Records -->
			<section class="space-y-2">
				<div class="flex items-center justify-between gap-2">
					<h2 class="font-bold text-sm">
						Daily records
						<span class="font-normal text-[11px] text-base-content/50"
							>({h.totalRecords.toLocaleString('en-NG')})</span
						>
					</h2>
					<a href={csvHref} download class="btn btn-primary btn-sm gap-1.5" data-sveltekit-reload>
						<Download size={14} />Download CSV
					</a>
				</div>
				<p class="text-[11px] text-base-content/50">
					One row per day, market and product. The CSV includes every record for your filters.
				</p>
				<ul class="divide-y divide-base-300 rounded-xl border border-base-300">
					{#each h.records as r (r.date + r.state + r.market + r.product)}
						<li class="px-3 py-2 flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-semibold truncate">{CATEGORY_ICON[r.category]} {r.product}</p>
								<p class="text-[11px] text-base-content/60 truncate">
									{day(r.date)} · {r.market}, {r.state}
								</p>
							</div>
							<div class="shrink-0 text-right">
								<p class="text-xs font-bold tabular-nums">{ngn(r.priceNgn)}</p>
								<p class="text-[10px] text-base-content/50 tabular-nums">
									{r.unit}{r.sampleSize > 1 ? ` · avg ${ngn(r.avgNgn)} · ${r.sampleSize} entries` : ''}
								</p>
							</div>
						</li>
					{/each}
				</ul>
				{#if totalPages > 1}
					<div class="flex items-center justify-between gap-2">
						<button
							type="button"
							class="btn btn-ghost btn-sm gap-1"
							disabled={h.page <= 1}
							onclick={() => setParams({ page: String(h.page - 1) })}
						>
							<ChevronLeft size={14} />Newer
						</button>
						<span class="text-[11px] text-base-content/60">Page {h.page} of {totalPages}</span>
						<button
							type="button"
							class="btn btn-ghost btn-sm gap-1"
							disabled={h.page >= totalPages}
							onclick={() => setParams({ page: String(h.page + 1) })}
						>
							Older<ChevronRight size={14} />
						</button>
					</div>
				{/if}
			</section>
		{/if}

		<p class="text-[10px] text-base-content/50 leading-relaxed">
			Prices are FarmPaddy's index, built from field-agent reports. Each figure is a median with unusual outliers
			removed; the average is the mean after removing outliers. Every product is reported in one fixed unit. Before
			6 Aug 2026 only cattle and goat history is included, because other products were not yet recorded in a
			consistent unit.
		</p>
	</div>
</div>
