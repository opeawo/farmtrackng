<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { AlertTriangle, MapPin, Plus } from 'lucide-svelte';

	// In production, fetch from Supabase disease_alerts
	let alerts = $state<Array<{
		id: string;
		disease_name: string;
		livestock_type: string;
		severity: string;
		description: string;
		state: string;
		lga: string;
		reported_at: string;
	}>>([]);
</script>

<PageHeader title="Disease Alerts" />

<div class="px-4 py-4 space-y-4">
	{#if alerts.length === 0}
		<EmptyState
			title="No active alerts"
			message="No disease outbreaks reported in your area"
			actionLabel="Report Outbreak"
			actionHref="/alerts/report"
		/>
	{:else}
		<div class="space-y-3">
			{#each alerts as alert}
				<div class="card bg-base-100 shadow-sm border-l-4"
					class:border-l-error={alert.severity === 'critical'}
					class:border-l-warning={alert.severity === 'high'}
					class:border-l-info={alert.severity === 'medium'}
				>
					<div class="card-body p-4">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-semibold text-sm flex items-center gap-1">
									<AlertTriangle size={14} class="text-warning" />
									{alert.disease_name}
								</h3>
								<p class="text-xs text-base-content/60 mt-1">{alert.livestock_type}</p>
							</div>
							<span
								class="badge badge-sm"
								class:badge-error={alert.severity === 'critical'}
								class:badge-warning={alert.severity === 'high'}
								class:badge-info={alert.severity === 'medium'}
							>
								{alert.severity}
							</span>
						</div>
						{#if alert.description}
							<p class="text-xs text-base-content/70 mt-1">{alert.description}</p>
						{/if}
						<div class="flex items-center gap-1 text-xs text-base-content/40 mt-2">
							<MapPin size={12} />
							<span>{alert.lga ? `${alert.lga}, ` : ''}{alert.state}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<a href="/alerts/report" class="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-error to-red-500 text-white flex items-center justify-center shadow-lg shadow-error/30 active:scale-95 transition-transform">
	<Plus size={24} />
</a>
