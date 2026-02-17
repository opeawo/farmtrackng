<script lang="ts">
	import { Mic, Square, Loader2 } from 'lucide-svelte';
	import { startRecording, stopRecording, transcribeAudio } from '$lib/utils/voice';

	interface Props {
		onTranscription?: (text: string) => void;
	}

	let { onTranscription }: Props = $props();

	let recording = $state(false);
	let transcribing = $state(false);
	let recorder: MediaRecorder | null = $state(null);
	let error = $state('');

	async function toggleRecording() {
		if (recording && recorder) {
			recording = false;
			transcribing = true;
			error = '';
			try {
				const blob = await stopRecording(recorder);
				const text = await transcribeAudio(blob);
				onTranscription?.(text);
			} catch {
				error = 'Could not transcribe audio. Please try again.';
			} finally {
				transcribing = false;
				recorder = null;
			}
		} else {
			try {
				recorder = await startRecording();
				recorder.start();
				recording = true;
				error = '';
			} catch {
				error = 'Microphone access denied.';
			}
		}
	}
</script>

<div class="flex flex-col items-center gap-2">
	<button
		type="button"
		class="btn btn-circle btn-lg"
		class:btn-error={recording}
		class:btn-primary={!recording}
		disabled={transcribing}
		onclick={toggleRecording}
	>
		{#if transcribing}
			<Loader2 size={24} class="animate-spin" />
		{:else if recording}
			<Square size={24} />
		{:else}
			<Mic size={24} />
		{/if}
	</button>
	<span class="text-xs text-base-content/60">
		{#if transcribing}
			Transcribing...
		{:else if recording}
			Recording... Tap to stop
		{:else}
			Tap to record
		{/if}
	</span>
	{#if error}
		<p class="text-xs text-error">{error}</p>
	{/if}
</div>
