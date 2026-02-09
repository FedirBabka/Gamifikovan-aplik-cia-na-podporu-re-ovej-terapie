/* ============================================
   HERNÝ STAV - Globálna premenná pre celú aplikáciu
   ============================================ */

// Tento objekt ukladá všetky dôležité informácie o hre
const gameState = {
    currentLevel: 'easy',           // Aktuálne vybraná úroveň obtiažnosti
    score: 0,                        // Celkové body hráča
    level: 1,                        // Level hráča (zvyšuje sa po dokončení úrovne)
    streak: 0,                       // Počet správnych odpovedí za sebou
    currentExerciseIndex: 0,         // Index aktuálneho cvičenia v poli
    correctAnswers: 0,               // Počet správnych odpovedí v aktuálnej úrovni
    unlockedLevels: ['easy']         // Pole odomknutých úrovní (na začiatku len 'easy')
};

/* ============================================
   DATABÁZA CVIČENÍ - TU PRIDÁVAŠ NOVÉ CVIČENIA!
   ============================================ */

// Objekt s cvičeniami rozdelený podľa úrovní obtiažnosti
const exercises = {
    // ========== ĽAHKÁ ÚROVEŇ ==========
    // Jednoduché slová, vhodné pre začiatočníkov
    easy: [
        // --- CVIČENIA NA ZVUK "R" ---
        { 
            word: 'RYBA',                                    // Slovo ktoré sa má vysloviť
            instruction: 'Povedz slovo s písmenom R:',       // Inštrukcia pre dieťa
            category: 'r-sound'                               // Kategória cvičenia (pre budúce filtrovanie)
        },
        { word: 'RUKA', instruction: 'Povedz slovo s písmenom R:', category: 'r-sound' },
        { word: 'RAK', instruction: 'Povedz slovo s písmenom R:', category: 'r-sound' },
        
        // --- CVIČENIA NA ZVUK "L" ---
        { word: 'LOPTA', instruction: 'Povedz slovo s písmenom L:', category: 'l-sound' },
        { word: 'LISKA', instruction: 'Povedz slovo s písmenom L:', category: 'l-sound' },
        { word: 'LES', instruction: 'Povedz slovo s písmenom L:', category: 'l-sound' },
        
        // --- CVIČENIA NA ZVUK "S" ---
        { word: 'SOVA', instruction: 'Povedz slovo s písmenom S:', category: 's-sound' },
        { word: 'SYR', instruction: 'Povedz slovo s písmenom S:', category: 's-sound' },
        { word: 'SOM', instruction: 'Povedz slovo s písmenom S:', category: 's-sound' }
    ],
    
    // ========== STREDNÁ ÚROVEŇ ==========
    // Zložitejšie slová s viacerými problematickými zvukmi
    medium: [
        { word: 'RÁNO', instruction: 'Povedz toto slovo jasne:', category: 'r-sound' },
        { word: 'KRAVA', instruction: 'Povedz toto slovo jasne:', category: 'r-sound' },
        { word: 'LAMPA', instruction: 'Povedz toto slovo jasne:', category: 'l-sound' },
        { word: 'VLAK', instruction: 'Povedz toto slovo jasne:', category: 'l-sound' },
        { word: 'SLNKO', instruction: 'Povedz toto slovo jasne:', category: 's-sound' },
        { word: 'STROM', instruction: 'Povedz toto slovo jasne:', category: 's-sound' },
        { word: 'PRÁCA', instruction: 'Povedz toto slovo jasne:', category: 'complex' },
        { word: 'KRESLO', instruction: 'Povedz toto slovo jasne:', category: 'complex' }
    ],
    
    // ========== ŤAŽKÁ ÚROVEŇ ==========
    // Náročné slová a frázy
    hard: [
        { word: 'STRIEBORNÝ', instruction: 'Povedz túto náročnú frázu:', category: 'complex' },
        { word: 'PRETEKY', instruction: 'Povedz túto náročnú frázu:', category: 'complex' },
        { word: 'KRÁTKA CESTA', instruction: 'Povedz túto frázu jasne:', category: 'phrases' },
        { word: 'RÝCHLY VLAK', instruction: 'Povedz túto frázu jasne:', category: 'phrases' },
        { word: 'SLNEČNÝ DEŇ', instruction: 'Povedz túto frázu jasne:', category: 'phrases' },
        { word: 'ZELENÉ LÍSTKY', instruction: 'Povedz túto frázu jasne:', category: 'phrases' }
    ]
    
    /* 
    ============================================
    AKO PRIDAŤ NOVÚ ÚROVEŇ?
    ============================================
    1. Pridaj nový kľúč do exercises objektu (napr. 'expert')
    2. Definuj pole s cvičeniami rovnako ako vyššie
    3. V HTML pridaj novú kartu úrovne s data-level="expert"
    4. Upraviť pole "levels" v funkcii completeLevel() (riadok cca 320)
    
    Príklad:
    expert: [
        { word: 'PRIEHĽADNÝ', instruction: 'Vyslov toto slovo:', category: 'expert' },
        { word: 'ROZPRÁVKA', instruction: 'Vyslov toto slovo:', category: 'expert' }
    ]
    */
};

