<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';

	interface Props {
		title: string;
		backHref?: string;
	}

	let { title, backHref }: Props = $props();
</script>

<header class="sticky top-0 z-40 bg-primary text-primary-content px-4 py-3 flex items-center gap-3">
	{#if backHref}
		<a href={backHref} class="btn btn-ghost btn-sm btn-circle text-primary-content">
			<ArrowLeft size={20} />
		</a>
	{/if}
	<h1 class="text-lg font-bold">{title}</h1>
</header>
