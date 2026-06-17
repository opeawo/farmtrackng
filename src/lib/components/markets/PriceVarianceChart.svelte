<script lang="ts" generics="T extends { state: string; priceNgn: number; lowNgn?: number; highNgn?: number }">
	// Lightweight horizontal bar chart of price-per-state for one livestock type.
	// Bars are sorted most→least expensive; a lighter band shows each state's
	// low–high spread, and a dashed line marks the national median. No SVG / no
	// charting dependency — plain themeable HTML so it stays crisp on mobile.

	let {
		points,
		color = 'var(--color-primary)',
		maxValue,
		medianValue,
		compact = false,
		onselect
	}: {
		points: T[];
		color?: string;
		maxValue?: number;
		medianValue?: number;
		compact?: boolean;
		onselect?: (p: T) => void;
	} = $props();

	const sorted = $derived([...points].sort((a, b) => b.priceNgn - a.priceNgn));
	const scaleMax = $derived(maxValue ?? Math.max(1, ...points.map((p) => p.highNgn ?? p.priceNgn)));
	const medianPct = $derived(medianValue != null ? (medianValue / scaleMax) * 100 : null);

	function pct(v: number): number {
		return Math.max(0, Math.min(100, (v / scaleMax) * 100));
	}
	function fmt(n: number): string {
		return '₦' + n.toLocaleString('en-NG');
	}
</script>

<div class="space-y-1">
	{#each sorted as p (p.state + p.priceNgn)}
		{@const pricePct = pct(p.priceNgn)}
		{@const lowPct = p.lowNgn ? pct(p.lowNgn) : pricePct}
		{@const highPct = p.highNgn ? pct(p.highNgn) : pricePct}
		<button
			type="button"
			onclick={() => onselect?.(p)}
			class="group flex items-center gap-2 w-full text-left"
			aria-label={`${p.state}: ${fmt(p.priceNgn)} per kg`}
		>
			<span
				class="shrink-0 truncate text-base-content/70 {compact
					? 'w-14 text-[10px]'
					: 'w-16 text-[11px]'}"
				title={p.state}>{p.state}</span
			>
			<span
				class="relative flex-1 rounded bg-base-200 overflow-hidden {compact ? 'h-3' : 'h-5'}"
			>
				{#if p.lowNgn && p.highNgn && highPct > lowPct}
					<span
						class="absolute inset-y-0 rounded"
						style="left:{lowPct}%;width:{highPct - lowPct}%;background:{color};opacity:.22"
					></span>
				{/if}
				<span
					class="absolute inset-y-0 left-0 rounded transition-[filter] group-hover:brightness-90"
					style="width:{pricePct}%;background:{color}"
				></span>
				{#if medianPct != null}
					<span
						class="absolute inset-y-0 border-l border-dashed border-base-content/40"
						style="left:{medianPct}%"
					></span>
				{/if}
			</span>
			<span
				class="shrink-0 text-right font-semibold tabular-nums {compact
					? 'w-14 text-[10px]'
					: 'w-16 text-xs'}">{fmt(p.priceNgn)}</span
			>
		</button>
	{/each}
</div>
