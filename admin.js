// Панель администратора
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.selectedQuestion = null;
        this.confirmCallback = null;
        
        this.initializePanel();
        this.loadDashboardData();
    }

    initializePanel() {
        // Проверка авторизации
        const session = storageManager.getCurrentUser();
        if (!session || session.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = session.user;
        this.loadQuestionsList();
        this.loadResultsTable();
        this.loadMediaGallery();
    }

    loadDashboardData() {
        const stats = storageManager.getStatistics();
        
        // Обновление статистики
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalQuestions').textContent = stats.totalQuestions;
        document.getElementById('totalTests').textContent = stats.totalTests;
        document.getElementById('avgScore').textContent = stats.avgScore + '%';

        // Статистика по предметам
        document.getElementById('avgAlgebra').textContent = stats.subjectStats.algebra + '%';
        document.getElementById('avgGeometry').textContent = stats.subjectStats.geometry + '%';
        document.getElementById('avgPhysics').textContent = stats.subjectStats.physics + '%';
        document.getElementById('avgEnglish').textContent = stats.subjectStats.english + '%';

        // Статистика по классам
        this.loadClassStats();
    }

    loadClassStats() {
        const results = storageManager.getTestResults();
        const classStats = {};

        results.forEach(result => {
            const className = result.studentClass;
            if (!classStats[className]) {
                classStats[className] = { total: 0, sum: 0 };
            }
            classStats[className].total++;
            classStats[className].sum += result.percentage;
        });

        const classStatsElement = document.getElementById('classStats');
        const statsHtml = Object.entries(classStats).map(([className, stats]) => {
            const avg = Math.round(stats.sum / stats.total);
            return `
                <div class="class-stat">
                    <span>${className} класс:</span>
                    <span>${avg}% (${stats.total} тестов)</span>
                </div>
            `;
        }).join('');

        classStatsElement.innerHTML = statsHtml || '<p>Нет данных по классам</p>';
    }

    // Навигация между секциями
    showAdminSection(sectionId) {
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

        // Загрузка данных для секции
        if (sectionId === 'question-editor') {
            this.loadQuestionsList();
        } else if (sectionId === 'results') {
            this.loadResultsTable();
        } else if (sectionId === 'media-manager') {
            this.loadMediaGallery();
        }
    }

    // Генерация кода доступа
    generateAccessCode() {
        const code = storageManager.generateAccessCode();
        
        document.getElementById('generatedCode').textContent = code;
        document.getElementById('accessCodeDisplay').style.display = 'block';
    }

    copyCode() {
        const code = document.getElementById('generatedCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Код скопирован в буфер обмена!');
        });
    }

    // Управление вопросами
    loadQuestionsList() {
        const questions = storageManager.getQuestions();
        const questionsList = document.getElementById('questionsList');
        const questionsGrid = document.getElementById('questionsGrid');

        // Список для редактора
        if (questionsList) {
            const listHtml = questions.map(q => `
                <div class="question-item" onclick="selectQuestionForEdit(${q.id})">
                    <div class="question-preview">
                        <strong>№${q.number}</strong> - ${q.subjectName}
                    </div>
                    <div class="question-text-preview">
                        ${q.text.substring(0, 50)}...
                    </div>
                </div>
            `).join('');
            questionsList.innerHTML = listHtml;
        }

        // Сетка для менеджера
        if (questionsGrid) {
            const gridHtml = questions.map(q => `
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-number">№${q.number}</span>
                        <span class="question-subject">${q.subjectName}</span>
                    </div>
                    <div class="question-content">
                        <p>${q.text}</p>
                        ${q.formula ? `<div class="formula">${q.formula}</div>` : ''}
                    </div>
                    <div class="question-actions">
                        <button onclick="selectQuestionForEdit(${q.id})" class="btn-primary btn-sm">Редактировать</button>
                        <button onclick="deleteQuestionConfirm(${q.id})" class="btn-danger btn-sm">Удалить</button>
                    </div>
                </div>
            `).join('');
            questionsGrid.innerHTML = gridHtml;
        }
    }

    selectQuestionForEdit(questionId) {
        const question = storageManager.getQuestion(questionId);
        if (!question) return;

        this.selectedQuestion = question;

        // Заполнение формы
        document.getElementById('questionNumber').value = question.number;
        document.getElementById('questionSubject').value = question.subject;
        document.getElementById('questionText').value = question.text;
        document.getElementById('questionFormula').value = question.formula || '';
        document.getElementById('optionA').value = question.options.A;
        document.getElementById('optionB').value = question.options.B;
        document.getElementById('optionC').value = question.options.C;
        document.getElementById('optionD').value = question.options.D;
        document.getElementById('correctAnswer').value = question.correctAnswer;
        document.getElementById('questionExplanation').value = question.explanation || '';

        // Изображение
        if (question.image) {
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('previewImg').src = question.image;
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }

        // Выделение в списке
        document.querySelectorAll('.question-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.question-item')?.classList.add('active');

        // Переход к редактору
        this.showAdminSection('question-editor');
    }

    saveQuestion() {
        if (!this.selectedQuestion) return;

        const formData = {
            id: this.selectedQuestion.id,
            number: parseInt(document.getElementById('questionNumber').value),
            subject: document.getElementById('questionSubject').value,
            subjectName: this.getSubjectName(document.getElementById('questionSubject').value),
            text: document.getElementById('questionText').value,
            formula: document.getElementById('questionFormula').value,
            options: {
                A: document.getElementById('optionA').value,
                B: document.getElementById('optionB').value,
                C: document.getElementById('optionC').value,
                D: document.getElementById('optionD').value
            },
            correctAnswer: document.getElementById('correctAnswer').value,
            explanation: document.getElementById('questionExplanation').value,
            image: this.selectedQuestion.image // Сохраняем существующее изображение
        };

        // Валидация
        if (!this.validateQuestionForm(formData)) {
            return;
        }

        // Сохранение
        if (storageManager.updateQuestion(formData)) {
            alert('Вопрос успешно сохранен!');
            this.loadQuestionsList();
            
            // Уведомление учеников об обновлении
            this.notifyStudentsUpdate();
        } else {
            alert('Ошибка при сохранении вопроса');
        }
    }

    getSubjectName(subject) {
        const subjects = {
            algebra: 'Алгебра',
            geometry: 'Геометрия',
            physics: 'Физика',
            english: 'Английский'
        };
        return subjects[subject] || subject;
    }

    validateQuestionForm(data) {
        if (!data.text.trim()) {
            alert('Введите текст вопроса');
            return false;
        }

        if (!data.options.A.trim() || !data.options.B.trim() || 
            !data.options.C.trim() || !data.options.D.trim()) {
            alert('Заполните все варианты ответов');
            return false;
        }

        if (!data.correctAnswer) {
            alert('Выберите правильный ответ');
            return false;
        }

        return true;
    }

    notifyStudentsUpdate() {
        // Создание события для уведомления учеников
        const event = new StorageEvent('storage', {
            key: 'chsb_questions',
            newValue: JSON.stringify(storageManager.getQuestions()),
            url: window.location.href
        });
        
        window.dispatchEvent(event);
    }

    addNewQuestion() {
        const questions = storageManager.getQuestions();
        const nextNumber = Math.max(...questions.map(q => q.number)) + 1;

        const newQuestion = {
            number: nextNumber,
            subject: 'algebra',
            subjectName: 'Алгебра',
            text: 'Новый вопрос',
            formula: '',
            options: { A: 'Вариант A', B: 'Вариант B', C: 'Вариант C', D: 'Вариант D' },
            correctAnswer: 'A',
            explanation: '',
            image: null
        };

        const savedQuestion = storageManager.addQuestion(newQuestion);
        this.selectQuestionForEdit(savedQuestion.id);
        this.loadQuestionsList();
    }

    deleteQuestionConfirm(questionId) {
        const question = storageManager.getQuestion(questionId);
        if (!question) return;

        this.showConfirmModal(
            `Вы уверены, что хотите удалить вопрос №${question.number}?`,
            () => this.deleteQuestion(questionId)
        );
    }

    deleteQuestion(questionId) {
        if (storageManager.deleteQuestion(questionId)) {
            alert('Вопрос удален');
            this.loadQuestionsList();
            this.resetForm();
        }
    }

    resetForm() {
        document.getElementById('questionEditForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        this.selectedQuestion = null;
    }

    // Работа с изображениями
    previewImage() {
        const fileInput = document.getElementById('questionImage');
        const file = fileInput.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('previewImg').src = e.target.result;
                document.getElementById('imagePreview').style.display = 'block';
                
                // Сохранение изображения в вопрос
                if (this.selectedQuestion) {
                    this.selectedQuestion.image = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('questionImage').value = '';
        
        if (this.selectedQuestion) {
            this.selectedQuestion.image = null;
        }
    }

    // Медиа менеджер
    loadMediaGallery() {
        const mediaFiles = storageManager.getMediaFiles();
        const gallery = document.getElementById('mediaGallery');
        
        if (mediaFiles.length === 0) {
            gallery.innerHTML = '<p>Нет загруженных изображений</p>';
            return;
        }

        const galleryHtml = mediaFiles.map(file => `
            <div class="media-item">
                <img src="${file.data}" alt="${file.name}">
                <div class="media-info">
                    <p>${file.name}</p>
                    <button onclick="deleteMediaFile(${file.id})" class="btn-danger btn-sm">Удалить</button>
                </div>
            </div>
        `).join('');

        gallery.innerHTML = galleryHtml;
    }

    uploadMedia() {
        const fileInput = document.getElementById('mediaUpload');
        const files = fileInput.files;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result
                    };
                    
                    storageManager.saveMediaFile(mediaData);
                    this.loadMediaGallery();
                };
                reader.readAsDataURL(file);
            }
        });

        fileInput.value = '';
    }

    deleteMediaFile(fileId) {
        this.showConfirmModal(
            'Удалить изображение?',
            () => {
                storageManager.deleteMediaFile(fileId);
                this.loadMediaGallery();
            }
        );
    }

    // Мониторинг результатов
    loadResultsTable() {
        const results = storageManager.getTestResults();
        const tableBody = document.getElementById('resultsTableBody');
        const studentFilter = document.getElementById('studentFilter');

        // Загрузка фильтра учеников
        const students = storageManager.getStudents();
        const studentOptions = students.map(s => 
            `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`
        ).join('');
        studentFilter.innerHTML = '<option value="all">Все ученики</option>' + studentOptions;

        // Загрузка таблицы результатов
        if (results.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10">Нет результатов тестов</td></tr>';
            return;
        }

        const tableHtml = results.map(result => {
            const date = new Date(result.timestamp).toLocaleDateString();
            const time = new Date(result.timestamp).toLocaleTimeString();
            const duration = this.formatDuration(result.testDuration);

            return `
                <tr>
                    <td>${result.studentName}</td>
                    <td>${result.studentClass}</td>
                    <td>${date}</td>
                    <td>${result.totalScore}/${result.totalQuestions} (${result.percentage}%)</td>
                    <td>${result.subjectScores.algebra}/${result.subjectTotals.algebra}</td>
                    <td>${result.subjectScores.geometry}/${result.subjectTotals.geometry}</td>
                    <td>${result.subjectScores.physics}/${result.subjectTotals.physics}</td>
                    <td>${result.subjectScores.english}/${result.subjectTotals.english}</td>
                    <td>${duration}</td>
                    <td>
                        <button onclick="viewResultDetails(${result.id})" class="btn-info btn-sm">Детали</button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHtml;
    }

    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    filterResults() {
        const studentFilter = document.getElementById('studentFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let results = storageManager.getTestResults();

        // Фильтр по ученику
        if (studentFilter !== 'all') {
            results = results.filter(r => r.studentId == studentFilter);
        }

        // Фильтр по дате
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }

            results = results.filter(r => new Date(r.timestamp) >= filterDate);
        }

        // Обновление таблицы с отфильтрованными результатами
        this.updateResultsTable(results);
    }

    updateResultsTable(results) {
        const tableBody = document.getElementById('resultsTableBody');
        
        if (results.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10">Нет результатов по выбранным фильтрам</td></tr>';
            return;
        }

        const tableHtml = results.map(result => {
            const date = new Date(result.timestamp).toLocaleDateString();
            const duration = this.formatDuration(result.testDuration);

            return `
                <tr>
                    <td>${result.studentName}</td>
                    <td>${result.studentClass}</td>
                    <td>${date}</td>
                    <td>${result.totalScore}/${result.totalQuestions} (${result.percentage}%)</td>
                    <td>${result.subjectScores.algebra}/${result.subjectTotals.algebra}</td>
                    <td>${result.subjectScores.geometry}/${result.subjectTotals.geometry}</td>
                    <td>${result.subjectScores.physics}/${result.subjectTotals.physics}</td>
                    <td>${result.subjectScores.english}/${result.subjectTotals.english}</td>
                    <td>${duration}</td>
                    <td>
                        <button onclick="viewResultDetails(${result.id})" class="btn-info btn-sm">Детали</button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHtml;
    }

    viewResultDetails(resultId) {
        const results = storageManager.getTestResults();
        const result = results.find(r => r.id === resultId);
        
        if (result) {
            alert(`Детали результата:\n\nУченик: ${result.studentName}\nКласс: ${result.studentClass}\nОбщий балл: ${result.totalScore}/${result.totalQuestions}\nПроцент: ${result.percentage}%\nВремя: ${this.formatDuration(result.testDuration)}`);
        }
    }

    // Экспорт и импорт
    exportQuestions() {
        const data = storageManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chsb_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    importQuestions() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (storageManager.importData(e.target.result)) {
                        alert('Данные успешно импортированы!');
                        this.loadQuestionsList();
                        this.loadDashboardData();
                    } else {
                        alert('Ошибка при импорте данных');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // Модальные окна
    showConfirmModal(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
        this.confirmCallback = callback;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeModal();
    }

    closeModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    // Поиск вопросов
    searchQuestions() {
        const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
        const questions = storageManager.getQuestions();
        
        const filteredQuestions = questions.filter(q => 
            q.text.toLowerCase().includes(searchTerm) ||
            q.subjectName.toLowerCase().includes(searchTerm) ||
            q.number.toString().includes(searchTerm)
        );

        this.updateQuestionsList(filteredQuestions);
    }

    updateQuestionsList(questions) {
        const questionsList = document.getElementById('questionsList');
        
        const listHtml = questions.map(q => `
            <div class="question-item" onclick="selectQuestionForEdit(${q.id})">
                <div class="question-preview">
                    <strong>№${q.number}</strong> - ${q.subjectName}
                </div>
                <div class="question-text-preview">
                    ${q.text.substring(0, 50)}...
                </div>
            </div>
        `).join('');
        
        questionsList.innerHTML = listHtml;
    }

    filterQuestions() {
        const subjectFilter = document.getElementById('subjectFilter').value;
        const questions = storageManager.getQuestions();
        
        let filteredQuestions = questions;
        
        if (subjectFilter !== 'all') {
            filteredQuestions = questions.filter(q => q.subject === subjectFilter);
        }

        this.updateQuestionsGrid(filteredQuestions);
    }

    updateQuestionsGrid(questions) {
        const questionsGrid = document.getElementById('questionsGrid');
        
        const gridHtml = questions.map(q => `
            <div class="question-card">
                <div class="question-header">
                    <span class="question-number">№${q.number}</span>
                    <span class="question-subject">${q.subjectName}</span>
                </div>
                <div class="question-content">
                    <p>${q.text}</p>
                    ${q.formula ? `<div class="formula">${q.formula}</div>` : ''}
                </div>
                <div class="question-actions">
                    <button onclick="selectQuestionForEdit(${q.id})" class="btn-primary btn-sm">Редактировать</button>
                    <button onclick="deleteQuestionConfirm(${q.id})" class="btn-danger btn-sm">Удалить</button>
                </div>
            </div>
        `).join('');
        
        questionsGrid.innerHTML = gridHtml;
    }
}

// Глобальные функции для HTML
function showAdminSection(sectionId) {
    if (window.adminPanel) {
        window.adminPanel.showAdminSection(sectionId);
    }
}

function generateAccessCode() {
    if (window.adminPanel) {
        window.adminPanel.generateAccessCode();
    }
}

function copyCode() {
    if (window.adminPanel) {
        window.adminPanel.copyCode();
    }
}

function selectQuestionForEdit(questionId) {
    if (window.adminPanel) {
        window.adminPanel.selectQuestionForEdit(questionId);
    }
}

function addNewQuestion() {
    if (window.adminPanel) {
        window.adminPanel.addNewQuestion();
    }
}

function deleteQuestionConfirm(questionId) {
    if (window.adminPanel) {
        window.adminPanel.deleteQuestionConfirm(questionId);
    }
}

function previewImage() {
    if (window.adminPanel) {
        window.adminPanel.previewImage();
    }
}

function removeImage() {
    if (window.adminPanel) {
        window.adminPanel.removeImage();
    }
}

function resetForm() {
    if (window.adminPanel) {
        window.adminPanel.resetForm();
    }
}

function uploadMedia() {
    if (window.adminPanel) {
        window.adminPanel.uploadMedia();
    }
}

function deleteMediaFile(fileId) {
    if (window.adminPanel) {
        window.adminPanel.deleteMediaFile(fileId);
    }
}

function filterResults() {
    if (window.adminPanel) {
        window.adminPanel.filterResults();
    }
}

function viewResultDetails(resultId) {
    if (window.adminPanel) {
        window.adminPanel.viewResultDetails(resultId);
    }
}

function exportQuestions() {
    if (window.adminPanel) {
        window.adminPanel.exportQuestions();
    }
}

function importQuestions() {
    if (window.adminPanel) {
        window.adminPanel.importQuestions();
    }
}

function confirmAction() {
    if (window.adminPanel) {
        window.adminPanel.confirmAction();
    }
}

function closeModal() {
    if (window.adminPanel) {
        window.adminPanel.closeModal();
    }
}

function searchQuestions() {
    if (window.adminPanel) {
        window.adminPanel.searchQuestions();
    }
}

function filterQuestions() {
    if (window.adminPanel) {
        window.adminPanel.filterQuestions();
    }
}

function adminLogout() {
    storageManager.clearSession();
    window.location.href = 'index.html';
}

// Обработчик формы редактирования вопроса
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Обработчик формы
    const questionForm = document.getElementById('questionEditForm');
    if (questionForm) {
        questionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (window.adminPanel) {
                window.adminPanel.saveQuestion();
            }
        });
    }
});