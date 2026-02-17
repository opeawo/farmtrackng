<script lang="ts">
	import { isOnline } from '$lib/stores/offline';
	import { WifiOff } from 'lucide-svelte';
</script>

{#if !$isOnline}
	<div class="bg-warning text-warning-content px-4 py-2 flex items-center gap-2 text-sm">
		<WifiOff size={16} />
		<span>You're offline. Changes will sync when you reconnect.</span>
	</div>
{/if}
