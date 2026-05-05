<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/loans/StatusBadge.svelte';
	import PaymentInstructions from '$lib/components/loans/PaymentInstructions.svelte';

	let { data }: { data: PageData } = $props();
	const view = data.view;

	function naira(n: number): string {
		return '₦' + (n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
	}
	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return iso;
		}
	}
	function dueLabel(v: typeof view.installments[number]): string {
		if (v.status === 'paid') return `Paid ${fmtDate(v.payment_date)}`;
		if (v.days_overdue > 0) return `${v.days_overdue} day${v.days_overdue === 1 ? '' : 's'} overdue`;
		if (v.days_until_due === 0) return 'Due today';
		if (v.days_until_due > 0)
			return `In ${v.days_until_due} day${v.days_until_due === 1 ? '' : 's'}`;
		return '';
	}
</script>

<section class="space-y-4">
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<div class="flex items-start justify-between gap-2">
				<div>
					<h1 class="card-title text-xl">{view.loan.business_name}</h1>
					<p class="text-sm opacity-70">{view.loan.equipment_financed}</p>
					<p class="text-xs opacity-60 mt-1">Loan ID: {view.loan.loan_id}</p>
				</div>
				<StatusBadge status={view.account_status} />
			</div>
		</div>
	</div>

	{#if view.next_payment}
		<div class="card bg-primary text-primary-content shadow-sm">
			<div class="card-body">
				<p class="text-sm opacity-80">Next payment</p>
				<p class="text-3xl font-bold">{naira(view.next_payment.amount_due_ngn)}</p>
				<div class="flex items-center justify-between text-sm">
					<span>Due {fmtDate(view.next_payment.due_date)}</span>
					<span class="opacity-90">{dueLabel(view.next_payment)}</span>
				</div>
			</div>
		</div>
	{/if}

	{#if view.outstanding_ngn > 0}
		<PaymentInstructions amount={view.outstanding_ngn} />
	{/if}

	<div class="grid grid-cols-3 gap-2">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-3">
				<p class="text-xs opacity-60">Total repayable</p>
				<p class="font-bold">{naira(view.loan.total_repayable_ngn)}</p>
			</div>
		</div>
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-3">
				<p class="text-xs opacity-60">Paid to date</p>
				<p class="font-bold text-success">{naira(view.total_paid_ngn)}</p>
			</div>
		</div>
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-3">
				<p class="text-xs opacity-60">Outstanding</p>
				<p class="font-bold">{naira(view.outstanding_ngn)}</p>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<h2 class="font-semibold">Repayment schedule</h2>
			<ul class="divide-y divide-base-200">
				{#each view.installments as inst (inst.installment_id)}
					<li class="py-3 flex items-center justify-between gap-3">
						<div>
							<p class="font-medium">#{inst.installment_no} · {fmtDate(inst.due_date)}</p>
							<p class="text-xs opacity-60">{dueLabel(inst)}</p>
						</div>
						<div class="text-right">
							<p class="font-medium">{naira(inst.amount_due_ngn)}</p>
							<StatusBadge status={inst.status} size="sm" />
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<p class="text-xs opacity-50 text-center">
		Records last refreshed {new Date(data.fetched_at).toLocaleString('en-NG')}
	</p>
</section>