/* ============================================
   DOM ELEMENTY - Odkazy na HTML elementy
   ============================================ */

// Získanie odkazov na všetky dôležité elementy z HTML
const levelSelection = document.getElementById('level-selection');     // Sekcia s výberom úrovní
const exerciseArea = document.getElementById('exercise-area');           // Sekcia s cvičeniami
const wordDisplay = document.getElementById('word-display');             // Element kde sa zobrazuje slovo
const instruction = document.getElementById('instruction');              // Element s inštrukciou
const voiceBtn = document.getElementById('voice-btn');                   // Tlačidlo mikrofónu
const feedback = document.getElementById('feedback');                    // Panel s feedbackom
const progressFill = document.getElementById('progress-fill');           // Vyplnená časť progress baru
const backBtn = document.getElementById('back-btn');                     // Tlačidlo späť
const nextBtn = document.getElementById('next-btn');                     // Tlačidlo ďalej
const scoreDisplay = document.getElementById('score-display');           // Zobrazenie skóre
const levelDisplay = document.getElementById('level-display');           // Zobrazenie levelu
const streakDisplay = document.getElementById('streak-display');         // Zobrazenie série
const levelCompleteModal = document.getElementById('level-complete-modal'); // Modálne okno
const modalText = document.getElementById('modal-text');                 // Text v modálnom okne
const continueBtn = document.getElementById('continue-btn');             // Tlačidlo pokračovať
const celebration = document.getElementById('celebration');              // Kontajner na konfety

/* ============================================
   ПОСТОЯННЫЙ ДОСТУП К МИКРОФОНУ (для file://)
   ============================================ */

/*
  РЕШЕНИЕ ПРОБЛЕМЫ С ПОСТОЯННЫМИ ЗАПРОСАМИ РАЗРЕШЕНИЯ!
  
  Стратегия: Запрашиваем разрешение MediaStream ОДИН РАЗ,
  потом останавливаем его, но разрешение остаётся в памяти браузера
  на время сессии. Web Speech API может использовать это разрешение.
*/

let microphonePermissionGranted = false;

