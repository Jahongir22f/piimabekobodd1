// Система управления данными в LocalStorage
class StorageManager {
    constructor() {
        this.initializeDefaultData();
        this.setupStorageListener();
    }

    // Инициализация базовых данных
    initializeDefaultData() {
        // Создание админа по умолчанию
        if (!localStorage.getItem('admin_credentials')) {
            const adminData = {
                login: 'admin',
                password: 'admin123',
                created: new Date().toISOString()
            };
            localStorage.setItem('admin_credentials', JSON.stringify(adminData));
        }

        // Инициализация вопросов CHSB
        if (!localStorage.getItem('chsb_questions')) {
            this.initializeDefaultQuestions();
        }

        // Инициализация других данных
        if (!localStorage.getItem('students')) {
            localStorage.setItem('students', JSON.stringify([]));
        }

        if (!localStorage.getItem('test_results')) {
            localStorage.setItem('test_results', JSON.stringify([]));
        }

        if (!localStorage.getItem('access_codes')) {
            localStorage.setItem('access_codes', JSON.stringify([]));
        }

        if (!localStorage.getItem('media_files')) {
            localStorage.setItem('media_files', JSON.stringify([]));
        }
    }

    // Инициализация базовых вопросов CHSB
    initializeDefaultQuestions() {
        const defaultQuestions = [];

        // Алгебра (1-12)
        for (let i = 1; i <= 12; i++) {
            defaultQuestions.push({
                id: i,
                number: i,
                subject: 'algebra',
                subjectName: 'Алгебра',
                text: `Алгебраический вопрос ${i}`,
                formula: `x + ${i} = ${i + 5}`,
                options: {
                    A: `${5}`,
                    B: `${6}`,
                    C: `${7}`,
                    D: `${8}`
                },
                correctAnswer: 'A',
                explanation: `Решение: x = ${5}`,
                image: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }

        // Геометрия (13-20)
        for (let i = 13; i <= 20; i++) {
            defaultQuestions.push({
                id: i,
                number: i,
                subject: 'geometry',
                subjectName: 'Геометрия',
                text: `Геометрический вопрос ${i - 12}`,
                formula: `S = πr²`,
                options: {
                    A: `${Math.PI * 4}`,
                    B: `${Math.PI * 9}`,
                    C: `${Math.PI * 16}`,
                    D: `${Math.PI * 25}`
                },
                correctAnswer: 'C',
                explanation: 'При радиусе 4, площадь равна 16π',
                image: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }

        // Физика (21-36)
        for (let i = 21; i <= 36; i++) {
            defaultQuestions.push({
                id: i,
                number: i,
                subject: 'physics',
                subjectName: 'Физика',
                text: `Физический вопрос ${i - 20}`,
                formula: `F = ma`,
                options: {
                    A: `${(i - 20) * 2} Н`,
                    B: `${(i - 20) * 3} Н`,
                    C: `${(i - 20) * 4} Н`,
                    D: `${(i - 20) * 5} Н`
                },
                correctAnswer: 'B',
                explanation: `При массе ${i - 20} кг и ускорении 3 м/с², сила равна ${(i - 20) * 3} Н`,
                image: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }

        // Английский (37-50)
        for (let i = 37; i <= 50; i++) {
            defaultQuestions.push({
                id: i,
                number: i,
                subject: 'english',
                subjectName: 'Английский',
                text: `Choose the correct form: "I ___ to school every day."`,
                formula: null,
                options: {
                    A: 'go',
                    B: 'goes',
                    C: 'going',
                    D: 'went'
                },
                correctAnswer: 'A',
                explanation: 'Present Simple с местоимением "I" требует базовую форму глагола',
                image: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }

        localStorage.setItem('chsb_questions', JSON.stringify(defaultQuestions));
    }

    // Настройка слушателя изменений в localStorage
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'chsb_questions') {
                // Уведомление об обновлении вопросов
                this.notifyQuestionUpdate();
            }
        });
    }

    // Уведомление об обновлении вопросов
    notifyQuestionUpdate() {
        const event = new CustomEvent('questionsUpdated', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }

    // Методы для работы с учениками
    getStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }

    addStudent(studentData) {
        const students = this.getStudents();
        const newStudent = {
            id: Date.now(),
            ...studentData,
            created: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        students.push(newStudent);
        localStorage.setItem('students', JSON.stringify(students));
        return newStudent;
    }

    findStudent(email, password) {
        const students = this.getStudents();
        return students.find(s => s.email === email && s.password === password);
    }

    updateStudentLogin(studentId) {
        const students = this.getStudents();
        const student = students.find(s => s.id === studentId);
        if (student) {
            student.lastLogin = new Date().toISOString();
            localStorage.setItem('students', JSON.stringify(students));
        }
    }

    // Методы для работы с админом
    getAdminCredentials() {
        return JSON.parse(localStorage.getItem('admin_credentials'));
    }

    validateAdmin(login, password) {
        const admin = this.getAdminCredentials();
        return admin && admin.login === login && admin.password === password;
    }

    // Методы для работы с вопросами CHSB
    getQuestions() {
        return JSON.parse(localStorage.getItem('chsb_questions') || '[]');
    }

    getQuestion(id) {
        const questions = this.getQuestions();
        return questions.find(q => q.id === parseInt(id));
    }

    updateQuestion(questionData) {
        const questions = this.getQuestions();
        const index = questions.findIndex(q => q.id === questionData.id);
        
        if (index !== -1) {
            questions[index] = {
                ...questions[index],
                ...questionData,
                updated: new Date().toISOString()
            };
            localStorage.setItem('chsb_questions', JSON.stringify(questions));
            
            // Уведомление об изменении
            this.notifyQuestionUpdate();
            return true;
        }
        return false;
    }

    addQuestion(questionData) {
        const questions = this.getQuestions();
        const newQuestion = {
            id: Date.now(),
            ...questionData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        questions.push(newQuestion);
        localStorage.setItem('chsb_questions', JSON.stringify(questions));
        this.notifyQuestionUpdate();
        return newQuestion;
    }

    deleteQuestion(id) {
        const questions = this.getQuestions();
        const filteredQuestions = questions.filter(q => q.id !== parseInt(id));
        localStorage.setItem('chsb_questions', JSON.stringify(filteredQuestions));
        this.notifyQuestionUpdate();
        return true;
    }

    // Методы для работы с результатами тестов
    getTestResults() {
        return JSON.parse(localStorage.getItem('test_results') || '[]');
    }

    saveTestResult(resultData) {
        const results = this.getTestResults();
        const newResult = {
            id: Date.now(),
            ...resultData,
            timestamp: new Date().toISOString()
        };
        results.push(newResult);
        localStorage.setItem('test_results', JSON.stringify(results));
        return newResult;
    }

    getStudentResults(studentId) {
        const results = this.getTestResults();
        return results.filter(r => r.studentId === studentId);
    }

    // Методы для работы с кодами доступа
    getAccessCodes() {
        return JSON.parse(localStorage.getItem('access_codes') || '[]');
    }

    generateAccessCode() {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const codes = this.getAccessCodes();
        
        const newCode = {
            code: code,
            created: new Date().toISOString(),
            used: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
        };
        
        codes.push(newCode);
        localStorage.setItem('access_codes', JSON.stringify(codes));
        return code;
    }

    validateAccessCode(code) {
        const codes = this.getAccessCodes();
        const accessCode = codes.find(c => c.code === code && !c.used);
        
        if (accessCode) {
            const now = new Date();
            const expiresAt = new Date(accessCode.expiresAt);
            
            if (now < expiresAt) {
                // Отмечаем код как использованный
                accessCode.used = true;
                accessCode.usedAt = now.toISOString();
                localStorage.setItem('access_codes', JSON.stringify(codes));
                return true;
            }
        }
        return false;
    }

    // Методы для работы с медиафайлами
    getMediaFiles() {
        return JSON.parse(localStorage.getItem('media_files') || '[]');
    }

    saveMediaFile(fileData) {
        const mediaFiles = this.getMediaFiles();
        const newFile = {
            id: Date.now(),
            ...fileData,
            uploaded: new Date().toISOString()
        };
        mediaFiles.push(newFile);
        localStorage.setItem('media_files', JSON.stringify(mediaFiles));
        return newFile;
    }

    deleteMediaFile(id) {
        const mediaFiles = this.getMediaFiles();
        const filteredFiles = mediaFiles.filter(f => f.id !== parseInt(id));
        localStorage.setItem('media_files', JSON.stringify(filteredFiles));
        return true;
    }

    // Методы для работы с сессиями
    setCurrentUser(userData, role) {
        const sessionData = {
            user: userData,
            role: role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('current_session', JSON.stringify(sessionData));
    }

    getCurrentUser() {
        const session = localStorage.getItem('current_session');
        return session ? JSON.parse(session) : null;
    }

    clearSession() {
        localStorage.removeItem('current_session');
    }

    // Утилиты
    exportData() {
        const data = {
            students: this.getStudents(),
            questions: this.getQuestions(),
            results: this.getTestResults(),
            mediaFiles: this.getMediaFiles(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.students) {
                localStorage.setItem('students', JSON.stringify(data.students));
            }
            
            if (data.questions) {
                localStorage.setItem('chsb_questions', JSON.stringify(data.questions));
                this.notifyQuestionUpdate();
            }
            
            if (data.results) {
                localStorage.setItem('test_results', JSON.stringify(data.results));
            }
            
            if (data.mediaFiles) {
                localStorage.setItem('media_files', JSON.stringify(data.mediaFiles));
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            return false;
        }
    }

    // Очистка данных
    clearAllData() {
        const keys = [
            'students', 'chsb_questions', 'test_results', 
            'access_codes', 'media_files', 'current_session'
        ];
        
        keys.forEach(key => localStorage.removeItem(key));
        this.initializeDefaultData();
    }

    // Статистика
    getStatistics() {
        const students = this.getStudents();
        const results = this.getTestResults();
        const questions = this.getQuestions();

        const totalTests = results.length;
        const avgScore = totalTests > 0 
            ? results.reduce((sum, r) => sum + r.totalScore, 0) / totalTests 
            : 0;

        const subjectStats = {
            algebra: this.calculateSubjectAverage(results, 'algebra'),
            geometry: this.calculateSubjectAverage(results, 'geometry'),
            physics: this.calculateSubjectAverage(results, 'physics'),
            english: this.calculateSubjectAverage(results, 'english')
        };

        return {
            totalStudents: students.length,
            totalQuestions: questions.length,
            totalTests: totalTests,
            avgScore: Math.round(avgScore * 100) / 100,
            subjectStats: subjectStats
        };
    }

    calculateSubjectAverage(results, subject) {
        if (results.length === 0) return 0;
        
        const subjectResults = results.map(r => r.subjectScores[subject] || 0);
        const sum = subjectResults.reduce((a, b) => a + b, 0);
        return Math.round((sum / results.length) * 100) / 100;
    }
}

// Создание глобального экземпляра
window.storageManager = new StorageManager();