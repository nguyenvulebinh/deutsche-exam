let currentQuestionIndex = 0;
let questions = [];
let questions2 = [];
let questions3 = [];
let currentTask = null;
let writingTasks = [];
let writingTasks2 = [];
let wordDatabase = [];

// Lesen Test Variables
let testQuestions = [];
let currentTestQuestion = 0;
let userAnswers = [];
let testStarted = false;

// Load questions for all tasks
async function loadAllQuestions() {
    try {
        const [response1, response2, response3, response4, response5, wordsResponse] = await Promise.all([
            fetch('./datasets/reading_task_1.json'),
            fetch('./datasets/reading_task_2.json'),
            fetch('./datasets/reading_task_3.json'),
            fetch('./datasets/writing_task_1.json'),
            fetch('./datasets/writing_task_2.json'),
            fetch('./datasets/a1_words.json')
        ]);
        
        if (!response1.ok || !response2.ok || !response3.ok || !response4.ok || !response5.ok || !wordsResponse.ok) {
            throw new Error('Failed to load questions');
        }

        // Load and shuffle Lesen Teil 1 questions and their statements
        const lesen1Data = await response1.json();
        questions = lesen1Data.map(question => ({
            ...question,
            statements: shuffleArray([...question.statements]).slice(0, 3)
        }));
        questions = shuffleArray(questions);

        questions2 = shuffleArray(await response2.json());
        questions3 = shuffleArray(await response3.json());
        writingTasks = shuffleArray(await response4.json());
        writingTasks2 = shuffleArray(await response5.json());
        
        // Process word database
        const wordsData = await wordsResponse.json();
        const allWords = [];
        for (const category in wordsData) {
            // Add category to each word
            const wordsWithCategory = wordsData[category].map(word => ({
                ...word,
                category: category
            }));
            allWords.push(...wordsWithCategory);
        }
        wordDatabase = shuffleArray(allWords);

        console.log('Loaded questions:', { questions, questions2, questions3, writingTasks, writingTasks2, wordDatabase });
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please refresh the page.');
    }
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Task Selection Handlers
function showTaskSelection() {
    document.getElementById('task-selection').style.display = 'block';
    document.getElementById('lesen1-container').style.display = 'none';
    document.getElementById('lesen2-container').style.display = 'none';
    document.getElementById('lesen3-container').style.display = 'none';
    document.getElementById('schreiben1-container').style.display = 'none';
    document.getElementById('schreiben2-container').style.display = 'none';
    document.getElementById('wortubung-container').style.display = 'none';
    document.getElementById('lesen-test-container').style.display = 'none';
    document.getElementById('absatzweise-container').style.display = 'none';
    currentTask = null;
    currentQuestionIndex = 0;
    
    // Reset word practice state
    if (document.querySelector('#wortubung-container .feedback-box')) {
        document.querySelector('#wortubung-container .feedback-box').style.display = 'none';
    }
    if (document.querySelector('#wortubung-container .correct-answer')) {
        document.querySelector('#wortubung-container .correct-answer').style.display = 'none';
    }
    if (document.getElementById('word-answer')) {
        document.getElementById('word-answer').value = '';
        document.getElementById('word-answer').disabled = false;
    }
    if (document.getElementById('submit-btn-wortubung')) {
        document.getElementById('submit-btn-wortubung').style.display = 'block';
    }
    if (document.getElementById('next-btn-wortubung')) {
        document.getElementById('next-btn-wortubung').style.display = 'none';
    }
    
    // Reshuffle writing tasks when returning to selection
    if (writingTasks.length > 0) {
        writingTasks = shuffleArray([...writingTasks]);
    }
    if (writingTasks2.length > 0) {
        writingTasks2 = shuffleArray([...writingTasks2]);
    }
    // Reshuffle word database when returning to selection
    if (wordDatabase.length > 0) {
        wordDatabase = shuffleArray([...wordDatabase]);
    }
}

function showTask(taskId) {
    document.getElementById('task-selection').style.display = 'none';
    document.getElementById('lesen1-container').style.display = taskId === 'lesen1' ? 'block' : 'none';
    document.getElementById('lesen2-container').style.display = taskId === 'lesen2' ? 'block' : 'none';
    document.getElementById('lesen3-container').style.display = taskId === 'lesen3' ? 'block' : 'none';
    document.getElementById('schreiben1-container').style.display = taskId === 'schreiben1' ? 'block' : 'none';
    document.getElementById('schreiben2-container').style.display = taskId === 'schreiben2' ? 'block' : 'none';
    document.getElementById('wortubung-container').style.display = taskId === 'wortubung' ? 'block' : 'none';
    document.getElementById('lesen-test-container').style.display = taskId === 'lesen-test' ? 'block' : 'none';
    document.getElementById('absatzweise-container').style.display = taskId === 'absatzweise' ? 'block' : 'none';
    currentTask = taskId;
    currentQuestionIndex = 0;
    
    // Shuffle questions based on the selected task
    switch (taskId) {
        case 'lesen1':
            questions = shuffleArray([...questions]);
            displayQuestion1();
            break;
        case 'lesen2':
            questions2 = shuffleArray([...questions2]);
            displayQuestion2();
            break;
        case 'lesen3':
            questions3 = shuffleArray([...questions3]);
            displayQuestion3();
            break;
        case 'schreiben1':
            writingTasks = shuffleArray([...writingTasks]);
            displayWritingTask1();
            break;
        case 'schreiben2':
            writingTasks2 = shuffleArray([...writingTasks2]);
            displayWritingTask2();
            break;
        case 'wortubung':
            wordDatabase = shuffleArray([...wordDatabase]);
            displayWordPractice();
            break;
        case 'lesen-test':
            currentTestQuestion = 0;
            userAnswers = [];
            testStarted = false;
            initializeLesenTest();
            break;
        case 'absatzweise':
            if (window.absatzweiseModule) {
                window.absatzweiseModule.displayParagraph();
            } else {
                console.error('AbsatzweiseModule not initialized');
            }
            break;
    }
}

// Lesen Teil 1 Functions
function updateInstructionText(statementCount) {
    const instructionText = document.querySelector('#lesen1-container .instruction p:first-child');
    instructionText.textContent = `Sind die Aussagen 1–${statementCount} richtig (+) oder falsch (–)?`;
}

function displayQuestion1() {
    if (currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0;
        questions = shuffleArray(questions);
    }

    const question = questions[currentQuestionIndex];
    updateInstructionText(question.statements.length);
    
    const textContent = document.getElementById('text-content');
    textContent.innerHTML = question.text.replace(/\n/g, '<br>');
    
    const statementsContainer = document.getElementById('statements');
    statementsContainer.innerHTML = '';
    
    question.statements.forEach((statement, index) => {
        const statementDiv = document.createElement('div');
        statementDiv.className = 'statement';
        statementDiv.innerHTML = `
            <span class="statement-number">${index + 1}</span>
            <div class="statement-content">
                <div class="statement-text">${statement.statement}</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="statement${index}" value="richtig">
                        +
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="statement${index}" value="falsch">
                        –
                    </label>
                </div>
            </div>
        `;
        statementsContainer.appendChild(statementDiv);
    });

    document.getElementById('submit-btn').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
}

function checkAnswers1() {
    const question = questions[currentQuestionIndex];
    const statements = document.querySelectorAll('.statement');
    let allAnswered = true;

    statements.forEach((statement, index) => {
        const selectedAnswer = statement.querySelector('input[type="radio"]:checked');
        if (!selectedAnswer) {
            allAnswered = false;
            return;
        }

        const isCorrect = selectedAnswer.value === question.statements[index].answer;
        statement.classList.remove('correct', 'incorrect');
        statement.classList.add(isCorrect ? 'correct' : 'incorrect');

        statement.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.disabled = true;
        });
    });

    if (allAnswered) {
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';
    } else {
        alert('Bitte beantworten Sie alle Aussagen.');
    }
}

