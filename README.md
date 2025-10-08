# Gato OX - Juego Multijugador en Tiempo Real

Este proyecto es una implementación web del clásico juego "Gato" (Tic-Tac-Toe), diseñado para que dos jugadores puedan competir en tiempo real a través de internet.

## Descripción General

El juego permite a un usuario crear una "sala" de juego y compartir un ID único con un oponente. El oponente puede usar este ID para unirse a la partida. La interacción es instantánea gracias al uso de **Firebase Firestore** como backend para sincronizar el estado del juego entre los dos clientes.

## Características

- **Multijugador en Tiempo Real**: Dos jugadores pueden unirse a una partida desde diferentes dispositivos y ver los movimientos del oponente al instante.
- **Crear y Unirse a Partidas**: Un jugador crea una sala y el otro se une con un código.
- **Selector de Símbolo**: El creador de la partida puede elegir empezar como 'X' o 'O'.
- **Indicadores de Estado**: La interfaz muestra de quién es el turno, el estado de conexión del oponente y el resultado de la partida.
- **Puntuación y Rondas**: El juego lleva la puntuación a través de múltiples rondas.
- **Diseño Adaptable**: Interfaz con tema claro y oscuro.

## ¿Cómo Funciona la Lógica?

La lógica del juego se divide en dos partes principales: el lobby y la partida.

### 1. Lobby (`index.html` y `scripts/lobby.js`)

- El jugador ingresa un apodo.
- Puede optar por **crear una nueva partida**, eligiendo su símbolo ('X' o 'O'). Al hacerlo, se crea un nuevo documento en Firebase con un ID de sala único.
- O puede **unirse a una partida existente** ingresando el ID de la sala proporcionado por otro jugador.
- Una vez que se crea o se une a una sala, el jugador es redirigido a `game.html`.

### 2. Partida (`game.html` y `scripts/game.js`)

- La página se conecta a la sala de juego específica en Firebase usando el ID de la URL.
- **Sincronización con Firebase**: El script `game.js` establece un "listener" (observador) en tiempo real sobre el documento de la partida en Firestore. Cualquier cambio en el documento (como un movimiento del oponente) se refleja inmediatamente en la interfaz del jugador.
- **Manejo de Turnos**: El estado del juego (`gameData`) contiene información sobre de quién es el turno. Un jugador solo puede hacer un movimiento si es su turno.
- **Movimientos**: Cuando un jugador hace clic en una casilla, el tablero se actualiza localmente y luego se envía la actualización a Firebase. El listener del oponente recibe este cambio y actualiza su propia vista.
- **Detección de Ganador**: Después de cada movimiento, una función comprueba si hay una combinación ganadora (línea horizontal, vertical o diagonal) o si el tablero está lleno (empate).
- **Estado de Conexión**: Un sistema de "heartbeat" (latido) actualiza periódicamente una marca de tiempo para cada jugador en Firebase, permitiendo a la interfaz mostrar si el oponente está conectado o desconectado.

## Estructura de Archivos

- `index.html`: Página de inicio para crear o unirse a una partida.
- `game.html`: Página principal donde se desarrolla el juego.
- `styles/style.css`: Hoja de estilos para toda la aplicación.
- `scripts/lobby.js`: Lógica para la creación y unión a salas de juego.
- `scripts/game.js`: Lógica principal del juego, incluyendo la comunicación con Firebase.
- `img/`: Contiene los recursos gráficos.
