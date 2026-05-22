<script lang="ts">
	import { equipment, formatNgn, downPayment } from '$lib/data/equipment';
	import { ShoppingBag, ChevronRight, Wallet } from 'lucide-svelte';
</script>

<!-- Hero -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-8 rounded-b-[2rem]">
	<div class="flex items-center gap-2 mb-3">
		<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
			<ShoppingBag size={18} class="text-white" />
		</div>
		<span class="font-bold text-lg tracking-tight">Equipment Marketplace</span>
	</div>
	<h1 class="text-2xl font-bold leading-tight">Tools to grow your farm</h1>
	<p class="text-white/70 text-sm mt-1">30% down. Spread the rest in installments.</p>
</div>

<div class="px-4 pt-4 space-y-4 pb-24">
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
			class="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-base-300/50 active:scale-[0.99] transition-transform"
		>
			<div class="aspect-[16/9] bg-base-200 overflow-hidden">
				<img
					src={item.image}
					alt={item.imageAlt}
					loading="lazy"
					class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				/>
			</div>
			<div class="p-4 space-y-2">
				<div class="flex items-start justify-between gap-3">
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-[15px] leading-tight">{item.name}</h3>
						<p class="text-xs text-base-content/50 mt-0.5">{item.tagline}</p>
					</div>
					<ChevronRight size={18} class="text-base-content/30 shrink-0 mt-1" />
				</div>
				<div class="flex items-center justify-between pt-2 border-t border-base-300/50">
					<div>
						<p class="text-[11px] text-base-content/50 uppercase tracking-wide">Price</p>
						<p class="font-bold text-primary">{formatNgn(item.priceNgn)}</p>
					</div>
					<div class="text-right">
						<p class="text-[11px] text-base-content/50 uppercase tracking-wide">30% down</p>
						<p class="font-semibold text-sm">{formatNgn(downPayment(item.priceNgn))}</p>
					</div>
				</div>
			</div>
		</a>
	{/each}
</div>
