<script lang="ts">
	let { amount, label = 'Outstanding balance' }: { amount: number; label?: string } = $props();

	const ACCOUNT_NUMBER = '3001701296';
	const BANK_NAME = 'GT Bank';
	const ACCOUNT_NAME = 'Fast Forward Technology Services';

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;

	function naira(n: number): string {
		return '₦' + (n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
	}

	async function copyAccount() {
		try {
			await navigator.clipboard.writeText(ACCOUNT_NUMBER);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard blocked — fall back silently. The number is still on screen.
		}
	}
</script>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<h2 class="font-semibold">Make a payment</h2>
		<p class="text-sm opacity-70 -mt-1">
			{label}: <span class="font-semibold text-base-content">{naira(amount)}</span>
		</p>

		<div class="mt-2 rounded-lg bg-base-200/60 p-3 space-y-2">
			<div>
				<p class="text-xs opacity-60">Bank</p>
				<p class="font-medium">{BANK_NAME}</p>
			</div>
			<div>
				<p class="text-xs opacity-60">Account name</p>
				<p class="font-medium">{ACCOUNT_NAME}</p>
			</div>
			<div>
				<p class="text-xs opacity-60">Account number</p>
				<div class="flex items-center gap-2">
					<p class="font-mono text-lg font-bold tracking-wider">{ACCOUNT_NUMBER}</p>
					<button
						type="button"
						onclick={copyAccount}
						class="btn btn-xs btn-ghost"
						aria-label="Copy account number"
					>
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>
			</div>
		</div>

		<p class="text-xs opacity-70 mt-2">
			Your payment will be matched and confirmed within 24 hours.
		</p>
	</div>
</div>