// Функция для получения разрешения микрофона (вызывается ОДИН РАЗ)
async function requestMicrophonePermission() {
    if (microphonePermissionGranted) {
        console.log('✅ Разрешение уже получено');
        return true;
    }
    
    try {
        console.log('🎤 Запрашиваем разрешение микрофона...');
        
        // Запрашиваем доступ к микрофону
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        console.log('✅ Разрешение получено!');
        
        // ВАЖНО: Останавливаем поток сразу после получения разрешения
        // Разрешение остаётся валидным в текущей сессии
        stream.getTracks().forEach(track => {
            track.stop();
            console.log('🛑 MediaStream трек остановлен');
        });
        
        microphonePermissionGranted = true;
        console.log('💡 Разрешение сохранено для сессии');
        console.log('💡 Web Speech API может теперь использовать микрофон без повторных запросов');
        
        return true;
    } catch (error) {
        console.error('❌ Не удалось получить разрешение:', error);
        microphonePermissionGranted = false;
        
        const errorMessages = {
            'NotAllowedError': 'Prístup k mikrofónu bol zamietnutý.\n\nKlikni znova a povol prístup.',
            'NotFoundError': 'Mikrofón nebol nájdený.\n\nSkontroluj či je mikrofón pripojený.',
            'NotReadableError': 'Mikrofón je používaný inou aplikáciou.\n\nZavri ostatné aplikácie.',
            'SecurityError': 'Bezpečnostné obmedzenie.'
        };
        
        const message = errorMessages[error.name] || 'Neznáma chyba: ' + error.message;
        alert('⚠️ Chyba mikrofónu\n\n' + message);
        
        return false;
    }
}

/* ============================================
   WEB SPEECH API - ROZPOZNÁVANIE HLASU
   ============================================ */

/*
  TOTO JE NAJDÔLEŽITEJŠIA ČASŤ - TU SA PRIPÁJA "PLUGIN"!
  
  Web Speech API je vstavaná funkcia v moderných prehliadačoch (Chrome, Edge).
  Nie je to externý plugin - je to súčasť prehliadača!
  
  RIEŠENIE PROBLÉMU S OPAKOVANÝM ŽIADANÍM POVOLENIA:
  Namiesto spúšťania a zastavenia recognition pri každom použití,
  spustíme ho RAZ a necháme bežať NEUSTÁLE v pozadí.
  Keď používateľ klikne na mikrofón, len "počúvame" výsledok.
*/

// Získanie správnej verzie SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecognitionActive = false;  // Sledujeme či recognition beží
let isListening = false;          // Sledujeme či práve počúvame používateľa

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    
    // === KĽÚČOVÉ NASTAVENIE! ===
    recognition.lang = 'sk-SK';
    recognition.continuous = true;        // ← ZMENA! Teraz beží NEUSTÁLE
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    console.log('✅ Web Speech API inicializované');
    
    // Spustíme recognition HNEĎ pri načítaní stránky
    // Toto požiada o povolenie LEN RAZ
    setTimeout(function() {
        startContinuousRecognition();
    }, 1000);
}

