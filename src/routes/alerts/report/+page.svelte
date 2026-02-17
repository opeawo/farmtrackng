<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import LocationPicker from '$lib/components/maps/LocationPicker.svelte';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { diseases } from '$lib/data/diseases';
	import { nigerianStates } from '$lib/data/markets';

	let diseaseName = $state('');
	let livestockType = $state('');
	let severity = $state('medium');
	let description = $state('');
	let selectedState = $state('');
	let lga = $state('');
	let lat = $state(9.06);
	let lng = $state(7.49);
	let saving = $state(false);

	const currentState = $derived(nigerianStates.find((s) => s.name === selectedState));
	const filteredDiseases = $derived(
		livestockType
			? diseases.filter((d) => d.livestockTypes.includes(livestockType))
			: diseases
	);

	function handleLocation(newLat: number, newLng: number) {
		lat = newLat;
		lng = newLng;
	}

	async function submit() {
		saving = true;
		// In production: save to Supabase disease_alerts table
		goto('/alerts');
	}
</script>

<PageHeader title="Report Outbreak" backHref="/alerts" />

<div class="px-4 py-4 space-y-4">
	<div class="alert alert-warning">
		<span class="text-sm">Only report confirmed or strongly suspected disease outbreaks. False reports may cause unnecessary panic.</span>
	</div>

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

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Disease</span></div>
			<select bind:value={diseaseName} class="select select-bordered w-full" required>
				<option value="">Select disease</option>
				{#each filteredDiseases as d}
					<option value={d.name}>{d.name}</option>
				{/each}
				<option value="other">Other / Unknown</option>
			</select>
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Severity</span></div>
			<select bind:value={severity} class="select select-bordered w-full">
				<option value="low">Low - Few animals affected</option>
				<option value="medium">Medium - Several animals affected</option>
				<option value="high">High - Many animals affected</option>
				<option value="critical">Critical - Widespread / deaths</option>
			</select>
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Description</span></div>
			<textarea bind:value={description} placeholder="Describe the outbreak..." class="textarea textarea-bordered w-full" rows="3"></textarea>
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
				<div class="label"><span class="label-text">LGA</span></div>
				<select bind:value={lga} class="select select-bordered w-full">
					<option value="">Select LGA</option>
					{#each currentState.lgas as l}
						<option value={l}>{l}</option>
					{/each}
				</select>
			</label>
		{/if}

		<div>
			<div class="label"><span class="label-text">Location</span></div>
			<LocationPicker {lat} {lng} onSelect={handleLocation} />
		</div>

		<button type="submit" class="btn btn-error btn-block" disabled={!diseaseName || !livestockType || !selectedState || saving}>
			{#if saving}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Report Outbreak
		</button>
	</form>
</div>
