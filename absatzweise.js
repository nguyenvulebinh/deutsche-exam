let mediaRecorder;
let audioChunks = [];
let audioBlob;
let currentParagraph;
let allParagraphs = []; // Store all paragraphs
let currentIndex = 0; // Track current paragraph index

// Load paragraphs from JSON file
async function loadParagraphs() {
    try {
        const response = await fetch('./datasets/speaking_practice.json');
        if (!response.ok) {
            throw new Error('Failed to load paragraphs');
        }
        const data = await response.json();
        // Shuffle once when loading
        allParagraphs = shuffleArray(data.paragraphs);
        console.log(allParagraphs);
        currentIndex = 0;
        return allParagraphs;
    } catch (error) {
        console.error('Error loading paragraphs:', error);
        // Fallback paragraphs in case of error
        allParagraphs = shuffleArray([
            {
                german: "Hallo, ich heiße Anna. Ich lerne Deutsch, weil ich in Deutschland leben möchte.",
                english: "Hello, my name is Anna. I am learning German because I want to live in Germany."
            },
            {
                german: "Ich wohne in Berlin. Meine Wohnung ist klein, aber gemütlich.",
                english: "I live in Berlin. My apartment is small but cozy."
            }
        ]);
        currentIndex = 0;
        return allParagraphs;
    }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Create debug panel
function createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        z-index: 9999;
        display: none;
    `;

    const debugHeader = document.createElement('div');
    debugHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    `;

    const debugTitle = document.createElement('span');
    debugTitle.textContent = 'Debug Log';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Clear';
    toggleButton.onclick = () => {
        const logContainer = document.getElementById('debug-log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    };
    toggleButton.style.cssText = `
        background: #666;
        border: none;
        color: white;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 3px;
    `;

    debugHeader.appendChild(debugTitle);
    debugHeader.appendChild(toggleButton);

    const logContainer = document.createElement('div');
    logContainer.id = 'debug-log-container';
    logContainer.style.cssText = `
        font-size: 11px;
        line-height: 1.4;
    `;

    debugPanel.appendChild(debugHeader);
    debugPanel.appendChild(logContainer);
    document.body.appendChild(debugPanel);

    // Add keyboard shortcut to toggle debug panel
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    });
}

// Enhanced debug logging function
function debugLog(message, error = null) {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        message: message,
        error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : null
    };

    // Console logging
    console.log('DEBUG:', debugInfo);

    // Visual logging
    const logContainer = document.getElementById('debug-log-container');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.style.borderBottom = '1px solid #444';
        logEntry.style.padding = '4px 0';

        const timestamp = document.createElement('span');
        timestamp.style.color = '#888';
        timestamp.textContent = new Date().toLocaleTimeString();

        const messageSpan = document.createElement('span');
        messageSpan.style.marginLeft = '8px';
        messageSpan.style.color = error ? '#ff6b6b' : '#a8ff60';
        messageSpan.textContent = message;

        logEntry.appendChild(timestamp);
        logEntry.appendChild(messageSpan);

        if (error) {
            const errorDetails = document.createElement('div');
            errorDetails.style.color = '#ff8080';
            errorDetails.style.marginLeft = '20px';
            errorDetails.textContent = `${error.name}: ${error.message}`;
            logEntry.appendChild(errorDetails);
        }

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

function displayParagraph() {
    if (!allParagraphs.length) {
        // First time loading
        loadParagraphs().then(paragraphs => {
            currentParagraph = paragraphs[currentIndex];
            updateParagraphDisplay();
        });
    } else {
        // Just move to next paragraph in the shuffled list
        currentParagraph = allParagraphs[currentIndex];
        updateParagraphDisplay();
    }
    
    // Reset UI to initial state
    setupInitialUI();
}

