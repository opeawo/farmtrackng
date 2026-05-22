<script lang="ts">
	import { user } from '$lib/stores/user';
	import {
		Sparkles, TrendingUp, AlertTriangle, ShoppingBag,
		ChevronRight, Leaf, Sun, Moon, Sunset, MapPin, ArrowRight
	} from 'lucide-svelte';

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
	const GreetingIcon = hour < 6 ? Moon : hour < 17 ? Sun : Sunset;

	const tips = [
		'Regular deworming every 3 months keeps livestock healthy and productive.',
		'Vaccinate chickens against Newcastle Disease every 3–4 months — it is the biggest killer of poultry in Nigeria.',
		'Always quarantine new animals for at least 14 days before mixing them with your herd.',
		'Clean drinking water cuts disease risk more than any single medication. Change water twice daily.',
		'Store feed off the ground on pallets to keep moisture and rats out — mouldy feed causes liver damage.',
		'In the dry season, vaccinate small ruminants against PPR before the herd starts moving for grazing.',
		'Check your animals at the same time every day. Early signs of sickness — droopy ears, not eating — are easy to miss.',
		'Record sales and feed costs weekly. Margins shift fast when feed prices move.',
		'Foot rot in sheep spreads in wet pens. Keep bedding dry and trim hooves monthly.',
		'Hot afternoons drop layer hen egg production. Provide shade and cool drinking water in the heat.'
	];
	const dayOfYear = Math.floor(
		(Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
	);
	const tipOfDay = tips[dayOfYear % tips.length];
</script>

<!-- Hero Header -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-10 rounded-b-[2rem]">
	<div class="flex items-center justify-between mb-5">
		<div class="flex items-center gap-2">
			<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
				<Leaf size={18} class="text-white" />
			</div>
			<span class="font-bold text-lg tracking-tight">FarmTrack</span>
		</div>
		<div class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
			<span class="text-sm">NG</span>
		</div>
	</div>

	<div class="flex items-center gap-2 mb-2">
		<GreetingIcon size={16} class="text-white/70" />
		<span class="text-white/70 text-sm">{greeting}</span>
	</div>
	{#if $user?.state}
		<div class="flex items-center gap-2">
			<MapPin size={22} class="text-white/80" />
			<h1 class="text-2xl font-bold">{$user.state}{$user.lga ? ` · ${$user.lga}` : ''}</h1>
		</div>
	{:else}
		<a href="/onboard" class="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-full pl-3 pr-2 py-1.5 mt-1">
			<MapPin size={16} class="text-white/80" />
			<span class="text-sm font-medium">Set your location</span>
			<ArrowRight size={14} class="text-white/70" />
		</a>
	{/if}
</div>

<div class="px-4 -mt-4 space-y-5 pb-4">
	<!-- Quick Actions -->
	<div class="grid grid-cols-2 gap-3">
		<a href="/ai" class="bg-gradient-to-br from-primary to-[#40916c] text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97] transition-transform">
			<div class="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
				<Sparkles size={22} />
			</div>
			<span class="text-sm font-semibold">Ask Animal AI</span>
			<span class="text-[11px] text-white/70">Diagnose, price, advice</span>
		</a>
		<a href="/marketplace" class="bg-gradient-to-br from-[#b7e4c7] to-[#95d5b2] text-[#1b4332] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg shadow-secondary/20 active:scale-[0.97] transition-transform">
			<div class="w-11 h-11 rounded-full bg-[#1b4332]/10 flex items-center justify-center">
				<ShoppingBag size={22} />
			</div>
			<span class="text-sm font-semibold">Shop Equipment</span>
			<span class="text-[11px] text-[#1b4332]/60">30% down, rest in installments</span>
		</a>
	</div>

	<!-- Section Label -->
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-bold text-base-content/80">Quick Access</h2>
	</div>

	<!-- Feature Cards -->
	<div class="space-y-3">
		<a href="/markets" class="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 active:scale-[0.98] transition-transform">
			<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
				<TrendingUp size={22} class="text-accent" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-[15px]">Market Prices</h3>
				<p class="text-xs text-base-content/50 mt-0.5">Latest livestock market prices</p>
			</div>
			<ChevronRight size={18} class="text-base-content/20 group-hover:text-base-content/40 transition-colors shrink-0" />
		</a>

		<a href="/alerts" class="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 active:scale-[0.98] transition-transform">
			<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-error/15 to-error/5 flex items-center justify-center shrink-0">
				<AlertTriangle size={22} class="text-error" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-[15px]">Disease Alerts</h3>
				<p class="text-xs text-base-content/50 mt-0.5">Nearby outbreak warnings</p>
			</div>
			<ChevronRight size={18} class="text-base-content/20 group-hover:text-base-content/40 transition-colors shrink-0" />
		</a>
	</div>

	<!-- Tip Card -->
	<div class="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-4">
		<p class="text-xs font-semibold text-accent mb-1">Tip of the day</p>
		<p class="text-sm text-base-content/70">{tipOfDay}</p>
	</div>
</div>
