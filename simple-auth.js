/* ============================================
   ИДЕАЛЬНАЯ СИСТЕМА АВТОРИЗАЦИИ
   ============================================ */

let currentUser = null;

/* ============================================
   РЕГИСТРАЦИЯ
   ============================================ */
async function doRegister(email, password, username) {
    try {
        console.log('📝 Начинаем регистрацию:', email, username);
        
        // Создаем пользователя
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log('✅ Пользователь создан в Firebase Auth');
        
        // ВАЖНО! Обновляем displayName
        await userCredential.user.updateProfile({ 
            displayName: username 
        });
        console.log('✅ DisplayName установлен:', username);
        
        // Сохраняем в базу данных
        await firebase.database().ref('users/' + userCredential.user.uid).set({
            username: username,
            email: email,
            createdAt: new Date().toISOString(),
            totalScore: 0,
            level: 1,
            unlockedLevels: ['easy']
        });
        console.log('✅ Данные сохранены в базу');
        
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        return { success: false, error: getErrorText(error.code) };
    }
}

/* ============================================
   ВХОД
   ============================================ */
async function doLogin(email, password) {
    try {
        console.log('🔑 Вход:', email);
        await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('✅ Вход успешен');
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        return { success: false, error: getErrorText(error.code) };
    }
}

/* ============================================
   ВЫХОД
   ============================================ */
async function doLogout() {
    console.log('🚪 Выход начат');
    
    try {
        // Сохраняем прогресс
        if (currentUser) {
            await firebase.database().ref('users/' + currentUser.uid + '/gameProgress').set({
                score: gameState.score,
                level: gameState.level,
                unlockedLevels: gameState.unlockedLevels,
                lastPlayed: new Date().toISOString()
            });
            console.log('💾 Прогресс сохранен');
        }
        
        // Выходим
        await firebase.auth().signOut();
        console.log('✅ Выход успешен');
        
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        return { success: false, error: error.message };
    }
}

/* ============================================
   ПОКАЗАТЬ/СКРЫТЬ ПАРОЛЬ
   ============================================ */
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈'; // Скрыть пароль
    } else {
        input.type = 'password';
        icon.textContent = '👁️'; // Показать пароль
    }
}

window.togglePasswordVisibility = togglePasswordVisibility;

/* ============================================
   ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ
   ============================================ */
