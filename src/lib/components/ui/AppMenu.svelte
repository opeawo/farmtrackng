<script lang="ts">
	// The app's three-dot header menu: a trigger button styled for the green
	// hero/header, plus a bottom-sheet of links. Self-contained (owns its open
	// state) so any page can drop in a single <AppMenu /> in its header.
	import { MoreVertical, Code2, Info, FileText, ShieldCheck, ChevronRight, X } from 'lucide-svelte';

	let menuOpen = $state(false);

	const links = [
		{
			href: '/developers',
			title: 'Livestock Price Index API',
			sub: 'Pricing API for developers',
			icon: Code2,
			tint: 'bg-info/10',
			color: 'text-info'
		},
		{
			href: '/about',
			title: 'About FarmPaddy',
			sub: 'Story, supporters, and contact',
			icon: Info,
			tint: 'bg-primary/10',
			color: 'text-primary'
		},
		{
			href: '/terms',
			title: 'Terms & Conditions',
			sub: 'How you may use the service',
			icon: FileText,
			tint: 'bg-accent/10',
			color: 'text-accent'
		},
		{
			href: '/privacy',
			title: 'Privacy Policy',
			sub: 'What we collect and why',
			icon: ShieldCheck,
			tint: 'bg-success/10',
			color: 'text-success'
		}
	];
</script>

<button
	type="button"
	onclick={() => (menuOpen = true)}
	class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center shrink-0"
	aria-label="Open menu"
>
	<MoreVertical size={18} class="text-white" />
</button>

{#if menuOpen}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="App menu"
		class="fixed inset-0 z-50 flex items-end justify-center"
	>
		<button
			type="button"
			aria-label="Close menu"
			onclick={() => (menuOpen = false)}
			class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
		></button>

		<div class="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-4 pb-safe animate-in slide-in-from-bottom">
			<div class="flex items-center justify-between mb-3 px-1">
				<h2 class="text-sm font-bold text-base-content/80 uppercase tracking-wide">Menu</h2>
				<button
					type="button"
					onclick={() => (menuOpen = false)}
					class="w-8 h-8 rounded-full hover:bg-base-200 flex items-center justify-center"
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div class="space-y-1">
				{#each links as link}
					<a
						href={link.href}
						onclick={() => (menuOpen = false)}
						class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-200/60 active:scale-[0.99] transition-transform"
					>
						<div class="w-9 h-9 rounded-full {link.tint} flex items-center justify-center">
							<link.icon size={18} class={link.color} />
						</div>
						<div class="flex-1">
							<p class="text-sm font-semibold">{link.title}</p>
							<p class="text-xs text-base-content/50">{link.sub}</p>
						</div>
						<ChevronRight size={16} class="text-base-content/30" />
					</a>
				{/each}
			</div>

			<p class="text-[11px] text-center text-base-content/40 pt-4 pb-2">FarmPaddy — Nigeria</p>
		</div>
	</div>
{/if}
