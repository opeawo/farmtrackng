<script lang="ts">
	import type { ActionData } from './$types';
	import SEO from '$lib/components/ui/SEO.svelte';
	let { form }: { form: ActionData } = $props();
</script>

<SEO title="Loan Portal" description="Check your FarmTrack loan status." noindex canonicalPath="/loans" />

<div class="card bg-base-100 shadow-sm">
	<div class="card-body">
		<h1 class="card-title text-2xl">Check your loan</h1>
		<p class="text-sm opacity-70">
			Enter the phone number and loan ID provided by your financing officer.
		</p>

		<form method="POST" class="mt-4 flex flex-col gap-4">
			<label class="form-control">
				<span class="label-text mb-1">Phone number</span>
				<input
					name="phone"
					type="tel"
					class="input input-bordered w-full"
					placeholder="08012345678"
					value={form?.phone ?? ''}
					autocomplete="tel"
					required
				/>
			</label>

			<label class="form-control">
				<span class="label-text mb-1">Loan ID</span>
				<input
					name="loan_id"
					type="text"
					class="input input-bordered w-full uppercase"
					placeholder="L001"
					value={form?.loan_id ?? ''}
					autocomplete="off"
					required
				/>
			</label>

			{#if form?.error}
				<div class="alert alert-error text-sm">{form.error}</div>
			{/if}

			<button type="submit" class="btn btn-primary">View my loan</button>
		</form>
	</div>
</div>