firebase.auth().onAuthStateChanged(async function(user) {
    console.log('🔄 Auth state changed');
    
    if (user) {
        // ПОЛЬЗОВАТЕЛЬ ВОШЕЛ
        currentUser = user;
        
        // Перезагружаем данные пользователя чтобы получить актуальный displayName
        await user.reload();
        const freshUser = firebase.auth().currentUser;
        
        console.log('✅ Пользователь:', freshUser.email);
        console.log('👤 DisplayName:', freshUser.displayName);
        console.log('🆔 UID:', freshUser.uid);
        
        // ПОКАЗЫВАЕМ ПАНЕЛЬ ПОЛЬЗОВАТЕЛЯ
        document.getElementById('auth-trigger').style.display = 'none';
        document.getElementById('user-panel').style.display = 'flex';
        
        // Устанавливаем имя и email
        const displayName = freshUser.displayName || 'User';
        document.getElementById('user-name').textContent = displayName;
        document.getElementById('user-email').textContent = freshUser.email;
        
        console.log('✅ UI обновлен. Имя:', displayName);
        
        // ЗАГРУЖАЕМ ПРОГРЕСС
        try {
            const snapshot = await firebase.database().ref('users/' + freshUser.uid + '/gameProgress').once('value');
            const progress = snapshot.val();
            
            if (progress) {
                console.log('📥 Прогресс найден:', progress);
                
                gameState.score = progress.score || 0;
                gameState.level = progress.level || 1;
                gameState.unlockedLevels = progress.unlockedLevels || ['easy'];
                
                updateStats();
                
                // Разблокируем уровни
                (progress.unlockedLevels || ['easy']).forEach(function(lvl) {
                    const card = document.querySelector('[data-level="' + lvl + '"]');
                    if (card) {
                        card.classList.remove('locked');
                        const lock = card.querySelector('.lock-icon');
                        if (lock) lock.remove();
                    }
                });
                
                console.log('✅ Прогресс загружен');
            } else {
                console.log('ℹ️ Нет сохраненного прогресса');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки прогресса:', error);
        }
        
    } else {
        // ПОЛЬЗОВАТЕЛЬ ВЫШЕЛ
        currentUser = null;
        console.log('👋 Пользователь вышел');
        
        // СКРЫВАЕМ ПАНЕЛЬ
        document.getElementById('auth-trigger').style.display = 'block';
        document.getElementById('user-panel').style.display = 'none';
        
        // СБРОС ИГРЫ
        gameState.score = 0;
        gameState.level = 1;
        gameState.unlockedLevels = ['easy'];
        updateStats();
        
        // Блокируем уровни
        document.querySelectorAll('.level-card').forEach(function(card) {
            if (card.dataset.level !== 'easy') {
                card.classList.add('locked');
                if (!card.querySelector('.lock-icon')) {
                    const lock = document.createElement('div');
                    lock.className = 'lock-icon';
                    lock.textContent = '🔒';
                    card.appendChild(lock);
                }
            }
        });
    }
});

/* ============================================
   ОБРАБОТЧИКИ ФОРМ
   ============================================ */

// РЕГИСТРАЦИЯ
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('📝 Submit регистрации');
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-password-confirm').value;
    
    // Валидация
    if (username.length < 3) {
        alert('Používateľské meno musí mať aspoň 3 znaky!');
        return;
    }
    
    if (password.length < 6) {
        alert('Heslo musí mať aspoň 6 znakov!');
        return;
    }
    
    if (password !== confirm) {
        alert('Heslá sa nezhodujú!');
        return;
    }
    
    // Регистрация
    const result = await doRegister(email, password, username);
    
    if (result.success) {
        closeModal('register-modal');
        alert('✅ Registrácia úspešná! Vitaj, ' + username + '!');
        
        // Очищаем форму
        document.getElementById('register-form').reset();
    } else {
        alert('❌ Chyba: ' + result.error);
    }
});

// ВХОД
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('🔑 Submit входа');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Vyplň všetky polia!');
        return;
    }
    
    const result = await doLogin(email, password);
    
    if (result.success) {
        closeModal('login-modal');
        alert('✅ Prihlásenie úspešné! Vitaj späť!');
        
        // Очищаем форму
        document.getElementById('login-form').reset();
    } else {
        alert('❌ Chyba: ' + result.error);
    }
});

// ВЫХОД
document.getElementById('logout-btn').addEventListener('click', async function() {
    console.log('🖱️ Клик на выход');
    
    if (confirm('Naozaj sa chceš odhlásiť?')) {
        const result = await doLogout();
        
        if (result.success) {
            alert('✅ Odhlásenie úspešné! Dovidenia!');
        } else {
            alert('❌ Chyba: ' + result.error);
        }
    }
});

/* ============================================
   МОДАЛЬНЫЕ ОКНА
   ============================================ */
function openModal(id) {
    console.log('📂 Открываем модальное окно:', id);
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    console.log('📁 Закрываем модальное окно:', id);
    document.getElementById(id).style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;

/* ============================================
   ПЕРЕВОД ОШИБОК
   ============================================ */
function getErrorText(code) {
    const errors = {
        'auth/email-already-in-use': 'Tento email už je použitý',
        'auth/invalid-email': 'Neplatný email',
        'auth/weak-password': 'Slabé heslo (min. 6 znakov)',
        'auth/user-not-found': 'Používateľ neexistuje',
        'auth/wrong-password': 'Nesprávne heslo',
        'auth/too-many-requests': 'Príliš veľa pokusov. Skús neskôr.'
    };
    return errors[code] || code;
}

console.log('✅ Nová ideálna systém авторизации загружена');
