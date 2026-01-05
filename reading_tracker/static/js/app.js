    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('login-btn').addEventListener('click', showLogin);
        document.getElementById('register-btn').addEventListener('click', showRegister);
        document.getElementById('start-now-btn').addEventListener('click', showLogin);
        document.getElementById('register-main-btn').addEventListener('click', showRegister);
        
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        document.getElementById('add-book-form').addEventListener('submit', handleAddBook);
    });

    function showLogin() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    function showRegister() {
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    function showAddBookModal() {
        const modal = new bootstrap.Modal(document.getElementById('addBookModal'));
        modal.show();
    }

    function showAlert(message, type = 'info') {
        const container = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });

            if (response.ok) {
                const data = await response.json();
                showAlert('Успешный вход!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                location.reload();
            } else {
                showAlert('Ошибка входа', 'danger');
            }
        } catch (error) {
            showAlert('Ошибка сети', 'danger');
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            if (response.ok) {
                showAlert('Регистрация успешна! Войдите в систему.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
                setTimeout(showLogin, 1000);
            } else {
                const error = await response.json();
                showAlert(error.error || 'Ошибка регистрации', 'danger');
            }
        } catch (error) {
            showAlert('Ошибка сети', 'danger');
        }
    }

    async function handleAddBook(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
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
            const bookResponse = await fetch('/api/books/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify(bookData)
            });

            if (bookResponse.ok) {
                const book = await bookResponse.json();
                
                const entryResponse = await fetch('/api/reading-entries/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken(),
                    },
                    body: JSON.stringify({
                        book: book.id,
                        ...readingEntryData
                    })
                });

                if (entryResponse.ok) {
                    showAlert('Книга добавлена!', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addBookModal')).hide();
                    e.target.reset();
                }
            }
        } catch (error) {
            showAlert('Ошибка при добавлении книги', 'danger');
        }
    }

    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    async function checkAuth() {
        try {
            const response = await fetch('/api/users/current_user/', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                document.getElementById('auth-buttons').style.display = 'none';
                document.getElementById('user-menu').style.display = 'block';
                document.getElementById('username').textContent = user.username;
                document.getElementById('logout-btn').addEventListener('click', logout);
                
                showAuthenticatedContent();
            }
        } catch (error) {
            console.log('Пользователь не авторизован');
        }
    }

    async function logout() {
        try {
            await fetch('/api/auth/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                }
            });
            location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async function showAuthenticatedContent() {
        try {
            const response = await fetch('/api/reading-entries/');
            if (response.ok) {
                const books = await response.json();
                displayBooks(books);
            }
        } catch (error) {
            console.error('Error loading books:', error);
        }
    }

    function displayBooks(books) {
        const content = document.getElementById('app-content');
        
        if (books.length === 0) {
            content.innerHTML = `
                <div class="text-center py-4">
                    <h3>Мои книги</h3>
                    <p class="text-muted">У вас пока нет книг</p>
                    <button class="btn btn-primary" onclick="showAddBookModal()">
                        <i class="fas fa-plus"></i> Добавить книгу
                    </button>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Мои книги (${books.length})</h3>
                <button class="btn btn-primary" onclick="showAddBookModal()">
                    <i class="fas fa-plus"></i> Добавить книгу
                </button>
            </div>
            <div class="row">
                ${books.map(book => `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card book-card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${book.book_details.title}</h6>
                                <p class="card-text text-muted">${book.book_details.author}</p>
                                <span class="badge ${getStatusBadgeClass(book.status)}">
                                    ${getStatusText(book.status)}
                                </span>
                                ${book.rating ? `
                                    <div class="mt-2 text-warning">
                                        ${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'want_to_read': 'bg-secondary',
            'reading': 'bg-warning',
            'finished': 'bg-success'
        };
        return classes[status] || 'bg-secondary';
    }

    function getStatusText(status) {
        const texts = {
            'want_to_read': 'Хочу прочитать',
            'reading': 'Читаю',
            'finished': 'Прочитано'
        };
        return texts[status] || status;
    }

    checkAuth();