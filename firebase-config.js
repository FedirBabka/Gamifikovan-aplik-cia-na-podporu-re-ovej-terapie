/* ============================================
   FIREBASE КОНФИГУРАЦИЯ
   ============================================ */

/*
  ВАЖНО! Перед использованием нужно:
  1. Создать проект на https://firebase.google.com/
  2. Включить Authentication (Email/Password)
  3. Создать Realtime Database или Firestore
  4. Скопировать конфигурацию сюда
*/

// Здесь будет твоя конфигурация из Firebase Console
const firebaseConfig = {

    apiKey: "AIzaSyAviQI9lE19-hnhr8nf4MnqCSnohwBEpfU",

    authDomain: "fedir-babka.firebaseapp.com",

    databaseURL: "https://fedir-babka-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "fedir-babka",

    storageBucket: "fedir-babka.firebasestorage.app",

    messagingSenderId: "138349727254",

    appId: "1:138349727254:web:9516f5a5bad4302b36ef37"

};

/*
  ============================================
  КАК ПОЛУЧИТЬ СВОЮ КОНФИГУРАЦИЮ:
  ============================================
  
  1. Иди на https://console.firebase.google.com/
  2. Создай новый проект (или выбери существующий)
  3. Нажми на иконку настроек (⚙️) → Project Settings
  4. Прокрути вниз до "Your apps"
  5. Нажми на значок </> (Web)
  6. Скопируй объект firebaseConfig
  7. Вставь его выше вместо примера
  
  ============================================
  ЧТО НУЖНО ВКЛЮЧИТЬ В FIREBASE:
  ============================================
  
  1. Authentication:
     - Build → Authentication → Get Started
     - Sign-in method → Email/Password → Enable
  
  2. Realtime Database:
     - Build → Realtime Database → Create Database
     - Start in test mode (для разработки)
     
  3. Правила безопасности (позже):
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
*/

// Инициализация Firebase (только если конфигурация настроена)
let app, auth, database;

try {
    // Инициализируем Firebase
    app = firebase.initializeApp(firebaseConfig);
    
    // Получаем сервисы
    auth = firebase.auth();           // Аутентификация
    database = firebase.database();   // База данных
    
    // ============================================
    // ВКЛЮЧАЕМ ПОСТОЯННОЕ СОХРАНЕНИЕ СЕССИИ
    // ============================================
    // Это гарантирует, что пользователь останется в системе
    // даже после закрытия браузера или перезагрузки страницы
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('✅ Firebase подключен с сохранением сессии!');
        })
        .catch((error) => {
            console.warn('⚠️ Не удалось установить persistence:', error);
        });
    
    console.log('✅ Firebase успешно подключен!');
} catch (error) {
    console.error('❌ Ошибка подключения к Firebase:', error);
    console.log('💡 Не забудь настроить firebaseConfig в firebase-config.js!');
}

// Экспортируем для использования в других файлах
window.firebaseAuth = auth;
window.firebaseDB = database;