function updateParagraphDisplay() {
    const paragraphText = document.getElementById('paragraph-text');
    const paragraphTextEnglish = document.getElementById('paragraph-text-english') || createEnglishTextElement();
    
    paragraphText.style.cssText = `
        cursor: pointer;
        padding: 10px;
        background-color: #fff;
        border-radius: 4px;
        transition: background-color 0.2s;
    `;
    paragraphText.title = 'Click to show/hide English translation';
    
    // Add hover effect
    paragraphText.onmouseover = () => {
        paragraphText.style.backgroundColor = '#f8f9fa';
    };
    paragraphText.onmouseout = () => {
        paragraphText.style.backgroundColor = '#fff';
    };
    
    // Add click handler to toggle English text
    paragraphText.onclick = () => {
        paragraphTextEnglish.style.display = paragraphTextEnglish.style.display === 'none' ? 'block' : 'none';
    };
    
    paragraphText.textContent = currentParagraph.german;
    paragraphTextEnglish.textContent = currentParagraph.english;
}

function createEnglishTextElement() {
    const container = document.getElementById('paragraph-text').parentElement;
    
    // Create English text element
    const englishText = document.createElement('div');
    englishText.id = 'paragraph-text-english';
    englishText.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
        font-style: italic;
        color: #6c757d;
        display: none;
        border-left: 3px solid #007bff;
    `;
    
    // Insert element
    container.appendChild(englishText);
    
    return englishText;
}

function setupInitialUI() {
    // Clean up any existing UI elements
    cleanupPreviousRecording();
    
    const controlsContainer = document.querySelector('.recording-controls');
    if (!controlsContainer) {
        console.error('Recording controls container not found');
        return;
    }

    // Style the controls container
    controlsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 100%;
        margin: 20px 0;
    `;
    
    // Create record button if it doesn't exist
    let recordBtn = document.getElementById('record-btn');
    if (!recordBtn) {
        recordBtn = document.createElement('button');
        recordBtn.id = 'record-btn';
    }
    recordBtn.style.cssText = `
        display: block;
        width: 100%;
        padding: 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin: 0;
        transition: background-color 0.2s;
    `;
    recordBtn.innerHTML = '<span class="record-icon">●</span> Aufnehmen';
    recordBtn.onclick = startRecording;
    controlsContainer.appendChild(recordBtn);

    // Create skip button if it doesn't exist
    let skipButton = document.getElementById('skip-btn-absatzweise');
    if (!skipButton) {
        skipButton = document.createElement('button');
        skipButton.id = 'skip-btn-absatzweise';
    }
    skipButton.style.cssText = `
        display: block;
        width: 100%;
        padding: 15px;
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin: 0;
        transition: background-color 0.2s;
    `;
    skipButton.textContent = 'Überspringen';
    skipButton.onclick = () => {
        // Move to next paragraph, loop back to start if at end
        currentIndex = (currentIndex + 1) % allParagraphs.length;
        currentParagraph = allParagraphs[currentIndex];
        displayParagraph();
    };
    controlsContainer.appendChild(skipButton);
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1
            }
        });

        // Initialize MediaRecorder with best supported format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
            ? 'audio/webm;codecs=opus' 
            : 'audio/mp4';
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 128000
        });
        
        audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        // Setup recording UI
        const recordBtn = document.getElementById('record-btn');
        recordBtn.innerHTML = '<span class="record-icon">●</span> Aufnahme stoppen';
        recordBtn.onclick = stopRecording;
        recordBtn.classList.add('recording');
        
        // Hide next button during recording
        document.getElementById('next-btn-absatzweise').style.display = 'none';

        mediaRecorder.start(100);
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Mikrofonberechtigung.');
    }
}

