<script lang="ts">
	import { ChevronLeft, Leaf, KeyRound, Gauge, Code2 } from 'lucide-svelte';
	import SEO from '$lib/components/ui/SEO.svelte';

	const BASE = 'https://www.farmpaddy.com';

	const categories = [
		'poultry',
		'cattle',
		'goat',
		'sheep',
		'pig',
		'fish',
		'feed',
		'eggs',
		'vaccine',
		'other'
	];

	const fields: [string, string][] = [
		['product', 'Canonical product name, e.g. "Broiler (live)"'],
		['category', 'Product category (see the category list)'],
		['state', 'Nigerian state'],
		['unit', '"per head" (cattle, goats), "per dose" (vaccines) or "per kg"'],
		['priceNgn', 'Modeled representative price in ₦ (outlier-trimmed median)'],
		['lowNgn / highNgn', 'Plausible low–high range for the point'],
		['confidence', '0–100 — from sample size and price agreement. Higher = more data, tighter spread'],
		['sampleSize', 'Number of agent entries behind the figure'],
		['date', '(history only) YYYY-MM-DD in West Africa Time'],
		['fetchedAt', 'When the index was last rebuilt'],
		['degraded', 'true when the dataset is thin — treat prices as indicative'],
		['stale', 'true when serving the last good index because a refresh failed']
	];

	const errors: [string, string, string][] = [
		['400', 'invalid_query', 'Bad category, malformed from/to, or from after to'],
		['401', 'invalid_api_key', 'Missing, unknown, or revoked key'],
		['429', 'rate_limited', 'Over the rate limit — check Retry-After'],
		['502', '(stale payload)', 'Index temporarily unavailable and nothing cached']
	];
</script>

<SEO
	title="Nigeria Livestock Price Index API"
	description="Pull FarmPaddy's Nigeria Livestock Price Index programmatically — current prices and daily history by product, state, and category, secured with an API key."
	canonicalPath="/developers"
/>

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
		<span class="font-bold text-lg tracking-tight">FarmPaddy</span>
	</div>
	<h1 class="text-2xl font-bold leading-tight">Nigeria Livestock Price Index API</h1>
	<p class="text-white/70 text-sm mt-1">
		FarmPaddy's modeled Nigerian livestock price index — current prices and daily history, by
		product, state, and category.
	</p>
</div>

