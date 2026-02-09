/* ============================================
   UI ОБРАБОТЧИКИ ДЛЯ АВТОРИЗАЦИИ
   ============================================ */

/* ============================================
   ОБРАБОТКА РЕГИСТРАЦИИ
   ============================================ */

async function handleRegister(event) {
    event.preventDefault();

    // Получаем значения полей
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    // Очищаем предыдущие ошибки
    hideError('register-error');

    // Валидация
    if (!window.authModule.validateUsername(username)) {
        showError('register-error', 'Používateľské meno musí mať 3-20 znakov');
        return;
    }

    if (!window.authModule.validateEmail(email)) {
        showError('register-error', 'Neplatný formát emailu');
        return;
    }

    if (!window.authModule.validatePassword(password)) {
        showError('register-error', 'Heslo musí mať minimálne 6 znakov');
        return;
    }

    if (password !== passwordConfirm) {
        showError('register-error', 'Heslá sa nezhodujú');
        return;
    }

    // Показываем спиннер
    setButtonLoading('register', true);

    // Регистрация
    const result = await window.authModule.register(email, password, username);

    setButtonLoading('register', false);

    if (result.success) {
        // Успех - закрываем модальное окно
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none'; // Явно скрываем
        }
        
        showSuccessMessage('Účet úspešne vytvorený! Vitaj, ' + username + '! 🎉');
        
        // Очищаем форму
        document.getElementById('register-form').reset();
    } else {
        // Ошибка
        showError('register-error', result.error);
    }
}

/* ============================================
   ОБРАБОТКА ВХОДА
   ============================================ */

async function handleLogin(event) {
    event.preventDefault();
    console.log('🔵 handleLogin вызван');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    console.log('📧 Email:', email);

    hideError('login-error');

    if (!window.authModule.validateEmail(email)) {
        showError('login-error', 'Neplatný formát emailu');
        return;
    }

    if (!password) {
        showError('login-error', 'Zadaj heslo');
        return;
    }

    console.log('🔄 Начинаем вход...');
    setButtonLoading('login', true);

    const result = await window.authModule.login(email, password);
    
    console.log('📨 Результат входа:', result);

    setButtonLoading('login', false);

    if (result.success) {
        console.log('✅ Вход успешный!');
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            console.log('✅ Модальное окно закрыто');
        }
        
        showSuccessMessage('Prihlásenie úspešné! Vitaj späť! 👋');
        document.getElementById('login-form').reset();
        
        // ВАЖНО: Принудительно проверяем состояние после входа
        setTimeout(() => {
            const user = window.firebaseAuth.currentUser;
            console.log('🔍 Проверка пользователя после входа:', user);
            if (user) {
                console.log('👤 Пользователь найден, вызываем showUserInfo вручную');
                // Пытаемся вызвать функцию вручную
                if (typeof showUserInfo === 'function') {
                    showUserInfo(user);
                } else {
                    console.error('❌ showUserInfo не является функцией!');
                }
            } else {
                console.error('❌ Пользователь не найден после входа!');
            }
        }, 1000);
        
    } else {
        console.error('❌ Ошибка входа:', result.error);
        showError('login-error', result.error);
    }
}

/* ============================================
   ОБРАБОТКА ВЫХОДА
   ============================================ */

async function handleLogout() {
    console.log('🔴 handleLogout вызван');
    
    // Показываем СВОЕ модальное окно подтверждения (не browser confirm!)
    showLogoutConfirmModal();
}

// Функция для показа модального окна подтверждения выхода
function showLogoutConfirmModal() {
    console.log('📋 Показываем модальное окно подтверждения выхода');
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'auth-modal active';
    modal.id = 'logout-confirm-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 400px;">
            <div class="auth-header">
                <div class="auth-logo">👋</div>
                <h2>Odhlásenie</h2>
                <p>Naozaj sa chceš odhlásiť?</p>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                <button class="btn btn-secondary" id="logout-cancel-btn" style="flex: 1;">
                    Zrušiť
                </button>
                <button class="btn btn-primary" id="logout-confirm-btn" style="flex: 1; background: #f44336;">
                    Odhlásiť sa
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики кнопок
    document.getElementById('logout-cancel-btn').addEventListener('click', function() {
        console.log('⏹️ Выход отменен');
        modal.remove();
    });
    
    document.getElementById('logout-confirm-btn').addEventListener('click', async function() {
        console.log('✅ Выход подтвержден');
        modal.remove();
        
        // Выполняем выход
        await performLogout();
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            console.log('⏹️ Выход отменен (клик вне окна)');
            modal.remove();
        }
    });
}

// Функция которая реально выполняет выход
async function performLogout() {
    console.log('▶️ Выполняем выход...');
    
    try {
        // Сохраняем прогресс
        console.log('💾 Сохранение прогресса...');
        if (window.authModule && typeof window.authModule.saveProgress === 'function') {
            await window.authModule.saveProgress(gameState);
            console.log('✅ Прогресс сохранен');
        }

        // Выходим
        console.log('🚪 Вызываем logout...');
        const result = await window.authModule.logout();
        console.log('📨 Результат:', result);

        if (result && result.success) {
            console.log('✅ ВЫХОД УСПЕШЕН!');
            showSuccessMessage('Odhlásenie úspešné! Dovidenia! 👋');
            resetGameState();
        } else {
            console.error('❌ Ошибка выхода:', result);
            alert('Chyba pri odhlásení: ' + (result ? result.error : 'Unknown error'));
        }
    } catch (error) {
        console.error('💥 Исключение при выходе:', error);
        alert('Chyba: ' + error.message);
    }
}

