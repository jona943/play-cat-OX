// Paso 1: Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUuRqZMMIakjLFiVEV6egCwyKxzs6pXXc",
  authDomain: "play-cat-cf754.firebaseapp.com",
  projectId: "play-cat-cf754",
  storageBucket: "play-cat-cf754.firebasestorage.app",
  messagingSenderId: "93048951851",
  appId: "1:93048951851:web:24a2a464f57ae8ba0a466e",
  measurementId: "G-P4G036829P"
};

// Paso 2: Importaciones del SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Inicializa Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ** 1. REFERENCIAS A ELEMENTOS DEL DOM Y ESTADO **

// Referencias a elementos del DOM
const boardDiv = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const scoreX = document.getElementById('score-X');
const scoreO = document.getElementById('score-O');
const playerNameX = document.getElementById('player-name-X');
const playerNameO = document.getElementById('player-name-O');
const newRoundBtn = document.getElementById('new-round-btn');
const roomIdDisplay = document.getElementById('room-id');
const timerDisplay = document.getElementById('timer');
const opponentStatusDisplay = document.getElementById('opponent-status');
const opponentSymbolDisplay = document.getElementById('opponent-symbol');

// Variables de estado del juego
let roomId, playerSymbol, opponentSymbol, gameRef, gameData;
let heartbeatInterval, timerInterval;
let unsubscribeGame = null; // Para detener el listener de Firebase al salir

// ** 2. INICIALIZACIÓN DEL JUEGO **

window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get('room');
    playerSymbol = params.get('symbol');

    if (!roomId || !playerSymbol) {
        alert('Información de la partida no encontrada. Redirigiendo al lobby.');
        window.location.href = 'index.html';
        return;
    }

    opponentSymbol = playerSymbol === 'X' ? 'O' : 'X';
    gameRef = doc(db, "games", roomId);

    roomIdDisplay.textContent = roomId;
    opponentSymbolDisplay.textContent = opponentSymbol;

    listenToGameChanges();
    startHeartbeat();

    boardDiv.addEventListener('click', handleCellClick);
    newRoundBtn.addEventListener('click', startNewRound);
});

// Limpiar intervalos y listeners al salir de la página
window.addEventListener('beforeunload', () => {
    if (unsubscribeGame) {
        unsubscribeGame();
    }
    clearInterval(heartbeatInterval);
    clearInterval(timerInterval);
});

// --- Lógica del Theme Switcher ---
themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Guardar preferencia
});

// Cargar preferencia de tema al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'light';
    }
});


// ** 3. SINCRONIZACIÓN CON FIREBASE **

/**
 * Escucha cambios en el documento de la partida en Firestore.
 * Esta es la función principal que mantiene el juego sincronizado.
 */
function listenToGameChanges() {
    unsubscribeGame = onSnapshot(gameRef, (docSnap) => {
        if (!docSnap.exists()) {
            alert('La partida ha sido eliminada o no existe.');
            window.location.href = 'index.html';
            return;
        }
        gameData = docSnap.data();
        renderUI();
        checkOpponentConnection();
        
        // Iniciar el temporizador si no está corriendo y la partida tiene fecha de creación
        if (!timerInterval && gameData.createdAt) {
            const startTime = gameData.createdAt.toMillis();
            startSessionTimer(startTime);
        }
    });
}

// ** 4. RENDERIZADO DE LA INTERFAZ **

/**
 * Actualiza toda la interfaz de usuario basándose en los datos de Firebase.
 */
function renderUI() {
    if (!gameData) return;

    // Resaltar jugador activo
    document.getElementById('player-info-X').classList.remove('active-turn');
    document.getElementById('player-info-O').classList.remove('active-turn');

    if (gameData.status === 'IN_PROGRESS') {
        const activePlayerInfo = document.getElementById(`player-info-${gameData.turn}`);
        if (activePlayerInfo) {
            activePlayerInfo.classList.add('active-turn');
        }
    }

    renderBoard();
    updateScoresAndNames();
    updateTurnIndicator();
    checkGameStatus();
}

/**
 * Dibuja el tablero en la pantalla.
 */
function renderBoard() {
    boardDiv.innerHTML = '';
    gameData.board.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.dataset.index = index;
        cellDiv.textContent = cell.trim();
        if (cell !== ' ') {
            cellDiv.classList.add(cell);
        }
        boardDiv.appendChild(cellDiv);
    });
}

/**
 * Actualiza los marcadores y nombres de los jugadores.
 */
function updateScoresAndNames() {
    scoreX.textContent = gameData.scores.X;
    scoreO.textContent = gameData.scores.O;
    playerNameX.textContent = gameData.players.X.name || 'Jugador X';
    playerNameO.textContent = gameData.players.O.name || 'Esperando...';
}

/**
 * Muestra a quién le toca jugar o el resultado de la partida.
 */
