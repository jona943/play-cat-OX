
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
const nicknameInput = document.getElementById('nickname');
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const roomIdInput = document.getElementById('roomIdInput');

// --- Lógica para Crear Partida ---
createGameBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('Por favor, ingresa un apodo.');
        return;
    }

    // Genera un ID de sala único y simple
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(db, 'games', roomId);

    const initialGameState = {
        board: Array(9).fill(' '),
        turn: 'X',
        scores: { X: 0, O: 0 },
        players: {
            X: { name: nickname, lastActive: serverTimestamp() },
            O: { name: '', lastActive: null }
        },
        gameStarter: 'X',
        status: 'WAITING', // Esperando a que se una el jugador O
        createdAt: serverTimestamp()
    };

    try {
        await setDoc(gameRef, initialGameState);
        console.log(`Partida creada con ID: ${roomId}`);
        window.location.href = `game.html?room=${roomId}&symbol=X`;
    } catch (error) {
        console.error("Error al crear la partida:", error);
        alert("No se pudo crear la partida. Inténtalo de nuevo.");
    }
});

// --- Lógica para Unirse a Partida ---
joinGameBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    const roomId = roomIdInput.value.trim().toUpperCase();

    if (!nickname) {
        alert('Por favor, ingresa un apodo.');
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

        if (gameData.players.O.name !== '') {
            alert('Error: La sala ya está llena.');
            return;
        }

        // El jugador O se une, la partida comienza
        await updateDoc(gameRef, {
            'players.O.name': nickname,
            'players.O.lastActive': serverTimestamp(),
            'status': 'IN_PROGRESS'
        });
        
        console.log(`Uniéndose a la partida: ${roomId}`);
        window.location.href = `game.html?room=${roomId}&symbol=O`;

    } catch (error) {
        console.error("Error al unirse a la partida:", error);
        alert("No se pudo unir a la partida. Verifica el ID e inténtalo de nuevo.");
    }
});