// ВАЖНО! Делаем функцию глобальной ДО любого другого кода
window.handleLogout = handleLogout;
console.log('✅ handleLogout установлена как window.handleLogout');
console.log('🔍 Проверка:', typeof window.handleLogout);

/* ============================================
   УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
   ============================================ */

function openAuthModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex'; // Явно показываем
    }
}

function closeAuthModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none'; // Явно скрываем
        
        // Очищаем ошибки
        const errorId = modalId.replace('-modal', '-error');
        hideError(errorId);
    }
}

function switchAuthModal(fromModalId, toModalId) {
    closeAuthModal(fromModalId);
    setTimeout(() => openAuthModal(toModalId), 300);
}

// Закрытие по клику вне модального окна
window.onclick = function(event) {
    if (event.target.classList.contains('auth-modal')) {
        closeAuthModal(event.target.id);
    }
}

// Делаем все функции глобально доступными для onclick в HTML
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthModal = switchAuthModal;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

/* ============================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ============================================ */

function showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function hideError(errorId) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function setButtonLoading(formType, isLoading) {
    const btnText = document.getElementById(`${formType}-btn-text`);
    const spinner = document.getElementById(`${formType}-spinner`);
    const form = document.getElementById(`${formType}-form`);
    const button = form.querySelector('button[type="submit"]');

    if (isLoading) {
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        button.disabled = false;
    }
}

function showSuccessMessage(message) {
    // Создаем временное сообщение
    const msgEl = document.createElement('div');
    msgEl.className = 'success-message';
    msgEl.textContent = message;
    msgEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 1.2em;
        font-weight: bold;
        z-index: 4000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: bounceIn 0.5s ease;
    `;
    
    document.body.appendChild(msgEl);
    
    setTimeout(() => {
        msgEl.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => msgEl.remove(), 300);
    }, 2500);
}

function resetGameState() {
    // Сброс игрового состояния
    gameState.score = 0;
    gameState.level = 1;
    gameState.streak = 0;
    gameState.currentExerciseIndex = 0;
    gameState.correctAnswers = 0;
    gameState.unlockedLevels = ['easy'];
    
    // Обновляем статистику на экране
    updateStats();
    
    // Возвращаемся к выбору уровней (если мы в игре)
    const exerciseArea = document.getElementById('exercise-area');
    const levelSelection = document.getElementById('level-selection');
    if (exerciseArea) exerciseArea.style.display = 'none';
    if (levelSelection) levelSelection.style.display = 'block';
    
    // Блокируем все уровни кроме easy
    document.querySelectorAll('.level-card').forEach(card => {
        const level = card.dataset.level;
        if (level !== 'easy' && !card.classList.contains('locked')) {
            card.classList.add('locked');
            
            // Добавляем замок если его нет
            if (!card.querySelector('.lock-icon')) {
                const lockIcon = document.createElement('div');
                lockIcon.className = 'lock-icon';
                lockIcon.textContent = '🔒';
                card.appendChild(lockIcon);
            }
        }
    });
    
    console.log('🔄 Игровое состояние сброшено');
}

/* ============================================
   АВТОСОХРАНЕНИЕ ПРОГРЕССА
   ============================================ */

// Сохраняем прогресс каждые 30 секунд если пользователь авторизован
setInterval(async () => {
    const user = window.firebaseAuth?.currentUser;
    if (user && gameState.score > 0) {
        await window.authModule.saveProgress(gameState);
        console.log('💾 Прогресс автоматически сохранен');
    }
}, 30000); // 30 секунд

// Сохраняем при закрытии страницы
window.addEventListener('beforeunload', async () => {
    const user = window.firebaseAuth?.currentUser;
    if (user) {
        await window.authModule.saveProgress(gameState);
    }
});

/* ============================================
   АЛЬТЕРНАТИВНОЕ ПОДКЛЮЧЕНИЕ КНОПКИ LOGOUT
   ============================================ */

// Функция для подключения кнопки logout
function attachLogoutButton() {
    console.log('🔘 Пытаемся подключить кнопку logout...');
    
    const logoutBtn = document.getElementById('logout-button');
    console.log('🔍 Кнопка найдена:', logoutBtn);
    
    if (logoutBtn) {
        console.log('✅ Кнопка logout найдена!');
        
        // Способ 1: addEventListener
        logoutBtn.addEventListener('click', function(e) {
            console.log('🖱️ ===== КЛИК! (addEventListener) =====');
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
        
        // Способ 2: onclick (резервный)
        logoutBtn.onclick = function(e) {
            console.log('🖱️ ===== КЛИК! (onclick) =====');
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        };
        
        console.log('✅ Обработчики на кнопку logout добавлены');
        return true;
    } else {
        console.warn('⚠️ Кнопка logout НЕ найдена');
        return false;
    }
}

// Пробуем подключить сразу
if (document.readyState === 'loading') {
    console.log('📄 Документ еще загружается...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM готов');
        setTimeout(attachLogoutButton, 100);
        setTimeout(attachLogoutButton, 500);
        setTimeout(attachLogoutButton, 1000);
        setTimeout(attachLogoutButton, 2000);
    });
} else {
    console.log('📄 Документ уже загружен');
    attachLogoutButton();
    setTimeout(attachLogoutButton, 100);
    setTimeout(attachLogoutButton, 500);
    setTimeout(attachLogoutButton, 1000);
    setTimeout(attachLogoutButton, 2000);
}

// Также пробуем при изменении авторизации
if (window.firebaseAuth) {
    window.firebaseAuth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('👤 Пользователь вошел, пробуем подключить кнопку logout...');
            setTimeout(attachLogoutButton, 100);
            setTimeout(attachLogoutButton, 500);
        }
    });
}