function updateTurnIndicator() {
    if (gameData.status === 'WAITING') {
        turnIndicator.textContent = 'Esperando al Jugador O';
    } else if (gameData.status === 'IN_PROGRESS') {
        turnIndicator.textContent = `Turno de ${gameData.turn}`;
    } else if (gameData.status === 'FINISHED') {
        const winner = checkWinner(gameData.board);
        if (winner && winner !== 'draw') {
            turnIndicator.textContent = `¡Ganó ${winner}!`;
        } else {
            turnIndicator.textContent = '¡Es un empate!';
        }
    }
}

/**
 * Muestra u oculta el botón de "Nueva Ronda" si la partida ha terminado.
 */
function checkGameStatus() {
    if (gameData.status === 'FINISHED') {
        newRoundBtn.style.display = 'block';
    } else {
        newRoundBtn.style.display = 'none';
    }
}

// ** 5. LÓGICA DEL JUEGO **

/**
 * Maneja el clic en una casilla del tablero.
 * @param {Event} e - El evento de clic.
 */
async function handleCellClick(e) {
    if (e.target.className !== 'cell') return;

    if (gameData.status !== 'IN_PROGRESS' || gameData.turn !== playerSymbol) {
        return; // No es tu turno o la partida no está en curso
    }

    const index = parseInt(e.target.dataset.index);
    if (gameData.board[index] !== ' ') {
        return; // Casilla no vacía
    }

    const newBoard = [...gameData.board];
    newBoard[index] = playerSymbol;

    const winner = checkWinner(newBoard);
    const updates = {
        board: newBoard
    };

    if (winner) {
        updates.status = 'FINISHED';
        if (winner !== 'draw') {
            // Usamos notación de punto para actualizar campos anidados en Firestore
            updates[`scores.${winner}`] = gameData.scores[winner] + 1;
        }
    } else {
        updates.turn = opponentSymbol;
    }

    try {
        await updateDoc(gameRef, updates);
    } catch (error) {
        console.error("Error al realizar el movimiento:", error);
    }
}

/**
 * Comprueba si hay un ganador o si es un empate.
 * @param {string[]} board - El estado actual del tablero.
 * @returns {string|null|'draw'} - 'X', 'O', 'draw', o null si el juego continúa.
 */
function checkWinner(board) {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontales
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticales
        [0, 4, 8], [2, 4, 6]             // Diagonales
    ];

    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Retorna 'X' o 'O'
        }
    }

    if (!board.includes(' ')) {
        return 'draw'; // Empate
    }

    return null; // El juego continúa
}

/**
 * Prepara el estado para una nueva ronda y lo sube a Firebase.
 */
async function startNewRound() {
    if (gameData.status !== 'FINISHED') return;

    const nextStarter = gameData.gameStarter === 'X' ? 'O' : 'X';

    const updates = {
        board: Array(9).fill(' '),
        turn: nextStarter,
        gameStarter: nextStarter,
        status: 'IN_PROGRESS'
    };

    try {
        await updateDoc(gameRef, updates);
    } catch (error) {
        console.error("Error al iniciar nueva ronda:", error);
    }
}

// ** 6. UTILIDADES (HEARTBEAT Y TEMPORIZADOR) **

/**
 * Inicia un intervalo para actualizar el timestamp `lastActive` del jugador.
 * Esto permite detectar si un jugador se ha desconectado.
 */
function startHeartbeat() {
    heartbeatInterval = setInterval(async () => {
        if (gameRef) {
            try {
                // Actualiza el campo 'lastActive' del jugador actual
                await updateDoc(gameRef, {
                    [`players.${playerSymbol}.lastActive`]: serverTimestamp()
                });
            } catch (error) {
                console.error("Error en el heartbeat:", error);
                clearInterval(heartbeatInterval); // Detener si hay un error (ej. permisos)
            }
        }
    }, 30000); // Cada 30 segundos
}

/**
 * Comprueba la última vez que el oponente estuvo activo.
 */
function checkOpponentConnection() {
    const opponent = gameData.players[opponentSymbol];
    if (!opponent || !opponent.lastActive) {
        opponentStatusDisplay.textContent = 'Esperando...';
        opponentStatusDisplay.className = '';
        return;
    }

    // El timestamp de Firestore se convierte a milisegundos
    const lastActiveMillis = opponent.lastActive.toMillis();
    const now = Date.now();
    const timeSinceActive = now - lastActiveMillis;

    if (timeSinceActive > 65000) { // Más de 65 segundos (con un pequeño margen)
        opponentStatusDisplay.textContent = 'Desconectado';
        opponentStatusDisplay.className = 'disconnected';
    } else {
        opponentStatusDisplay.textContent = 'Conectado';
        opponentStatusDisplay.className = 'connected';
    }
}

/**
 * Inicia el temporizador de la sesión de juego.
 * @param {number} startTime - El timestamp de creación de la partida en milisegundos.
 */
function startSessionTimer(startTime) {
    if (timerInterval) clearInterval(timerInterval); // Limpiar intervalo anterior si existe

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
}
