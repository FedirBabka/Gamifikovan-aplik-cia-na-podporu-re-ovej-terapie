/* ============================================
   FIREBASE КОНФИГУРАЦИЯ - ПРИМЕР
   ============================================
   
   Этот файл показывает пример ПРАВИЛЬНОЙ конфигурации.
   Используй его как образец для заполнения firebase-config.js
   
   ============================================ */

// 🔥 ПРИМЕР РЕАЛЬНОЙ КОНФИГУРАЦИИ (с вымышленными данными)
const firebaseConfig_EXAMPLE = {
    // API ключ твоего проекта
    apiKey: "AIzaSyB1234567890abcdefGHIJKLmnopQRSTuvw",
    
    // Домен авторизации (всегда заканчивается на .firebaseapp.com)
    authDomain: "speech-therapy-app-12345.firebaseapp.com",
    
    // URL базы данных (включает регион, например europe-west1)
    databaseURL: "https://speech-therapy-app-12345-default-rtdb.europe-west1.firebasedatabase.app",
    
    // ID проекта
    projectId: "speech-therapy-app-12345",
    
    // Bucket для хранилища
    storageBucket: "speech-therapy-app-12345.appspot.com",
    
    // ID отправителя сообщений
    messagingSenderId: "123456789012",
    
    // ID приложения
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

/* ============================================
   КАК ПОЛУЧИТЬ СВОЮ КОНФИГУРАЦИЮ
   ============================================
   
   1. Иди на https://console.firebase.google.com/
   2. Открой свой проект (или создай новый)
   3. Нажми на ⚙️ Settings → Project settings
   4. Прокрути до "Your apps"
   5. Нажми на </> (Web app)
   6. Если еще не создавал - создай новое веб-приложение
   7. Скопируй весь объект firebaseConfig
   8. Вставь его в файл firebase-config.js
   
   ============================================
   ВАЖНО!
   ============================================
   
   - НЕ публикуй свою конфигурацию в открытом доступе
   - НЕ коммить в Git без .gitignore
   - Для продакшена используй переменные окружения
   - Настрой правила безопасности в Firebase Console
   
   ============================================
   ЧТО ВКЛЮЧИТЬ В FIREBASE CONSOLE
   ============================================
   
   ✅ Authentication:
      Build → Authentication → Get Started
      Sign-in method → Email/Password → Enable
   
   ✅ Realtime Database:
      Build → Realtime Database → Create Database
      Location: europe-west1 (или ближайший)
      Start in: Test mode (для разработки)
   
   ✅ Security Rules (после тестирования):
   
   {
     "rules": {
       "users": {
         "$uid": {
           ".read": "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       },
       "leaderboard": {
         ".read": true,
         ".write": "auth != null"
       }
     }
   }
   
   ============================================ */

// 📋 ПРОВЕРКА КОНФИГУРАЦИИ
function checkFirebaseConfig(config) {
    const required = [
        'apiKey',
        'authDomain',
        'databaseURL',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];
    
    const missing = required.filter(key => !config[key] || config[key].includes('YOUR_'));
    
    if (missing.length > 0) {
        console.error('❌ Отсутствуют поля конфигурации:', missing);
        console.log('💡 Проверь файл firebase-config.js');
        return false;
    }
    
    console.log('✅ Конфигурация Firebase выглядит корректно');
    return true;
}

/* ============================================
   СТРУКТУРА ДАННЫХ В FIREBASE
   ============================================
   
   users/
     └─ {userId}/
         ├─ username: string
         ├─ email: string
         ├─ createdAt: string (ISO date)
         ├─ totalScore: number
         ├─ level: number
         ├─ unlockedLevels: array
         ├─ achievements: array
         └─ gameProgress/
             ├─ score: number
             ├─ level: number
             ├─ streak: number
             ├─ unlockedLevels: array
             ├─ lastPlayed: string (ISO date)
             └─ lastUpdated: timestamp
   
   ============================================ */

/* ============================================
   ТИПИЧНЫЕ ОШИБКИ И ИХ РЕШЕНИЕ
   ============================================
   
   ❌ "Firebase: Firebase App named '[DEFAULT]' already exists"
   ✅ Решение: Firebase уже инициализирован, проверь что
      firebase-config.js подключается только один раз
   
   ❌ "Firebase: Error (auth/invalid-api-key)"
   ✅ Решение: Неверный API ключ, скопируй заново из Console
   
   ❌ "Firebase: Error (auth/project-not-found)"
   ✅ Решение: Неверный projectId, проверь в Console
   
   ❌ "PERMISSION_DENIED: Permission denied"
   ✅ Решение: Настрой правила безопасности в Realtime Database
   
   ❌ Сессия не сохраняется
   ✅ Решение: Убедись что persistence установлен в LOCAL
      (это делается автоматически в firebase-config.js)
   
   ============================================ */
