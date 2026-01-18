// Панель ученика
class StudentPanel {
    constructor() {
        this.currentUser = null;
        this.currentTest = null;
        this.testTimer = null;
        this.testStartTime = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.isFullscreen = false;
        this.violationCount = 0;
        
        this.initializePanel();
        this.setupEventListeners();
    }

    initializePanel() {
        // Проверка авторизации
        const session = storageManager.getCurrentUser();
        if (!session || session.role !== 'student') {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = session.user;
        this.loadUserData();
        this.setupQuestionUpdateListener();
    }

    setupEventListeners() {
        // Обработчики для полноэкранного режима
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        
        // Блокировка правого клика во время теста
        document.addEventListener('contextmenu', (e) => {
            if (this.currentTest) {
                e.preventDefault();
            }
        });

        // Блокировка горячих клавиш во время теста
        document.addEventListener('keydown', (e) => {
            if (this.currentTest) {
                if (e.key === 'F12' || 
                    (e.ctrlKey && (e.key === 'u' || e.key === 'U' || 
                                   e.key === 'i' || e.key === 'I' ||
                                   e.key === 's' || e.key === 'S'))) {
                    e.preventDefault();
                }
            }
        });
    }

    setupQuestionUpdateListener() {
        // Слушатель обновлений вопросов от админа
        window.addEventListener('questionsUpdated', () => {
            if (this.currentTest) {
                this.updateCurrentQuestion();
            }
        });
    }

    loadUserData() {
        // Загрузка данных пользователя
        document.getElementById('studentName').textContent = this.currentUser.firstName;
        document.getElementById('studentClass').textContent = this.currentUser.class + ' класс';
        
        // Профиль
        document.getElementById('profileName').textContent = this.currentUser.firstName;
        document.getElementById('profileLastName').textContent = this.currentUser.lastName;
        document.getElementById('profileClass').textContent = this.currentUser.class + ' класс';
        document.getElementById('profileEmail').textContent = this.currentUser.email;

        // Загрузка достижений
        this.loadAchievements();
    }

    loadAchievements() {
        const results = storageManager.getStudentResults(this.currentUser.id);
        const achievementsList = document.getElementById('achievementsList');
        
        if (results.length === 0) {
            achievementsList.innerHTML = '<p>No achievements yet. Take your first test!</p>';
            return;
        }

        const bestResult = results.reduce((best, current) => 
            current.totalScore > best.totalScore ? current : best
        );

        const achievements = [];
        
        if (bestResult.totalScore >= 40) {
            achievements.push('🏆 Excellent Student - more than 80% correct answers');
        }
        
        if (bestResult.totalScore >= 35) {
            achievements.push('🥇 Good Student - more than 70% correct answers');
        }
        
        if (results.length >= 5) {
            achievements.push('📚 Active Learner - completed 5+ tests');
        }
        
        if (results.length >= 1) {
            achievements.push('🎯 First Test - completed first assessment');
        }

        achievementsList.innerHTML = achievements.length > 0 
            ? achievements.map(a => `<div class="achievement-item">${a}</div>`).join('')
            : '<p>Keep learning to earn achievements!</p>';
    }

    // Навигация между секциями
    showSection(sectionId) {
        // Скрытие всех секций
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Показ выбранной секции
        document.getElementById(sectionId).classList.add('active');

        // Обновление активной ссылки в навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        event.target.classList.add('active');
    }

    // ИИ-репетитор
    askAI() {
        const topicInput = document.getElementById('topicInput');
        const topic = topicInput.value.trim();
        
        if (!topic) return;

        this.addUserMessage(topic);
        topicInput.value = '';

        // Имитация ответа ИИ
        setTimeout(() => {
            const aiResponse = this.generateAIResponse(topic);
            this.addAIMessage(aiResponse);
        }, 1000);
    }

    addUserMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addAIMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';
        messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    generateAIResponse(topic) {
        const responses = {
            'algebra': 'Algebra studies mathematical structures and operations. Key concepts include variables, equations, and functions. Would you like to explore a specific example?',
            'geometry': 'Geometry studies shapes, sizes, and properties of figures in space. It includes plane geometry (2D figures) and solid geometry (3D figures). Which topic interests you?',
            'physics': 'Physics studies natural phenomena and laws. Main branches: mechanics, thermodynamics, electricity, optics. Which area would you like to learn more about?',
            'english': 'English is an international language of communication. Important to study grammar, vocabulary, and practice speaking. What aspect of English interests you?'
        };

        const lowerTopic = topic.toLowerCase();
        
        for (const [key, response] of Object.entries(responses)) {
            if (lowerTopic.includes(key)) {
                return response;
            }
        }

        return `Interesting topic "${topic}"! This is an important subject to study. I recommend starting with basic concepts and gradually moving to more complex topics. Do you have specific questions about this topic?`;
    }

    handleEnter(event) {
        if (event.key === 'Enter') {
            this.askAI();
        }
    }

    // CHSB Тестирование
    startTest() {
        const accessCode = document.getElementById('accessCode').value.trim();
        const errorElement = document.getElementById('codeError');

        if (!accessCode) {
            this.showError(errorElement, 'Введите код доступа');
            return;
        }

        if (!storageManager.validateAccessCode(accessCode)) {
            this.showError(errorElement, 'Неверный или истекший код доступа');
            return;
        }

        // Инициализация теста
        this.initializeTest();
    }

    initializeTest() {
        const questions = storageManager.getQuestions();
        
        this.currentTest = {
            questions: questions,
            startTime: new Date(),
            timeLimit: 90 * 60 * 1000, // 90 minutes
            currentQuestion: 0
        };

        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.violationCount = 0;

        // Initialize question navigation
        this.initializeQuestionNavigation();

        // Enter fullscreen mode
        this.enterFullscreen();

        // Hide test menu and show interface
        document.getElementById('chsbMenu').style.display = 'none';
        document.getElementById('testInterface').style.display = 'block';

        // Start timer
        this.startTimer();

        // Load first question
        this.loadQuestion(0);
    }

    initializeQuestionNavigation() {
        const questions = this.currentTest.questions;
        
        // Clear existing grids
        document.getElementById('algebraGrid').innerHTML = '';
        document.getElementById('geometryGrid').innerHTML = '';
        document.getElementById('physicsGrid').innerHTML = '';
        document.getElementById('englishGrid').innerHTML = '';

        questions.forEach((question, index) => {
            const btn = document.createElement('button');
            btn.className = 'question-nav-btn';
            btn.textContent = question.number;
            btn.onclick = () => this.jumpToQuestion(index);
            btn.id = `nav-btn-${index}`;

            // Add to appropriate subject grid
            if (question.subject === 'algebra') {
                document.getElementById('algebraGrid').appendChild(btn);
            } else if (question.subject === 'geometry') {
                document.getElementById('geometryGrid').appendChild(btn);
            } else if (question.subject === 'physics') {
                document.getElementById('physicsGrid').appendChild(btn);
            } else if (question.subject === 'english') {
                document.getElementById('englishGrid').appendChild(btn);
            }
        });

        // Highlight current question
        this.updateNavigationHighlight();
    }

    jumpToQuestion(index) {
        if (index >= 0 && index < this.currentTest.questions.length) {
            this.currentQuestionIndex = index;
            this.loadQuestion(index);
            this.updateNavigationHighlight();
        }
    }

    updateNavigationHighlight() {
        // Remove all highlights
        document.querySelectorAll('.question-nav-btn').forEach(btn => {
            btn.classList.remove('current', 'answered');
        });

        // Highlight current question
        const currentBtn = document.getElementById(`nav-btn-${this.currentQuestionIndex}`);
        if (currentBtn) {
            currentBtn.classList.add('current');
        }

        // Mark answered questions
        Object.keys(this.userAnswers).forEach(questionIndex => {
            const btn = document.getElementById(`nav-btn-${questionIndex}`);
            if (btn && !btn.classList.contains('current')) {
                btn.classList.add('answered');
            }
        });
    }

    enterFullscreen() {
        const testInterface = document.getElementById('testInterface');
        
        if (testInterface.requestFullscreen) {
            testInterface.requestFullscreen();
        } else if (testInterface.webkitRequestFullscreen) {
            testInterface.webkitRequestFullscreen();
        } else if (testInterface.msRequestFullscreen) {
            testInterface.msRequestFullscreen();
        }

        this.isFullscreen = true;
        testInterface.classList.add('fullscreen-test');
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        this.isFullscreen = false;
        document.getElementById('testInterface').classList.remove('fullscreen-test');
    }

    handleFullscreenChange() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);

