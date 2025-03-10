let currentQuestionIndex = 0;
let questions = [];

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load questions from the JSON file
async function loadQuestions() {
    try {
        const response = await fetch('datasets/reading_task_1.json');
        const loadedQuestions = await response.json();
        questions = shuffleArray(loadedQuestions);
        displayQuestion();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function updateInstructionText(statementCount) {
    const instructionText = document.querySelector('.instruction p:first-child');
    instructionText.textContent = `Sind die Aussagen 1–${statementCount} richtig (+) oder falsch (–)?`;
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0; // Reset to first question
        questions = shuffleArray(questions); // Reshuffle when starting over
    }

    const question = questions[currentQuestionIndex];
    
    // Update instruction text with current number of statements
    updateInstructionText(question.statements.length);
    
    // Display the text with preserved line breaks
    const textContent = document.getElementById('text-content');
    textContent.innerHTML = question.text.replace(/\n/g, '<br>');
    
    // Display the statements
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
                        richtig
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="statement${index}" value="falsch">
                        falsch
                    </label>
                </div>
            </div>
        `;
        statementsContainer.appendChild(statementDiv);
    });

    // Reset buttons
    document.getElementById('submit-btn').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
}

function checkAnswers() {
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

        // Disable radio buttons after checking
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

// Event Listeners
document.getElementById('submit-btn').addEventListener('click', checkAnswers);
document.getElementById('next-btn').addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});

// Load questions when the page loads
document.addEventListener('DOMContentLoaded', loadQuestions); 