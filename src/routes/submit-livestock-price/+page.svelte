<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import SEO from '$lib/components/ui/SEO.svelte';
	import { CheckCircle2, MapPin, Phone, ShieldCheck } from 'lucide-svelte';
	import { unitForProduct, unitShort } from '$lib/markets/units';

	let { form }: { form: ActionData } = $props();

	// Narrowed verified context (null until the phone passes the allowlist).
	const v = $derived(form && 'verified' in form && form.verified === true ? form : null);

	// Today's date in WAT (display only — the server stamps the authoritative time).
	const watDate = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Africa/Lagos',
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date());

	let submitting = $state(false);
	// The selected commodity's mandatory reporting unit — fixed per commodity,
	// never agent-editable. Shown beside the price field so the expected unit
	// is unambiguous.
	let selectedProduct = $state('');
	const priceUnit = $derived(unitForProduct(selectedProduct));
</script>

<SEO title="Submit Livestock Price" canonicalPath="/submit-livestock-price" noindex />

<div class="min-h-screen bg-base-100 px-4 py-8">
	<div class="max-w-md mx-auto">
		<div class="flex items-center gap-2 mb-1">
			<ShieldCheck size={22} class="text-primary" />
			<h1 class="text-xl font-bold">Field Agent Price Entry</h1>
		</div>
		<p class="text-sm text-base-content/60 mb-6">{watDate} · West Africa Time</p>

		{#if !v}
			<!-- Step 1: phone gate -->
			<form method="POST" action="?/verify" use:enhance class="space-y-4">
				<div>
					<label for="phone" class="block text-sm font-semibold mb-1">Your registered phone number</label>
					<div class="relative">
						<Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
						<input
							id="phone"
							name="phone"
							type="tel"
							inputmode="tel"
							autocomplete="tel"
							placeholder="0801 234 5678"
							value={form && 'phone' in form ? (form.phone ?? '') : ''}
							required
							class="input input-bordered w-full pl-9"
						/>
					</div>
				</div>

				{#if form && 'error' in form && form.error}
					<p class="text-sm text-error">{form.error}</p>
				{/if}

				<button type="submit" class="btn btn-primary w-full">Continue</button>
				<p class="text-xs text-base-content/50 text-center">
					Only registered FarmPaddy agents can submit prices.
				</p>
			</form>
		{:else}
			<!-- Step 2: price entry, locked to the agent's state -->
			{#if 'submitted' in v && v.submitted}
				<div class="alert alert-success mb-4 text-sm">
					<CheckCircle2 size={18} />
					<span>Saved: {v.savedProduct} · {v.savedMarket} · ₦{v.savedPrice?.toLocaleString('en-NG')}{unitShort(unitForProduct(v.savedProduct ?? ''))}</span>
				</div>
			{/if}

			<div class="bg-base-200 rounded-xl p-3 mb-4 flex items-center justify-between">
				<div>
					<p class="text-xs text-base-content/50">Signed in as</p>
					<p class="font-semibold text-sm">{v.name || 'Agent'}</p>
				</div>
				<div class="text-right">
					<p class="text-xs text-base-content/50 flex items-center gap-1 justify-end"><MapPin size={12} /> State</p>
					<p class="font-semibold text-sm">{v.state}</p>
				</div>
			</div>

			<form
				method="POST"
				action="?/submit"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="phone" value={v.phone} />

				<div>
					<label for="market" class="block text-sm font-semibold mb-1">Market</label>
					<select id="market" name="market" required class="select select-bordered w-full">
						<option value="" disabled selected>Select market</option>
						{#each v.markets as m (m)}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="product" class="block text-sm font-semibold mb-1">Livestock type</label>
					<select id="product" name="product" required bind:value={selectedProduct} class="select select-bordered w-full">
						<option value="" disabled selected>Select livestock</option>
						{#each v.livestockTypes as t (t)}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="price" class="block text-sm font-semibold mb-1">Price (₦ {priceUnit})</label>
					{#if selectedProduct}
						<p class="text-xs text-base-content/60 mb-1.5">
							{selectedProduct} | ₦____ <span class="font-semibold">{priceUnit}</span>
						</p>
					{/if}
					<input
						id="price"
						name="price"
						type="number"
						inputmode="numeric"
						min="1"
						step="1"
						placeholder="Amount in ₦ {priceUnit}"
						required
						class="input input-bordered w-full"
					/>
				</div>

				{#if form && 'error' in form && form.error}
					<p class="text-sm text-error">{form.error}</p>
				{/if}

				<button type="submit" class="btn btn-primary w-full" disabled={submitting}>
					{submitting ? 'Saving…' : 'Submit price'}
				</button>
			</form>
		{/if}
	</div>
</div>
