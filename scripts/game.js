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
const themeToggle = document.getElementById('theme-toggle');
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
 */
function listenToGameChanges() {
    let isFirstLoad = true;
    unsubscribeGame = onSnapshot(gameRef, (docSnap) => {
        if (!docSnap.exists()) {
            alert('La partida ha sido eliminada o no existe.');
            window.location.href = 'index.html';
            return;
        }
        
        const oldStatus = gameData ? gameData.status : null;
        gameData = docSnap.data();
        
        renderUI();
        checkOpponentConnection();
        
        // Mostrar toast solo cuando el estado cambia a FINISHED
        if (oldStatus === 'IN_PROGRESS' && gameData.status === 'FINISHED') {
            if (gameData.winner === playerSymbol) {
                showToast('¡Ganaste la ronda!');
            } else if (gameData.winner === 'draw') {
                showToast('¡Es un empate!');
            } else {
                showToast(`¡${gameData.winner} ha ganado!`);
            }
        }

        // Iniciar el temporizador si no está corriendo y la partida tiene fecha de creación
        if (isFirstLoad && gameData.createdAt) {
            const startTime = gameData.createdAt.toMillis();
            startSessionTimer(startTime);
            isFirstLoad = false;
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
        // Activar/desactivar tablero
        if (gameData.turn !== playerSymbol) {
            boardDiv.classList.add('board-inactive');
        } else {
            boardDiv.classList.remove('board-inactive');
        }
    } else {
        boardDiv.classList.add('board-inactive');
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

        if (cell.trim() !== '') {
            cellDiv.innerHTML = `<span class="symbol">${cell.trim()}</span>`;
            cellDiv.classList.add(cell.trim());
        }
        
        // Resaltar línea ganadora
        if (gameData.winningCombo && gameData.winningCombo.includes(index)) {
            cellDiv.classList.add('winning-cell');
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
        turnIndicator.innerHTML = 'Esperando<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    } else if (gameData.status === 'IN_PROGRESS') {
        turnIndicator.textContent = `Turno de ${gameData.turn}`;
    } else if (gameData.status === 'FINISHED') {
        const winner = gameData.winner; // Usar el ganador guardado
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
        newRoundBtn.style.display = 'flex';
    } else {
        newRoundBtn.style.display = 'none';
    }
}

// ** 5. LÓGICA DEL JUEGO **

/**
 * Maneja el clic en una casilla del tablero.
 */
async function handleCellClick(e) {
    // Usar .closest para asegurar que el clic dentro de la celda (en el span) también funcione
    const cell = e.target.closest('.cell');
    if (!cell) return;

    if (gameData.status !== 'IN_PROGRESS' || gameData.turn !== playerSymbol) {
        return; // No es tu turno o la partida no está en curso
    }

    const index = parseInt(cell.dataset.index);
    if (gameData.board[index] !== ' ') {
        return; // Casilla no vacía
    }

    const newBoard = [...gameData.board];
    newBoard[index] = playerSymbol;

    const result = checkWinner(newBoard);
    const updates = {
        board: newBoard
    };

    if (result) {
        updates.status = 'FINISHED';
        updates.winner = result.winner; // Guardar el ganador
        if (result.winner !== 'draw') {
            updates[`scores.${result.winner}`] = gameData.scores[result.winner] + 1;
            updates.winningCombo = result.combo; // Guardar el combo ganador
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
            return { winner: board[a], combo }; // Retorna ganador y combo
        }
    }

    if (!board.includes(' ')) {
        return { winner: 'draw', combo: null }; // Empate
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
        status: 'IN_PROGRESS',
        winner: null,
        winningCombo: null
    };

    try {
        await updateDoc(gameRef, updates);
    } catch (error) {
        console.error("Error al iniciar nueva ronda:", error);
    }
}

// ** 6. UTILIDADES (HEARTBEAT, TEMPORIZADOR, TOAST) **

/**
 * Muestra una notificación flotante (toast).
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000); // Ocultar después de 4 segundos
}

/**
 * Inicia un intervalo para actualizar el timestamp `lastActive` del jugador.
 */
function startHeartbeat() {
    heartbeatInterval = setInterval(async () => {
        if (gameRef) {
            try {
                await updateDoc(gameRef, {
                    [`players.${playerSymbol}.lastActive`]: serverTimestamp()
                });
            } catch (error) {
                console.error("Error en el heartbeat:", error);
                clearInterval(heartbeatInterval);
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

    const lastActiveMillis = opponent.lastActive.toMillis();
    const now = Date.now();
    const timeSinceActive = now - lastActiveMillis;

    if (timeSinceActive > 65000) { // Más de 65 segundos
        opponentStatusDisplay.textContent = 'Desconectado';
        opponentStatusDisplay.className = 'disconnected';
    } else {
        opponentStatusDisplay.textContent = 'Conectado';
        opponentStatusDisplay.className = 'connected';
    }
}

/**
 * Inicia el temporizador de la sesión de juego.
 */
function startSessionTimer(startTime) {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
}