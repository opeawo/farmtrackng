<script lang="ts">
	import { equipment, formatNgn, downPayment } from '$lib/data/equipment';
	import { ShoppingBag, ChevronRight, Wallet, Package } from 'lucide-svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import AppMenu from '$lib/components/ui/AppMenu.svelte';
</script>

<SEO
	title="Equipment Marketplace — 30% down, rest in installments"
	description="Buy poultry processing equipment in Nigeria with flexible financing. Poultry processor, defeathering machine, electric chicken cutter — 30% down, balance in installments paid on WhatsApp."
	canonicalPath="/marketplace"
/>

<!-- Hero -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-8 rounded-b-[2rem]">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
				<ShoppingBag size={18} class="text-white" />
			</div>
			<span class="font-bold text-lg tracking-tight">Equipment Marketplace</span>
		</div>
		<AppMenu />
	</div>
	<h1 class="text-2xl font-bold leading-tight">Tools to grow your farm</h1>
	<p class="text-white/70 text-sm mt-1">30% down. Spread the rest in installments.</p>
</div>

<div class="px-4 pt-4 space-y-3 pb-24">
	<!-- Financing banner -->
	<div class="bg-accent/10 border border-accent/20 rounded-2xl p-3 flex items-start gap-3">
		<Wallet size={18} class="text-accent shrink-0 mt-0.5" />
		<p class="text-xs text-base-content/70">
			Every item ships on the same plan: <span class="font-semibold text-base-content">30% down payment</span>, balance in installments agreed on WhatsApp.
		</p>
	</div>

	<!-- Equipment list -->
	{#each equipment as item}
		<a
			href="/marketplace/{item.id}"
			class="group flex gap-3 p-3 bg-white rounded-2xl shadow-sm border border-base-300/50 active:scale-[0.99] transition-transform"
		>
			<div class="w-20 h-20 shrink-0 rounded-xl bg-base-200 overflow-hidden">
				{#if item.image}
					<img
						src={item.image}
						alt={item.imageAlt}
						loading="lazy"
						class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
					/>
				{:else}
					<div class="w-full h-full bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] flex items-center justify-center">
						<Package size={28} class="text-white/70" />
					</div>
				{/if}
			</div>
			<div class="flex-1 min-w-0 flex flex-col justify-between">
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0">
						<h3 class="font-semibold text-[15px] leading-tight">{item.name}</h3>
						<p class="text-xs text-base-content/50 mt-0.5 line-clamp-1">{item.tagline}</p>
					</div>
					<ChevronRight size={18} class="text-base-content/30 shrink-0 mt-0.5" />
				</div>
				<div class="flex items-baseline gap-2 mt-2">
					<p class="font-bold text-primary">{formatNgn(item.priceNgn)}</p>
					<p class="text-[11px] text-base-content/50">
						{formatNgn(downPayment(item.priceNgn))} down
					</p>
				</div>
			</div>
		</a>
	{/each}
</div>