        if (this.currentTest && !isCurrentlyFullscreen && this.isFullscreen) {
            this.handleViolation();
        }
    }

    handleVisibilityChange() {
        if (this.currentTest && document.hidden) {
            this.handleViolation();
        }
    }

    handleWindowBlur() {
        if (this.currentTest) {
            this.handleViolation();
        }
    }

    handleWindowFocus() {
        // Возврат фокуса - можно добавить логику восстановления
    }

    handleViolation() {
        this.violationCount++;
        this.pauseTest();
        this.showViolationModal();
    }

    pauseTest() {
        if (this.testTimer) {
            clearInterval(this.testTimer);
            this.testTimer = null;
        }
    }

    resumeTest() {
        if (this.currentTest) {
            this.startTimer();
        }
    }

    showViolationModal() {
        document.getElementById('violationModal').style.display = 'flex';
    }

    hideViolationModal() {
        document.getElementById('violationModal').style.display = 'none';
    }

    returnToFullscreen() {
        this.hideViolationModal();
        this.enterFullscreen();
        this.resumeTest();
    }

    checkAdminCode() {
        const adminCode = document.getElementById('adminCode').value;
        const admin = storageManager.getAdminCredentials();
        
        if (adminCode === admin.password) {
            this.hideViolationModal();
            this.resumeTest();
            document.getElementById('adminCode').value = '';
        } else {
            document.getElementById('violationError').textContent = 'Неверный код администратора';
            
            if (this.violationCount >= 3) {
                this.terminateTest();
            }
        }
    }

    terminateTest() {
        this.currentTest = null;
        this.exitFullscreen();
        this.hideViolationModal();
        
        alert('Тест завершен из-за нарушений. Результат аннулирован.');
        this.resetTest();
    }

    startTimer() {
        if (!this.currentTest) return;

        const startTime = this.currentTest.startTime;
        const timeLimit = this.currentTest.timeLimit;

        this.testTimer = setInterval(() => {
            const elapsed = new Date() - startTime;
            const remaining = timeLimit - elapsed;

            if (remaining <= 0) {
                this.finishTest();
                return;
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    loadQuestion(index) {
        const questions = this.currentTest.questions;
        const question = questions[index];

        if (!question) return;

        // Update progress
        document.getElementById('currentQuestion').textContent = index + 1;
        document.getElementById('questionNumber').textContent = index + 1;
        document.getElementById('progressFill').style.width = `${((index + 1) / questions.length) * 100}%`;

        // Load question data
        document.getElementById('questionSubject').textContent = question.subjectName;
        document.getElementById('questionText').textContent = question.text;

        // Formula (if exists)
        if (question.formula) {
            document.getElementById('questionText').innerHTML += `<br><br><strong>${question.formula}</strong>`;
        }

        // Image (if exists)
        const questionImage = document.getElementById('questionImage');
        if (question.image) {
            document.getElementById('questionImg').src = question.image;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // Answer options
        document.getElementById('optionA').textContent = question.options.A;
        document.getElementById('optionB').textContent = question.options.B;
        document.getElementById('optionC').textContent = question.options.C;
        document.getElementById('optionD').textContent = question.options.D;

        // Restore selected answer
        const savedAnswer = this.userAnswers[index];
        if (savedAnswer) {
            document.getElementById(`answer${savedAnswer}`).checked = true;
            document.querySelector(`.answer-option:has(#answer${savedAnswer})`).classList.add('selected');
        } else {
            // Reset selection
            document.querySelectorAll('input[name="answer"]').forEach(input => input.checked = false);
            document.querySelectorAll('.answer-option').forEach(option => option.classList.remove('selected'));
        }

        // Update navigation buttons
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('nextBtn').style.display = index === questions.length - 1 ? 'none' : 'inline-block';
        document.getElementById('finishBtn').style.display = index === questions.length - 1 ? 'inline-block' : 'none';

        // Update navigation highlight
        this.updateNavigationHighlight();
    }

    updateCurrentQuestion() {
        // Обновление текущего вопроса при изменении админом
        if (this.currentTest) {
            const updatedQuestions = storageManager.getQuestions();
            this.currentTest.questions = updatedQuestions;
            this.loadQuestion(this.currentQuestionIndex);
        }
    }

    selectAnswer(option) {
        // Save answer
        this.userAnswers[this.currentQuestionIndex] = option;

        // Visual update
        document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`.answer-option:has(#answer${option})`).classList.add('selected');
        document.getElementById(`answer${option}`).checked = true;

        // Update navigation highlight
        this.updateNavigationHighlight();
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion(this.currentQuestionIndex);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion(this.currentQuestionIndex);
        }
    }

    finishTest() {
        if (this.testTimer) {
            clearInterval(this.testTimer);
        }

        this.exitFullscreen();
        this.calculateResults();
    }

    calculateResults() {
        const questions = this.currentTest.questions;
        let totalScore = 0;
        const subjectScores = {
            algebra: { correct: 0, total: 0 },
            geometry: { correct: 0, total: 0 },
            physics: { correct: 0, total: 0 },
            english: { correct: 0, total: 0 }
        };

        // Подсчет результатов
        questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                totalScore++;
            }

            // Подсчет по предметам
            if (subjectScores[question.subject]) {
                subjectScores[question.subject].total++;
                if (isCorrect) {
                    subjectScores[question.subject].correct++;
                }
            }
        });

        // Сохранение результата
        const testResult = {
            studentId: this.currentUser.id,
            studentName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
            studentClass: this.currentUser.class,
            totalScore: totalScore,
            totalQuestions: questions.length,
            percentage: Math.round((totalScore / questions.length) * 100),
            subjectScores: {
                algebra: subjectScores.algebra.correct,
                geometry: subjectScores.geometry.correct,
                physics: subjectScores.physics.correct,
                english: subjectScores.english.correct
            },
            subjectTotals: {
                algebra: subjectScores.algebra.total,
                geometry: subjectScores.geometry.total,
                physics: subjectScores.physics.total,
                english: subjectScores.english.total
            },
            testDuration: new Date() - this.currentTest.startTime,
            answers: this.userAnswers
        };

        storageManager.saveTestResult(testResult);

        // Показ результатов
        this.showResults(testResult);
    }

    showResults(result) {
        // Скрытие интерфейса теста
        document.getElementById('testInterface').style.display = 'none';
        document.getElementById('testResults').style.display = 'block';

        // Общий балл
        document.getElementById('totalScore').textContent = result.totalScore;
        document.getElementById('scorePercentage').textContent = result.percentage + '%';

        // Результаты по предметам
        this.updateSubjectResult('algebra', result.subjectScores.algebra, result.subjectTotals.algebra);
        this.updateSubjectResult('geometry', result.subjectScores.geometry, result.subjectTotals.geometry);
        this.updateSubjectResult('physics', result.subjectScores.physics, result.subjectTotals.physics);
        this.updateSubjectResult('english', result.subjectScores.english, result.subjectTotals.english);

        // ИИ рекомендации
        this.generateRecommendations(result);
    }

    updateSubjectResult(subject, correct, total) {
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        document.getElementById(`${subject}Score`).textContent = `${correct}/${total}`;
        document.getElementById(`${subject}Progress`).style.width = `${percentage}%`;
    }

    generateRecommendations(result) {
        const recommendations = [];
        
        if (result.percentage >= 80) {
            recommendations.push('🎉 Excellent result! You showed a high level of knowledge.');
        } else if (result.percentage >= 60) {
            recommendations.push('👍 Good result! There are areas for improvement.');
        } else {
            recommendations.push('📚 We recommend spending more time studying the material.');
        }

        // Subject recommendations
        Object.entries(result.subjectScores).forEach(([subject, score]) => {
            const total = result.subjectTotals[subject];
            const percentage = total > 0 ? (score / total) * 100 : 0;
            
            if (percentage < 50) {
                const subjectNames = {
                    algebra: 'algebra',
                    geometry: 'geometry',
                    physics: 'physics',
                    english: 'English'
                };
                recommendations.push(`📖 Pay more attention to ${subjectNames[subject]}.`);
            }
        });

        document.getElementById('aiRecommendations').innerHTML = 
            recommendations.map(r => `<p>${r}</p>`).join('');
    }

    resetTest() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        
        document.getElementById('chsbMenu').style.display = 'block';
        document.getElementById('testInterface').style.display = 'none';
        document.getElementById('testResults').style.display = 'none';
        document.getElementById('accessCode').value = '';
    }

    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
}