// Funkcia na spustenie neustáleho rozpoznávania
// Функция для запуска continuous recognition с постоянным разрешением
async function startContinuousRecognition() {
    if (!recognition) return;
    
    // Если recognition уже активен, не запускаем снова
    if (isRecognitionActive) {
        console.log('ℹ️ Recognition už beží');
        return;
    }
    
    // ПЕРВЫЙ ЗАПУСК - получаем разрешение микрофона ОДИН РАЗ
    if (!microphonePermissionGranted) {
        console.log('🔵 Prvý štart - žiadam o povolenie mikrofónu...');
        
        const granted = await requestMicrophonePermission();
        
        if (!granted) {
            console.error('❌ Povolenie nebolo udelené');
            return;
        }
        
        console.log('✅ Povolenie získané!');
        console.log('💡 Odteraz už nebude pýtať pri každom použití!');
        
        // Малая пауза для надежности
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Теперь запускаем recognition (уже не будет спрашивать!)
    try {
        recognition.start();
        isRecognitionActive = true;
        console.log('🎤 Continuous recognition spustené');
        console.log('✅ Mikrofón sa aktivuje LEN keď hovoríš');
    } catch (error) {
        if (error.message && error.message.includes('already started')) {
            console.log('ℹ️ Recognition už beží');
            isRecognitionActive = true;
        } else {
            console.error('❌ Chyba pri spustení:', error);
        }
    }
}

// Keď recognition skončí (chyba alebo iné), reštartujeme ho
if (recognition) {
    recognition.onend = function() {
        console.log('🔄 Recognition sa ukončilo, reštartujeme...');
        isRecognitionActive = false;
        
        // Reštart po malej pauze
        setTimeout(function() {
            startContinuousRecognition();
        }, 100);
    };
    
    recognition.onerror = function(event) {
        console.log('⚠️ Recognition error:', event.error);
        
        // Ak je chyba "no-speech", ignorujeme (to je normálne)
        if (event.error === 'no-speech') {
            console.log('ℹ️ Nikto nehovoril, čakáme ďalej...');
            return;
        }
        
        // Pri iných chybách reštartujeme
        if (event.error !== 'aborted') {
            isRecognitionActive = false;
            setTimeout(function() {
                startContinuousRecognition();
            }, 100);
        }
    };
}

/* ============================================
   INICIALIZÁCIA KARIET ÚROVNÍ
   ============================================ */

// Nájdeme všetky karty úrovní a pridáme im event listener
document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', function() {
        // Získame hodnotu atribútu data-level (easy, medium, hard)
        const level = this.dataset.level;
        
        // Skontrolujeme či je táto úroveň odomknutá
        if (!gameState.unlockedLevels.includes(level)) {
            // Ak nie, zobrazíme správu
            showMessage('Táto úroveň je uzamknutá! Dokonči predchádzajúcu úroveň.', 'info');
            return; // Ukončíme funkciu - nepovoľujeme pokračovanie
        }
        
        // Ak je úroveň odomknutá, nastavíme ju ako aktuálnu
        gameState.currentLevel = level;
        gameState.currentExerciseIndex = 0; // Reset indexu cvičenia
        startExercises(); // Spustíme cvičenia
    });
});

/* ============================================
   SPUSTENIE CVIČENÍ
   ============================================ */

// Funkcia ktorá sa volá po výbere úrovne
function startExercises() {
    // Skryjeme výber úrovní
    levelSelection.style.display = 'none';
    // Zobrazíme sekciu s cvičeniami
    exerciseArea.style.display = 'block';
    // Načítame prvé cvičenie
    loadExercise();
}

/* ============================================
   NAČÍTANIE CVIČENIA
   ============================================ */

// Funkcia ktorá načíta aktuálne cvičenie na obrazovku
function loadExercise() {
    // Získame pole cvičení pre aktuálnu úroveň (easy/medium/hard)
    const currentExercises = exercises[gameState.currentLevel];
    
    // Získame konkrétne cvičenie podľa indexu
    const exercise = currentExercises[gameState.currentExerciseIndex];
    
    // Ak cvičenie neexistuje (došli nám cvičenia), ukončíme úroveň
    if (!exercise) {
        completeLevel();
        return;
    }

    // Zobrazíme slovo a inštrukciu na obrazovke
    wordDisplay.textContent = exercise.word;           // Nastavíme slovo
    instruction.textContent = exercise.instruction;     // Nastavíme inštrukciu
    
    // Skryjeme feedback a tlačidlo "Ďalej"
    feedback.style.display = 'none';
    nextBtn.style.display = 'none';
    
    // Vypočítame a zobrazíme progress (koľko % je hotových)
    const progress = ((gameState.currentExerciseIndex + 1) / currentExercises.length) * 100;
    progressFill.style.width = progress + '%'; // Nastavíme šírku progress baru
}

/* ============================================
   SPUSTENIE ROZPOZNÁVANIA HLASU
   ============================================ */

