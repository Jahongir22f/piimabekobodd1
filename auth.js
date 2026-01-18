// Система авторизации
class AuthManager {
    constructor() {
        this.initializeAuth();
        this.setupEventListeners();
    }

    initializeAuth() {
        // Проверка существующей сессии
        const currentUser = storageManager.getCurrentUser();
        if (currentUser) {
            this.redirectToUserPanel(currentUser.role);
        }
    }

    setupEventListeners() {
        // Обработчики форм авторизации
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const adminLoginForm = document.getElementById('adminLoginForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleStudentLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleStudentRegister(e));
        }

        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
    }

    // Handle student login
    handleStudentLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginError');

        // Validation
        if (!email || !password) {
            this.showError(errorElement, 'Please fill in all fields');
            return;
        }

        // Find student
        const student = storageManager.findStudent(email, password);
        
        if (student) {
            // Update last login time
            storageManager.updateStudentLogin(student.id);
            
            // Save session
            storageManager.setCurrentUser(student, 'student');
            
            // Redirect
            this.redirectToUserPanel('student');
        } else {
            this.showError(errorElement, 'Invalid email or password');
        }
    }

    // Handle student registration
    handleStudentRegister(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const className = document.getElementById('regClass').value;
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const errorElement = document.getElementById('registerError');

        // Validation
        if (!firstName || !lastName || !className || !email || !password) {
            this.showError(errorElement, 'Please fill in all fields');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError(errorElement, 'Please enter a valid email');
            return;
        }

        if (password.length < 6) {
            this.showError(errorElement, 'Password must be at least 6 characters');
            return;
        }

        // Check email uniqueness
        const existingStudent = storageManager.getStudents().find(s => s.email === email);
        if (existingStudent) {
            this.showError(errorElement, 'A user with this email already exists');
            return;
        }

        // Create new student
        const studentData = {
            firstName: firstName,
            lastName: lastName,
            class: className,
            email: email,
            password: password
        };

        const newStudent = storageManager.addStudent(studentData);
        
        // Auto login after registration
        storageManager.setCurrentUser(newStudent, 'student');
        this.redirectToUserPanel('student');
    }

    // Handle admin login
    handleAdminLogin(e) {
        e.preventDefault();
        
        const login = document.getElementById('adminLogin').value.trim();
        const password = document.getElementById('adminPassword').value;
        const errorElement = document.getElementById('adminError');

        // Validation
        if (!login || !password) {
            this.showError(errorElement, 'Please fill in all fields');
            return;
        }

        // Check admin credentials
        if (storageManager.validateAdmin(login, password)) {
            const adminData = {
                login: login,
                role: 'admin',
                loginTime: new Date().toISOString()
            };
            
            storageManager.setCurrentUser(adminData, 'admin');
            this.redirectToUserPanel('admin');
        } else {
            this.showError(errorElement, 'Invalid administrator login or password');
        }
    }

    // Валидация email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Показ ошибки
    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            
            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    // Перенаправление на панель пользователя
    redirectToUserPanel(role) {
        if (role === 'student') {
            window.location.href = 'student.html';
        } else if (role === 'admin') {
            window.location.href = 'admin.html';
        }
    }

    // Выход из системы
    logout() {
        storageManager.clearSession();
        window.location.href = 'index.html';
    }
}

// Глобальные функции для HTML
function selectRole(role) {
    const roleSelection = document.getElementById('roleSelection');
    const studentAuth = document.getElementById('studentAuth');
    const adminAuth = document.getElementById('adminAuth');

    roleSelection.style.display = 'none';

    if (role === 'student') {
        studentAuth.style.display = 'block';
    } else if (role === 'admin') {
        adminAuth.style.display = 'block';
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Сброс активных вкладок
    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabBtns[0].classList.add('active');
    } else if (tab === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabBtns[1].classList.add('active');
    }

    // Очистка ошибок
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.style.display = 'none');
}

function backToRoleSelection() {
    const roleSelection = document.getElementById('roleSelection');
    const studentAuth = document.getElementById('studentAuth');
    const adminAuth = document.getElementById('adminAuth');

    roleSelection.style.display = 'block';
    studentAuth.style.display = 'none';
    adminAuth.style.display = 'none';

    // Очистка форм
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Очистка ошибок
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.style.display = 'none');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Глобальная функция выхода
function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// Добавление эффекта ripple для кнопок
function addRippleEffect() {
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-info, .btn-warning');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Инициализация эффектов при загрузке
document.addEventListener('DOMContentLoaded', () => {
    addRippleEffect();
});