// Lesen Teil 2 Functions
function displayQuestion2() {
    if (currentQuestionIndex >= questions2.length) {
        currentQuestionIndex = 0;
        questions2 = shuffleArray(questions2);
    }

    const question = questions2[currentQuestionIndex];
    console.log('Current question:', question);
    
    // Display the scenario/question
    document.getElementById('scenario-text').textContent = question.scenario;
    
    // Randomly assign answer and interferer to positions a or b
    const isAnswerA = Math.random() < 0.5;
    const optionA = document.getElementById('option-a').querySelector('.option-content');
    const optionB = document.getElementById('option-b').querySelector('.option-content');
    
    // Clear previous content
    optionA.innerHTML = '';
    optionB.innerHTML = '';
    
    // Set new content with line breaks
    const answerText = isAnswerA ? question.answer : question.interferer;
    const interferenceText = isAnswerA ? question.interferer : question.answer;
    
    // Handle multi-line content
    if (answerText) {
        const aLines = answerText.split('\n');
        optionA.innerHTML = aLines.join('<br>');
    }
    
    if (interferenceText) {
        const bLines = interferenceText.split('\n');
        optionB.innerHTML = bLines.join('<br>');
    }
    
    // Store the correct answer (a or b) for checking
    question.correctPosition = isAnswerA ? 'a' : 'b';
    
    // Reset radio buttons and styles
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.checked = false;
        radio.disabled = false;
    });
    document.querySelectorAll('.option-box').forEach(box => {
        box.classList.remove('correct', 'incorrect');
    });

    document.getElementById('submit-btn2').style.display = 'block';
    document.getElementById('next-btn2').style.display = 'none';
    
    // Debug output
    console.log('Option A content:', answerText);
    console.log('Option B content:', interferenceText);
    console.log('Correct position:', question.correctPosition);
}

function checkAnswers2() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (!selectedAnswer) {
        alert('Bitte wählen Sie eine Antwort aus.');
        return;
    }

    const question = questions2[currentQuestionIndex];
    const isCorrect = selectedAnswer.value === question.correctPosition;
    
    // Show correct/incorrect feedback
    const correctBox = document.getElementById(`option-${question.correctPosition}`);
    const selectedBox = document.getElementById(`option-${selectedAnswer.value}`);
    
    // Remove any existing feedback classes
    document.querySelectorAll('.option-box').forEach(box => {
        box.classList.remove('correct', 'incorrect');
    });
    
    // Add new feedback classes
    correctBox.classList.add('correct');
    if (!isCorrect) {
        selectedBox.classList.add('incorrect');
    }

    // Disable radio buttons
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.disabled = true;
    });

    document.getElementById('submit-btn2').style.display = 'none';
    document.getElementById('next-btn2').style.display = 'block';
}

// Lesen Teil 3 Functions
function displayQuestion3() {
    if (currentQuestionIndex >= questions3.length) {
        currentQuestionIndex = 0;
        questions3 = shuffleArray(questions3);
    }

    const question = questions3[currentQuestionIndex];
    
    document.getElementById('location-text').textContent = question.Location;
    document.getElementById('noticeboard-content').textContent = question.Noticeboard;
    document.getElementById('statement-text').textContent = question.Statement;
    
    // Reset radio buttons and styles
    document.querySelectorAll('input[name="answer3"]').forEach(radio => {
        radio.checked = false;
        radio.disabled = false;
    });
    
    document.querySelector('.statement-section').classList.remove('correct-answer', 'incorrect-answer');

    document.getElementById('submit-btn3').style.display = 'block';
    document.getElementById('next-btn3').style.display = 'none';
}