// Event listener na tlačidlo mikrofónu
voiceBtn.addEventListener('click', async function() {
    // Kontrola či prehliadač podporuje rozpoznávanie
    if (!recognition) {
        alert('Tvoj prehliadač nepodporuje rozpoznávanie hlasu. Skús Chrome alebo Edge.');
        return;
    }

    // Ak recognition ešte nebeží, spustíme ho
    if (!isRecognitionActive) {
        console.log('🔄 Recognition nie je aktívny, spúšťam...');
        startContinuousRecognition();
        
        // Počkáme kým sa spustí
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Teraz len nastavíme že POČÚVAME
    isListening = true;
    
    // Zmeníme vzhľad tlačidla
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '<span>🎤</span><span>Počúvam...</span>';
    
    console.log('👂 Čakám na tvoj hlas...');
});

/* ============================================
   EVENT HANDLERY PRE WEB SPEECH API
   ============================================ */

if (recognition) {
    // === KEĎŽE SA ROZPOZNÁ HLAS ===
    recognition.onresult = function(event) {
        // Ak NEPOČÚVAME (tlačidlo nebolo stlačené), ignorujeme
        if (!isListening) {
            console.log('🔇 Rozpoznaný hlas, ale nepočúvame - ignorujem');
            return;
        }
        
        // Získame rozpoznaný text
        const resultIndex = event.results.length - 1;
        const transcript = event.results[resultIndex][0].transcript.toUpperCase().trim();
        
        console.log('🎤 Rozpoznané:', transcript);
        
        // Získame slovo ktoré má byť vyslovené
        const currentWord = wordDisplay.textContent;
        
        // Prestaneme počúvať
        isListening = false;
        
        // Vrátime tlačidlo do normálneho stavu
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<span>🎤</span><span>Stlač a hovor</span>';
        
        // Skontrolujeme odpoveď
        checkAnswer(transcript, currentWord);
    };

    // Poznámka: onend a onerror sú už definované vyššie
}

/* ============================================
   KONTROLA ODPOVEDE
   ============================================ */

// Funkcia ktorá porovná vyslovené slovo s očakávaným
function checkAnswer(spoken, expected) {
    // Normalizujeme obe slová (odstránime diakritiku, medzery atď.)
    const normalizedSpoken = normalizeText(spoken);
    const normalizedExpected = normalizeText(expected);
    
    // Kontrolujeme tri podmienky:
    // 1. Vyslovené slovo obsahuje očakávané
    // 2. Očakávané slovo obsahuje vyslovené
    // 3. Podobnosť slov je vyššia ako 60% (používame Levenshtein distance)
    const isCorrect = normalizedSpoken.includes(normalizedExpected) || 
                    normalizedExpected.includes(normalizedSpoken) ||
                    calculateSimilarity(normalizedSpoken, normalizedExpected) > 0.6;
    
    if (isCorrect) {
        // === SPRÁVNA ODPOVEĎ ===
        gameState.correctAnswers++;                    // Zvýšime počet správnych odpovedí
        gameState.streak++;                            // Zvýšime streak (sériu)
        gameState.score += 10 * gameState.streak;      // Pridáme body (viac bodov za streak!)
        showFeedback('Výborně! 🎉', true);            // Zobrazíme zelený feedback
        createConfetti();                              // Spustíme konfety
        nextBtn.style.display = 'inline-block';        // Zobrazíme tlačidlo "Ďalej"
    } else {
        // === NESPRÁVNA ODPOVEĎ ===
        gameState.streak = 0;                          // Resetujeme streak
        showFeedback(`Skús ešte raz! Počul som: "${spoken}"`, false); // Červený feedback
    }
    
    updateStats(); // Aktualizujeme štatistiky na obrazovke
}

/* ============================================
   NORMALIZÁCIA TEXTU
   ============================================ */

// Táto funkcia odstráni diakritiku a medzery pre lepšie porovnávanie
// Napríklad: "KRÁĽ" → "KRAL", "slnečný deň" → "SLNECNYDEN"
function normalizeText(text) {
    return text
        .toUpperCase()                    // Všetko na veľké písmená
        .replace(/[áäâ]/g, 'A')          // á,ä,â → A
        .replace(/[éě]/g, 'E')           // é,ě → E
        .replace(/[íî]/g, 'I')           // í,î → I
        .replace(/[óôö]/g, 'O')          // ó,ô,ö → O
        .replace(/[úůü]/g, 'U')          // ú,ů,ü → U
        .replace(/[ý]/g, 'Y')            // ý → Y
        .replace(/[čć]/g, 'C')           // č,ć → C
        .replace(/[ď]/g, 'D')            // ď → D
        .replace(/[ň]/g, 'N')            // ň → N
        .replace(/[řŕ]/g, 'R')           // ř,ŕ → R
        .replace(/[šś]/g, 'S')           // š,ś → S
        .replace(/[ť]/g, 'T')            // ť → T
        .replace(/[žź]/g, 'Z')           // ž,ź → Z
        .replace(/[ľĺ]/g, 'L')           // ľ,ĺ → L
        .replace(/\s+/g, '');             // Odstránime všetky medzery
}

/* ============================================
   VÝPOČET PODOBNOSTI SLOV
   ============================================ */

// Táto funkcia vypočíta ako veľmi sú si slová podobné (0.0 = úplne rozdielne, 1.0 = identické)
function calculateSimilarity(str1, str2) {
    // Určíme ktorý string je dlhší
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    // Ak je dlhší string prázdny, sú identické
    if (longer.length === 0) return 1.0;
    
    // Vypočítame "edit distance" (koľko zmien treba na zmenu jedného slova na druhé)
    const editDistance = levenshteinDistance(longer, shorter);
    
    // Vrátime podobnosť ako percento (0.0 - 1.0)
    return (longer.length - editDistance) / longer.length;
}

/* ============================================
   LEVENSHTEIN DISTANCE ALGORITMUS
   ============================================ */

/*
  Tento algoritmus počíta minimálny počet operácií potrebných na zmenu
  jedného slova na druhé. Operácie: vloženie, zmazanie, nahradenie písmena.
  
  Príklad:
  "KRAVA" → "RAVA" = 1 operácia (zmazanie K)
  "LOPTA" → "LOMTA" = 1 operácia (nahradenie P za M)
  
  Čím menší výsledok, tým sú si slová podobnejšie!
*/
function levenshteinDistance(str1, str2) {
    // Vytvoríme 2D maticu pre dynamické programovanie
    const matrix = [];
    
    // Inicializácia prvého stĺpca (0, 1, 2, 3...)
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    // Inicializácia prvého riadku (0, 1, 2, 3...)
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // Vypĺňanie matice
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            // Ak sú písmená rovnaké, skopírujeme hodnotu z diagonály
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                // Inak vyberieme minimum z troch možností a pridáme 1
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,  // Nahradenie
                    matrix[i][j - 1] + 1,      // Vloženie
                    matrix[i - 1][j] + 1       // Zmazanie
                );
            }
        }
    }
    
    // Vrátíme hodnotu v pravom dolnom rohu (celková vzdialenosť)
    return matrix[str2.length][str1.length];
}

