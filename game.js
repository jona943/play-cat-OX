// Paso 1: Copia la configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUuRqZMMIakjLFiVEV6egCwyKxzs6pXXc",
  authDomain: "play-cat-cf754.firebaseapp.com",
  projectId: "play-cat-cf754",
  storageBucket: "play-cat-cf754.firebasestorage.app",
  messagingSenderId: "93048951851",
  appId: "1:93048951851:web:24a2a464f57ae8ba0a466e",
  measurementId: "G-P4G036829P"
};

// Paso 2: Importa y usa las funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtiene una referencia a Cloud Firestore
const db = getFirestore(app);

// ¡A partir de aquí, puedes empezar a escribir la lógica de tu juego!
// Por ejemplo, para crear una nueva partida en la colección 'games':
// await setDoc(doc(db, "games", "partida_123"), { /* datos del juego */ });


// ------------------------------------------------------------------
// -- El código anterior ha sido comentado porque usa una versión --
// -- antigua del SDK de Firebase. Deberás adaptarlo para que    --
// -- funcione con Firestore y el nuevo SDK modular.             --
// ------------------------------------------------------------------

/*

// ** 1. INICIALIZACIÓN Y CONFIGURACIÓN **
// firebase.initializeApp(firebaseConfig); // <- Comentado: Reemplazado por initializeApp
// const database = firebase.database(); // <- Comentado: Reemplazado por getFirestore

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

// Obtener parámetros de la URL y empezar el juego
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
    // gameRef = database.ref('games/' + roomId); // <- Comentado: Necesita ser adaptado a Firestore
    
    // Ejemplo de cómo sería con Firestore:
    // gameRef = doc(db, "games", roomId);

    roomIdDisplay.textContent = roomId;
    opponentSymbolDisplay.textContent = opponentSymbol;

    listenToGameChanges();
    startHeartbeat();

    boardDiv.addEventListener('click', handleCellClick);
    newRoundBtn.addEventListener('click', startNewRound);
});

// ** 2. SINCRONIZACIÓN CON FIREBASE **

/**
 * Escucha cambios en el nodo de la partida en Firebase.
 * Esta es la función principal que mantiene el juego sincronizado.
 *
function listenToGameChanges() {
    // gameRef.on('value', (snapshot) => { ... }); // <- Comentado: Reemplazado por onSnapshot
    
    // Ejemplo de cómo sería con Firestore:
    // onSnapshot(gameRef, (docSnap) => {
    //     if (!docSnap.exists()) {
    //         alert('La partida ha sido eliminada o no existe.');
    //         window.location.href = 'index.html';
    //         return;
    //     }
    //     gameData = docSnap.data();
    //     renderUI();
    //     checkOpponentConnection();
    //     if (!timerInterval && gameData.createdAt) {
    //         startSessionTimer(gameData.createdAt);
    //     }
    // });
}

// ** 3. RENDERIZADO DE LA INTERFAZ **

/**
 * Actualiza toda la interfaz de usuario basándose en los datos de Firebase.
 *
function renderUI() {
    renderBoard();
    updateScoresAndNames();
    updateTurnIndicator();
    checkGameStatus();
}

/**
 * Dibuja el tablero en la pantalla.
 *
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
 *
function updateScoresAndNames() {
    scoreX.textContent = gameData.scores.X;
    scoreO.textContent = gameData.scores.O;
    playerNameX.textContent = gameData.players.X.name || 'Jugador X';
    playerNameO.textContent = gameData.players.O.name || 'Esperando...';
}

/**
 * Muestra a quién le toca jugar o el resultado de la partida.
 *
function updateTurnIndicator() {
    if (gameData.status === 'IN_PROGRESS') {
        turnIndicator.textContent = `Turno de ${gameData.turn}`;
    } else if (gameData.status === 'FINISHED') {
        const winner = checkWinner(gameData.board);
        if (winner && winner !== 'draw') {
            turnIndicator.textContent = `¡Ganó ${winner}!`;
        } else {
            turnIndicator.textContent = '¡Es un empate!';
        }
    }
     else if (gameData.status === 'WAITING') {
        turnIndicator.textContent = 'Esperando al Jugador O';
    }
}

/**
 * Muestra u oculta el botón de "Nueva Ronda" si la partida ha terminado.
 *
function checkGameStatus() {
    if (gameData.status === 'FINISHED') {
        newRoundBtn.style.display = 'block';
    } else {
        newRoundBtn.style.display = 'none';
    }
}

// ** 4. LÓGICA DEL JUEGO **

/**
 * Maneja el clic en una casilla del tablero.
 * @param {Event} e - El evento de clic.
 *
function handleCellClick(e) {
    if (e.target.className !== 'cell') return; // Clic fuera de una casilla

    // Validaciones para permitir el movimiento
    if (gameData.status !== 'IN_PROGRESS') return;
    if (gameData.turn !== playerSymbol) return; // No es tu turno

    const index = parseInt(e.target.dataset.index);
    if (gameData.board[index] !== ' ') return; // Casilla no vacía

    // Realizar el movimiento
    const newBoard = [...gameData.board];
    newBoard[index] = playerSymbol;

    const winner = checkWinner(newBoard);
    const updates = {};

    if (winner) {
        updates.status = 'FINISHED';
        if (winner !== 'draw') {
            updates[`scores/${winner}`] = gameData.scores[winner] + 1;
        }
    } else {
        updates.turn = opponentSymbol;
    }
    updates.board = newBoard;

    // Enviar el estado actualizado a Firebase
    // gameRef.update(updates); // <- Comentado: Necesita ser adaptado a Firestore
    
    // Ejemplo de cómo sería con Firestore:
    // updateDoc(gameRef, updates);
}

/**
 * Comprueba si hay un ganador o si es un empate.
 * @param {string[]} board - El estado actual del tablero.
 * @returns {string|null|'draw'} - 'X', 'O', 'draw', o null si el juego continúa.
 *
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
 *
function startNewRound() {
    if (gameData.status !== 'FINISHED') return;

    // Alternar quién empieza la siguiente ronda
    const nextStarter = gameData.gameStarter === 'X' ? 'O' : 'X';

    const updates = {
        board: Array(9).fill(' '),
        turn: nextStarter,
        gameStarter: nextStarter,
        status: 'IN_PROGRESS'
    };

    // gameRef.update(updates); // <- Comentado: Necesita ser adaptado a Firestore
    // Ejemplo de cómo sería con Firestore:
    // updateDoc(gameRef, updates);
}

// ** 5. UTILIDADES (HEARTBEAT Y TEMPORIZADOR) **

/**
 * Inicia un intervalo para actualizar el timestamp `lastActive` del jugador.
 * Esto permite detectar si un jugador se ha desconectado.
 *
function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        // if (gameRef) { ... } // <- Comentado: Necesita ser adaptado a Firestore
        
        // Ejemplo de cómo sería con Firestore:
        // if (gameRef) {
        //     const playerRef = doc(db, "games", roomId, "players", playerSymbol);
        //     updateDoc(playerRef, { lastActive: serverTimestamp() }); // serverTimestamp necesita importarse
        // }
    }, 30000); // Cada 30 segundos
}

/**
 * Comprueba la última vez que el oponente estuvo activo.
 *
function checkOpponentConnection() {
    const opponent = gameData.players[opponentSymbol];
    if (!opponent || !opponent.lastActive) {
        opponentStatusDisplay.textContent = 'Esperando...';
        opponentStatusDisplay.className = '';
        return;
    }

    const now = Date.now();
    const timeSinceActive = now - opponent.lastActive;

    if (timeSinceActive > 60000) { // Más de 60 segundos
        opponentStatusDisplay.textContent = 'Desconectado';
        opponentStatusDisplay.className = 'disconnected';
    } else {
        opponentStatusDisplay.textContent = 'Conectado';
        opponentStatusDisplay.className = 'connected';
    }
}

/**
 * Inicia el temporizador de la sesión de juego.
 * @param {number} startTime - El timestamp de creación de la partida.
 *
function startSessionTimer(startTime) {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

*/