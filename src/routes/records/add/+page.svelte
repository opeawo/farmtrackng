<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import VoiceRecorder from '$lib/components/forms/VoiceRecorder.svelte';
	import { isOnline } from '$lib/stores/offline';
	import { queueOfflineAction } from '$lib/utils/offline';

	const recordTypes = [
		{ value: 'feeding', label: 'Feeding' },
		{ value: 'treatment', label: 'Treatment' },
		{ value: 'sale', label: 'Sale' },
		{ value: 'purchase', label: 'Purchase' },
		{ value: 'birth', label: 'Birth' },
		{ value: 'death', label: 'Death' },
		{ value: 'expense', label: 'Expense' },
		{ value: 'income', label: 'Income' },
		{ value: 'note', label: 'Note' }
	];

	let recordType = $state('note');
	let title = $state('');
	let description = $state('');
	let amount = $state('');
	let saving = $state(false);

	function handleTranscription(text: string) {
		description = text;
		if (!title) title = text.slice(0, 50);
	}

	async function save() {
		if (!title) return;
		saving = true;

		const record = {
			id: crypto.randomUUID(),
			record_type: recordType,
			title,
			description,
			amount: amount ? parseFloat(amount) : null,
			currency: 'NGN',
			recorded_at: new Date().toISOString()
		};

		if (!$isOnline) {
			await queueOfflineAction('farm_records', record);
		}
		// In production: save to Supabase

		goto('/records');
	}
</script>

<PageHeader title="Add Record" backHref="/records" />

<div class="px-4 py-4 space-y-6">
	<VoiceRecorder onTranscription={handleTranscription} />

	<div class="divider text-xs">or enter manually</div>

	<form onsubmit={save} class="space-y-4">
		<label class="form-control w-full">
			<div class="label"><span class="label-text">Record Type</span></div>
			<select bind:value={recordType} class="select select-bordered w-full">
				{#each recordTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Title</span></div>
			<input type="text" bind:value={title} placeholder="What happened?" class="input input-bordered w-full" required />
		</label>

		<label class="form-control w-full">
			<div class="label"><span class="label-text">Details</span></div>
			<textarea bind:value={description} placeholder="More details..." class="textarea textarea-bordered w-full" rows="3"></textarea>
		</label>

		{#if ['sale', 'purchase', 'expense', 'income'].includes(recordType)}
			<label class="form-control w-full">
				<div class="label"><span class="label-text">Amount (NGN)</span></div>
				<input type="number" bind:value={amount} placeholder="0.00" class="input input-bordered w-full" />
			</label>
		{/if}

		<button type="submit" class="btn btn-primary btn-block" disabled={!title || saving}>
			{#if saving}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Save Record
		</button>
	</form>
</div>
