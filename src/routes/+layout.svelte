<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/ui/BottomNav.svelte';
	import OfflineBanner from '$lib/components/ui/OfflineBanner.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const hideNav = $derived(page.url.pathname.startsWith('/onboard'));
</script>

<div class="min-h-screen bg-base-200/50">
	<OfflineBanner />
	{@render children()}
	{#if !hideNav}
		<BottomNav />
	{/if}
</div>
