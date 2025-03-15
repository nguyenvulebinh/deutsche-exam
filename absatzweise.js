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

function displayParagraph() {
    if (!currentParagraph) {
        currentParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    }
    document.getElementById('paragraph-text').textContent = currentParagraph.text;
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            document.getElementById('play-btn').onclick = () => {
                const audio = new Audio(audioUrl);
                audio.play();
            };
            document.getElementById('play-btn').style.display = 'block';
            document.getElementById('submit-recording').style.display = 'block';
        };

        mediaRecorder.start();
        document.getElementById('record-btn').classList.add('recording');
        document.getElementById('record-btn').innerHTML = '<span class="record-icon">●</span> Aufnahme stoppen';
        document.getElementById('record-btn').onclick = stopRecording;
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Mikrofonberechtigung.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        document.getElementById('record-btn').classList.remove('recording');
        document.getElementById('record-btn').innerHTML = '<span class="record-icon">●</span> Neu aufnehmen';
        document.getElementById('record-btn').onclick = startRecording;
    }
}

async function submitRecording() {
    if (!audioBlob) {
        alert('Bitte nehmen Sie zuerst Ihre Stimme auf.');
        return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('input_language', 'de');

    try {
        document.getElementById('submit-recording').disabled = true;
        document.getElementById('submit-recording').textContent = 'Wird verarbeitet...';

        const response = await fetch('https://isl.nguyenbinh.dev/asr/asr/inference', {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json',
            },
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
        
        // More descriptive error message for users
        let errorMessage = 'Ein Fehler ist aufgetreten. ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.message.includes('HTTP error')) {
            errorMessage += 'Der Server konnte die Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut.';
        } else if (error.name === 'TypeError') {
            errorMessage += 'Es gab ein Problem mit der Audioverarbeitung. Bitte versuchen Sie es erneut.';
        }
        
        alert(errorMessage);
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
    audioBlob = null;
    document.getElementById('play-btn').style.display = 'none';
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
    // Add event listeners
    document.getElementById('record-btn').onclick = startRecording;
    document.getElementById('submit-recording').onclick = submitRecording;
    document.getElementById('next-btn-absatzweise').onclick = nextParagraph;
    document.getElementById('skip-btn-absatzweise').onclick = nextParagraph;
}); 