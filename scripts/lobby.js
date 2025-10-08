// --- Configuración de Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBUuRqZMMIakjLFiVEV6egCwyKxzs6pXXc",
    authDomain: "play-cat-cf754.firebaseapp.com",
    projectId: "play-cat-cf754",
    storageBucket: "play-cat-cf754.firebasestorage.app",
    messagingSenderId: "93048951851",
    appId: "1:93048951851:web:24a2a464f57ae8ba0a466e",
    measurementId: "G-P4G036829P"
};

// --- Importaciones del SDK de Firebase 9 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Inicialización de Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Referencias a elementos del DOM ---
const createNicknameInput = document.getElementById('create-nickname');
const joinNicknameInput = document.getElementById('join-nickname');
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const roomIdInput = document.getElementById('roomIdInput');
const themeToggle = document.getElementById('theme-toggle');
const symbolBtns = document.querySelectorAll('.symbol-btn');
const openJoinModalBtn = document.getElementById('openJoinModalBtn');
const joinGameModal = document.getElementById('joinGameModal');
const closeModalBtn = document.querySelector('.close-modal');

let selectedSymbol = 'X'; // Símbolo por defecto

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


// --- Lógica del Selector de Símbolo ---
symbolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        symbolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSymbol = btn.dataset.symbol;
    });
});

// --- Lógica del Modal ---
openJoinModalBtn.addEventListener('click', () => {
    joinGameModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    joinGameModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === joinGameModal) {
        joinGameModal.style.display = 'none';
    }
});

// --- Lógica para Crear Partida ---
createGameBtn.addEventListener('click', async () => {
    const nickname = createNicknameInput.value.trim();
    if (!nickname) {
        alert('Por favor, ingresa un apodo para crear la partida.');
        return;
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(db, 'games', roomId);

    const playerX = selectedSymbol === 'X' ? { name: nickname, lastActive: serverTimestamp() } : { name: '', lastActive: null };
    const playerO = selectedSymbol === 'O' ? { name: nickname, lastActive: serverTimestamp() } : { name: '', lastActive: null };

    const initialGameState = {
        board: Array(9).fill(' '),
        turn: 'X', // 'X' siempre empieza
        scores: { X: 0, O: 0 },
        players: { X: playerX, O: playerO },
        gameStarter: selectedSymbol,
        status: 'WAITING',
        createdAt: serverTimestamp()
    };

    try {
        await setDoc(gameRef, initialGameState);
        console.log(`Partida creada con ID: ${roomId}`);
        window.location.href = `game.html?room=${roomId}&symbol=${selectedSymbol}`;
    } catch (error) {
        console.error("Error al crear la partida:", error);
        alert("No se pudo crear la partida. Inténtalo de nuevo.");
    }
});

// --- Lógica para Unirse a Partida ---
joinGameBtn.addEventListener('click', async () => {
    const nickname = joinNicknameInput.value.trim();
    const roomId = roomIdInput.value.trim().toUpperCase();

    if (!nickname) {
        alert('Por favor, ingresa un apodo para unirte a la partida.');
        return;
    }
    if (!roomId) {
        alert('Por favor, ingresa un ID de sala.');
        return;
    }

    const gameRef = doc(db, 'games', roomId);

    try {
        const gameSnap = await getDoc(gameRef);

        if (!gameSnap.exists()) {
            alert('Error: La sala no existe.');
            return;
        }

        const gameData = gameSnap.data();
        const playerX_exists = gameData.players.X.name !== '';
        const playerO_exists = gameData.players.O.name !== '';

        if (playerX_exists && playerO_exists) {
            alert('Error: La sala ya está llena.');
            return;
        }
        
        // Determinar qué símbolo le corresponde al jugador que se une
        const symbolToJoin = playerX_exists ? 'O' : 'X';

        await updateDoc(gameRef, {
            [`players.${symbolToJoin}.name`]: nickname,
            [`players.${symbolToJoin}.lastActive`]: serverTimestamp(),
            'status': 'IN_PROGRESS'
        });
        
        console.log(`Uniéndose a la partida: ${roomId} como ${symbolToJoin}`);
        window.location.href = `game.html?room=${roomId}&symbol=${symbolToJoin}`;

    } catch (error) {
        console.error("Error al unirse a la partida:", error);
        alert("No se pudo unir a la partida. Verifica el ID e inténtalo de nuevo.");
    }
});