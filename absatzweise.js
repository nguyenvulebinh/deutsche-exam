let mediaRecorder;
let audioChunks = [];
let audioBlob;
let currentParagraph;

const paragraphs = [
    {
        text: "Der kleine Hund spielt im Park. Er läuft schnell und fröhlich herum. Andere Hunde kommen auch zum Spielen. Sie haben viel Spaß zusammen.",
        id: 1
    },
    {
        text: "Heute ist das Wetter sehr schön. Die Sonne scheint hell am Himmel. Die Menschen gehen spazieren und genießen den Tag.",
        id: 2
    },
    {
        text: "In der Bäckerei riecht es gut. Frische Brötchen und Brot liegen in den Regalen. Die Verkäuferin ist freundlich und hilfsbereit.",
        id: 3
    }
];

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
    if (!currentParagraph) {
        currentParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    }
    document.getElementById('paragraph-text').textContent = currentParagraph.text;
}

async function startRecording() {
    debugLog('Starting recording process');
    try {
        debugLog('Checking MediaRecorder support');
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder is not supported in this browser');
        }

        debugLog('Setting up audio constraints for iOS');
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1
            }
        };

        debugLog('Requesting microphone permission');
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        debugLog('Microphone permission granted, stream obtained');

        // iOS-specific MIME types first
        const supportedTypes = [
            'audio/mp4',
            'audio/mp4;codecs=mp4a',
            'audio/aac',
            'audio/mpeg',
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg'
        ];
        
        debugLog('Checking supported MIME types');
        const availableMimeTypes = supportedTypes.filter(type => {
            const isSupported = MediaRecorder.isTypeSupported(type);
            debugLog(`MIME type ${type} supported: ${isSupported}`);
            return isSupported;
        });

        if (availableMimeTypes.length === 0) {
            debugLog('No supported MIME types found, using default');
            // On iOS, if no MIME type is specified, it might default to a compatible format
            mediaRecorder = new MediaRecorder(stream);
            debugLog('MediaRecorder initialized with default settings');
        } else {
            const options = {
                mimeType: availableMimeTypes[0],
                audioBitsPerSecond: 128000
            };
            debugLog(`Using MIME type: ${options.mimeType}`);
            
            try {
                mediaRecorder = new MediaRecorder(stream, options);
                debugLog('MediaRecorder initialized successfully with options');
            } catch (e) {
                debugLog('Failed to initialize MediaRecorder with options, trying without options', e);
                mediaRecorder = new MediaRecorder(stream);
                debugLog('MediaRecorder initialized without options');
            }
        }
        
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            debugLog(`Data available event, chunk size: ${event.data.size} bytes`);
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            debugLog('Recording stopped, processing audio chunks');
            try {
                // Try to detect the actual MIME type used
                const actualMimeType = mediaRecorder.mimeType || 'audio/mp4';
                debugLog(`Actual MIME type used: ${actualMimeType}`);
                
                const audioBlob = new Blob(audioChunks, { type: actualMimeType });
                debugLog(`Audio blob created, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
                
                let audioPlayer = document.getElementById('audio-player');
                if (!audioPlayer) {
                    debugLog('Creating new audio player');
                    audioPlayer = document.createElement('audio');
                    audioPlayer.id = 'audio-player';
                    audioPlayer.controls = true;
                    audioPlayer.style.width = '100%';
                    audioPlayer.style.marginTop = '10px';
                    audioPlayer.playsinline = true; // Important for iOS
                    audioPlayer.setAttribute('webkit-playsinline', 'true'); // For older iOS versions
                    document.querySelector('.recording-controls').appendChild(audioPlayer);
                }

                // Create a debug message for the audio format
                const debugAudioInfo = document.createElement('div');
                debugAudioInfo.style.fontSize = '12px';
                debugAudioInfo.style.color = '#666';
                debugAudioInfo.textContent = `Audio format: ${actualMimeType}`;
                audioPlayer.parentNode.insertBefore(debugAudioInfo, audioPlayer.nextSibling);
                
                const audioUrl = URL.createObjectURL(audioBlob);
                debugLog('Audio URL created');
                
                // Add event listeners before setting src
                audioPlayer.onloadedmetadata = () => {
                    debugLog('Audio metadata loaded');
                };
                
                audioPlayer.oncanplay = () => {
                    debugLog('Audio can be played');
                    // Try to play a short segment to test audio
                    audioPlayer.currentTime = 0;
                    const playPromise = audioPlayer.play();
                    if (playPromise) {
                        playPromise.then(() => {
                            debugLog('Audio playback started successfully');
                            setTimeout(() => {
                                audioPlayer.pause();
                                audioPlayer.currentTime = 0;
                            }, 100);
                        }).catch(error => {
                            debugLog('Audio playback test failed', error);
                        });
                    }
                };
                
                audioPlayer.onerror = (e) => {
                    debugLog('Audio player error', {
                        error: e.target.error,
                        code: e.target.error.code,
                        message: e.target.error.message
                    });
                };

                // Set the source and display
                audioPlayer.src = audioUrl;
                audioPlayer.style.display = 'block';
                
                window.recordedBlob = audioBlob;
                document.getElementById('submit-recording').style.display = 'block';
                
            } catch (error) {
                debugLog('Error in onstop handler', error);
                console.error('Error setting up audio playback:', error);
                alert('Es gab ein Problem bei der Aufnahme. Bitte versuchen Sie es erneut.');
            }
        };

        mediaRecorder.onerror = (event) => {
            debugLog('MediaRecorder error', event.error);
        };

        // Start recording with a timeslice to ensure regular ondataavailable events
        debugLog('Starting MediaRecorder');
        mediaRecorder.start(100);
        document.getElementById('record-btn').classList.add('recording');
        document.getElementById('record-btn').innerHTML = '<span class="record-icon">●</span> Aufnahme stoppen';
        document.getElementById('record-btn').onclick = stopRecording;
    } catch (err) {
        debugLog('Error in startRecording', err);
        console.error('Error accessing microphone:', err);
        alert('Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Mikrofonberechtigung.');
    }
}

function stopRecording() {
    debugLog('Stopping recording');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        debugLog(`Current MediaRecorder state: ${mediaRecorder.state}`);
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
            debugLog(`Track ${track.kind} stopped`);
        });
        document.getElementById('record-btn').classList.remove('recording');
        document.getElementById('record-btn').innerHTML = '<span class="record-icon">●</span> Neu aufnehmen';
        document.getElementById('record-btn').onclick = startRecording;
    } else {
        debugLog(`MediaRecorder not recording. State: ${mediaRecorder ? mediaRecorder.state : 'undefined'}`);
    }
}

async function submitRecording() {
    if (!window.recordedBlob) {
        alert('Bitte nehmen Sie zuerst Ihre Stimme auf.');
        return;
    }

    const formData = new FormData();
    formData.append('audio', window.recordedBlob, 'recording.webm');
    formData.append('input_language', 'de');

    try {
        document.getElementById('submit-recording').disabled = true;
        document.getElementById('submit-recording').textContent = 'Wird verarbeitet...';

        const response = await fetch('https://isl.nguyenbinh.dev/asr/asr/inference', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const transcription = result.segments.map(seg => seg.text).join(' ').trim();
        
        document.getElementById('transcription-result').style.display = 'block';
        document.getElementById('user-transcription').textContent = transcription;
        
        // Compare with original text
        const comparison = compareTexts(currentParagraph.text, transcription);
        document.getElementById('comparison-result').innerHTML = comparison;
        
        // Show next button
        document.getElementById('next-btn-absatzweise').style.display = 'block';
    } catch (error) {
        console.error('Error submitting recording:', error);
        alert('Fehler beim Senden der Aufnahme. Bitte versuchen Sie es erneut.');
    } finally {
        document.getElementById('submit-recording').disabled = false;
        document.getElementById('submit-recording').textContent = 'Aussprache prüfen';
    }
}

function compareTexts(original, transcribed) {
    // Simple word-by-word comparison
    const originalWords = original.toLowerCase().split(/\s+/);
    const transcribedWords = transcribed.toLowerCase().split(/\s+/);
    
    let result = 'Vergleich:<br>';
    let correctWords = 0;
    
    originalWords.forEach((word, index) => {
        if (transcribedWords[index] === word) {
            correctWords++;
        }
    });
    
    const accuracy = (correctWords / originalWords.length * 100).toFixed(1);
    result += `Genauigkeit: ${accuracy}%<br>`;
    
    if (accuracy > 90) {
        result += '<span style="color: #27ae60">Sehr gut! Ihre Aussprache ist ausgezeichnet.</span>';
    } else if (accuracy > 75) {
        result += '<span style="color: #f39c12">Gut! Weiter üben für noch bessere Ergebnisse.</span>';
    } else {
        result += '<span style="color: #c0392b">Versuchen Sie es noch einmal. Achten Sie auf die Aussprache jedes Wortes.</span>';
    }
    
    return result;
}

function nextParagraph() {
    // Reset state
    audioChunks = [];
    window.recordedBlob = null;
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.style.display = 'none';
        audioPlayer.src = '';
    }
    document.getElementById('submit-recording').style.display = 'none';
    document.getElementById('transcription-result').style.display = 'none';
    document.getElementById('next-btn-absatzweise').style.display = 'none';
    
    // Get new random paragraph different from current
    let newParagraph;
    do {
        newParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    } while (newParagraph.id === currentParagraph.id);
    
    currentParagraph = newParagraph;
    displayParagraph();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create debug panel
    createDebugPanel();
    debugLog('Debug panel initialized');
    debugLog(`User Agent: ${navigator.userAgent}`);
    
    // Add event listeners
    document.getElementById('record-btn').onclick = startRecording;
    document.getElementById('submit-recording').onclick = submitRecording;
    document.getElementById('next-btn-absatzweise').onclick = nextParagraph;
    document.getElementById('skip-btn-absatzweise').onclick = nextParagraph;
}); 