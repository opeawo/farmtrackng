<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { page } from '$app/state';
	import { Calendar, Tag } from 'lucide-svelte';

	const recordId = $derived(page.params.id);

	// In production, fetch from Supabase by ID
	let record = $state<{
		id: string;
		record_type: string;
		title: string;
		description: string;
		amount: number | null;
		recorded_at: string;
	} | null>(null);
</script>

<PageHeader title="Record Detail" backHref="/records" />

<div class="px-4 py-4">
	{#if record}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<div class="flex items-center gap-2 mb-2">
					<span class="badge badge-primary">{record.record_type}</span>
					{#if record.amount}
						<span class="font-bold">&#8358;{record.amount.toLocaleString()}</span>
					{/if}
				</div>
				<h2 class="card-title text-lg">{record.title}</h2>
				{#if record.description}
					<p class="text-sm text-base-content/70">{record.description}</p>
				{/if}
				<div class="flex items-center gap-1 text-xs text-base-content/50 mt-2">
					<Calendar size={14} />
					<span>{new Date(record.recorded_at).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-base-content/60">Record not found</p>
			<a href="/records" class="btn btn-primary btn-sm mt-4">Back to Records</a>
		</div>
	{/if}
</div>
