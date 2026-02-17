<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Stethoscope, Syringe, AlertCircle, Plus } from 'lucide-svelte';
</script>

<PageHeader title="Health Management" />

<div class="px-4 py-4 space-y-4">
	<div class="grid grid-cols-2 gap-3">
		<a href="/health/check" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 items-center text-center">
				<Stethoscope size={24} class="text-primary" />
				<span class="text-sm font-medium">Symptom Check</span>
			</div>
		</a>
		<a href="/health/report" class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4 items-center text-center">
				<AlertCircle size={24} class="text-error" />
				<span class="text-sm font-medium">Report Incident</span>
			</div>
		</a>
	</div>

	<h2 class="font-bold text-sm flex items-center gap-2">
		<Syringe size={16} /> Upcoming Vaccinations
	</h2>

	<EmptyState
		title="No vaccinations scheduled"
		message="Add vaccination schedules to get reminders"
	/>

	<h2 class="font-bold text-sm flex items-center gap-2 mt-6">
		<AlertCircle size={16} /> Recent Incidents
	</h2>

	<EmptyState
		title="No incidents reported"
		message="Report health issues to track them"
		actionLabel="Report Incident"
		actionHref="/health/report"
	/>
</div>
