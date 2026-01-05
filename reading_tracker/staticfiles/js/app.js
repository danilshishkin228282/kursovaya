// Глобальные функции для вызова из HTML
function showLogin() {
    if (window.app) {
        window.app.showModal('loginModal');
    }
}

function showRegister() {
    if (window.app) {
        window.app.showModal('registerModal');
    }
}

function showAddBookModal() {
    if (window.app && window.app.currentUser) {
        window.app.showModal('addBookModal');
    } else if (window.app) {
        window.app.showAlert('Сначала войдите в систему', 'warning');
    }
}

// Основной класс приложения
class ReadingTrackerApp {
    constructor() {
        this.currentUser = null;
        this.books = [];
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadInitialData();
    }

    // Проверка статуса аутентификации
    async checkAuthStatus() {
        try {
            const response = await this.apiCall('/api/users/current_user/');
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.showAuthenticatedUI();
                this.loadDashboard();
            } else {
                this.showUnauthenticatedUI();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showUnauthenticatedUI();
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Форма входа
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Форма регистрации
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Форма добавления книги
        document.getElementById('add-book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });
    }

    // API вызовы
    async apiCall(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        return response;
    }

    getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    // Показать/скрыть UI в зависимости от аутентификации
    showAuthenticatedUI() {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-menu').style.display = 'block';
        document.getElementById('username').textContent = this.currentUser.username;
    }

    showUnauthenticatedUI() {
        document.getElementById('auth-buttons').style.display = 'block';
        document.getElementById('user-menu').style.display = 'none';
    }

    // Вход в систему
    async login() {
        const form = document.getElementById('login-form');
        const formData = new FormData(form);
        
        try {
            const response = await this.apiCall('/api/auth/login/', {
                method: 'POST',
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showAuthenticatedUI();
                this.loadDashboard();
                this.hideModal('loginModal');
                this.showAlert('Успешный вход!', 'success');
            } else {
                this.showAlert('Неверное имя пользователя или пароль', 'danger');
            }
        } catch (error) {
            this.showAlert('Ошибка при входе', 'danger');
        }
    }

    // Регистрация
    async register() {
        const form = document.getElementById('register-form');
        const formData = new FormData(form);
        
        try {
            const response = await this.apiCall('/api/auth/register/', {
                method: 'POST',
                body: JSON.stringify({
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            if (response.ok) {
                this.showAlert('Регистрация успешна! Теперь войдите в систему.', 'success');
                this.hideModal('registerModal');
                setTimeout(() => showLogin(), 1000);
            } else {
                const error = await response.json();
                this.showAlert(error.message || 'Ошибка регистрации', 'danger');
            }
        } catch (error) {
            this.showAlert('Ошибка при регистрации', 'danger');
        }
    }

    // Выход из системы
    async logout() {
        try {
            await this.apiCall('/api/auth/logout/', {
                method: 'POST'
            });
            this.currentUser = null;
            this.showUnauthenticatedUI();
            this.showAlert('Вы вышли из системы', 'info');
            this.loadDashboard();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Загрузка дашборда
    async loadDashboard() {
        if (!this.currentUser) {
            this.showUnauthenticatedContent();
            return;
        }

        try {
            const [booksResponse, statsResponse, goalsResponse] = await Promise.all([
                this.apiCall('/api/reading-entries/'),
                this.apiCall('/api/reading-entries/stats/'),
                this.apiCall('/api/reading-goals/')
            ]);

            if (booksResponse.ok && statsResponse.ok) {
                const books = await booksResponse.json();
                const stats = await statsResponse.json();
                const goals = goalsResponse.ok ? await goalsResponse.json() : [];

                this.displayDashboard(stats, books, goals);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    // Отображение дашборда
    displayDashboard(stats, books, goals) {
        const content = `
            <div class="row">
                <!-- Статистика -->
                <div class="col-md-8">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card text-white bg-primary">
                                <div class="card-body">
                                    <h4>${stats.total_books || 0}</h4>
                                    <p>Всего книг</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-white bg-success">
                                <div class="card-body">
                                    <h4>${stats.finished_books || 0}</h4>
                                    <p>Прочитано</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-white bg-warning">
                                <div class="card-body">
                                    <h4>${stats.reading_books || 0}</h4>
                                    <p>Читаю сейчас</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-white bg-info">
                                <div class="card-body">
                                    <h4>${stats.want_to_read_books || 0}</h4>
                                    <p>Хочу прочитать</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Цели -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Цели чтения</h5>
                            <button class="btn btn-sm btn-primary" onclick="app.showAddGoalModal()">
                                <i class="fas fa-plus"></i> Цель
                            </button>
                        </div>
                        <div class="card-body">
                            ${this.renderGoals(goals)}
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Быстрые действия</h5>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-primary w-100 mb-2" onclick="showAddBookModal()">
                                <i class="fas fa-plus"></i> Добавить книгу
                            </button>
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="app.loadMyBooks()">
                                <i class="fas fa-book"></i> Мои книги
                            </button>
                            <button class="btn btn-outline-secondary w-100" onclick="app.loadStatistics()">
                                <i class="fas fa-chart-bar"></i> Статистика
                            </button>
                        </div>
                    </div>

                    <!-- Последние книги -->
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="mb-0">Последние книги</h5>
                        </div>
                        <div class="card-body">
                            ${this.renderRecentBooks(books.slice(0, 5))}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Список книг -->
            <div class="card mt-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Мои книги</h5>
                    <div>
                        <select class="form-select form-select-sm" onchange="app.filterBooks(this.value)">
                            <option value="all">Все статусы</option>
                            <option value="want_to_read">Хочу прочитать</option>
                            <option value="reading">Читаю</option>
                            <option value="finished">Прочитано</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    ${this.renderBooks(books)}
                </div>
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    }

    // Рендер целей
    renderGoals(goals) {
        if (goals.length === 0) {
            return '<p class="text-muted">У вас нет целей на этот год. Добавьте первую цель!</p>';
        }

        return goals.map(goal => `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>Цель на ${goal.year}: ${goal.target_books} книг</span>
                    <span>${goal.books_read_count || 0}/${goal.target_books}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${goal.progress_percentage || 0}%">
                        ${goal.progress_percentage || 0}%
                    </div>
                </div>
                <div class="mt-1">
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteGoal(${goal.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Рендер последних книг
    renderRecentBooks(books) {
        if (books.length === 0) {
            return '<p class="text-muted">У вас пока нет книг</p>';
        }

        return books.map(book => `
            <div class="d-flex align-items-center mb-2">
                <div class="flex-grow-1">
                    <strong>${book.book_details.title}</strong><br>
                    <small class="text-muted">${book.book_details.author}</small>
                </div>
                <span class="badge ${this.getStatusBadgeClass(book.status)}">
                    ${this.getStatusText(book.status)}
                </span>
            </div>
        `).join('');
    }

    // Рендер всех книг
    renderBooks(books) {
        if (books.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-book fa-3x text-muted mb-3"></i>
                    <p class="text-muted">У вас пока нет книг. Добавьте первую книгу!</p>
                    <button class="btn btn-primary" onclick="showAddBookModal()">
                        <i class="fas fa-plus"></i> Добавить книгу
                    </button>
                </div>
            `;
        }

        return `
            <div class="row">
                ${books.map(book => `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card book-card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${book.book_details.title}</h6>
                                <p class="card-text text-muted">${book.book_details.author}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge ${this.getStatusBadgeClass(book.status)}">
                                        ${this.getStatusText(book.status)}
                                    </span>
                                    ${book.rating ? `
                                        <span class="text-warning">
                                            ${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}
                                        </span>
                                    ` : ''}
                                </div>
                                ${book.review ? `
                                    <p class="card-text mt-2 small">${book.review.substring(0, 100)}...</p>
                                ` : ''}
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.editBook(${book.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="app.deleteBook(${book.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <select class="form-select form-select-sm d-inline-block w-auto" onchange="app.updateBookStatus(${book.id}, this.value)">
                                    <option value="want_to_read" ${book.status === 'want_to_read' ? 'selected' : ''}>Хочу прочитать</option>
                                    <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>Читаю</option>
                                    <option value="finished" ${book.status === 'finished' ? 'selected' : ''}>Прочитано</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Вспомогательные методы для статусов
    getStatusBadgeClass(status) {
        const classes = {
            'want_to_read': 'bg-secondary',
            'reading': 'bg-warning',
            'finished': 'bg-success'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'want_to_read': 'Хочу прочитать',
            'reading': 'Читаю',
            'finished': 'Прочитано'
        };
        return texts[status] || status;
    }

    // Добавление книги
    async addBook() {
        const form = document.getElementById('add-book-form');
        const formData = new FormData(form);
        
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            genre: formData.get('genre'),
            publication_year: formData.get('publication_year') || null,
            description: formData.get('description')
        };

        const readingEntryData = {
            status: formData.get('status'),
            rating: formData.get('rating') || null,
            review: formData.get('review')
        };

        try {
            // Сначала создаем книгу
            const bookResponse = await this.apiCall('/api/books/', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });

            if (bookResponse.ok) {
                const book = await bookResponse.json();
                
                // Затем создаем запись о чтении
                const entryResponse = await this.apiCall('/api/reading-entries/', {
                    method: 'POST',
                    body: JSON.stringify({
                        book: book.id,
                        ...readingEntryData
                    })
                });

                if (entryResponse.ok) {
                    this.hideModal('addBookModal');
                    this.showAlert('Книга успешно добавлена!', 'success');
                    form.reset();
                    this.loadDashboard();
                }
            }
        } catch (error) {
            this.showAlert('Ошибка при добавлении книги', 'danger');
        }
    }

    // Обновление статуса книги
    async updateBookStatus(bookId, newStatus) {
        try {
            const response = await this.apiCall(`/api/reading-entries/${bookId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (response.ok) {
                this.showAlert('Статус обновлен!', 'success');
                this.loadDashboard();
            }
        } catch (error) {
            this.showAlert('Ошибка при обновлении статуса', 'danger');
        }
    }

    // Удаление книги
    async deleteBook(bookId) {
        if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
            return;
        }

        try {
            const response = await this.apiCall(`/api/reading-entries/${bookId}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showAlert('Книга удалена!', 'success');
                this.loadDashboard();
            }
        } catch (error) {
            this.showAlert('Ошибка при удалении книги', 'danger');
        }
    }

    // Редактирование книги (заглушка)
    editBook(bookId) {
        this.showAlert('Редактирование книги будет доступно в следующей версии', 'info');
    }

    // Фильтрация книг
    async filterBooks(status) {
        try {
            const response = await this.apiCall('/api/reading-entries/');
            if (response.ok) {
                let books = await response.json();
                
                if (status !== 'all') {
                    books = books.filter(book => book.status === status);
                }
                
                // Обновляем только список книг
                const booksContainer = document.querySelector('.card-body .row');
                if (booksContainer) {
                    booksContainer.innerHTML = this.renderBooksList(books);
                }
            }
        } catch (error) {
            console.error('Error filtering books:', error);
        }
    }

    // Рендер списка книг для фильтрации
    renderBooksList(books) {
        return books.map(book => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card book-card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${book.book_details.title}</h6>
                        <p class="card-text text-muted">${book.book_details.author}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge ${this.getStatusBadgeClass(book.status)}">
                                ${this.getStatusText(book.status)}
                            </span>
                            ${book.rating ? `
                                <span class="text-warning">
                                    ${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}
                                </span>
                            ` : ''}
                        </div>
                        ${book.review ? `
                            <p class="card-text mt-2 small">${book.review.substring(0, 100)}...</p>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editBook(${book.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteBook(${book.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <select class="form-select form-select-sm d-inline-block w-auto" onchange="app.updateBookStatus(${book.id}, this.value)">
                            <option value="want_to_read" ${book.status === 'want_to_read' ? 'selected' : ''}>Хочу прочитать</option>
                            <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>Читаю</option>
                            <option value="finished" ${book.status === 'finished' ? 'selected' : ''}>Прочитано</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Загрузка "Мои книги"
    async loadMyBooks() {
        this.currentView = 'my-books';
        await this.loadDashboard();
    }

    // Загрузка статистики
    async loadStatistics() {
        this.showAlert('Раздел статистики будет доступен в следующей версии', 'info');
    }

    // Добавление цели
    async showAddGoalModal() {
        const year = new Date().getFullYear();
        const targetBooks = prompt(`Введите цель по количеству книг на ${year} год:`, '12');
        
        if (targetBooks && !isNaN(targetBooks)) {
            try {
                const response = await this.apiCall('/api/reading-goals/', {
                    method: 'POST',
                    body: JSON.stringify({
                        year: year,
                        target_books: parseInt(targetBooks)
                    })
                });

                if (response.ok) {
                    this.showAlert('Цель добавлена!', 'success');
                    this.loadDashboard();
                }
            } catch (error) {
                this.showAlert('Ошибка при добавлении цели', 'danger');
            }
        }
    }

    // Удаление цели
    async deleteGoal(goalId) {
        if (!confirm('Вы уверены, что хотите удалить эту цель?')) {
            return;
        }

        try {
            const response = await this.apiCall(`/api/reading-goals/${goalId}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showAlert('Цель удалена!', 'success');
                this.loadDashboard();
            }
        } catch (error) {
            this.showAlert('Ошибка при удалении цели', 'danger');
        }
    }

    // Управление модальными окнами
    showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }

    // Показать уведомление
    showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    // Контент для неавторизованных пользователей
    showUnauthenticatedContent() {
        document.getElementById('app-content').innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 text-center">
                    <i class="fas fa-book-reader fa-5x text-primary mb-4"></i>
                    <h2>Отслеживайте свои книги</h2>
                    <p class="lead mb-4">
                        Добавляйте книги, ставьте оценки, пишите отзывы и достигайте целей по чтению.
                    </p>
                    <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <button type="button" class="btn btn-primary btn-lg px-4 gap-3" onclick="showLogin()">
                            Начать сейчас
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-lg px-4" onclick="showRegister()">
                            Регистрация
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Инициализация приложения
window.app = new ReadingTrackerApp();