<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { user } from '$lib/stores/user';
	import { ClipboardList, HeartPulse, TrendingUp, AlertTriangle, Plus, Syringe } from 'lucide-svelte';

	const greeting = $derived(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good Morning';
		if (hour < 17) return 'Good Afternoon';
		return 'Good Evening';
	});
</script>

<PageHeader title="FarmTrack" />

<div class="px-4 py-4 space-y-4">
	<div class="text-sm text-base-content/60">
		{greeting()}{$user ? `, ${$user.fullName}` : ''}
	</div>

	<div class="grid grid-cols-2 gap-3">
		<a href="/records/add" class="card bg-primary text-primary-content shadow-md">
			<div class="card-body p-4 items-center text-center">
				<Plus size={24} />
				<span class="text-sm font-medium">Add Record</span>
			</div>
		</a>
		<a href="/health/check" class="card bg-secondary text-secondary-content shadow-md">
			<div class="card-body p-4 items-center text-center">
				<HeartPulse size={24} />
				<span class="text-sm font-medium">Health Check</span>
			</div>
		</a>
	</div>

	<div class="space-y-3">
		<a href="/records" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 flex-row items-center gap-3">
				<div class="bg-primary/10 p-2 rounded-lg">
					<ClipboardList size={20} class="text-primary" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm">Farm Records</h3>
					<p class="text-xs text-base-content/60">Track feeding, sales & expenses</p>
				</div>
			</div>
		</a>

		<a href="/health" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 flex-row items-center gap-3">
				<div class="bg-success/10 p-2 rounded-lg">
					<Syringe size={20} class="text-success" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm">Vaccinations</h3>
					<p class="text-xs text-base-content/60">Upcoming vaccination schedule</p>
				</div>
			</div>
		</a>

		<a href="/markets" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 flex-row items-center gap-3">
				<div class="bg-accent/10 p-2 rounded-lg">
					<TrendingUp size={20} class="text-accent" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm">Market Prices</h3>
					<p class="text-xs text-base-content/60">Latest livestock market prices</p>
				</div>
			</div>
		</a>

		<a href="/alerts" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 flex-row items-center gap-3">
				<div class="bg-error/10 p-2 rounded-lg">
					<AlertTriangle size={20} class="text-error" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm">Disease Alerts</h3>
					<p class="text-xs text-base-content/60">Nearby outbreak warnings</p>
				</div>
			</div>
		</a>
	</div>
</div>
