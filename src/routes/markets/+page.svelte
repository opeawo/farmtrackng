<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { nigerianStates } from '$lib/data/markets';
	import { Plus, TrendingUp, TrendingDown } from 'lucide-svelte';

	let selectedAnimal = $state('all');
	let selectedState = $state('all');

	// In production, fetch from Supabase market_prices
	let prices = $state<Array<{
		id: string;
		livestock_type: string;
		breed: string;
		price: number;
		market_name: string;
		state: string;
		submitted_at: string;
	}>>([]);
</script>

<PageHeader title="Market Prices" />

<div class="px-4 py-4 space-y-4">
	<div class="flex gap-2">
		<select bind:value={selectedAnimal} class="select select-bordered select-sm flex-1">
			<option value="all">All Animals</option>
			{#each livestockTypes as type}
				<option value={type.id}>{type.icon} {type.name}</option>
			{/each}
		</select>
		<select bind:value={selectedState} class="select select-bordered select-sm flex-1">
			<option value="all">All States</option>
			{#each nigerianStates as state}
				<option value={state.name}>{state.name}</option>
			{/each}
		</select>
	</div>

	{#if prices.length === 0}
		<EmptyState
			title="No prices reported yet"
			message="Be the first to submit market prices in your area"
			actionLabel="Submit Price"
			actionHref="/markets/submit"
		/>
	{:else}
		<div class="space-y-2">
			{#each prices as price}
				<div class="card bg-base-100 shadow-sm border border-base-300">
					<div class="card-body p-4">
						<div class="flex justify-between items-start">
							<div>
								<h3 class="font-semibold text-sm">{price.livestock_type} - {price.breed}</h3>
								<p class="text-xs text-base-content/60">{price.market_name}, {price.state}</p>
							</div>
							<span class="font-bold text-primary">&#8358;{price.price.toLocaleString()}</span>
						</div>
						<p class="text-xs text-base-content/40">{new Date(price.submitted_at).toLocaleDateString()}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<a href="/markets/submit" class="btn btn-primary btn-circle btn-lg fixed bottom-24 right-4 shadow-lg z-30">
	<Plus size={24} />
</a>
