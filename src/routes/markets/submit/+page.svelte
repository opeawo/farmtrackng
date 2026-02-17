<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { livestockTypes, getLivestockType } from '$lib/data/livestock-types';
	import { nigerianStates, getStateByName } from '$lib/data/markets';

	let livestockType = $state('');
	let breed = $state('');
	let price = $state('');
	let selectedState = $state('');
	let marketName = $state('');
	let saving = $state(false);

	const currentType = $derived(getLivestockType(livestockType));
	const currentState = $derived(getStateByName(selectedState));

	async function submit() {
		saving = true;
		// In production: save to Supabase market_prices table
		goto('/markets');
	}
</script>

<PageHeader title="Submit Price" backHref="/markets" />

<div class="px-4 py-4 space-y-4">
	<form onsubmit={submit} class="space-y-4">
		<label class="form-control w-full">
			<div class="label"><span class="label-text">Animal Type</span></div>
			<select bind:value={livestockType} class="select select-bordered w-full" required>
				<option value="">Select animal</option>
				{#each livestockTypes as type}
					<option value={type.id}>{type.icon} {type.name}</option>
				{/each}
			</select>
		</label>

		{#if currentType}
			<label class="form-control w-full">
				<div class="label"><span class="label-text">Breed</span></div>
				<select bind:value={breed} class="select select-bordered w-full">
					<option value="">Select breed</option>
					{#each currentType.breeds as b}
						<option value={b}>{b}</option>
					{/each}
				</select>
			</label>
		{/if}

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Price (NGN)</span></div>
			<input type="number" bind:value={price} placeholder="0" class="input input-bordered w-full" required />
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">State</span></div>
			<select bind:value={selectedState} class="select select-bordered w-full" required>
				<option value="">Select state</option>
				{#each nigerianStates as state}
					<option value={state.name}>{state.name}</option>
				{/each}
			</select>
		</label>

		{#if currentState}
			<label class="form-control w-full">
				<div class="label"><span class="label-text">Market</span></div>
				<select bind:value={marketName} class="select select-bordered w-full" required>
					<option value="">Select market</option>
					{#each currentState.majorMarkets as m}
						<option value={m}>{m}</option>
					{/each}
				</select>
			</label>
		{/if}

		<button type="submit" class="btn btn-primary btn-block" disabled={!livestockType || !price || !selectedState || saving}>
			{#if saving}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Submit Price
		</button>
	</form>
</div>