// Глобальные функции для HTML
function showSection(sectionId) {
    if (window.studentPanel) {
        window.studentPanel.showSection(sectionId);
    }
}

function askAI() {
    if (window.studentPanel) {
        window.studentPanel.askAI();
    }
}

function handleEnter(event) {
    if (window.studentPanel) {
        window.studentPanel.handleEnter(event);
    }
}

function startTest() {
    if (window.studentPanel) {
        window.studentPanel.startTest();
    }
}

function selectAnswer(option) {
    if (window.studentPanel) {
        window.studentPanel.selectAnswer(option);
    }
}

function previousQuestion() {
    if (window.studentPanel) {
        window.studentPanel.previousQuestion();
    }
}

function nextQuestion() {
    if (window.studentPanel) {
        window.studentPanel.nextQuestion();
    }
}

function finishTest() {
    if (window.studentPanel) {
        window.studentPanel.finishTest();
    }
}

function resetTest() {
    if (window.studentPanel) {
        window.studentPanel.resetTest();
    }
}

function returnToFullscreen() {
    if (window.studentPanel) {
        window.studentPanel.returnToFullscreen();
    }
}

function checkAdminCode() {
    if (window.studentPanel) {
        window.studentPanel.checkAdminCode();
    }
}

function logout() {
    storageManager.clearSession();
    window.location.href = 'index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.studentPanel = new StudentPanel();
});