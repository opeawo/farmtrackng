<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import LocationPicker from '$lib/components/maps/LocationPicker.svelte';
	import { livestockTypes } from '$lib/data/livestock-types';

	let livestockType = $state('');
	let symptoms = $state('');
	let severity = $state('medium');
	let notes = $state('');
	let lat = $state(9.06);
	let lng = $state(7.49);
	let saving = $state(false);

	function handleLocation(newLat: number, newLng: number) {
		lat = newLat;
		lng = newLng;
	}

	async function submit() {
		saving = true;
		// In production: save to Supabase health_incidents table
		goto('/health');
	}
</script>

<PageHeader title="Report Incident" backHref="/health" />

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

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Symptoms</span></div>
			<textarea bind:value={symptoms} placeholder="Describe the symptoms..." class="textarea textarea-bordered w-full" rows="3" required></textarea>
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Severity</span></div>
			<select bind:value={severity} class="select select-bordered w-full">
				<option value="low">Low</option>
				<option value="medium">Medium</option>
				<option value="high">High</option>
				<option value="critical">Critical</option>
			</select>
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Additional Notes</span></div>
			<textarea bind:value={notes} placeholder="Any other details..." class="textarea textarea-bordered w-full" rows="2"></textarea>
		</label>

		<div>
			<div class="label"><span class="label-text">Location</span></div>
			<LocationPicker {lat} {lng} onSelect={handleLocation} />
		</div>

		<button type="submit" class="btn btn-primary btn-block" disabled={!livestockType || !symptoms || saving}>
			{#if saving}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Report Incident
		</button>
	</form>
</div>
