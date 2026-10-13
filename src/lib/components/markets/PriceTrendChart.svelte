<script lang="ts">
	// Daily price trend for ONE product (one unit, one y-axis). The median is a
	// 2px line, the low–high range a light band behind it, the period average a
	// dashed reference line. A crosshair snaps to the nearest day and shows a
	// readout. Plain inline SVG — no charting dependency, in keeping with
	// PriceVarianceChart.

	import type { TrendSeries } from '$lib/markets/history-types';

	let {
		series,
		color = 'var(--color-primary)',
		average,
		compact = false
	}: {
		series: TrendSeries;
		color?: string;
		average?: number;
		compact?: boolean;
	} = $props();

	let width = $state(320);
	const height = $derived(compact ? 120 : 220);
	const pad = $derived({ top: 10, right: 8, bottom: 20, left: compact ? 40 : 48 });
	const innerW = $derived(Math.max(10, width - pad.left - pad.right));
	const innerH = $derived(height - pad.top - pad.bottom);

	const points = $derived(series.points);
	const t0 = $derived(points.length ? Date.parse(points[0].date) : 0);
	const t1 = $derived(points.length ? Date.parse(points[points.length - 1].date) : 1);

	// Y domain from the band (low/high), padded and rounded to a "nice" step.
	const yDomain = $derived.by(() => {
		let lo = Math.min(...points.map((p) => p.lowNgn), average ?? Infinity);
		let hi = Math.max(...points.map((p) => p.highNgn), average ?? -Infinity);
		if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1, ticks: [0, 1] };
		if (hi === lo) {
			lo = lo * 0.9;
			hi = hi * 1.1;
		}
		const raw = (hi - lo) / (compact ? 2 : 4);
		const mag = 10 ** Math.floor(Math.log10(raw));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
		const nlo = Math.floor(lo / step) * step;
		const nhi = Math.ceil(hi / step) * step;
		const ticks: number[] = [];
		for (let v = nlo; v <= nhi + step / 2; v += step) ticks.push(v);
		return { lo: nlo, hi: nhi, ticks };
	});

	function x(date: string): number {
		if (t1 === t0) return pad.left + innerW / 2;
		return pad.left + ((Date.parse(date) - t0) / (t1 - t0)) * innerW;
	}
	function y(v: number): number {
		const { lo, hi } = yDomain;
		return pad.top + (1 - (v - lo) / (hi - lo || 1)) * innerH;
	}

	const linePath = $derived(
		points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.priceNgn).toFixed(1)}`).join('')
	);
	const bandPath = $derived(
		points.length
			? points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.highNgn).toFixed(1)}`).join('') +
					[...points]
						.reverse()
						.map((p) => `L${x(p.date).toFixed(1)},${y(p.lowNgn).toFixed(1)}`)
						.join('') +
					'Z'
			: ''
	);

	// ~4 evenly spaced date labels (fewer when compact).
	const xTicks = $derived.by(() => {
		const n = Math.min(points.length, compact ? 3 : 4);
		if (n <= 1) return points.slice(0, 1);
		return Array.from({ length: n }, (_, i) => points[Math.round((i * (points.length - 1)) / (n - 1))]);
	});

	let hover = $state<number | null>(null);
	const hp = $derived(hover != null ? points[hover] : null);

	function onmove(e: PointerEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const px = e.clientX - rect.left;
		let best = 0;
		let bestD = Infinity;
		points.forEach((p, i) => {
			const d = Math.abs(x(p.date) - px);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		});
		hover = best;
	}
	function onkey(e: KeyboardEvent) {
		if (!points.length) return;
		if (e.key === 'ArrowRight') hover = Math.min(points.length - 1, (hover ?? -1) + 1);
		else if (e.key === 'ArrowLeft') hover = Math.max(0, (hover ?? points.length) - 1);
		else return;
		e.preventDefault();
	}

	function short(n: number): string {
		if (n >= 1_000_000) return '₦' + +(n / 1_000_000).toFixed(1) + 'm';
		if (n >= 1_000) return '₦' + +(n / 1_000).toFixed(n >= 100_000 ? 0 : 1) + 'k';
		return '₦' + n;
	}
	function ngn(n: number): string {
		return '₦' + n.toLocaleString('en-NG');
	}
	function day(date: string): string {
		return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NG', {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
	}
