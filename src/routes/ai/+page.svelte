<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { user } from '$lib/stores/user';
	import { livestockTypes } from '$lib/data/livestock-types';
	import { nigerianStates } from '$lib/data/markets';
	import { startRecording, stopRecording, transcribeAudio } from '$lib/utils/voice';
	import {
		Sparkles,
		Camera,
		Mic,
		Square,
		Send,
		AlertTriangle,
		ShieldAlert,
		ChevronDown,
		ChevronUp,
		ImageOff,
		X,
		History,
		Trash2,
		MessageSquare
	} from 'lucide-svelte';

	interface AiResult {
		answer: string;
		severity: 'monitor' | 'treat' | 'urgent' | null;
		drugMentioned: boolean;
		priceInfo: string | null;
		sources: string[];
	}

	interface ChatEntry {
		id: string;
		ts: number;
		question: string;
		species?: string;
		state?: string;
		hadImage: boolean;
		result: AiResult;
	}

	const HISTORY_KEY = 'farmtrack:ai-history';
	const HISTORY_LIMIT = 20;

	const speciesFromUrl = page.url.searchParams.get('species') ?? '';
	const intentFromUrl = page.url.searchParams.get('intent') ?? '';

	let question = $state('');
	let species = $state(speciesFromUrl);
	let stateName = $state('');
	let imageDataUrl = $state<string | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let result = $state<AiResult | null>(null);

	let fileInput: HTMLInputElement | null = $state(null);
	let recorder: MediaRecorder | null = null;
	let recording = $state(false);
	let transcribing = $state(false);
	let sourcesOpen = $state(false);

	let history = $state<ChatEntry[]>([]);
	let expandedHistoryId = $state<string | null>(null);

	onMount(() => {
		// Prefill state from the user profile if available.
		if (!stateName && $user?.state) stateName = $user.state;

		// Load history from localStorage.
		try {
			const raw = localStorage.getItem(HISTORY_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as ChatEntry[];
				if (Array.isArray(parsed)) history = parsed;
			}
		} catch {
			// Corrupt history — start fresh.
		}
	});

	function saveHistory(next: ChatEntry[]) {
		history = next;
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
		} catch {
			// localStorage full or disabled — keep in-memory only.
		}
	}

	function clearHistory() {
		expandedHistoryId = null;
		saveHistory([]);
	}

	function reaskFromHistory(entry: ChatEntry) {
		question = entry.question;
		species = entry.species ?? '';
		stateName = entry.state ?? '';
		imageDataUrl = null; // images aren't persisted
		expandedHistoryId = null;
		// Scroll to top for the form
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function formatTimestamp(ts: number): string {
		const now = Date.now();
		const diffMin = Math.round((now - ts) / 60_000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffH = Math.round(diffMin / 60);
		if (diffH < 24) return `${diffH}h ago`;
		const d = new Date(ts);
		return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
	}

	async function compressImage(file: File): Promise<string> {
		const bitmap = await createImageBitmap(file);
		const maxEdge = 1280;
		const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
		const w = Math.round(bitmap.width * scale);
		const h = Math.round(bitmap.height * scale);
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas not available');
		ctx.drawImage(bitmap, 0, 0, w, h);
		return canvas.toDataURL('image/jpeg', 0.8);
	}

	async function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			imageDataUrl = await compressImage(file);
		} catch (err) {
			console.error(err);
			error = 'Could not read that image. Try another photo.';
		}
	}

	function clearImage() {
		imageDataUrl = null;
		if (fileInput) fileInput.value = '';
	}

	async function toggleVoice() {
		if (recording) {
			if (!recorder) return;
			recording = false;
			transcribing = true;
			try {
				const blob = await stopRecording(recorder);
				const text = await transcribeAudio(blob);
				question = question ? `${question} ${text}` : text;
			} catch (err) {
				console.error(err);
				error = 'Voice transcription failed. Please type instead.';
			} finally {
				transcribing = false;
				recorder = null;
			}
		} else {
			try {
				recorder = await startRecording();
				recorder.start();
				recording = true;
			} catch (err) {
				console.error(err);
				error = 'Microphone access denied.';
			}
		}
	}

	async function submit() {
		error = null;
		result = null;
		if (!question.trim() && !imageDataUrl) {
			error = 'Type a question or add a photo.';
			return;
		}
		const currentQuestion = question.trim();
		const currentSpecies = species || undefined;
		const currentState = stateName || undefined;
		const currentHadImage = !!imageDataUrl;
		loading = true;
		try {
			const res = await fetch('/api/ai/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: currentQuestion,
					species: currentSpecies,
					state: currentState,
					imageDataUrl
				})
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error ?? 'Something went wrong.';
				return;
			}
			const aiResult = data as AiResult;
			result = aiResult;
			// Persist to history (newest first, capped at HISTORY_LIMIT).
			const entry: ChatEntry = {
				id: crypto.randomUUID(),
				ts: Date.now(),
				question: currentQuestion,
				species: currentSpecies,
				state: currentState,
				hadImage: currentHadImage,
				result: aiResult
			};
			saveHistory([entry, ...history].slice(0, HISTORY_LIMIT));
		} catch (err) {
			console.error(err);
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	const severityStyle = $derived.by(() => {
		switch (result?.severity) {
			case 'monitor':
				return { label: '🟢 Monitor', cls: 'bg-success/15 text-success border-success/30' };
			case 'treat':
				return { label: '🟡 Treat', cls: 'bg-warning/15 text-warning border-warning/30' };
			case 'urgent':
				return { label: '🔴 Urgent — see a vet', cls: 'bg-error/15 text-error border-error/30' };
			default:
				return null;
		}
	});

	function entrySeverityChip(entry: ChatEntry): string | null {
		switch (entry.result.severity) {
			case 'urgent':
				return '🔴';
			case 'treat':
				return '🟡';
			case 'monitor':
				return '🟢';
			default:
				return null;
		}
	}

	$effect(() => {
		if (intentFromUrl === 'image' && fileInput && !imageDataUrl) {
			fileInput.click();
		}
	});
</script>

<!-- Hero -->
<div class="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white px-5 pt-6 pb-8 rounded-b-[2rem]">
	<div class="flex items-center gap-2 mb-3">
		<div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
			<Sparkles size={18} class="text-white" />
		</div>
		<span class="font-bold text-lg tracking-tight">Animal AI</span>
	</div>
	<h1 class="text-2xl font-bold leading-tight">Ask anything about your livestock</h1>
	<p class="text-white/70 text-sm mt-1">Health, husbandry, prices. Snap a photo if it helps.</p>
</div>

<div class="px-4 -mt-4 space-y-4 pb-24">
	<!-- Form Card -->
	<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 space-y-3">
		<div class="grid grid-cols-2 gap-2">
			<label class="block">
				<span class="text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">Species</span>
				<select
					bind:value={species}
					class="select select-bordered select-sm w-full mt-1"
				>
					<option value="">Any</option>
					{#each livestockTypes as t}
						<option value={t.id}>{t.icon} {t.name}</option>
					{/each}
				</select>
			</label>
			<label class="block">
				<span class="text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">State (optional)</span>
				<select
					bind:value={stateName}
					class="select select-bordered select-sm w-full mt-1"
				>
					<option value="">Any</option>
					{#each nigerianStates as s}
						<option value={s.name}>{s.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="relative">
			<textarea
				bind:value={question}
				placeholder="e.g. My layer hens are not eating and have green diarrhoea. What should I do?"
				rows="4"
				class="textarea textarea-bordered w-full resize-none pr-12"
			></textarea>
			<button
				type="button"
				onclick={toggleVoice}
				disabled={transcribing}
				class="absolute right-2 bottom-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors {recording ? 'bg-error text-white animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20'}"
				aria-label={recording ? 'Stop recording' : 'Start voice input'}
			>
				{#if transcribing}
					<span class="loading loading-spinner loading-xs"></span>
				{:else if recording}
					<Square size={16} />
				{:else}
					<Mic size={16} />
				{/if}
			</button>
		</div>

		<!-- Image picker -->
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			capture="environment"
			onchange={onFileChange}
			class="hidden"
		/>

		{#if imageDataUrl}
			<div class="relative">
				<img src={imageDataUrl} alt="Selected" class="w-full max-h-48 object-cover rounded-xl border border-base-300" />
				<button
					type="button"
					onclick={clearImage}
					class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
					aria-label="Remove image"
				>
					<X size={16} />
				</button>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => fileInput?.click()}
				class="w-full border-2 border-dashed border-base-300 rounded-xl py-3 flex items-center justify-center gap-2 text-base-content/60 hover:text-primary hover:border-primary/40 transition-colors"
			>
				<Camera size={18} />
				<span class="text-sm">Add a photo (optional)</span>
			</button>
		{/if}

		<button
			type="button"
			onclick={submit}
			disabled={loading}
			class="btn btn-primary w-full gap-2"
		>
			{#if loading}
				<span class="loading loading-spinner loading-sm"></span>
				Thinking…
			{:else}
				<Send size={16} />
				Ask Animal AI
			{/if}
		</button>

		{#if error}
			<div class="bg-error/10 text-error border border-error/30 rounded-xl px-3 py-2 text-sm flex items-start gap-2">
				<AlertTriangle size={16} class="mt-0.5 shrink-0" />
				<span>{error}</span>
			</div>
		{/if}
	</div>

	<!-- Result -->
	{#if result}
		<div class="bg-white rounded-2xl p-4 shadow-sm border border-base-300/50 space-y-3">
			{#if severityStyle}
				<div class="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold {severityStyle.cls}">
					{severityStyle.label}
				</div>
			{/if}

			<p class="text-[15px] leading-relaxed whitespace-pre-line">{result.answer}</p>

			{#if result.priceInfo}
				<div class="bg-accent/5 border border-accent/20 rounded-xl p-3">
					<p class="text-[11px] font-semibold text-accent uppercase tracking-wide mb-1">Price guidance</p>
					<p class="text-sm text-base-content/80">{result.priceInfo}</p>
				</div>
			{/if}

			{#if result.drugMentioned}
				<div class="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-start gap-2">
					<ShieldAlert size={18} class="text-warning shrink-0 mt-0.5" />
					<div>
						<p class="text-sm font-semibold text-warning">Check NAFDAC registration</p>
						<p class="text-xs text-base-content/70 mt-0.5">
							Only buy veterinary drugs that are registered with NAFDAC. Confirm the registration number on the pack before use, and follow the withdrawal period.
						</p>
					</div>
				</div>
			{/if}

			{#if result.sources.length > 0}
				<button
					type="button"
					onclick={() => (sourcesOpen = !sourcesOpen)}
					class="flex items-center gap-1 text-xs font-semibold text-base-content/60 hover:text-base-content"
				>
					Sources
					<ChevronDown size={14} class="transition-transform {sourcesOpen ? 'rotate-180' : ''}" />
				</button>
				{#if sourcesOpen}
					<ul class="text-xs text-base-content/60 space-y-1 pl-4 list-disc">
						{#each result.sources as src}
							<li>{src}</li>
						{/each}
					</ul>
				{/if}
			{/if}

			<p class="text-[11px] text-base-content/50 pt-1 border-t border-base-300/50">
				Animal AI gives general guidance. For urgent or unclear cases, please consult a registered veterinarian.
			</p>
		</div>
	{:else if !loading && history.length === 0}
		<div class="bg-white/60 border border-dashed border-base-300 rounded-2xl p-4 flex items-start gap-3">
			<ImageOff size={18} class="text-base-content/40 mt-0.5 shrink-0" />
			<p class="text-xs text-base-content/60">
				Your answer will appear here. Add a photo for better diagnosis, and pick a state if you're asking about market prices.
			</p>
		</div>
	{/if}

	<!-- History -->
	{#if history.length > 0}
		<div class="space-y-2">
			<div class="flex items-center justify-between px-1">
				<div class="flex items-center gap-2">
					<History size={14} class="text-base-content/50" />
					<h2 class="text-sm font-bold text-base-content/80">Recent questions</h2>
				</div>
				<button
					type="button"
					onclick={clearHistory}
					class="text-[11px] text-base-content/40 hover:text-error inline-flex items-center gap-1"
				>
					<Trash2 size={12} />
					Clear
				</button>
			</div>

			<div class="space-y-2">
				{#each history as entry (entry.id)}
					{@const chip = entrySeverityChip(entry)}
					{@const open = expandedHistoryId === entry.id}
					<div class="bg-white rounded-2xl shadow-sm border border-base-300/50 overflow-hidden">
						<button
							type="button"
							onclick={() => (expandedHistoryId = open ? null : entry.id)}
							class="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-base-200/30 transition-colors"
						>
							<MessageSquare size={16} class="text-base-content/30 shrink-0 mt-0.5" />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium line-clamp-2">{entry.question || '(photo question)'}</p>
								<p class="text-[11px] text-base-content/50 mt-0.5">
									{#if chip}<span>{chip}</span>{/if}
									<span>{formatTimestamp(entry.ts)}</span>
									{#if entry.species}<span>· {entry.species}</span>{/if}
									{#if entry.hadImage}<span>· 📷</span>{/if}
								</p>
							</div>
							{#if open}
								<ChevronUp size={16} class="text-base-content/30 shrink-0 mt-0.5" />
							{:else}
								<ChevronDown size={16} class="text-base-content/30 shrink-0 mt-0.5" />
							{/if}
						</button>
						{#if open}
							<div class="px-4 pb-3 pt-1 space-y-2 border-t border-base-200/60">
								<p class="text-sm leading-relaxed whitespace-pre-line text-base-content/80">{entry.result.answer}</p>
								{#if entry.result.priceInfo}
									<p class="text-xs text-base-content/60"><span class="font-semibold">Price:</span> {entry.result.priceInfo}</p>
								{/if}
								<button
									type="button"
									onclick={() => reaskFromHistory(entry)}
									class="text-xs font-semibold text-primary hover:underline"
								>
									Ask a follow-up →
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
