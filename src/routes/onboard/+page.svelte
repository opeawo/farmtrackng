<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { nigerianStates } from '$lib/data/markets';
	import { ChevronRight, ChevronLeft } from 'lucide-svelte';
	import SEO from '$lib/components/ui/SEO.svelte';

	let step = $state(1);
	let fullName = $state('');
	let phone = $state('');
	let selectedState = $state('');
	let selectedLga = $state('');
	let selectedLivestock = $state<string[]>([]);
	let whatsappOptIn = $state(false);

	const currentState = $derived(nigerianStates.find((s) => s.name === selectedState));
	const totalSteps = 4;

	function toggleLivestock(id: string) {
		if (selectedLivestock.includes(id)) {
			selectedLivestock = selectedLivestock.filter((l) => l !== id);
		} else {
			selectedLivestock = [...selectedLivestock, id];
		}
	}

	function next() {
		if (step < totalSteps) step++;
	}

	function prev() {
		if (step > 1) step--;
	}

	async function complete() {
		user.set({
			id: crypto.randomUUID(),
			fullName,
			phone,
			state: selectedState,
			lga: selectedLga,
			lat: null,
			lng: null,
			whatsappOptedIn: whatsappOptIn,
			onboarded: true
		});
		goto('/');
	}
</script>

<SEO title="Welcome to FarmPaddy" description="Set up your FarmPaddy profile." noindex canonicalPath="/onboard" />

<div class="min-h-screen bg-primary flex flex-col">
	<div class="px-6 pt-8 pb-4">
		<h1 class="text-2xl font-bold text-primary-content">FarmPaddy</h1>
		<p class="text-primary-content/70 text-sm mt-1">Step {step} of {totalSteps}</p>
		<progress class="progress progress-secondary w-full mt-3" value={step} max={totalSteps}></progress>
	</div>

	<div class="flex-1 bg-base-100 rounded-t-3xl px-6 pt-6 pb-8">
		{#if step === 1}
			<h2 class="text-xl font-bold mb-1">Welcome!</h2>
			<p class="text-sm text-base-content/60 mb-6">Let's set up your farm profile</p>
			<div class="space-y-4">
				<label class="form-control w-full">
					<div class="label"><span class="label-text">Full Name</span></div>
					<input type="text" bind:value={fullName} placeholder="Enter your name" class="input input-bordered w-full" />
				</label>
				<label class="form-control w-full">
					<div class="label"><span class="label-text">Phone Number</span></div>
					<input type="tel" bind:value={phone} placeholder="+234..." class="input input-bordered w-full" />
				</label>
			</div>

		{:else if step === 2}
			<h2 class="text-xl font-bold mb-1">Your Location</h2>
			<p class="text-sm text-base-content/60 mb-6">Where is your farm?</p>
			<div class="space-y-4">
				<label class="form-control w-full">
					<div class="label"><span class="label-text">State</span></div>
					<select bind:value={selectedState} class="select select-bordered w-full">
						<option value="">Select state</option>
						{#each nigerianStates as state}
							<option value={state.name}>{state.name}</option>
						{/each}
					</select>
				</label>
				{#if currentState}
					<label class="form-control w-full">
						<div class="label"><span class="label-text">LGA</span></div>
						<select bind:value={selectedLga} class="select select-bordered w-full">
							<option value="">Select LGA</option>
							{#each currentState.lgas as lga}
								<option value={lga}>{lga}</option>
							{/each}
						</select>
					</label>
				{/if}
			</div>

		{:else if step === 3}
			<h2 class="text-xl font-bold mb-1">Your Livestock</h2>
			<p class="text-sm text-base-content/60 mb-6">What animals do you keep?</p>
			<div class="grid grid-cols-2 gap-3">
				{#each livestockTypes as type}
					<button
						class="card bg-base-100 border-2 p-4 text-center transition-all"
						class:border-primary={selectedLivestock.includes(type.id)}
						class:border-base-300={!selectedLivestock.includes(type.id)}
						onclick={() => toggleLivestock(type.id)}
					>
						<span class="text-3xl">{type.icon}</span>
						<span class="text-sm font-medium mt-1">{type.name}</span>
					</button>
				{/each}
			</div>

		{:else if step === 4}
			<h2 class="text-xl font-bold mb-1">Stay Connected</h2>
			<p class="text-sm text-base-content/60 mb-6">Get updates via WhatsApp</p>
			<div class="form-control">
				<label class="label cursor-pointer justify-start gap-3">
					<input type="checkbox" bind:checked={whatsappOptIn} class="toggle toggle-primary" />
					<div>
						<span class="label-text font-medium">WhatsApp Alerts</span>
						<p class="text-xs text-base-content/60">Receive vaccination reminders, price updates, and disease alerts</p>
					</div>
				</label>
			</div>
		{/if}

		<div class="flex gap-3 mt-8">
			{#if step > 1}
				<button class="btn btn-outline flex-1" onclick={prev}>
					<ChevronLeft size={18} /> Back
				</button>
			{/if}
			{#if step < totalSteps}
				<button
					class="btn btn-primary flex-1"
					disabled={step === 1 && !fullName}
					onclick={next}
				>
					Next <ChevronRight size={18} />
				</button>
			{:else}
				<button class="btn btn-primary flex-1" onclick={complete}>
					Get Started <ChevronRight size={18} />
				</button>
			{/if}
		</div>
	</div>
</div>
