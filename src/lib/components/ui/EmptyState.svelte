<script lang="ts">
	import { Inbox } from 'lucide-svelte';

	interface Props {
		title: string;
		message?: string;
		actionLabel?: string;
		actionHref?: string;
	}

	let { title, message = '', actionLabel = '', actionHref = '' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
	<Inbox size={48} class="text-base-300 mb-4" />
	<h3 class="text-lg font-semibold text-base-content">{title}</h3>
	{#if message}
		<p class="text-sm text-base-content/60 mt-1 max-w-xs">{message}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a href={actionHref} class="btn btn-primary btn-sm mt-4">{actionLabel}</a>
	{/if}
</div>
