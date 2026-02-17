<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { page } from '$app/state';
	import { CheckCircle } from 'lucide-svelte';

	const scheduleId = $derived(page.params.id);

	let notes = $state('');
	let saving = $state(false);

	async function markComplete() {
		saving = true;
		// In production: update vaccination_schedules.completed = true
		goto('/health');
	}
</script>

<PageHeader title="Complete Vaccination" backHref="/health" />

<div class="px-4 py-4 space-y-4">
	<div class="card bg-success/10 border border-success/30">
		<div class="card-body p-4 items-center text-center">
			<CheckCircle size={48} class="text-success" />
			<h2 class="font-bold text-lg mt-2">Mark as Completed</h2>
			<p class="text-sm text-base-content/60">Confirm this vaccination has been administered</p>
		</div>
	</div>

	<label class="form-control w-full">
		<div class="label"><span class="label-text">Notes (optional)</span></div>
		<textarea bind:value={notes} placeholder="Any notes about the vaccination..." class="textarea textarea-bordered w-full" rows="3"></textarea>
	</label>

	<button class="btn btn-success btn-block" onclick={markComplete} disabled={saving}>
		{#if saving}
			<span class="loading loading-spinner loading-sm"></span>
		{/if}
		Confirm Vaccination Complete
	</button>
</div>
