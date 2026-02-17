<script lang="ts">
	import { onMount } from 'svelte';
	import { MapPin } from 'lucide-svelte';
	import { browser } from '$app/environment';

	interface Props {
		lat?: number;
		lng?: number;
		onSelect?: (lat: number, lng: number) => void;
	}

	let { lat = 9.06, lng = 7.49, onSelect }: Props = $props();

	let mapContainer: HTMLDivElement;
	let loading = $state(false);

	function useCurrentLocation() {
		if (!browser) return;
		loading = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat = pos.coords.latitude;
				lng = pos.coords.longitude;
				onSelect?.(lat, lng);
				loading = false;
			},
			() => {
				loading = false;
			},
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	}

	onMount(() => {
		useCurrentLocation();
	});
</script>

<div class="space-y-2">
	<div
		bind:this={mapContainer}
		class="w-full h-40 bg-base-200 rounded-lg flex items-center justify-center"
	>
		<div class="text-center">
			<MapPin size={32} class="mx-auto text-primary mb-1" />
			{#if lat && lng}
				<p class="text-xs text-base-content/60">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
			{:else}
				<p class="text-xs text-base-content/60">No location set</p>
			{/if}
		</div>
	</div>
	<button
		type="button"
		class="btn btn-outline btn-sm btn-block"
		disabled={loading}
		onclick={useCurrentLocation}
	>
		{#if loading}
			<span class="loading loading-spinner loading-xs"></span>
		{/if}
		Use Current Location
	</button>
</div>