/* ============================================
   POMOCNÉ FUNKCIE PRE POUŽÍVATEĽSKÉ ROZHRANIE
   ============================================ */

// Zobrazenie feedbacku (zelený = správne, červený = nesprávne)
function showFeedback(message, isCorrect) {
    feedback.textContent = message;
    feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    feedback.style.display = 'block';
}

// Aktualizácia štatistík na obrazovke
function updateStats() {
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;
    streakDisplay.textContent = gameState.streak;
}

// Vytvorenie konfiet (30 kusov rôznych farieb)
function createConfetti() {
    const colors = ['#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];
    
    // Vytvoríme 30 konfiet
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';  // Náhodná pozícia X
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)]; // Náhodná farba
        confetti.style.animationDelay = Math.random() * 0.5 + 's'; // Náhodné oneskorenie
        celebration.appendChild(confetti);
        
        // Po 3 sekundách konfetu odstránime
        setTimeout(() => confetti.remove(), 3000);
    }
}

/* ============================================
   EVENT LISTENERY PRE NAVIGAČNÉ TLAČIDLÁ
   ============================================ */

// Tlačidlo "Ďalej" - načíta ďalšie cvičenie
nextBtn.addEventListener('click', function() {
    gameState.currentExerciseIndex++; // Zvýšime index
    loadExercise();                    // Načítame ďalšie cvičenie
});

