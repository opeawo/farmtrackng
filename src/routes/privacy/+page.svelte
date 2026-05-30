<script lang="ts">
	import { ChevronLeft, Leaf, ShieldCheck } from 'lucide-svelte';

	const LAST_UPDATED = 'May 2026';
</script>

<svelte:head>
	<title>Privacy Policy — FarmTrack</title>
	<meta name="description" content="How FarmTrack collects, uses, and protects your information." />
</svelte:head>

<!-- Hero -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-10 rounded-b-[2rem]">
	<a href="/" class="inline-flex items-center gap-1 text-white/70 text-sm mb-4 hover:text-white">
		<ChevronLeft size={16} />
		Home
	</a>
	<div class="flex items-center gap-2 mb-3">
		<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
			<Leaf size={18} class="text-white" />
		</div>
		<span class="font-bold text-lg tracking-tight">FarmTrack</span>
	</div>
	<h1 class="text-2xl font-bold leading-tight">Privacy Policy</h1>
	<p class="text-white/70 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
</div>

<div class="px-4 -mt-4 space-y-4 pb-24 max-w-2xl mx-auto">
	<!-- Intro -->
	<div class="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 space-y-2">
		<div class="flex items-center gap-2">
			<ShieldCheck size={18} class="text-primary" />
			<h2 class="font-bold text-base">In plain English</h2>
		</div>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmTrack is designed to work with as little personal data as possible. Most of your data — your location, your questions, your past answers — lives only in your own browser. When you ask the AI a question or check your location, we have to send that to trusted services to get an answer back. We don't sell your data, and we don't track you across the web.
		</p>
	</div>

	<!-- 1 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">1. About this Privacy Policy</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			This Privacy Policy explains what information FarmTrack ("we", "us") collects when you use the FarmTrack app and website, how we use it, who we share it with, and the choices you have. It is part of our <a href="/terms" class="text-primary hover:underline">Terms and Conditions</a>.
		</p>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmTrack is operated by FastForward Livestock Venture Studio. If anything in this policy is unclear, contact us at <a href="mailto:hello@livestockfunds.com" class="text-primary hover:underline">hello@livestockfunds.com</a>.
		</p>
	</section>

	<!-- 2 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">2. Information we collect</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">We collect only what we need to give you useful guidance.</p>

		<p class="text-sm font-semibold text-base-content/90 mt-2">Information you give us directly</p>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li><span class="font-semibold">Questions you ask the Animal AI</span>, including any photo or voice recording you attach.</li>
			<li><span class="font-semibold">Your approximate location</span> when you tap "Set your location" — we receive latitude and longitude from your browser, then look up your state and Local Government Area.</li>
			<li><span class="font-semibold">Phone number and loan ID</span> if you sign in to the loan-status portal — these are matched against the loan records to find your account.</li>
			<li><span class="font-semibold">Optional profile details</span> you enter if you choose to go through the onboarding flow (name, state, LGA, livestock kept, WhatsApp opt-in).</li>
		</ul>

		<p class="text-sm font-semibold text-base-content/90 mt-2">Information stored only on your device</p>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li>Your AI question history (the last 20 questions and answers).</li>
			<li>Your detected location (state, LGA, latitude, longitude).</li>
			<li>The "Tip of the day" cached so we only ask the AI for it once per day.</li>
			<li>Cached data the app uses to work offline.</li>
		</ul>
		<p class="text-sm text-base-content/80 leading-relaxed">
			This information lives in your browser's local storage. We never receive it on our servers, and clearing your browser data deletes it.
		</p>

		<p class="text-sm font-semibold text-base-content/90 mt-2">Information collected automatically</p>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li>Standard request information such as your IP address, browser type, and the pages you visit. This is logged by our hosting provider (Vercel) and used to keep the service running and to investigate errors.</li>
		</ul>
		<p class="text-sm text-base-content/80 leading-relaxed">
			We do <span class="font-semibold">not</span> use advertising cookies or third-party tracking pixels.
		</p>
	</section>

	<!-- 3 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">3. How we use your information</h2>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li>To answer your livestock questions, including by analysing any photo or voice clip you send.</li>
			<li>To work out which state and LGA you're in so we can localise market and disease information.</li>
			<li>To match your phone number and loan ID against the loan records when you sign in to the loan portal.</li>
			<li>To run, maintain, debug, and improve the FarmTrack service.</li>
			<li>To meet our legal obligations.</li>
		</ul>
		<p class="text-sm text-base-content/80 leading-relaxed">
			We do not use your questions, voice clips, or photos to build a profile of you or to advertise to you. We do not sell your data to anyone.
		</p>
	</section>

	<!-- 4 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">4. Who we share information with</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			To give you a useful answer, parts of your request are sent to a small number of trusted providers:
		</p>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li><span class="font-semibold">Google (Gemini AI)</span> — receives the text of your question, plus any photo or voice recording you attach, so the AI can answer. Per Google's policies, this data is used to provide the response. Google's policies for the Gemini API apply.</li>
			<li><span class="font-semibold">Mapbox</span> — receives your latitude and longitude when you use "Set your location" so we can look up the matching state and LGA.</li>
			<li><span class="font-semibold">Vercel</span> — hosts the FarmTrack service and processes every request on the way through. Standard server logs (IP, user-agent, request URL) are kept by Vercel.</li>
			<li><span class="font-semibold">Google (Sheets API)</span> — used only by the loan-status portal to read loan records the team maintains in a Google Sheet. Your loan-portal sign-in details are matched against those records.</li>
		</ul>
		<p class="text-sm text-base-content/80 leading-relaxed">
			We share information only as needed to make the service work, or when required by law. We do not sell your data, and we do not share it with advertisers.
		</p>
	</section>

	<!-- 5 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">5. Where your data is stored and processed</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmTrack runs on infrastructure outside Nigeria. AI requests are processed by Google Gemini, geocoding is processed by Mapbox, and the app itself is hosted on Vercel — all of which may process data in Europe or the United States. By using FarmTrack, you understand that your information may be transferred to and processed in these countries, which may have different data-protection laws than Nigeria.
		</p>
	</section>

	<!-- 6 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">6. How long we keep your information</h2>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li>Data in your browser (question history, location, cached tips) stays until you clear it or until you clear your browser storage.</li>
			<li>Server-side logs (Vercel access logs, Google/Mapbox provider logs) are kept according to the providers' standard retention windows — usually 30 to 90 days.</li>
			<li>Loan records in our Google Sheet are kept by FastForward Livestock Venture Studio for as long as needed to administer the loan.</li>
		</ul>
	</section>

	<!-- 7 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">7. Your choices and control</h2>
		<ul class="text-sm text-base-content/80 list-disc pl-5 space-y-1">
			<li><span class="font-semibold">Skip location.</span> You don't have to tap "Set your location". The app works without it.</li>
			<li><span class="font-semibold">Skip photos and voice.</span> You can ask questions with text only.</li>
			<li><span class="font-semibold">Clear your AI history</span> any time using the "Clear" button on the Animal AI page.</li>
			<li><span class="font-semibold">Clear all FarmTrack browser data</span> by clearing site data for FarmTrack in your browser settings — this removes your stored location, history, and cached data.</li>
			<li><span class="font-semibold">Stop using the loan portal.</span> Logging out clears the session cookie. You can ask us to remove your loan records by emailing us.</li>
			<li><span class="font-semibold">Email us</span> at <a href="mailto:hello@livestockfunds.com" class="text-primary hover:underline">hello@livestockfunds.com</a> to ask about, correct, or delete information we hold about you.</li>
		</ul>
	</section>

	<!-- 8 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">8. How we protect your information</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmTrack uses HTTPS for all traffic between your device and our servers. Loan portal credentials are matched without storing your phone number in a long-lived cookie. We use industry-standard providers (Vercel, Google, Mapbox) that maintain their own security practices.
		</p>
		<p class="text-sm text-base-content/80 leading-relaxed">
			No service can promise perfect security. If you become aware of a security issue with FarmTrack, please tell us at <a href="mailto:hello@livestockfunds.com" class="text-primary hover:underline">hello@livestockfunds.com</a>.
		</p>
	</section>

	<!-- 9 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">9. Children</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			FarmTrack is not designed for children under 13. We don't knowingly collect information from children. If you believe a child has used the service and given us personal information, contact us and we will delete it.
		</p>
	</section>

	<!-- 10 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">10. Changes to this policy</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			We may update this Privacy Policy from time to time. When we do, we'll update the "Last updated" date above. Significant changes will be highlighted in the app where reasonable.
		</p>
	</section>

	<!-- 11 -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">11. Contact us</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">For privacy questions, requests, or complaints:</p>
		<ul class="text-sm text-base-content/80 space-y-1">
			<li><span class="font-semibold">Email:</span> <a href="mailto:hello@livestockfunds.com" class="text-primary hover:underline">hello@livestockfunds.com</a></li>
			<li><span class="font-semibold">Website:</span> <a href="https://www.livestockfunds.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">www.livestockfunds.com</a></li>
			<li><span class="font-semibold">Operator:</span> FastForward Livestock Venture Studio, Lagos, Nigeria</li>
		</ul>
	</section>

	<p class="text-[11px] text-center text-base-content/40 pt-2">
		<a href="/about" class="hover:text-base-content/70">About FarmTrack</a>
		<span class="mx-1">·</span>
		<a href="/terms" class="hover:text-base-content/70">Terms &amp; Conditions</a>
	</p>
</div>
