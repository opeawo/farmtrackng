<script lang="ts">
	import { getLivestockType } from '$lib/data/livestock-types';

	interface Props {
		id: string;
		livestockType: string;
		breed?: string;
		count: number;
		tagId?: string;
	}

	let { id, livestockType, breed, count, tagId }: Props = $props();

	const typeInfo = $derived(getLivestockType(livestockType));
</script>

<a href="/records?livestock={id}" class="card bg-base-100 shadow-sm border border-base-300">
	<div class="card-body p-4 flex-row items-center gap-3">
		<span class="text-3xl">{typeInfo?.icon ?? '🐾'}</span>
		<div class="flex-1 min-w-0">
			<h3 class="font-semibold text-sm">{typeInfo?.name ?? livestockType}</h3>
			{#if breed}
				<p class="text-xs text-base-content/60">{breed}</p>
			{/if}
			{#if tagId}
				<p class="text-xs text-base-content/40">Tag: {tagId}</p>
			{/if}
		</div>
		<div class="badge badge-primary badge-lg font-bold">{count}</div>
	</div>
</a>