<div class="px-4 -mt-4 space-y-4 pb-24 max-w-2xl mx-auto">
	<!-- Intro -->
	<div class="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 space-y-2">
		<div class="flex items-center gap-2">
			<Code2 size={18} class="text-primary" />
			<h2 class="font-bold text-base">What you get</h2>
		</div>
		<p class="text-sm text-base-content/80 leading-relaxed">
			A JSON REST API over FarmPaddy's own price index, aggregated from field-agent submissions
			across Nigeria. Cattle and goats are priced <span class="font-semibold">per head</span>,
			vaccines <span class="font-semibold">per dose</span>, everything else
			<span class="font-semibold">per kg</span>. Prices are FarmPaddy's modeled estimates for
			guidance — not a quote or a guarantee.
		</p>
		<ul class="text-sm text-base-content/80 space-y-1 pt-1">
			<li><span class="font-semibold">Base URL:</span> <code class="text-primary">{BASE}</code></li>
			<li><span class="font-semibold">Format:</span> JSON over HTTPS, <code>GET</code> only</li>
			<li>
				<span class="font-semibold">OpenAPI:</span>
				<a href="/api/openapi.json" class="text-primary hover:underline">/api/openapi.json</a>
			</li>
		</ul>
	</div>

	<!-- Auth -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<div class="flex items-center gap-2">
			<KeyRound size={18} class="text-primary" />
			<h2 class="font-bold text-base">Authentication</h2>
		</div>
		<p class="text-sm text-base-content/80 leading-relaxed">
			Every request needs an API key, sent as a header — either way works:
		</p>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>X-API-Key: fp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></pre>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>Authorization: Bearer fp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></pre>
		<p class="text-sm text-base-content/80 leading-relaxed">
			Interested? Email
			<a href="mailto:hello@fastforward.fund" class="text-primary hover:underline">hello@fastforward.fund</a>
			to request a key. Keep it secret; a key can be revoked at any time. Missing or invalid keys
			return <code>401 {'{'} "error": "invalid_api_key" {'}'}</code>.
		</p>
	</section>

	<!-- Rate limits -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<div class="flex items-center gap-2">
			<Gauge size={18} class="text-primary" />
			<h2 class="font-bold text-base">Rate limits</h2>
		</div>
		<p class="text-sm text-base-content/80 leading-relaxed">
			Best-effort <span class="font-semibold">120 requests/minute</span> per key. Every response
			carries <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> and
			<code>X-RateLimit-Reset</code>. Over the limit returns <code>429</code> with a
			<code>Retry-After</code> header. Responses are edge-cached ~15 minutes, so polling faster than
			that just returns cached data — once a day is plenty.
		</p>
	</section>

	<!-- Endpoint: prices -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-base">
			<span class="badge badge-success badge-sm text-white mr-2">GET</span>
			<code>/api/v1/prices</code>
		</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">The current modeled index. All filters optional:</p>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<tbody>
					<tr><td class="font-mono text-xs">state</td><td class="text-xs">Nigerian state, exact, case-insensitive</td></tr>
					<tr><td class="font-mono text-xs">product</td><td class="text-xs">Product name, case-insensitive substring</td></tr>
					<tr><td class="font-mono text-xs">category</td><td class="text-xs">One of: {categories.join(', ')}</td></tr>
				</tbody>
			</table>
		</div>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>curl -H "X-API-Key: $FARMPADDY_KEY" \
  "{BASE}/api/v1/prices?state=Kano&category=poultry"</code></pre>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>{`{
  "fetchedAt": "2026-07-20T06:00:00.000Z",
  "count": 1,
  "degraded": false,
  "stale": false,
  "prices": [
    {
      "product": "Broiler (live)",
      "category": "poultry",
      "state": "Kano",
      "unit": "per kg",
      "priceNgn": 3200,
      "lowNgn": 2900,
      "highNgn": 3600,
      "confidence": 84,
      "sampleSize": 6
    }
  ]
}`}</code></pre>
	</section>

	<!-- Endpoint: history -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-base">
			<span class="badge badge-success badge-sm text-white mr-2">GET</span>
			<code>/api/v1/prices/history</code>
		</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			Daily history. Same filters as <code>/prices</code>, plus a date window. Each point is the
			modeled price for that product + state on that day.
		</p>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<tbody>
					<tr><td class="font-mono text-xs">from</td><td class="text-xs">YYYY-MM-DD. Defaults to 90 days before <code>to</code></td></tr>
					<tr><td class="font-mono text-xs">to</td><td class="text-xs">YYYY-MM-DD. Defaults to today (West Africa Time)</td></tr>
				</tbody>
			</table>
		</div>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>curl -H "X-API-Key: $FARMPADDY_KEY" \
  "{BASE}/api/v1/prices/history?product=broiler&from=2026-05-01&to=2026-07-01"</code></pre>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>{`{
  "from": "2026-05-01",
  "to": "2026-07-01",
  "count": 2,
  "prices": [
    { "date": "2026-06-14", "product": "Broiler (live)", "state": "Kano",
      "unit": "per kg", "priceNgn": 3200, "confidence": 80, "sampleSize": 4 },
    { "date": "2026-05-30", "product": "Broiler (live)", "state": "Kano",
      "unit": "per kg", "priceNgn": 3050, "confidence": 74, "sampleSize": 3 }
  ]
}`}</code></pre>
	</section>

	<!-- Endpoint: meta -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-3">
		<h2 class="font-bold text-base">
			<span class="badge badge-success badge-sm text-white mr-2">GET</span>
			<code>/api/v1/meta</code>
		</h2>
		<p class="text-sm text-base-content/80 leading-relaxed">
			The states and products currently in the index, the category vocabulary, and the unit per
			category — handy for building dropdowns or validating queries.
		</p>
		<pre class="bg-base-content/5 rounded-xl p-3 text-xs overflow-x-auto"><code>curl -H "X-API-Key: $FARMPADDY_KEY" "{BASE}/api/v1/meta"</code></pre>
	</section>

	<!-- Fields -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">Response fields</h2>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<tbody>
					{#each fields as [name, desc]}
						<tr><td class="font-mono text-xs align-top">{name}</td><td class="text-xs">{desc}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Errors -->
	<section class="bg-white rounded-2xl p-5 shadow-sm border border-base-300/50 space-y-2">
		<h2 class="font-bold text-base">Errors</h2>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr><th class="text-xs">Status</th><th class="text-xs">error</th><th class="text-xs">Cause</th></tr>
				</thead>
				<tbody>
					{#each errors as [status, code, cause]}
						<tr><td class="font-mono text-xs">{status}</td><td class="font-mono text-xs">{code}</td><td class="text-xs">{cause}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<p class="text-[11px] text-center text-base-content/40 pt-2">
		<a href="/about" class="hover:text-base-content/70">About FarmPaddy</a>
		<span class="mx-1">·</span>
		<a href="/terms" class="hover:text-base-content/70">Terms &amp; Conditions</a>
		<span class="mx-1">·</span>
		<a href="mailto:hello@fastforward.fund" class="hover:text-base-content/70">Request a key</a>
	</p>
</div>
