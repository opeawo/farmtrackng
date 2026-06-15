<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { LayoutDashboard, Sparkles, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-svelte';

	// In-progress features (Markets, Alerts) are hidden unless explicitly enabled.
	const showPreviewFeatures = env.PUBLIC_SHOW_PREVIEW_FEATURES === 'true';

	const navItems = [
		{ href: '/', label: 'Home', icon: LayoutDashboard },
		{ href: '/ai', label: 'AI', icon: Sparkles },
		{ href: '/marketplace', label: 'Shop', icon: ShoppingBag },
		...(showPreviewFeatures
			? [
					{ href: '/markets', label: 'Markets', icon: TrendingUp },
					{ href: '/alerts', label: 'Alerts', icon: AlertTriangle }
				]
			: [])
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		// Disambiguate /markets and /marketplace — both start with "/market".
		if (href === '/markets') {
			return page.url.pathname === '/markets' || page.url.pathname.startsWith('/markets/');
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-base-300 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
	<div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all duration-200 {isActive(item.href) ? 'text-primary' : 'text-base-content/40 hover:text-base-content/70'}"
			>
				{#if isActive(item.href)}
					<div class="bg-primary/10 rounded-full p-1.5 -mt-1">
						<item.icon size={20} strokeWidth={2.5} />
					</div>
				{:else}
					<div class="p-1.5 -mt-1">
						<item.icon size={20} strokeWidth={1.5} />
					</div>
				{/if}
				<span class="text-[10px] font-medium leading-none {isActive(item.href) ? 'font-semibold' : ''}">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
