export async function startRecording(): Promise<MediaRecorder> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
	return recorder;
}

export function stopRecording(recorder: MediaRecorder): Promise<Blob> {
	return new Promise((resolve) => {
		const chunks: Blob[] = [];
		recorder.ondataavailable = (e) => chunks.push(e.data);
		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: 'audio/webm' });
			recorder.stream.getTracks().forEach((t) => t.stop());
			resolve(blob);
		};
		recorder.stop();
	});
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
	const formData = new FormData();
	formData.append('audio', audioBlob, 'recording.webm');

	const response = await fetch('/api/voice/transcribe', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) throw new Error('Transcription failed');

	const { text } = await response.json();
	return text;
}
