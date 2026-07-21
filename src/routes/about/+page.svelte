<script lang="ts">
	import { Leaf, ChevronLeft, Mail, Globe, MapPin, Heart } from 'lucide-svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import AppMenu from '$lib/components/ui/AppMenu.svelte';
</script>

<SEO
	title="About FarmPaddy — Healthier animals, fewer losses, better equipment"
	description="FarmPaddy is built by Fast Forward Livestock Venture Studio for Nigerian farmers and animal health workers — animal health guidance plus an equipment marketplace. Backed by SAIS, implemented by GIZ on behalf of the German Government."
	canonicalPath="/about"
/>

<!-- Hero -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-10 rounded-b-[2rem]">
	<div class="flex items-center justify-between mb-4">
		<a href="/" class="inline-flex items-center gap-1 text-white/70 text-sm hover:text-white">
			<ChevronLeft size={16} />
			Home
		</a>
		<AppMenu />
	</div>
	<div class="flex items-center gap-2 mb-3">
		<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
			<Leaf size={18} class="text-white" />
		</div>
		<span class="font-bold text-lg tracking-tight">About FarmPaddy</span>
	</div>
	<h1 class="text-2xl font-bold leading-tight">Healthier animals.<br />Fewer losses.<br />Better decisions.</h1>
	<p class="text-white/80 text-sm mt-3">Better equipment, within reach.</p>
</div>

<div class="px-4 -mt-4 space-y-5 pb-24 max-w-2xl mx-auto">
	<!-- What FarmPaddy is -->
	<div class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<p class="text-[15px] text-base-content/80 leading-relaxed">
			FarmPaddy is a digital assistant built for Nigerian farmers, livestock keepers, and the animal health workers who serve them. Whether you raise poultry, cattle, goats, sheep, or pigs, FarmPaddy helps you spot trouble early, understand what you're seeing, know exactly who to call for help, and now, get the equipment you need to grow — all from your phone.
		</p>
		<p class="text-[15px] text-base-content/80 leading-relaxed">
			We built FarmPaddy because too many farmers face the same hard reality: a sick animal, no vet nearby, and no one to ask. By the time help arrives, the loss has already happened. FarmPaddy is here to give you a knowledgeable first answer the moment you need it, and to point you to the right hands-on help fast.
		</p>
		<p class="text-[15px] text-base-content/80 leading-relaxed">
			As FarmPaddy has grown, we've listened to what farmers told us they needed next: a way to access the equipment that makes their work easier, without paying the full price upfront. That's why FarmPaddy now also includes an equipment marketplace, helping you get equipment and farm tools on a simple payment plan.
		</p>
	</div>

	<!-- What it helps you do -->
	<div class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-lg">What FarmPaddy helps you do</h2>
		<ul class="space-y-3">
			<li class="flex items-start gap-3">
				<span class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
				<div>
					<p class="font-semibold text-sm">Understand symptoms</p>
					<p class="text-sm text-base-content/70 mt-0.5">Describe what you're seeing and get clear, plain guidance on what it might mean and how urgent it is.</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<span class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
				<div>
					<p class="font-semibold text-sm">Prevent disease</p>
					<p class="text-sm text-base-content/70 mt-0.5">Practical advice on biosecurity, vaccination, feeding, and husbandry to keep your animals healthy before problems start.</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<span class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
				<div>
					<p class="font-semibold text-sm">Act fast in an emergency</p>
					<p class="text-sm text-base-content/70 mt-0.5">Recognise the danger signs of fast-spreading and zoonotic diseases, and learn the safe steps to take right away.</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<span class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
				<div>
					<p class="font-semibold text-sm">Find the right help</p>
					<p class="text-sm text-base-content/70 mt-0.5">Get pointed to vets, agro-vet shops, and state veterinary services so you're never left guessing who to contact.</p>
				</div>
			</li>
			<li class="flex items-start gap-3">
				<span class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
				<div>
					<p class="font-semibold text-sm">Get the equipment you need</p>
					<p class="text-sm text-base-content/70 mt-0.5">Browse processing equipment like defeathering machines and poultry processing lines, pay 30% down, and spread the rest in instalments that work with your farm's cash flow.</p>
				</div>
			</li>
		</ul>
		<p class="text-sm text-base-content/60 pt-2 border-t border-base-300/40">
			We keep it simple. Plain words, short answers, and steps you can act on today.
		</p>
	</div>

	<!-- Who's behind -->
	<div class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-lg">Who is behind FarmPaddy</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmPaddy is built and operated by <span class="font-semibold">Fast Forward Livestock Venture Studio</span>, an operator-led studio dedicated to building practical technology for Africa's livestock and agriculture sector. We work hand in hand with veterinary professionals, equipment manufacturers, and farming communities to make sure FarmPaddy reflects the real conditions farmers face on the ground — from the health of their animals to the tools they need to grow their business.
		</p>
	</div>

	<!-- Supporters -->
	<div class="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-5 space-y-3">
		<div class="flex items-center gap-2">
			<Heart size={18} class="text-accent" />
			<h2 class="font-bold text-lg">Our supporters</h2>
		</div>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmPaddy is made possible by a grant from <span class="font-semibold">SAIS (Scaling Digital Agriculture Innovations through Start-ups)</span>, an initiative implemented by <span class="font-semibold">GIZ</span>, the German development agency, on behalf of the German Government. This support helped us build FarmPaddy's animal health foundation, and continues to help us grow the platform so that more farmers can reach reliable guidance and affordable equipment, regardless of where they are.
		</p>
		<p class="text-sm text-base-content/80 leading-relaxed">
			We are proud to put this support to work in service of Nigerian farmers and the animals that sustain their livelihoods.
		</p>
	</div>

	<!-- Honesty -->
	<div class="bg-warning/10 border border-warning/30 rounded-2xl p-5 space-y-2">
		<h2 class="font-bold text-lg">A word of honesty</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmPaddy is a helpful guide — not a replacement for a qualified veterinarian. We work hard to make our guidance accurate and useful, but every animal and situation is different. For diagnosis, treatment, and emergencies, always involve a licensed vet or animal health professional. We'll always tell you when it's time to get real, hands-on help.
		</p>
		<p class="text-sm text-base-content/80 leading-relaxed">
			On equipment financing: all listings show clear pricing, down payment, and instalment terms upfront. Final instalment plans are agreed directly with our team based on your farm's situation.
		</p>
	</div>

	<!-- Contact -->
	<div class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-lg">Get in touch</h2>
		<p class="text-sm text-base-content/70">
			We'd love to hear from you — questions, feedback, or ideas to make FarmPaddy better for your farm.
		</p>
		<div class="space-y-2 pt-1">
			<a href="mailto:hello@livestockfunds.com" class="flex items-center gap-3 text-sm hover:text-primary">
				<Mail size={16} class="text-base-content/50" />
				<span>hello@livestockfunds.com</span>
			</a>
			<a href="https://www.livestockfunds.com" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 text-sm hover:text-primary">
				<Globe size={16} class="text-base-content/50" />
				<span>www.livestockfunds.com</span>
			</a>
			<div class="flex items-center gap-3 text-sm text-base-content/70">
				<MapPin size={16} class="text-base-content/50" />
				<span>Lagos, Nigeria</span>
			</div>
		</div>
	</div>

	<p class="text-[11px] text-center text-base-content/40 pt-2">
		<a href="/terms" class="hover:text-base-content/70">Terms &amp; Conditions</a>
		<span class="mx-1">·</span>
		<a href="/privacy" class="hover:text-base-content/70">Privacy Policy</a>
	</p>
</div>
