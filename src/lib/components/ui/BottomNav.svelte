<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, ClipboardList, HeartPulse, TrendingUp, AlertTriangle } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: LayoutDashboard },
		{ href: '/records', label: 'Records', icon: ClipboardList },
		{ href: '/health', label: 'Health', icon: HeartPulse },
		{ href: '/markets', label: 'Markets', icon: TrendingUp },
		{ href: '/alerts', label: 'Alerts', icon: AlertTriangle }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="btm-nav btm-nav-sm bg-base-100 border-t border-base-300 z-50">
	{#each navItems as item}
		<a
			href={item.href}
			class="transition-colors"
			class:active={isActive(item.href)}
			class:text-primary={isActive(item.href)}
		>
			<item.icon size={20} />
			<span class="btm-nav-label text-xs">{item.label}</span>
		</a>
	{/each}
</nav>
