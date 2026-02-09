/* ============================================
   МОДУЛЬ АУТЕНТИФИКАЦИИ
   ============================================ */

// Текущий пользователь
let currentUser = null;

/* ============================================
   РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
   ============================================ */

async function registerUser(email, password, username) {
    try {
        // Проверка наличия Firebase
        if (!window.firebaseAuth) {
            throw new Error('Firebase не настроен. Проверь firebase-config.js');
        }

        // Создание пользователя в Firebase Authentication
        const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Обновление профиля с username
        await user.updateProfile({
            displayName: username
        });

        // Сохранение дополнительной информации в базу данных
        await window.firebaseDB.ref('users/' + user.uid).set({
            username: username,
            email: email,
            createdAt: new Date().toISOString(),
            totalScore: 0,
            level: 1,
            unlockedLevels: ['easy'],
            achievements: []
        });

        console.log('✅ Пользователь успешно зарегистрирован:', username);
        return { success: true, user: user };

    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/* ============================================
   ВХОД В СИСТЕМУ
   ============================================ */

async function loginUser(email, password) {
    try {
        if (!window.firebaseAuth) {
            throw new Error('Firebase не настроен. Проверь firebase-config.js');
        }

        // Вход через Firebase Authentication
        const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ Вход выполнен:', user.displayName || user.email);
        return { success: true, user: user };

    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

/* ============================================
   ВЫХОД ИЗ СИСТЕМЫ
   ============================================ */

async function logoutUser() {
    try {
        await window.firebaseAuth.signOut();
        currentUser = null;
        console.log('✅ Выход выполнен');
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        return { success: false, error: error.message };
    }
}

/* ============================================
   СОХРАНЕНИЕ ПРОГРЕССА ИГРЫ
   ============================================ */

async function saveGameProgress(gameState) {
    try {
        const user = window.firebaseAuth.currentUser;
        if (!user) {
            console.warn('⚠️ Пользователь не авторизован');
            return;
        }

        // Сохраняем данные в Firebase Realtime Database
        await window.firebaseDB.ref('users/' + user.uid + '/gameProgress').set({
            score: gameState.score,
            level: gameState.level,
            streak: gameState.streak,
            unlockedLevels: gameState.unlockedLevels,
            lastPlayed: new Date().toISOString()
        });

        // Обновляем общий счет
        await window.firebaseDB.ref('users/' + user.uid + '/totalScore').set(gameState.score);

        console.log('✅ Прогресс сохранен');
    } catch (error) {
        console.error('❌ Ошибка сохранения прогресса:', error);
    }
}

/* ============================================
   ЗАГРУЗКА ПРОГРЕССА ИГРЫ
   ============================================ */

async function loadGameProgress() {
    try {
        const user = window.firebaseAuth.currentUser;
        if (!user) return null;

        // Загружаем данные из Firebase
        const snapshot = await window.firebaseDB.ref('users/' + user.uid + '/gameProgress').once('value');
        const progress = snapshot.val();

        if (progress) {
            console.log('✅ Прогресс загружен');
            return progress;
        }

        return null;
    } catch (error) {
        console.error('❌ Ошибка загрузки прогресса:', error);
        return null;
    }
}

/* ============================================
   ПОЛУЧЕНИЕ ТАБЛИЦЫ ЛИДЕРОВ
   ============================================ */

async function getLeaderboard(limit = 10) {
    try {
        const snapshot = await window.firebaseDB.ref('users')
            .orderByChild('totalScore')
            .limitToLast(limit)
            .once('value');

        const leaderboard = [];
        snapshot.forEach((child) => {
            const userData = child.val();
            leaderboard.push({
                username: userData.username,
                score: userData.totalScore || 0,
                level: userData.level || 1
            });
        });

        // Сортируем по убыванию
        leaderboard.reverse();

        console.log('✅ Таблица лидеров загружена');
        return leaderboard;

    } catch (error) {
        console.error('❌ Ошибка загрузки лидеров:', error);
        return [];
    }
}

/* ============================================
   ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ АВТОРИЗАЦИИ
   ============================================ */

function initAuthStateListener() {
    if (!window.firebaseAuth) {
        console.warn('⚠️ Firebase Auth не инициализирован');
        return;
    }

    console.log('👂 Устанавливаем слушатель состояния авторизации...');

    window.firebaseAuth.onAuthStateChanged(async (user) => {
        console.log('🔄 Auth state changed. User:', user ? user.email : 'null');
        
        if (user) {
            // Пользователь вошел в систему или сессия восстановлена после перезагрузки
            currentUser = user;
            console.log('✅ Пользователь авторизован:', user.displayName || user.email);
            console.log('📧 Email:', user.email);
            console.log('🆔 UID:', user.uid);

            // ВАЖНО: Сначала показываем UI пользователя
            console.log('🎨 Вызываем showUserInfo...');
            showUserInfo(user);

            // Загружаем прогресс
            console.log('📥 Загружаем прогресс игры...');
            try {
                const progress = await loadGameProgress();
                if (progress) {
                    console.log('✅ Прогресс загружен:', progress);
                    
                    // Восстанавливаем состояние игры
                    gameState.score = progress.score || 0;
                    gameState.level = progress.level || 1;
                    gameState.streak = progress.streak || 0;
                    gameState.unlockedLevels = progress.unlockedLevels || ['easy'];
                    
                    console.log('🎮 Игровое состояние восстановлено:', gameState);
                    
                    updateStats();
                    
                    // Обновляем UI разблокированных уровней
                    if (progress.unlockedLevels) {
                        console.log('🔓 Разблокируем уровни:', progress.unlockedLevels);
                        progress.unlockedLevels.forEach(level => {
                            unlockLevelCard(level);
                        });
                    }
                } else {
                    console.log('ℹ️ Нет сохраненного прогресса');
                }
            } catch (error) {
                console.error('❌ Ошибка загрузки прогресса:', error);
            }
            
        } else {
            // Пользователь вышел
            currentUser = null;
            console.log('👋 Пользователь не авторизован');
            showAuthUI();
        }
    });
    
    console.log('✅ Слушатель состояния авторизации установлен');
}

/* ============================================
   ОБРАБОТКА ОШИБОК
   ============================================ */

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Этот email уже используется',
        'auth/invalid-email': 'Неверный формат email',
        'auth/operation-not-allowed': 'Операция не разрешена',
        'auth/weak-password': 'Слишком слабый пароль (минимум 6 символов)',
        'auth/user-disabled': 'Этот аккаунт отключен',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/too-many-requests': 'Слишком много попыток. Попробуй позже',
        'auth/network-request-failed': 'Ошибка сети. Проверь интернет'
    };

    return errorMessages[errorCode] || 'Неизвестная ошибка: ' + errorCode;
}

/* ============================================
   ВАЛИДАЦИЯ ДАННЫХ
   ============================================ */

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateUsername(username) {
    return username.length >= 3 && username.length <= 20;
}

/* ============================================
   ЭКСПОРТ ФУНКЦИЙ
   ============================================ */

// Делаем функции доступными глобально
window.authModule = {
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    saveProgress: saveGameProgress,
    loadProgress: loadGameProgress,
    getLeaderboard: getLeaderboard,
    getCurrentUser: () => currentUser,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateUsername: validateUsername
};

/* ============================================
   ОТОБРАЖЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
   ============================================ */

function showUserInfo(user) {
    console.log('🎨 showUserInfo вызвана для:', user ? user.email : 'null');
    
    if (!user) {
        console.error('❌ showUserInfo: user is null!');
        return;
    }
    
    // Скрываем кнопку входа
    const authTrigger = document.getElementById('auth-trigger');
    console.log('🔍 auth-trigger элемент:', authTrigger);
    if (authTrigger) {
        authTrigger.style.display = 'none';
        console.log('✅ Кнопка входа скрыта');
    } else {
        console.error('❌ auth-trigger не найден!');
    }

    // Показываем панель пользователя
    const userPanel = document.getElementById('user-panel');
    console.log('🔍 user-panel элемент:', userPanel);
    if (userPanel) {
        userPanel.style.display = 'flex';
        console.log('✅ Панель пользователя показана (display: flex)');
        
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        
        console.log('🔍 user-name элемент:', userName);
        console.log('🔍 user-email элемент:', userEmail);
        
        if (userName) {
            userName.textContent = user.displayName || 'Používateľ';
            console.log('✅ Username установлен:', userName.textContent);
        } else {
            console.error('❌ user-name элемент не найден!');
        }
        
        if (userEmail) {
            userEmail.textContent = user.email;
            console.log('✅ Email установлен:', userEmail.textContent);
        } else {
            console.error('❌ user-email элемент не найден!');
        }
        
        // ВАЖНО! Подключаем кнопку logout после показа панели
        console.log('🔘 Подключаем кнопку logout после показа панели...');
        setTimeout(function() {
            if (typeof attachLogoutButton === 'function') {
                attachLogoutButton();
            } else {
                console.warn('⚠️ attachLogoutButton не определена');
                // Подключаем вручную если функции нет
                const btn = document.getElementById('logout-button');
                if (btn) {
                    btn.onclick = function() {
                        console.log('🖱️ КЛИК (inline handler)');
                        if (typeof handleLogout === 'function') {
                            handleLogout();
                        }
                    };
                    console.log('✅ Кнопка подключена вручную');
                }
            }
        }, 100);
        
    } else {
        console.error('❌ Элемент user-panel не найден в DOM!');
        console.log('🔍 Все div элементы на странице:', document.querySelectorAll('div'));
    }
}

function showAuthUI() {
    console.log('🎨 showAuthUI вызвана');
    
    // Показываем кнопку входа
    const authTrigger = document.getElementById('auth-trigger');
    if (authTrigger) {
        authTrigger.style.display = 'block';
        console.log('✅ Кнопка входа показана');
    }

    // Скрываем панель пользователя
    const userPanel = document.getElementById('user-panel');
    if (userPanel) {
        userPanel.style.display = 'none';
        console.log('✅ Панель пользователя скрыта');
    }
}

// Делаем функции глобально доступными
window.showUserInfo = showUserInfo;
window.showAuthUI = showAuthUI;

/* ============================================
   ЭКСПОРТ ФУНКЦИЙ
   ============================================ */

// Делаем функции доступными глобально
window.authModule = {
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    saveProgress: saveGameProgress,
    loadProgress: loadGameProgress,
    getLeaderboard: getLeaderboard,
    getCurrentUser: () => currentUser,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateUsername: validateUsername
};

// Инициализация при загрузке
console.log('🔍 Проверка Firebase Auth:', typeof window.firebaseAuth);
if (typeof window.firebaseAuth !== 'undefined') {
    console.log('🚀 Инициализация auth state listener...');
    initAuthStateListener();
} else {
    console.warn('⚠️ Firebase Auth не загружен. Проверь firebase-config.js');
    // Попробуем еще раз через секунду
    setTimeout(() => {
        if (typeof window.firebaseAuth !== 'undefined') {
            console.log('🚀 Повторная инициализация auth state listener...');
            initAuthStateListener();
        }
    }, 1000);
}