function checkAnswers3() {
    const selectedAnswer = document.querySelector('input[name="answer3"]:checked');
    if (!selectedAnswer) {
        alert('Bitte wählen Sie eine Antwort aus.');
        return;
    }

    const question = questions3[currentQuestionIndex];
    const isCorrect = selectedAnswer.value === question.Answer;
    
    // Show correct/incorrect feedback
    const statementSection = document.querySelector('.statement-section');
    statementSection.classList.remove('correct-answer', 'incorrect-answer');
    statementSection.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');

    // Disable radio buttons
    document.querySelectorAll('input[name="answer3"]').forEach(radio => {
        radio.disabled = true;
    });

    document.getElementById('submit-btn3').style.display = 'none';
    document.getElementById('next-btn3').style.display = 'block';
}

// Schreiben Teil 1 Functions
function displayWritingTask1() {
    if (currentQuestionIndex >= writingTasks.length) {
        currentQuestionIndex = 0;
        writingTasks = shuffleArray([...writingTasks]); // Shuffle when starting over
    }

    const task = writingTasks[currentQuestionIndex];
    
    // Display task text
    document.getElementById('task-text').textContent = task.text;
    
    // Set form title
    document.querySelector('.form-container h2').textContent = task.form.title;
    
    // Create form fields
    const form = document.getElementById('registration-form');
    form.innerHTML = ''; // Clear existing fields
    
    task.form.fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        formGroup.appendChild(label);
        
        // Generate a safe ID by removing special characters and spaces
        const safeId = field.label
            .toLowerCase()
            .replace(':', '')
            .replace(/[^a-z0-9]/g, '_');
        
        if (field.options) {
            // Create radio buttons for options
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
                        
            // Create a flex container for horizontal layout
            const optionsContainer = document.createElement('div');
            optionsContainer.style.display = 'flex';
            optionsContainer.style.marginTop = '0.5rem';
            optionsContainer.style.alignItems = 'center';
            
            field.options.forEach(option => {
                const optionLabel = document.createElement('label');
                optionLabel.className = 'option';
                optionLabel.style.display = 'flex';
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = safeId;
                input.value = option;
                input.required = true;
                
                const optionText = document.createElement('span');
                optionText.textContent = option;
                
                optionLabel.appendChild(input);
                optionLabel.appendChild(optionText);
                optionsContainer.appendChild(optionLabel);
            });
            
            optionsDiv.appendChild(optionsContainer);
            formGroup.appendChild(optionsDiv);
        } else {
            // Create text input
            const input = document.createElement('input');
            input.type = 'text';
            input.required = true;
            input.id = safeId;
            formGroup.appendChild(input);
        }

        // Add a div for showing the correct answer (hidden initially)
        const answerDiv = document.createElement('div');
        answerDiv.className = 'correct-answer';
        answerDiv.style.display = 'none';
        answerDiv.innerHTML = `<span>Richtige Antwort: ${field.answer}</span>`;
        formGroup.appendChild(answerDiv);
        
        form.appendChild(formGroup);
    });

    // Reset validation styles
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('correct', 'incorrect');
        group.querySelector('.correct-answer').style.display = 'none';
    });

    document.getElementById('submit-btn-schreiben1').style.display = 'block';
    document.getElementById('next-btn-schreiben1').style.display = 'none';
}

function checkAnswersSchreiben1() {
    const task = writingTasks[currentQuestionIndex];
    const form = document.getElementById('registration-form');
    let allAnswered = true;
    let allCorrect = true;
    let emptyFields = [];

    task.form.fields.forEach(field => {
        // Generate the same safe ID as in displayWritingTask1
        const safeId = field.label
            .toLowerCase()
            .replace(':', '')
            .replace(/[^a-z0-9]/g, '_');
            
        let input;
        let value;

        if (field.options) {
            input = form.querySelector(`input[name="${safeId}"]:checked`);
            value = input ? input.value : null;
        } else {
            input = form.querySelector(`#${safeId}`);
            value = input ? input.value.trim() : null;
        }

        if (!value) {
            allAnswered = false;
            emptyFields.push(field.label);
            return;
        }

        const formGroup = input.closest('.form-group');
        const isCorrect = value.toLowerCase() === field.answer.toLowerCase();
        
        formGroup.classList.remove('correct', 'incorrect');
        formGroup.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Show the correct answer
        const answerDiv = formGroup.querySelector('.correct-answer');
        answerDiv.style.display = 'block';
        
        if (!isCorrect) allCorrect = false;
    });

    if (!allAnswered) {
        alert(`Bitte füllen Sie die folgenden Felder aus:\n${emptyFields.join('\n')}`);
        return;
    }

    // Disable all inputs
    form.querySelectorAll('input').forEach(input => {
        input.disabled = true;
    });

    document.getElementById('submit-btn-schreiben1').style.display = 'none';
    document.getElementById('next-btn-schreiben1').style.display = 'block';
}

async function displayWritingTask2() {
    if (currentQuestionIndex >= writingTasks2.length) {
        currentQuestionIndex = 0;
        writingTasks2 = shuffleArray([...writingTasks2]); // Shuffle when starting over
    }

    const task = writingTasks2[currentQuestionIndex];
    
    // Update the content in the existing container
    const contextContent = document.querySelector('#schreiben2-container .context-content');
    const requirementsList = document.querySelector('#schreiben2-container .requirements-list');
    
    // Clear previous content
    contextContent.textContent = task.context;
    requirementsList.innerHTML = task.requirements.map(req => `<li>${req}</li>`).join('');
    
    // Reset the textarea and hide feedback/suggestions
    document.getElementById('userText').value = '';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('suggestions').style.display = 'none';
}

