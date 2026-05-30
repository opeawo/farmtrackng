<script lang="ts">
	import { onMount } from 'svelte';
	import { user, requestLocation } from '$lib/stores/user';
	import {
		Sparkles, TrendingUp, AlertTriangle, ShoppingBag,
		ChevronRight, Leaf, Sun, Moon, Sunset, MapPin, ArrowRight, Loader2
	} from 'lucide-svelte';

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
	const GreetingIcon = hour < 6 ? Moon : hour < 17 ? Sun : Sunset;

	let detecting = $state(false);
	let detectError = $state<string | null>(null);

	async function detectLocation() {
		detectError = null;
		detecting = true;
		try {
			const { lat, lng } = await requestLocation();
			const res = await fetch('/api/geocode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lat, lng })
			});
			const data = await res.json();
			if (!res.ok) {
				detectError = data.error ?? 'Could not detect your location.';
				return;
			}
			user.update((current) => ({
				id: current?.id ?? crypto.randomUUID(),
				fullName: current?.fullName ?? '',
				phone: current?.phone ?? '',
				state: data.state ?? '',
				lga: data.lga ?? '',
				lat,
				lng,
				whatsappOptedIn: current?.whatsappOptedIn ?? false,
				onboarded: true
			}));
		} catch (err) {
			console.error(err);
			detectError =
				err instanceof Error && err.message.includes('denied')
					? 'Location permission denied.'
					: 'Could not detect your location.';
		} finally {
			detecting = false;
		}
	}

	// AI-powered Tip of the day. Generates once per calendar day per browser,
	// cached in localStorage. Falls back to a safe default if the API is unreachable.
	const FALLBACK_TIP =
		'Clean drinking water cuts disease risk more than any single medication. Change water twice daily.';

	let tipOfDay = $state(FALLBACK_TIP);

	function todayKey(): string {
		const d = new Date();
		return `farmtrack:tip:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function dayOfYearNum(): number {
		return Math.floor(
			(Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
		);
	}

	onMount(async () => {
		const key = todayKey();
		try {
			const cached = localStorage.getItem(key);
			if (cached) {
				tipOfDay = cached;
				return;
			}
		} catch {
			// localStorage disabled — fall through to fetch.
		}

		try {
			const res = await fetch('/api/ai/tip', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					species: undefined,
					state: $user?.state || undefined,
					dayOfYear: dayOfYearNum()
				})
			});
			if (!res.ok) return;
			const data = (await res.json()) as { tip?: string };
			if (typeof data.tip === 'string' && data.tip.length > 0) {
				tipOfDay = data.tip;
				try {
					localStorage.setItem(key, data.tip);
				} catch {
					// quota / disabled — ignore
				}
			}
		} catch {
			// network / API unavailable — keep fallback
		}
	});
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
		<button type="button" onclick={detectLocation} disabled={detecting} class="flex items-center gap-2 text-left">
			<MapPin size={22} class="text-white/80" />
			<h1 class="text-2xl font-bold">{$user.state}{$user.lga ? ` · ${$user.lga}` : ''}</h1>
			{#if detecting}<Loader2 size={16} class="text-white/70 animate-spin" />{/if}
		</button>
	{:else}
		<button
			type="button"
			onclick={detectLocation}
			disabled={detecting}
			class="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-full pl-3 pr-2 py-1.5 mt-1 disabled:opacity-70"
		>
			{#if detecting}
				<Loader2 size={16} class="text-white/80 animate-spin" />
				<span class="text-sm font-medium">Detecting…</span>
			{:else}
				<MapPin size={16} class="text-white/80" />
				<span class="text-sm font-medium">Set your location</span>
				<ArrowRight size={14} class="text-white/70" />
			{/if}
		</button>
	{/if}
	{#if detectError}
		<p class="text-xs text-white/80 mt-2">{detectError}</p>
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

	<!-- Footer links -->
	<p class="text-[11px] text-center text-base-content/40 pt-2">
		<a href="/about" class="hover:text-base-content/70">About</a>
		<span class="mx-1">·</span>
		<a href="/terms" class="hover:text-base-content/70">Terms</a>
	</p>
</div>
