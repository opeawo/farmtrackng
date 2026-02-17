<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';

	interface Props {
		title: string;
		backHref?: string;
	}

	let { title, backHref }: Props = $props();
</script>

<header class="sticky top-0 z-40 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white px-4 py-3.5 flex items-center gap-3 shadow-md">
	{#if backHref}
		<a href={backHref} class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
			<ArrowLeft size={18} />
		</a>
	{/if}
	<h1 class="text-lg font-bold tracking-tight">{title}</h1>
</header>