async function submitWriting() {
    const userText = document.getElementById('userText').value.trim();
    if (!userText) {
        alert('Bitte schreiben Sie zuerst Ihre Antwort.');
        return;
    }

    try {
        // Show loading overlay
        document.getElementById('progress-overlay').style.display = 'flex';

        const task = writingTasks2[currentQuestionIndex];
        const requestData = {
            assistant_id: "writing_task_2_a1_scoring",
            input: {
                messages: [
                    {
                        type: "human",
                        content: JSON.stringify({
                            context: task.context,
                            requirements: task.requirements,
                            student_letter: userText
                        })
                    }
                ]
            }
        };

        const response = await fetch('https://mcorec.nguyenbinh.dev/agent/runs/wait', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Failed to get feedback');
        }

        const data = await response.json();
        const aiMessage = data.messages.find(msg => msg.type === 'ai');
        
        if (!aiMessage) {
            throw new Error('No feedback received');
        }

        // Extract markdown content (remove the markdown code block markers)
        const markdownContent = aiMessage.content.replace(/```markdown\n|\n```/g, '');

        // Display the feedback using marked.js
        const feedbackSection = document.getElementById('feedback');
        const feedbackContent = feedbackSection.querySelector('.feedback-content');
        feedbackContent.innerHTML = marked.parse(markdownContent);
        feedbackSection.style.display = 'block';

    } catch (error) {
        console.error('Error getting feedback:', error);
        alert('Failed to get feedback. Please try again.');
    } finally {
        // Hide loading overlay
        document.getElementById('progress-overlay').style.display = 'none';
    }
}

async function getSuggestions() {
    const task = writingTasks2[currentQuestionIndex];
    
    try {
        // Show the progress bar overlay
        document.getElementById('progress-overlay').style.display = 'flex';
        
        // Prepare the API request data
        const requestData = {
            assistant_id: "writing_task_2_a1",
            input: {
                messages: [
                    {
                        type: "human",
                        content: JSON.stringify({
                            context: task.context,
                            requirements: task.requirements
                        })
                    }
                ]
            }
        };

        // Make the API call
        const response = await fetch('https://mcorec.nguyenbinh.dev/agent/runs/wait', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        const aiMessage = data.messages.find(msg => msg.type === 'ai');
        
        if (!aiMessage) {
            throw new Error('No suggestions received');
        }

        // Extract markdown content (remove the markdown code block markers)
        const markdownContent = aiMessage.content.replace(/```markdown\n|\n```/g, '');

        // Update the UI with formatted content using marked.js
        const suggestionsSection = document.getElementById('suggestions');
        const suggestionsContent = suggestionsSection.querySelector('.suggestions-content');
        suggestionsContent.innerHTML = marked.parse(markdownContent);
        suggestionsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error getting suggestions:', error);
        alert('Failed to get suggestions. Please try again.');
    } finally {
        // Hide the progress bar overlay
        document.getElementById('progress-overlay').style.display = 'none';
    }
}

// Skip functions for each task type
function skipQuestion1() {
    currentQuestionIndex++;
    displayQuestion1();
}

function skipQuestion2() {
    currentQuestionIndex++;
    displayQuestion2();
}

function skipQuestion3() {
    currentQuestionIndex++;
    displayQuestion3();
}

function skipWritingTask1() {
    currentQuestionIndex++;
    displayWritingTask1();
}

function skipWritingTask2() {
    currentQuestionIndex++;
    displayWritingTask2();
}

// Word Practice Functions
function displayWordPractice() {
    if (currentQuestionIndex >= wordDatabase.length) {
        currentQuestionIndex = 0;
        wordDatabase = shuffleArray(wordDatabase);
    }

    const word = wordDatabase[currentQuestionIndex];
    const hintTypes = ['english', 'meaning'];
    const randomHintType = hintTypes[Math.floor(Math.random() * hintTypes.length)];
    
    const hintTypeElement = document.querySelector('#wortubung-container .hint-type');
    const hintContentElement = document.querySelector('#wortubung-container .hint-content');
    const topicElement = document.querySelector('#wortubung-container .topic');
    
    // Show the topic/category
    topicElement.textContent = `Thema: ${word.category}`;
    
    // Set hint type and content based on random selection
    switch (randomHintType) {
        case 'english':
            hintTypeElement.textContent = 'Englisches Wort:';
            hintContentElement.textContent = word.english;
            break;
        case 'meaning':
            hintTypeElement.textContent = 'Bedeutung auf Englisch:';
            hintContentElement.textContent = word.meaning;
            break;
        case 'bedeutung':
            hintTypeElement.textContent = 'Bedeutung auf Deutsch:';
            hintContentElement.textContent = word.bedeutung;
            break;
    }
    
    // Reset the input and feedback
    document.getElementById('word-answer').value = '';
    document.getElementById('word-answer').disabled = false;
    document.querySelector('#wortubung-container .feedback-box').style.display = 'none';
    document.querySelector('#wortubung-container .correct-answer').style.display = 'none';
    document.getElementById('submit-btn-wortubung').style.display = 'block';
    document.getElementById('next-btn-wortubung').style.display = 'none';
}

function checkWordAnswer() {
    const word = wordDatabase[currentQuestionIndex];
    const userAnswer = document.getElementById('word-answer').value.trim();
    const feedbackBox = document.querySelector('#wortubung-container .feedback-box');
    const feedbackMessage = document.querySelector('#wortubung-container .feedback-message');
    const correctAnswer = document.querySelector('#wortubung-container .correct-answer');
    const correctWord = document.querySelector('#wortubung-container .correct-word');
    const wordDetails = document.querySelector('#wortubung-container .word-details');
    
    feedbackBox.style.display = 'block';
    
    if (userAnswer.toLowerCase() === word.german.toLowerCase()) {
        feedbackMessage.textContent = 'Richtig! 👏';
        feedbackMessage.style.color = '#4CAF50';
    } else {
        feedbackMessage.textContent = 'Leider falsch. 😔';
        feedbackMessage.style.color = '#f44336';
    }
    correctAnswer.style.display = 'block';
    correctWord.textContent = word.german;
    wordDetails.innerHTML = `
        Englisch: ${word.english}<br>
        Bedeutung: ${word.meaning}<br>
        Bedeutung (Deutsch): ${word.bedeutung}
    `;
    
    document.getElementById('word-answer').disabled = true;
    document.getElementById('submit-btn-wortubung').style.display = 'none';
    document.getElementById('next-btn-wortubung').style.display = 'block';
}

function skipWordPractice() {
    currentQuestionIndex++;
    displayWordPractice();
}

// Create progress overlay function
function createProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'progress-overlay';
    
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    const text = document.createElement('div');
    text.className = 'progress-text';
    text.textContent = 'Vorschläge werden geladen...';
    
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    
    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    
    bar.appendChild(fill);
    container.appendChild(text);
    container.appendChild(bar);
    overlay.appendChild(container);
    
    document.body.appendChild(overlay);
}

