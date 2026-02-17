<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
	}

	let { size = 'md' }: Props = $props();

	const sizeClass = { sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' };
</script>

<div class="flex items-center justify-center py-8">
	<span class="loading loading-spinner {sizeClass[size]} text-primary"></span>
</div>
