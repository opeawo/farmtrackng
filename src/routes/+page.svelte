<script lang="ts">
	import { onMount } from 'svelte';
	import { user, requestLocation } from '$lib/stores/user';
	import SEO from '$lib/components/ui/SEO.svelte';
	import {
		Sparkles, TrendingUp, ShoppingBag,
		ChevronRight, Leaf, Sun, Moon, Sunset, MapPin, ArrowRight, Loader2,
		MoreVertical, Info, FileText, ShieldCheck, X
	} from 'lucide-svelte';

	let menuOpen = $state(false);

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
		// Bumped to v2 to invalidate truncated tips cached when the previous
		// maxOutputTokens (80) was too small for the model.
		return `farmtrack:tip:v2:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
			// Guard against a truncated/broken cached tip — re-fetch if too short.
			if (cached && cached.length >= 15) {
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
			if (typeof data.tip === 'string' && data.tip.length >= 15) {
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

<SEO
	titleFull="FarmPaddy — Animal AI, market prices & equipment for Nigerian farmers"
	description="Ask FarmPaddy's Animal AI about livestock health, check live market prices for poultry and cattle, and buy processing equipment with 30% down. Built for Nigerian farmers and animal health workers."
	canonicalPath="/"
/>

<!-- Hero Header -->
<!-- Photo by Feyza Yıldırım on Pexels: https://www.pexels.com/photo/11350565/ -->
<div
	class="relative text-white px-5 pt-6 pb-10 rounded-b-[2rem] bg-cover bg-center"
	style="background-image: linear-gradient(135deg, rgba(27,67,50,0.94) 0%, rgba(45,106,79,0.82) 45%, rgba(64,145,108,0.62) 100%), url('/images/herd-of-cattle-grazing-green-pasture-farm-11350565.jpg');"
>
	<div class="flex items-center justify-between mb-5">
		<div class="flex items-center gap-2">
			<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
				<Leaf size={18} class="text-white" />
			</div>
			<span class="font-bold text-lg tracking-tight">FarmPaddy</span>
		</div>
		<button
			type="button"
			onclick={() => (menuOpen = true)}
			class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
			aria-label="Open menu"
		>
			<MoreVertical size={18} class="text-white" />
		</button>
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
	<!-- Animal AI — primary feature -->
	<a
		href="/ai"
		class="block bg-gradient-to-br from-primary to-[#40916c] text-white rounded-2xl p-5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
	>
		<div class="flex items-center gap-4">
			<div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
				<Sparkles size={28} />
			</div>
			<div class="flex-1 min-w-0">
				<h2 class="text-lg font-bold leading-tight">Ask Animal AI</h2>
				<p class="text-[13px] text-white/80 mt-0.5">Diagnose, get treatment and prices in seconds</p>
			</div>
			<ArrowRight size={20} class="text-white/70 shrink-0" />
		</div>
	</a>

	<!-- Shop + Market -->
	<div class="grid grid-cols-2 gap-3">
		<a
			href="/marketplace"
			class="bg-gradient-to-br from-[#b7e4c7] to-[#95d5b2] text-[#1b4332] rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-secondary/20 active:scale-[0.97] transition-transform"
		>
			<div class="w-11 h-11 rounded-full bg-[#1b4332]/10 flex items-center justify-center">
				<ShoppingBag size={22} />
			</div>
			<div>
				<span class="text-sm font-semibold block">Shop Equipment</span>
				<span class="text-[11px] text-[#1b4332]/60">30% down, pay the rest in bits</span>
			</div>
		</a>
		<a
			href="/markets"
			class="bg-gradient-to-br from-accent/25 to-accent/10 text-[#1b4332] rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-accent/10 active:scale-[0.97] transition-transform"
		>
			<div class="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center">
				<TrendingUp size={22} class="text-accent" />
			</div>
			<div>
				<span class="text-sm font-semibold block">Market Prices</span>
				<span class="text-[11px] text-[#1b4332]/60">Live livestock prices by state</span>
			</div>
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
		<span class="mx-1">·</span>
		<a href="/privacy" class="hover:text-base-content/70">Privacy</a>
	</p>
</div>

<!-- Menu bottom sheet -->
{#if menuOpen}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="App menu"
		class="fixed inset-0 z-50 flex items-end justify-center"
	>
		<button
			type="button"
			aria-label="Close menu"
			onclick={() => (menuOpen = false)}
			class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
		></button>

		<div class="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-4 pb-safe animate-in slide-in-from-bottom">
			<div class="flex items-center justify-between mb-3 px-1">
				<h2 class="text-sm font-bold text-base-content/80 uppercase tracking-wide">Menu</h2>
				<button
					type="button"
					onclick={() => (menuOpen = false)}
					class="w-8 h-8 rounded-full hover:bg-base-200 flex items-center justify-center"
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div class="space-y-1">
				<a
					href="/about"
					onclick={() => (menuOpen = false)}
					class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-200/60 active:scale-[0.99] transition-transform"
				>
					<div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
						<Info size={18} class="text-primary" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-semibold">About FarmPaddy</p>
						<p class="text-xs text-base-content/50">Story, supporters, and contact</p>
					</div>
					<ChevronRight size={16} class="text-base-content/30" />
				</a>

				<a
					href="/terms"
					onclick={() => (menuOpen = false)}
					class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-200/60 active:scale-[0.99] transition-transform"
				>
					<div class="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
						<FileText size={18} class="text-accent" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-semibold">Terms &amp; Conditions</p>
						<p class="text-xs text-base-content/50">How you may use the service</p>
					</div>
					<ChevronRight size={16} class="text-base-content/30" />
				</a>

				<a
					href="/privacy"
					onclick={() => (menuOpen = false)}
					class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-200/60 active:scale-[0.99] transition-transform"
				>
					<div class="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
						<ShieldCheck size={18} class="text-success" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-semibold">Privacy Policy</p>
						<p class="text-xs text-base-content/50">What we collect and why</p>
					</div>
					<ChevronRight size={16} class="text-base-content/30" />
				</a>
			</div>

			<p class="text-[11px] text-center text-base-content/40 pt-4 pb-2">FarmPaddy — Nigeria</p>
		</div>
	</div>
{/if}