// Initialize test questions
function initializeLesenTest() {
    // Shuffle each part separately
    const shuffledQuestions1 = shuffleArray([...questions]);
    const shuffledQuestions2 = shuffleArray([...questions2]);
    const shuffledQuestions3 = shuffleArray([...questions3]);
    
    // Take the required number of questions from each part and add type
    testQuestions = [
        // Teil 1 - 2 questions (always first)
        ...shuffledQuestions1.slice(0, 2).map(q => ({ type: 'teil1', ...q })),
        // Teil 2 - 5 questions (always second)
        ...shuffledQuestions2.slice(0, 5).map(q => ({ type: 'teil2', ...q })),
        // Teil 3 - 5 questions (always last)
        ...shuffledQuestions3.slice(0, 5).map(q => ({ type: 'teil3', ...q }))
    ];
    
    currentTestQuestion = 0;
    userAnswers = new Array(testQuestions.length).fill(null);
    testStarted = true;
    displayTestQuestion();
    updateProgressBar();
}

function displayTestQuestion() {
    const question = testQuestions[currentTestQuestion];
    const sections = ['lesen-test-teil1', 'lesen-test-teil2', 'lesen-test-teil3'];
    
    // Hide all sections first
    sections.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    
    // Update progress indicator
    document.getElementById('current-question').textContent = currentTestQuestion + 1;
    
    switch (question.type) {
        case 'teil1':
            displayTeil1TestQuestion(question);
            break;
        case 'teil2':
            displayTeil2TestQuestion(question);
            break;
        case 'teil3':
            displayTeil3TestQuestion(question);
            break;
    }
}

function displayTeil1TestQuestion(question) {
    document.getElementById('lesen-test-teil1').style.display = 'block';
    document.getElementById('test-text-content').innerHTML = question.text.replace(/\n/g, '<br>');
    
    const statementsContainer = document.getElementById('test-statements');
    statementsContainer.innerHTML = '';
    
    question.statements.forEach((statement, index) => {
        const statementDiv = document.createElement('div');
        statementDiv.className = 'statement';
        statementDiv.innerHTML = `
            <span class="statement-number">${index + 1}</span>
            <div class="statement-content">
                <div class="statement-text">${statement.statement}</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="test-statement${index}" value="richtig">
                        +
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="test-statement${index}" value="falsch">
                        –
                    </label>
                </div>
            </div>
        `;
        statementsContainer.appendChild(statementDiv);
    });
}

function displayTeil2TestQuestion(question) {
    document.getElementById('lesen-test-teil2').style.display = 'block';
    document.getElementById('test-scenario-text').textContent = question.scenario;
    
    const optionA = document.getElementById('test-option-a').querySelector('.option-content');
    const optionB = document.getElementById('test-option-b').querySelector('.option-content');
    
    // Randomly assign answer and interferer
    const isAnswerA = Math.random() < 0.5;
    optionA.innerHTML = (isAnswerA ? question.answer : question.interferer).split('\n').join('<br>');
    optionB.innerHTML = (isAnswerA ? question.interferer : question.answer).split('\n').join('<br>');
    
    // Store the correct answer
    question.correctPosition = isAnswerA ? 'a' : 'b';
    
    // Reset radio buttons
    document.querySelectorAll('input[name="test-answer"]').forEach(radio => {
        radio.checked = false;
    });
}

function displayTeil3TestQuestion(question) {
    document.getElementById('lesen-test-teil3').style.display = 'block';
    document.getElementById('test-location-text').textContent = question.Location;
    document.getElementById('test-noticeboard-content').textContent = question.Noticeboard;
    document.getElementById('test-statement-text').textContent = question.Statement;
    
    // Reset radio buttons
    document.querySelectorAll('input[name="test-answer3"]').forEach(radio => {
        radio.checked = false;
    });
}

function collectCurrentAnswer() {
    const question = testQuestions[currentTestQuestion];
    let answer = null;
    
    switch (question.type) {
        case 'teil1':
            answer = [];
            question.statements.forEach((_, index) => {
                const selected = document.querySelector(`input[name="test-statement${index}"]:checked`);
                answer.push(selected ? selected.value : null);
            });
            break;
        case 'teil2':
            const selected = document.querySelector('input[name="test-answer"]:checked');
            answer = selected ? selected.value : null;
            break;
        case 'teil3':
            const selected3 = document.querySelector('input[name="test-answer3"]:checked');
            answer = selected3 ? selected3.value : null;
            break;
    }
    
    return answer;
}

function updateProgressBar() {
    const progress = ((currentTestQuestion + 1) / testQuestions.length) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
}

function handleTestSubmit() {
    const answer = collectCurrentAnswer();
    
    if (!answer || (Array.isArray(answer) && answer.includes(null))) {
        alert('Bitte beantworten Sie alle Fragen.');
        return;
    }
    
    userAnswers[currentTestQuestion] = answer;
    
    if (currentTestQuestion < testQuestions.length - 1) {
        currentTestQuestion++;
        displayTestQuestion();
        updateProgressBar();
    } else {
        showTestResults();
    }
}