// Tlačidlo "Späť" - návrat na výber úrovní
backBtn.addEventListener('click', function() {
    exerciseArea.style.display = 'none';       // Skryjeme cvičenia
    levelSelection.style.display = 'block';    // Zobrazíme výber úrovní
    gameState.currentExerciseIndex = 0;        // Resetujeme index
    gameState.correctAnswers = 0;              // Resetujeme správne odpovede
});

/* ============================================
   DOKONČENIE ÚROVNE
   ============================================ */

function completeLevel() {
    // Vypočítame úspešnosť (koľko % cvičení bolo správnych)
    const totalExercises = exercises[gameState.currentLevel].length;
    const successRate = (gameState.correctAnswers / totalExercises) * 100;
    
    // Nastavíme text v modálnom okne
    modalText.innerHTML = `
        Získal si <strong>${gameState.score} bodov</strong>!<br>
        Úspešnosť: <strong>${Math.round(successRate)}%</strong>
    `;
    
    // Zobrazíme modálne okno
    levelCompleteModal.style.display = 'flex';
    createConfetti(); // Spustíme konfety
    
    // === ODOMKNUTIE ĎALŠEJ ÚROVNE ===
    // Ak má úspešnosť 70% alebo viac, odomkneme ďalšiu úroveň
    if (successRate >= 70) {
        const levels = ['easy', 'medium', 'hard']; // Zoznam všetkých úrovní
        const currentIndex = levels.indexOf(gameState.currentLevel);
        
        // Ak existuje ďalšia úroveň
        if (currentIndex < levels.length - 1) {
            const nextLevel = levels[currentIndex + 1];
            
            // Ak ešte nie je odomknutá, odomkneme ju
            if (!gameState.unlockedLevels.includes(nextLevel)) {
                gameState.unlockedLevels.push(nextLevel); // Pridáme do odomknutých
                gameState.level++;                         // Zvýšime level hráča
                unlockLevelCard(nextLevel);                // Vizuálne odomkneme kartu
            }
        }
    }
    
    gameState.correctAnswers = 0; // Resetujeme počítadlo
}

// Vizuálne odomknutie karty úrovne
function unlockLevelCard(level) {
    const card = document.querySelector(`[data-level="${level}"]`);
    if (card) {
        card.classList.remove('locked'); // Odstránime triedu "locked"
        const lockIcon = card.querySelector('.lock-icon');
        if (lockIcon) lockIcon.remove(); // Odstránime ikonu zámku
    }
}

// Tlačidlo "Pokračovať" v modálnom okne
continueBtn.addEventListener('click', function() {
    levelCompleteModal.style.display = 'none';   // Skryjeme modálne okno
    exerciseArea.style.display = 'none';         // Skryjeme cvičenia
    levelSelection.style.display = 'block';      // Zobrazíme výber úrovní
});

// Zobrazenie dočasnej správy
function showMessage(message, type) {
    const tempFeedback = document.createElement('div');
    tempFeedback.className = 'feedback ' + type;
    tempFeedback.textContent = message;
    tempFeedback.style.display = 'block';
    tempFeedback.style.position = 'fixed';
    tempFeedback.style.top = '50%';
    tempFeedback.style.left = '50%';
    tempFeedback.style.transform = 'translate(-50%, -50%)';
    tempFeedback.style.zIndex = '3000';
    document.body.appendChild(tempFeedback);
    
    setTimeout(() => tempFeedback.remove(), 2000); // Odstránime po 2 sekundách
}

/* ============================================
   INICIALIZÁCIA APLIKÁCIE
   ============================================ */

// Pri načítaní stránky aktualizujeme štatistiky
updateStats();