</script>

<div class="relative w-full" bind:clientWidth={width}>
	{#if points.length === 0}
		<p class="text-xs text-base-content/50 py-6 text-center">No data in this range.</p>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<svg
			{width}
			{height}
			role="img"
			tabindex="0"
			aria-label={`${series.product} daily median price ${series.unit}, ${day(points[0].date)} to ${day(points[points.length - 1].date)}`}
			class="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
			onpointermove={onmove}
			onpointerdown={onmove}
			onpointerleave={() => (hover = null)}
			onkeydown={onkey}
			onblur={() => (hover = null)}
		>
			<!-- Recessive grid + y labels -->
			{#each yDomain.ticks as t (t)}
				<line
					x1={pad.left}
					x2={pad.left + innerW}
					y1={y(t)}
					y2={y(t)}
					class="stroke-base-content/10"
					stroke-width="1"
				/>
				<text
					x={pad.left - 6}
					y={y(t)}
					dy="0.32em"
					text-anchor="end"
					class="fill-base-content/50 {compact ? 'text-[9px]' : 'text-[10px]'} tabular-nums">{short(t)}</text
				>
			{/each}
			{#each xTicks as p, i (p.date)}
				<text
					x={x(p.date)}
					y={height - 4}
					text-anchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
					class="fill-base-content/50 {compact ? 'text-[9px]' : 'text-[10px]'}">{day(p.date)}</text
				>
			{/each}

			<!-- Low–high band, average reference, median line -->
			<path d={bandPath} fill={color} opacity="0.14" />
			{#if average != null}
				<line
					x1={pad.left}
					x2={pad.left + innerW}
					y1={y(average)}
					y2={y(average)}
					class="stroke-base-content/45"
					stroke-width="1"
					stroke-dasharray="4 3"
				/>
			{/if}
			<path d={linePath} fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
			{#if points.length === 1}
				<circle cx={x(points[0].date)} cy={y(points[0].priceNgn)} r="4" fill={color} />
			{/if}

			<!-- Crosshair -->
			{#if hp}
				<line
					x1={x(hp.date)}
					x2={x(hp.date)}
					y1={pad.top}
					y2={pad.top + innerH}
					class="stroke-base-content/30"
					stroke-width="1"
				/>
				<circle
					cx={x(hp.date)}
					cy={y(hp.priceNgn)}
					r="4"
					fill={color}
					class="stroke-base-100"
					stroke-width="2"
				/>
			{/if}
		</svg>

		{#if hp}
			{@const left = x(hp.date)}
			<div
				class="pointer-events-none absolute top-1 z-10 rounded-lg border border-base-300 bg-base-100 px-2.5 py-1.5 shadow-md text-[11px] leading-tight whitespace-nowrap"
				style={left > width / 2 ? `right:${width - left + 8}px` : `left:${left + 8}px`}
			>
				<p class="text-base-content/60 mb-0.5">{day(hp.date)}</p>
				<p class="flex items-center gap-1.5">
					<span class="inline-block w-3 h-0.5 rounded" style="background:{color}"></span>
					<span class="font-bold text-base-content tabular-nums">{ngn(hp.priceNgn)}</span>
					<span class="text-base-content/60">median</span>
				</p>
				<p class="text-base-content/70 tabular-nums">Avg {ngn(hp.avgNgn)}</p>
				<p class="text-base-content/70 tabular-nums">Range {short(hp.lowNgn)}–{short(hp.highNgn)}</p>
				<p class="text-base-content/50">{hp.sampleSize} {hp.sampleSize === 1 ? 'entry' : 'entries'}</p>
			</div>
		{/if}
	{/if}
</div>
