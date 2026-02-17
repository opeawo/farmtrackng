<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { matchSymptoms, type Disease } from '$lib/data/diseases';
	import { AlertTriangle, CheckCircle } from 'lucide-svelte';

	let selectedAnimal = $state('');
	let symptomInput = $state('');
	let selectedSymptoms = $state<string[]>([]);
	let results = $state<{ disease: Disease; matchCount: number }[]>([]);

	const currentAnimal = $derived(livestockTypes.find((t) => t.id === selectedAnimal));

	function addSymptom() {
		const trimmed = symptomInput.trim().toLowerCase();
		if (trimmed && !selectedSymptoms.includes(trimmed)) {
			selectedSymptoms = [...selectedSymptoms, trimmed];
			symptomInput = '';
		}
	}

	function removeSymptom(s: string) {
		selectedSymptoms = selectedSymptoms.filter((sym) => sym !== s);
	}

	function checkSymptoms() {
		if (!selectedAnimal || selectedSymptoms.length === 0) return;
		results = matchSymptoms(selectedSymptoms, selectedAnimal);
	}
</script>

<PageHeader title="Symptom Checker" backHref="/health" />

<div class="px-4 py-4 space-y-4">
	<label class="form-control w-full">
		<div class="label"><span class="label-text">Animal Type</span></div>
		<select bind:value={selectedAnimal} class="select select-bordered w-full">
			<option value="">Select animal</option>
			{#each livestockTypes as type}
				<option value={type.id}>{type.icon} {type.name}</option>
			{/each}
		</select>
	</label>

	{#if selectedAnimal && currentAnimal}
		<div>
			<div class="label"><span class="label-text">Common Symptoms</span></div>
			<div class="flex flex-wrap gap-2">
				{#each ['fever', 'not eating', 'diarrhea', 'weight loss', 'weakness', 'lameness', 'coughing', 'nasal discharge'] as symptom}
					<button
						class="btn btn-xs"
						class:btn-primary={selectedSymptoms.includes(symptom)}
						class:btn-outline={!selectedSymptoms.includes(symptom)}
						onclick={() => {
							if (selectedSymptoms.includes(symptom)) removeSymptom(symptom);
							else selectedSymptoms = [...selectedSymptoms, symptom];
						}}
					>
						{symptom}
					</button>
				{/each}
			</div>
		</div>

		<form onsubmit={addSymptom} class="flex gap-2">
			<input
				type="text"
				bind:value={symptomInput}
				placeholder="Add other symptom..."
				class="input input-bordered input-sm flex-1"
			/>
			<button type="submit" class="btn btn-sm btn-primary">Add</button>
		</form>

		{#if selectedSymptoms.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each selectedSymptoms as s}
					<span class="badge badge-primary gap-1">
						{s}
						<button onclick={() => removeSymptom(s)} class="text-xs">x</button>
					</span>
				{/each}
			</div>

			<button class="btn btn-primary btn-block" onclick={checkSymptoms}>
				Check Symptoms
			</button>
		{/if}
	{/if}

	{#if results.length > 0}
		<div class="space-y-3 mt-4">
			<h3 class="font-bold text-sm">Possible Conditions</h3>
			{#each results as { disease, matchCount }}
				<div class="card bg-base-100 shadow-sm border border-base-300">
					<div class="card-body p-4">
						<div class="flex items-start justify-between">
							<h4 class="font-semibold text-sm">{disease.name}</h4>
							<span
								class="badge badge-sm"
								class:badge-error={disease.severity === 'critical'}
								class:badge-warning={disease.severity === 'high'}
								class:badge-info={disease.severity === 'medium'}
							>
								{disease.severity}
							</span>
						</div>
						<p class="text-xs text-base-content/60">{disease.description}</p>
						<div class="bg-warning/10 rounded-lg p-3 mt-2">
							<p class="text-xs font-medium flex items-center gap-1">
								<AlertTriangle size={14} class="text-warning" /> First Aid
							</p>
							<p class="text-xs mt-1">{disease.firstAid}</p>
						</div>
						<p class="text-xs text-base-content/40 mt-1">
							{matchCount} symptom{matchCount > 1 ? 's' : ''} matched
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
