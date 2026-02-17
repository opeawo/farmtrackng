<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Plus, Filter } from 'lucide-svelte';

	const recordTypes = ['all', 'feeding', 'treatment', 'sale', 'purchase', 'birth', 'death', 'expense', 'income'];
	let selectedType = $state('all');

	// In production, this would come from Supabase/IndexedDB
	let records = $state<Array<{
		id: string;
		record_type: string;
		title: string;
		description: string;
		amount: number | null;
		recorded_at: string;
	}>>([]);
</script>

<PageHeader title="Farm Records" />

<div class="px-4 py-4 space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex gap-2 overflow-x-auto pb-2 flex-1">
			{#each recordTypes as type}
				<button
					class="btn btn-xs whitespace-nowrap"
					class:btn-primary={selectedType === type}
					class:btn-ghost={selectedType !== type}
					onclick={() => (selectedType = type)}
				>
					{type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	{#if records.length === 0}
		<EmptyState
			title="No records yet"
			message="Start tracking your farm activities"
			actionLabel="Add Record"
			actionHref="/records/add"
		/>
	{:else}
		<div class="space-y-2">
			{#each records as record}
				<a href="/records/{record.id}" class="card bg-base-100 shadow-sm border border-base-300">
					<div class="card-body p-4">
						<div class="flex justify-between items-start">
							<div>
								<span class="badge badge-sm badge-outline">{record.record_type}</span>
								<h3 class="font-semibold text-sm mt-1">{record.title}</h3>
								{#if record.description}
									<p class="text-xs text-base-content/60 line-clamp-2">{record.description}</p>
								{/if}
							</div>
							{#if record.amount}
								<span class="font-bold text-sm">&#8358;{record.amount.toLocaleString()}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<a href="/records/add" class="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#40916c] text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
	<Plus size={24} />
</a>