async function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Show processing UI
        const recordBtn = document.getElementById('record-btn');
        recordBtn.disabled = true;
        recordBtn.textContent = 'Verarbeite Aufnahme...';
        
        // Handle the recorded audio
        mediaRecorder.onstop = async () => {
            try {
                showProgressOverlay();

                // Convert to WAV
                const originalBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await originalBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const wavBlob = await audioBufferToWav(audioBuffer);

                // Send to API and get transcription
                const formData = new FormData();
                formData.append('audio', wavBlob, 'recording.wav');
                formData.append('input_language', new Blob(['de'], { type: 'text/plain' }));
                formData.append('output_language', new Blob(['de'], { type: 'text/plain' }));

                debugLog('Sending audio to API...');
                const response = await fetch('https://isl.nguyenbinh.dev/asr/asr/inference', {
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
                debugLog('Received API response');
                const transcription = result.segments.map(seg => seg.text).join(' ').trim();

                // Hide progress overlay before showing results
                hideProgressOverlay();

                // Show results
                const controlsContainer = document.querySelector('.recording-controls');
                controlsContainer.innerHTML = ''; // Clear existing controls
                
                // Style the controls container for results
                controlsContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    width: 100%;
                    margin: 20px 0;
                `;

                // Create audio player container
                const audioContainer = document.createElement('div');
                audioContainer.style.cssText = `
                    width: 100%;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 4px;
                `;

                // Create audio player
                const audioPlayer = document.createElement('audio');
                audioPlayer.id = 'audio-player';
                audioPlayer.controls = true;
                audioPlayer.style.cssText = `
                    width: 100%;
                    margin: 0;
                `;
                audioPlayer.src = URL.createObjectURL(wavBlob);
                audioContainer.appendChild(audioPlayer);
                controlsContainer.appendChild(audioContainer);
                
                // Show transcription in the transcription-result element
                const transcriptionResult = document.getElementById('transcription-result');
                const userTranscription = document.getElementById('user-transcription');
                const comparisonResult = document.getElementById('comparison-result');
                
                if (transcriptionResult && userTranscription && comparisonResult) {
                    transcriptionResult.style.cssText = `
                        display: block;
                        width: 100%;
                        margin: 15px 0;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 4px;
                    `;
                    userTranscription.textContent = transcription;
                    comparisonResult.innerHTML = compareTexts(currentParagraph.german, transcription);
                }
                
                // Add new recording button
                const newRecordBtn = document.createElement('button');
                newRecordBtn.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 15px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0;
                    transition: background-color 0.2s;
                `;
                newRecordBtn.textContent = 'Neu aufnehmen';
                newRecordBtn.onclick = () => displayParagraph();
                controlsContainer.appendChild(newRecordBtn);
                
                // Add next text button
                const nextButton = document.createElement('button');
                nextButton.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 15px;
                    background-color: #28a745;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0;
                    transition: background-color 0.2s;
                `;
                nextButton.textContent = 'Nächster Text';
                nextButton.onclick = () => {
                    // Move to next paragraph, loop back to start if at end
                    currentIndex = (currentIndex + 1) % allParagraphs.length;
                    currentParagraph = allParagraphs[currentIndex];
                    displayParagraph();
                };
                controlsContainer.appendChild(nextButton);

            } catch (error) {
                console.error('Error processing recording:', error);
                alert('Fehler bei der Verarbeitung der Aufnahme. Bitte versuchen Sie es erneut.');
                displayParagraph(); // Reset to initial state
            }
        };
    }
}

// Levenshtein distance implementation
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + 1, // substitution
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1      // insertion
                );
            }
        }
    }
    return dp[m][n];
}

function compareTexts(original, transcribed) {
    // Normalize both texts: lowercase and remove punctuation
    const normalizeText = (text) => {
        return text.toLowerCase()
            .replace(/[.,!?]/g, '')  // Remove punctuation
            .replace(/\s+/g, ' ')    // Normalize spaces
            .trim();
    };

    const normalizedOriginal = normalizeText(original);
    const normalizedTranscribed = normalizeText(transcribed);

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(normalizedOriginal, normalizedTranscribed);
    
    // Calculate similarity percentage (0-100)
    const maxLength = Math.max(normalizedOriginal.length, normalizedTranscribed.length);
    const similarity = ((maxLength - distance) / maxLength * 100).toFixed(1);

    let result = 'Vergleich:<br>';
    result += `Genauigkeit: ${similarity}%<br>`;

    // Detailed feedback based on similarity
    if (similarity >= 90) {
        result += '<span style="color: #27ae60">Ausgezeichnet! Ihre Aussprache ist sehr präzise.</span>';
    } else if (similarity >= 75) {
        result += '<span style="color: #f39c12">Gut gemacht! Kleine Verbesserungen sind noch möglich.</span>';
    } else if (similarity >= 60) {
        result += '<span style="color: #e67e22">Verständlich, aber es gibt noch Raum für Verbesserungen.</span>';
    } else {
        result += '<span style="color: #c0392b">Versuchen Sie es noch einmal. Achten Sie auf die genaue Aussprache.</span>';
    }

    // Add detailed comparison if accuracy is low
    if (similarity < 75) {
        result += '<br><br><span style="color: #7f8c8d">Tipp: Achten Sie besonders auf:';
        
        // Find words with significant differences
        const originalWords = normalizedOriginal.split(' ');
        const transcribedWords = normalizedTranscribed.split(' ');
        
        let problematicWords = [];
        originalWords.forEach((word, index) => {
            if (transcribedWords[index] && levenshteinDistance(word, transcribedWords[index]) > 2) {
                problematicWords.push(word);
            }
        });
        
        if (problematicWords.length > 0) {
            result += `<br>- ${problematicWords.join('<br>- ')}</span>`;
        } else {
            result += '<br>- Wortstellung und Vollständigkeit der Sätze</span>';
        }
    }

    return result;
}

function cleanupPreviousRecording() {
    // Reset audio state
    audioChunks = [];
    if (mediaRecorder?.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    // Clean up audio player
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer?.src) {
        URL.revokeObjectURL(audioPlayer.src);
    }
    
    // Clear controls container
    const controlsContainer = document.querySelector('.recording-controls');
    if (controlsContainer) {
        controlsContainer.innerHTML = '';
    }

    // Hide transcription result
    const transcriptionResult = document.getElementById('transcription-result');
    if (transcriptionResult) {
        transcriptionResult.style.display = 'none';
    }
}

// Function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numberOfChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }

    return encodeWAV(result, format, sampleRate, numberOfChannels, bitDepth);
}

function interleave(leftChannel, rightChannel) {
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

function encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * bytesPerSample, true);

    floatTo16BitPCM(view, 44, samples);

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

// Add these functions after createDebugPanel but before displayParagraph

function createProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'progress-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        min-width: 300px;
    `;

    const progressText = document.createElement('div');
    progressText.textContent = 'Verarbeite Aufnahme...';
    progressText.style.cssText = `
        margin-bottom: 15px;
        font-size: 16px;
        color: #333;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        width: 100%;
        height: 4px;
        background: #f0f0f0;
        border-radius: 2px;
        overflow: hidden;
    `;

    const progressIndicator = document.createElement('div');
    progressIndicator.style.cssText = `
        width: 30%;
        height: 100%;
        background: #007bff;
        border-radius: 2px;
        animation: progress 1s infinite linear;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes progress {
            0% {
                transform: translateX(-100%);
            }
            100% {
                transform: translateX(400%);
            }
        }
    `;
    document.head.appendChild(style);

    progressBar.appendChild(progressIndicator);
    progressContainer.appendChild(progressText);
    progressContainer.appendChild(progressBar);
    overlay.appendChild(progressContainer);
    document.body.appendChild(overlay);
}

function showProgressOverlay() {
    const overlay = document.getElementById('progress-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideProgressOverlay() {
    const overlay = document.getElementById('progress-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createDebugPanel();
    createProgressOverlay();
    
    // Ensure the recording controls container exists
    let controlsContainer = document.querySelector('.recording-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'recording-controls';
        document.body.appendChild(controlsContainer);
    }
    
    displayParagraph();
}); 