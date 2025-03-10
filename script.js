let currentQuestionIndex = 0;
let questions = [];
let questions2 = [];
let questions3 = [];
let currentTask = null;
let writingTasks = [];

// Load questions for all tasks
async function loadAllQuestions() {
    try {
        const [response1, response2, response3, response4] = await Promise.all([
            fetch('./datasets/reading_task_1.json'),
            fetch('./datasets/reading_task_2.json'),
            fetch('./datasets/reading_task_3.json'),
            fetch('./datasets/writing_task_1.json')
        ]);
        
        if (!response1.ok || !response2.ok || !response3.ok || !response4.ok) {
            throw new Error('Failed to load questions');
        }

        questions = shuffleArray(await response1.json());
        questions2 = shuffleArray(await response2.json());
        questions3 = shuffleArray(await response3.json());
        writingTasks = shuffleArray(await response4.json()); // Shuffle initially

        console.log('Loaded questions:', { questions, questions2, questions3, writingTasks });
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
    currentTask = null;
    currentQuestionIndex = 0;
    
    // Reshuffle writing tasks when returning to selection
    if (writingTasks.length > 0) {
        writingTasks = shuffleArray([...writingTasks]);
    }
}

function showTask(taskId) {
    document.getElementById('task-selection').style.display = 'none';
    document.getElementById('lesen1-container').style.display = taskId === 'lesen1' ? 'block' : 'none';
    document.getElementById('lesen2-container').style.display = taskId === 'lesen2' ? 'block' : 'none';
    document.getElementById('lesen3-container').style.display = taskId === 'lesen3' ? 'block' : 'none';
    document.getElementById('schreiben1-container').style.display = taskId === 'schreiben1' ? 'block' : 'none';
    currentTask = taskId;
    currentQuestionIndex = 0;
    
    if (taskId === 'lesen1') {
        displayQuestion1();
    } else if (taskId === 'lesen2') {
        displayQuestion2();
    } else if (taskId === 'lesen3') {
        displayQuestion3();
    } else if (taskId === 'schreiben1') {
        // Reshuffle writing tasks when starting the task
        writingTasks = shuffleArray([...writingTasks]);
        displayWritingTask1();
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAllQuestions();
    
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

    // Teil 2 buttons
    document.getElementById('submit-btn2').addEventListener('click', checkAnswers2);
    document.getElementById('next-btn2').addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion2();
    });

    // Teil 3 buttons
    document.getElementById('submit-btn3').addEventListener('click', checkAnswers3);
    document.getElementById('next-btn3').addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion3();
    });

    // Schreiben Teil 1 buttons
    document.getElementById('submit-btn-schreiben1').addEventListener('click', checkAnswersSchreiben1);
    document.getElementById('next-btn-schreiben1').addEventListener('click', () => {
        currentQuestionIndex++;
        displayWritingTask1();
    });
}); 