// Audio Recorder Module
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : 'audio/mp4';
            
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });
            
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start(100);
            return true;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            throw new Error('Failed to access microphone');
        }
    }

    stopRecording() {
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            return new Promise((resolve) => {
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
                    resolve(audioBlob);
                };
            });
        }
        return null;
    }

    cleanup() {
        this.audioChunks = [];
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Audio Processor Module
class AudioProcessor {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    async convertToWav(audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return this.audioBufferToWav(audioBuffer);
    }

    async processAudio(audioBlob, inputLanguage = 'de', outputLanguage = 'de') {
        try {
            const wavBlob = await this.convertToWav(audioBlob);
            
            const formData = new FormData();
            formData.append('audio', wavBlob, 'recording.wav');
            formData.append('input_language', new Blob([inputLanguage], { type: 'text/plain' }));
            formData.append('output_language', new Blob([outputLanguage], { type: 'text/plain' }));

            const response = await fetch('https://mcorec.nguyenbinh.dev/asr/asr/inference', {
                method: 'POST',
                headers: {
                    'Origin': window.location.origin
                },
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.segments.map(seg => seg.text).join(' ').trim();
        } catch (error) {
            console.error('Error processing audio:', error);
            throw error;
        }
    }

    audioBufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1;
        const bitDepth = 16;
        
        let result;
        if (numberOfChannels === 2) {
            result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }

        return this.encodeWAV(result, format, sampleRate, numberOfChannels, bitDepth);
    }

    interleave(leftChannel, rightChannel) {
        const length = leftChannel.length + rightChannel.length;
        const result = new Float32Array(length);

        let inputIndex = 0;
        for (let index = 0; index < length; ) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        const view = new DataView(buffer);

        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * bytesPerSample, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, samples.length * bytesPerSample, true);

        this.floatTo16BitPCM(view, 44, samples);

        return new Blob([buffer], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    floatTo16BitPCM(view, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }
}

// Export the classes for use in other files
window.AudioRecorder = AudioRecorder;
window.AudioProcessor = AudioProcessor; 