<script lang="ts">
	import type { InstallmentStatus } from '$lib/server/loans/types';
	let { status, size = 'md' }: { status: InstallmentStatus; size?: 'sm' | 'md' } = $props();

	const LABEL: Record<InstallmentStatus, string> = {
		paid: 'Paid',
		not_yet_due: 'Not yet due',
		on_track: 'On track',
		late: 'Late',
		at_risk: 'Account at risk'
	};
	const CLASS: Record<InstallmentStatus, string> = {
		paid: 'badge-success',
		not_yet_due: 'badge-ghost',
		on_track: 'badge-success',
		late: 'badge-warning',
		at_risk: 'badge-error'
	};
</script>

<span
	class="badge {CLASS[status]} {size === 'sm' ? 'badge-sm' : ''} font-medium whitespace-nowrap shrink-0"
>
	{LABEL[status]}
</span>
