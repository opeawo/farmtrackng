<script lang="ts">
	import {
		formatNgn,
		downPayment,
		balanceAmount,
		whatsappBuyUrl
	} from '$lib/data/equipment';
	import { ArrowLeft, Check, Wallet, MessageCircle } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const item = $derived(data.item);
	const buyUrl = $derived(whatsappBuyUrl(item));
</script>

<!-- Hero image -->
<div class="relative">
	<div class="aspect-[3/2] max-h-[42vh] bg-base-200 overflow-hidden">
		<img src={item.image} alt={item.imageAlt} class="w-full h-full object-cover" />
	</div>
	<a
		href="/marketplace"
		class="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
		aria-label="Back to marketplace"
	>
		<ArrowLeft size={20} />
	</a>
</div>

<div class="relative z-10 px-4 -mt-6 space-y-4 pb-32">
	<!-- Title card -->
	<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50">
		<h1 class="text-xl font-bold leading-tight">{item.name}</h1>
		<p class="text-sm text-base-content/60 mt-1">{item.tagline}</p>
		<div class="mt-3 pt-3 border-t border-base-300/50">
			<p class="text-[11px] text-base-content/50 uppercase tracking-wide">Price</p>
			<p class="text-2xl font-bold text-primary mt-0.5">{formatNgn(item.priceNgn)}</p>
		</div>
	</div>

	<!-- Payment plan -->
	<div class="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-4 space-y-3">
		<div class="flex items-center gap-2">
			<Wallet size={18} class="text-accent" />
			<h2 class="font-semibold text-sm text-accent">Payment plan</h2>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div class="bg-white/70 rounded-xl p-3">
				<p class="text-[11px] text-base-content/50 uppercase tracking-wide">30% down</p>
				<p class="font-bold text-base mt-0.5">{formatNgn(downPayment(item.priceNgn))}</p>
				<p class="text-[11px] text-base-content/50 mt-1">Pay today to reserve</p>
			</div>
			<div class="bg-white/70 rounded-xl p-3">
				<p class="text-[11px] text-base-content/50 uppercase tracking-wide">Balance</p>
				<p class="font-bold text-base mt-0.5">{formatNgn(balanceAmount(item.priceNgn))}</p>
				<p class="text-[11px] text-base-content/50 mt-1">Spread in installments</p>
			</div>
		</div>
		<p class="text-xs text-base-content/60">
			Installment tenure and monthly amount are agreed on WhatsApp based on your farm cash flow.
		</p>
	</div>

	<!-- Description -->
	<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50">
		<h2 class="font-semibold text-sm mb-2">About this equipment</h2>
		<p class="text-sm text-base-content/70 leading-relaxed">{item.description}</p>
	</div>

	<!-- Features -->
	<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50">
		<h2 class="font-semibold text-sm mb-3">What you get</h2>
		<ul class="space-y-2">
			{#each item.features as feature}
				<li class="flex items-start gap-2 text-sm text-base-content/80">
					<Check size={16} class="text-success shrink-0 mt-0.5" />
					<span>{feature}</span>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Specs -->
	<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50">
		<h2 class="font-semibold text-sm mb-3">Specifications</h2>
		<dl class="space-y-2">
			{#each item.specs as spec}
				<div class="flex items-baseline justify-between gap-3 text-sm border-b border-base-300/40 pb-2 last:border-0 last:pb-0">
					<dt class="text-base-content/50">{spec.label}</dt>
					<dd class="font-medium text-right">{spec.value}</dd>
				</div>
			{/each}
		</dl>
	</div>

</div>

<!-- Sticky buy bar -->
<div class="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3">
	<div class="max-w-lg mx-auto">
		<a
			href={buyUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="btn btn-success w-full gap-2 shadow-lg shadow-success/30 text-white"
		>
			<MessageCircle size={18} />
			Buy on WhatsApp
		</a>
	</div>
</div>
