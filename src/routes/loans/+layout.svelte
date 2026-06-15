<script lang="ts">
	import '../../app.css';
	import type { LayoutData } from './$types';
	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
</script>

<div class="min-h-screen bg-base-200">
	<header class="bg-primary text-primary-content">
		<div class="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
			<a href="/loans" class="flex items-center gap-2 font-bold">
				<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-content/20">₦</span>
				FarmPaddy Loans
			</a>
			{#if data.authed}
				<a href="/loans/logout" data-sveltekit-reload class="text-sm opacity-80 hover:opacity-100"
					>Log out</a
				>
			{/if}
		</div>
	</header>
	<main class="mx-auto max-w-2xl px-4 py-6">
		{@render children()}
	</main>
</div>
