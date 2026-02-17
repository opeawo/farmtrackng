<script lang="ts">
	import { user } from '$lib/stores/user';
	import {
		ClipboardList, HeartPulse, TrendingUp, AlertTriangle,
		Plus, Syringe, ChevronRight, Leaf, Sun, Moon, Sunset
	} from 'lucide-svelte';

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
	const GreetingIcon = hour < 6 ? Moon : hour < 17 ? Sun : Sunset;
</script>

<!-- Hero Header -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-8 rounded-b-[2rem]">
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

	<div class="flex items-center gap-2 mb-1">
		<GreetingIcon size={16} class="text-white/70" />
		<span class="text-white/70 text-sm">{greeting}</span>
	</div>
	<h1 class="text-2xl font-bold">{$user ? $user.fullName : 'Farmer'}</h1>

	<!-- Stats Row -->
	<div class="grid grid-cols-3 gap-3 mt-5">
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
			<p class="text-2xl font-bold">0</p>
			<p class="text-[11px] text-white/60">Livestock</p>
		</div>
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
			<p class="text-2xl font-bold">0</p>
			<p class="text-[11px] text-white/60">Records</p>
		</div>
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
			<p class="text-2xl font-bold text-warning">0</p>
			<p class="text-[11px] text-white/60">Alerts</p>
		</div>
	</div>
</div>

<div class="px-4 -mt-4 space-y-5 pb-4">
	<!-- Quick Actions -->
	<div class="grid grid-cols-2 gap-3">
		<a href="/records/add" class="bg-gradient-to-br from-primary to-[#40916c] text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97] transition-transform">
			<div class="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
				<Plus size={22} />
			</div>
			<span class="text-sm font-semibold">Add Record</span>
			<span class="text-[11px] text-white/70">Voice or manual</span>
		</a>
		<a href="/health/check" class="bg-gradient-to-br from-[#b7e4c7] to-[#95d5b2] text-[#1b4332] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg shadow-secondary/20 active:scale-[0.97] transition-transform">
			<div class="w-11 h-11 rounded-full bg-[#1b4332]/10 flex items-center justify-center">
				<HeartPulse size={22} />
			</div>
			<span class="text-sm font-semibold">Health Check</span>
			<span class="text-[11px] text-[#1b4332]/60">Symptom checker</span>
		</a>
	</div>

	<!-- Section Label -->
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-bold text-base-content/80">Quick Access</h2>
	</div>

	<!-- Feature Cards -->
	<div class="space-y-3">
		<a href="/records" class="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 active:scale-[0.98] transition-transform">
			<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
				<ClipboardList size={22} class="text-primary" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-[15px]">Farm Records</h3>
				<p class="text-xs text-base-content/50 mt-0.5">Track feeding, sales & expenses</p>
			</div>
			<ChevronRight size={18} class="text-base-content/20 group-hover:text-base-content/40 transition-colors shrink-0" />
		</a>

		<a href="/health" class="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 active:scale-[0.98] transition-transform">
			<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center shrink-0">
				<Syringe size={22} class="text-success" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-[15px]">Vaccinations</h3>
				<p class="text-xs text-base-content/50 mt-0.5">Upcoming vaccination schedule</p>
			</div>
			<ChevronRight size={18} class="text-base-content/20 group-hover:text-base-content/40 transition-colors shrink-0" />
		</a>

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
		<p class="text-sm text-base-content/70">Regular deworming every 3 months helps keep your livestock healthy and productive.</p>
	</div>
</div>