function showTestResults() {
    // Hide all question sections
    document.getElementById('lesen-test-teil1').style.display = 'none';
    document.getElementById('lesen-test-teil2').style.display = 'none';
    document.getElementById('lesen-test-teil3').style.display = 'none';
    document.getElementById('test-submit-btn').style.display = 'none';
    
    // Show results section
    const resultsSection = document.getElementById('test-results');
    resultsSection.style.display = 'block';
    
    // Calculate scores
    let teil1Score = 0;
    let teil2Score = 0;
    let teil3Score = 0;
    
    const reviewList = document.getElementById('question-review-list');
    reviewList.innerHTML = '';
    
    testQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;
        let questionDetails = '';
        let userAnswerText = '';
        let correctAnswerText = '';
        
        switch (question.type) {
            case 'teil1':
                isCorrect = userAnswer.every((ans, i) => ans === question.statements[i].answer);
                if (isCorrect) teil1Score++;
                
                // Format question details for Teil 1
                questionDetails = `
                    <div class="text-box">
                        <div class="text-content">${question.text}</div>
                    </div>
                    <div class="statements-list">
                        ${question.statements.map((stmt, i) => `
                            <div class="statement ${userAnswer[i] === stmt.answer ? 'correct' : 'incorrect'}">
                                <span class="statement-number">${i + 1}</span>
                                <div class="statement-content">
                                    <div class="statement-text">${stmt.statement}</div>
                                    <div class="answer-details">
                                        Ihre Antwort: ${userAnswer[i] || 'Keine Antwort'}
                                        <br>
                                        Richtige Antwort: ${stmt.answer}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`;
                break;
                
            case 'teil2':
                isCorrect = userAnswer === question.correctPosition;
                if (isCorrect) teil2Score++;
                
                // Format question details for Teil 2
                questionDetails = `
                    <div class="scenario-text">${question.scenario}</div>
                    <div class="options-container">
                        <div class="option-box ${question.correctPosition === 'a' ? 'correct' : ''}">
                            <div class="option-label">a</div>
                            <div class="option-content">${question.correctPosition === 'a' ? question.answer : question.interferer}</div>
                        </div>
                        <div class="option-box ${question.correctPosition === 'b' ? 'correct' : ''}">
                            <div class="option-label">b</div>
                            <div class="option-content">${question.correctPosition === 'b' ? question.answer : question.interferer}</div>
                        </div>
                    </div>
                    <div class="answer-details">
                        Ihre Antwort: ${userAnswer || 'Keine Antwort'}
                        <br>
                        Richtige Antwort: ${question.correctPosition}
                    </div>`;
                break;
                
            case 'teil3':
                isCorrect = userAnswer === question.Answer;
                if (isCorrect) teil3Score++;
                
                // Format question details for Teil 3
                questionDetails = `
                    <h2 class="location-title">${question.Location}</h2>
                    <div class="noticeboard">
                        <div class="noticeboard-content">${question.Noticeboard}</div>
                    </div>
                    <div class="statement-section">
                        <p>${question.Statement}</p>
                        <div class="answer-details">
                            Ihre Antwort: ${userAnswer || 'Keine Antwort'}
                            <br>
                            Richtige Antwort: ${question.Answer}
                        </div>
                    </div>`;
                break;
        }
        
        // Create review item with collapsible details
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        reviewItem.innerHTML = `
            <div class="review-header">
                <div class="question-number">Frage ${index + 1} (${question.type})</div>
                <div class="result-icon">${isCorrect ? '✓' : '✗'}</div>
            </div>
            <div class="question-details" style="display: none;">
                ${questionDetails}
            </div>
        `;
        
        // Add click handler to toggle details
        reviewItem.querySelector('.review-header').addEventListener('click', function() {
            const details = this.nextElementSibling;
            const isExpanded = details.style.display !== 'none';
            details.style.display = isExpanded ? 'none' : 'block';
            this.classList.toggle('expanded', !isExpanded);
        });
        
        reviewList.appendChild(reviewItem);
    });
    
    // Update scores
    document.getElementById('teil1-score').textContent = teil1Score;
    document.getElementById('teil2-score').textContent = teil2Score;
    document.getElementById('teil3-score').textContent = teil3Score;
    document.getElementById('total-score').textContent = teil1Score + teil2Score + teil3Score;
}

function restartLesenTest() {
    // Reset all variables and start new test
    currentTestQuestion = 0;
    userAnswers = [];
    testStarted = false;
    initializeLesenTest();
    
    // Hide results and show first question
    document.getElementById('test-results').style.display = 'none';
    document.getElementById('test-submit-btn').style.display = 'block';
}

// Absatzweise Module UI
class AbsatzweiseModule {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.audioProcessor = new AudioProcessor();
        this.currentParagraph = null;
        this.allParagraphs = [];
        this.currentIndex = 0;
        this.progressOverlay = null;
        this.createProgressOverlay();
    }

    createProgressOverlay() {
        this.progressOverlay = document.createElement('div');
        this.progressOverlay.id = 'progress-overlay';
        this.progressOverlay.style.cssText = `
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
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }
        `;
        document.head.appendChild(style);

        progressBar.appendChild(progressIndicator);
        progressContainer.appendChild(progressText);
        progressContainer.appendChild(progressBar);
        this.progressOverlay.appendChild(progressContainer);
        document.body.appendChild(this.progressOverlay);
    }

    showProgress() {
        if (this.progressOverlay) {
            this.progressOverlay.style.display = 'flex';
        }
    }

    hideProgress() {
        if (this.progressOverlay) {
            this.progressOverlay.style.display = 'none';
        }
    }

    createAudioPlayer(audioBlob) {
        const audioContainer = document.createElement('div');
        audioContainer.style.cssText = `
            width: 100%;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        `;

        const audioPlayer = document.createElement('audio');
        audioPlayer.controls = true;
        audioPlayer.style.cssText = `
            width: 100%;
            margin: 0;
        `;
        audioPlayer.src = URL.createObjectURL(audioBlob);
        audioContainer.appendChild(audioPlayer);

        return audioContainer;
    }

    cleanupAudioPlayer(audioPlayer) {
        if (audioPlayer?.src) {
            URL.revokeObjectURL(audioPlayer.src);
        }
    }

    async loadParagraphs() {
        try {
            const response = await fetch('./datasets/speaking_practice.json');
            if (!response.ok) {
                throw new Error('Failed to load paragraphs');
            }
            const data = await response.json();
            this.allParagraphs = this.shuffleArray(data.paragraphs);
            this.currentIndex = 0;
            return this.allParagraphs;
        } catch (error) {
            console.error('Error loading paragraphs:', error);
            this.allParagraphs = this.shuffleArray([
                {
                    german: "Hallo, ich heiße Anna. Ich lerne Deutsch, weil ich in Deutschland leben möchte.",
                    english: "Hello, my name is Anna. I am learning German because I want to live in Germany."
                },
                {
                    german: "Ich wohne in Berlin. Meine Wohnung ist klein, aber gemütlich.",
                    english: "I live in Berlin. My apartment is small but cozy."
                }
            ]);
            this.currentIndex = 0;
            return this.allParagraphs;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    displayParagraph() {
        if (!this.allParagraphs.length) {
            this.loadParagraphs().then(paragraphs => {
                this.currentParagraph = paragraphs[this.currentIndex];
                this.updateParagraphDisplay();
            });
        } else {
            this.currentParagraph = this.allParagraphs[this.currentIndex];
            this.updateParagraphDisplay();
        }
        
        this.setupInitialUI();
    }

    updateParagraphDisplay() {
        const paragraphText = document.getElementById('paragraph-text');
        const paragraphTextGerman = document.getElementById('paragraph-text-german') || this.createGermanTextElement();
        
        // Create or get the metadata container
        let metadataContainer = document.getElementById('paragraph-metadata');
        if (!metadataContainer) {
            metadataContainer = document.createElement('div');
            metadataContainer.id = 'paragraph-metadata';
            metadataContainer.style.cssText = `
                margin-bottom: 15px;
                padding: 8px 10px;
                background-color: #e9ecef;
                border-radius: 4px;
                font-size: 0.9em;
                color: #495057;
                display: flex;
                gap: 15px;
            `;
            paragraphText.parentElement.insertBefore(metadataContainer, paragraphText);
        }
        
        // Update metadata content
        metadataContainer.innerHTML = `
            <span><strong>Thema:</strong> ${this.currentParagraph.thema || 'Allgemein'}</span>
            <span><strong>Stichwort:</strong> ${this.currentParagraph.keyword || '-'}</span>
        `;
        
        paragraphText.style.cssText = `
            cursor: pointer;
            padding: 10px;
            background-color: #fff;
            border-radius: 4px;
            transition: background-color 0.2s;
        `;
        paragraphText.title = 'Click to show/hide German translation';
        
        paragraphText.onmouseover = () => {
            paragraphText.style.backgroundColor = '#f8f9fa';
        };
        paragraphText.onmouseout = () => {
            paragraphText.style.backgroundColor = '#fff';
        };
        
        paragraphText.onclick = () => {
            paragraphTextGerman.style.display = paragraphTextGerman.style.display === 'none' ? 'block' : 'none';
        };
        
        paragraphText.textContent = this.currentParagraph.english;
        paragraphTextGerman.textContent = this.currentParagraph.german;
    }

    createGermanTextElement() {
        const container = document.getElementById('paragraph-text').parentElement;
        
        const germanText = document.createElement('div');
        germanText.id = 'paragraph-text-german';
        germanText.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-style: italic;
            color: #6c757d;
            display: none;
            border-left: 3px solid #007bff;
        `;
        
        container.appendChild(germanText);
        return germanText;
    }

    setupInitialUI() {
        this.cleanupPreviousRecording();
        
        const controlsContainer = document.querySelector('.recording-controls');
        if (!controlsContainer) {
            console.error('Recording controls container not found');
            return;
        }

        controlsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
            margin: 20px 0;
        `;
        
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
        recordBtn.innerHTML = 'Aufnehmen';
        recordBtn.onclick = () => this.startRecording();
        controlsContainer.appendChild(recordBtn);

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
            this.currentIndex = (this.currentIndex + 1) % this.allParagraphs.length;
            this.currentParagraph = this.allParagraphs[this.currentIndex];
            this.displayParagraph();
        };
        controlsContainer.appendChild(skipButton);
    }

    async startRecording() {
        try {
            await this.audioRecorder.startRecording();
            
            const recordBtn = document.getElementById('record-btn');
            recordBtn.innerHTML = '<span class="record-icon">●</span> Aufnahme stoppen';
            recordBtn.onclick = () => this.stopRecording();
            recordBtn.classList.add('recording');
            
            document.getElementById('next-btn-absatzweise').style.display = 'none';
        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Mikrofonberechtigung.');
        }
    }

    async stopRecording() {
        const audioBlob = await this.audioRecorder.stopRecording();
        if (!audioBlob) return;

        const recordBtn = document.getElementById('record-btn');
        recordBtn.disabled = true;
        recordBtn.textContent = 'Verarbeite Aufnahme...';

        try {
            this.showProgress();
            const transcription = await this.audioProcessor.processAudio(audioBlob);
            this.hideProgress();

            this.showResults(audioBlob, transcription);
        } catch (error) {
            console.error('Error processing recording:', error);
            alert('Fehler bei der Verarbeitung der Aufnahme. Bitte versuchen Sie es erneut.');
            this.displayParagraph();
        }
    }

    showResults(audioBlob, transcription) {
        const controlsContainer = document.querySelector('.recording-controls');
        controlsContainer.innerHTML = '';
        
        controlsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
            margin: 20px 0;
        `;

        const audioContainer = this.createAudioPlayer(audioBlob);
        controlsContainer.appendChild(audioContainer);
        
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
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: break-word;
                hyphens: auto;
            `;
            userTranscription.textContent = transcription;
            comparisonResult.innerHTML = this.compareTexts(this.currentParagraph.german, transcription);
        }
        
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
        newRecordBtn.onclick = () => this.displayParagraph();
        controlsContainer.appendChild(newRecordBtn);
        
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
            this.currentIndex = (this.currentIndex + 1) % this.allParagraphs.length;
            this.currentParagraph = this.allParagraphs[this.currentIndex];
            this.displayParagraph();
        };
        controlsContainer.appendChild(nextButton);
    }

    cleanupPreviousRecording() {
        this.audioRecorder.cleanup();
        
        const audioPlayer = document.getElementById('audio-player');
        this.cleanupAudioPlayer(audioPlayer);
        
        const controlsContainer = document.querySelector('.recording-controls');
        if (controlsContainer) {
            controlsContainer.innerHTML = '';
        }

        const transcriptionResult = document.getElementById('transcription-result');
        if (transcriptionResult) {
            transcriptionResult.style.display = 'none';
        }
    }

    levenshteinDistance(str1, str2) {
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
                        dp[i - 1][j - 1] + 1,
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1
                    );
                }
            }
        }
        return dp[m][n];
    }

    compareTexts(original, transcribed) {
        const normalizeText = (text) => {
            return text.toLowerCase()
                .replace(/[.,!?]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const normalizedOriginal = normalizeText(original);
        const normalizedTranscribed = normalizeText(transcribed);

        const distance = this.levenshteinDistance(normalizedOriginal, normalizedTranscribed);
        const maxLength = Math.max(normalizedOriginal.length, normalizedTranscribed.length);
        const similarity = ((maxLength - distance) / maxLength * 100).toFixed(1);

        const originalWords = original.split(' ');
        const transcribedWords = transcribed.split(' ');
        
        let visualComparison = '<div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; hyphens: auto;">';
        visualComparison += '<div style="margin-bottom: 10px;"><strong>Original:</strong><br>';
        
        originalWords.forEach((word, index) => {
            const normalizedWord = normalizeText(word);
            const transcribedWord = transcribedWords[index] ? normalizeText(transcribedWords[index]) : '';
            
            if (!transcribedWord || this.levenshteinDistance(normalizedWord, transcribedWord) > 1) {
                visualComparison += `<span style="display: inline-block; background-color: #ffebee; padding: 2px 4px; margin: 2px; border-radius: 3px;">${word}</span>`;
            } else {
                visualComparison += `<span style="display: inline-block; padding: 2px 4px; margin: 2px;">${word}</span>`;
            }
        });
        
        visualComparison += '</div><div><strong>Ihre Aussprache:</strong><br>';
        
        transcribedWords.forEach((word, index) => {
            const normalizedWord = normalizeText(word);
            const originalWord = originalWords[index] ? normalizeText(originalWords[index]) : '';
            
            if (!originalWord || this.levenshteinDistance(normalizedWord, originalWord) > 1) {
                visualComparison += `<span style="display: inline-block; background-color: #fff3e0; padding: 2px 4px; margin: 2px; border-radius: 3px;">${word}</span>`;
            } else {
                visualComparison += `<span style="display: inline-block; padding: 2px 4px; margin: 2px;">${word}</span>`;
            }
        });
        
        visualComparison += '</div></div>';

        let result = '<div style="overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; hyphens: auto;">';
        result += 'Vergleich:<br>';
        result += `Genauigkeit: ${similarity}%<br>`;
        result += visualComparison;

        if (similarity >= 90) {
            result += '<span style="color: #27ae60">Ausgezeichnet! Ihre Aussprache ist sehr präzise.</span>';
        } else if (similarity >= 75) {
            result += '<span style="color: #f39c12">Gut gemacht! Kleine Verbesserungen sind noch möglich.</span>';
        } else if (similarity >= 60) {
            result += '<span style="color: #e67e22">Verständlich, aber es gibt noch Raum für Verbesserungen.</span>';
        } else {
            result += '<span style="color: #c0392b">Versuchen Sie es noch einmal. Achten Sie auf die genaue Aussprache.</span>';
        }

        if (similarity < 75) {
            result += '<br><br><span style="color: #7f8c8d">Tipp: Achten Sie besonders auf die rot markierten Wörter.</span>';
        }

        result += '</div>';
        return result;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAllQuestions();
    createProgressOverlay();
    
    // Create global instance of AbsatzweiseModule
    window.absatzweiseModule = new AbsatzweiseModule();
    
    // Task selection buttons
    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.addEventListener('click', () => showTask(btn.dataset.task));
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', showTaskSelection);
    });

    // Teil 1 buttons
    document.getElementById('submit-btn').addEventListener('click', checkAnswers1);
    document.getElementById('next-btn').addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion1();
    });
    document.getElementById('skip-btn1').addEventListener('click', skipQuestion1);

    // Teil 2 buttons
    document.getElementById('submit-btn2').addEventListener('click', checkAnswers2);
    document.getElementById('next-btn2').addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion2();
    });
    document.getElementById('skip-btn2').addEventListener('click', skipQuestion2);

    // Teil 3 buttons
    document.getElementById('submit-btn3').addEventListener('click', checkAnswers3);
    document.getElementById('next-btn3').addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion3();
    });
    document.getElementById('skip-btn3').addEventListener('click', skipQuestion3);

    // Schreiben Teil 1 buttons
    document.getElementById('submit-btn-schreiben1').addEventListener('click', checkAnswersSchreiben1);
    document.getElementById('next-btn-schreiben1').addEventListener('click', () => {
        currentQuestionIndex++;
        displayWritingTask1();
    });
    document.getElementById('skip-btn-schreiben1').addEventListener('click', skipWritingTask1);

    // Word Practice event listeners
    document.getElementById('submit-btn-wortubung')?.addEventListener('click', checkWordAnswer);
    document.getElementById('next-btn-wortubung')?.addEventListener('click', () => {
        currentQuestionIndex++;
        displayWordPractice();
    });
    document.getElementById('skip-btn-wortubung')?.addEventListener('click', skipWordPractice);
    
    // Add enter key support for word practice
    document.getElementById('word-answer')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !this.disabled) {
            checkWordAnswer();
        }
    });

    // Lesen Test event listeners
    document.getElementById('test-submit-btn')?.addEventListener('click', handleTestSubmit);
}); 