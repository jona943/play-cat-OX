# <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="35" height="35" valign="middle" /> Gato OX — Juego Multijugador en Tiempo Real

[![Language - JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Backend - Firebase Firestore](https://img.shields.io/badge/Backend-Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](#)
[![Markup - HTML5](https://img.shields.io/badge/Markup-HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![Styling - CSS3](https://img.shields.io/badge/Styling-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)

Este proyecto es una aplicación web multijugador en tiempo real del clásico juego **Gato (Tic-Tac-Toe)**. Permite a dos jugadores conectarse remotamente desde diferentes dispositivos, sincronizando cada movimiento al instante mediante **Firebase Firestore**.

[Visualiza la demo interactiva en GitHub Pages](https://jona943.github.io/play-cat-OX/)

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/chrome/chrome-original.svg" width="22" height="22" valign="middle" /> Características Principales

* **Multijugador en Tiempo Real**: Sincronización instantánea de estados y movimientos entre jugadores conectados desde distintos navegadores o teléfonos.
* **Creación y Unión a Salas**: Sistema de lobby donde un jugador genera un código/ID único de sala y el oponente se une directamente.
* **Selector de Símbolo e Inmutabilidad**: El creador de la sala define si inicia con la ficha 'X' u 'O'.
* **Monitoreo de Estado & Heartbeat**: Indicador de conexión activa del oponente en tiempo real y detección automática de victorias, empates y cambio de turnos.
* **Tema Adaptable (Dark / Light Mode)**: Interfaz con soporte para cambio de tema claro u oscuro de forma reactiva.

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" width="22" height="22" valign="middle" /> Estructura del Repositorio

```text
play-cat-OX/
├── index.html                                          # Pantalla de Lobby (crear o unirse a sala)
├── game.html                                           # Tablero principal de juego e interfaz multijugador
├── styles/
│   └── style.css                                       # Hoja de estilos principal, temas y animaciones
├── scripts/
│   ├── lobby.js                                        # Lógica de gestión de salas en Firestore
│   └── game.js                                         # Observador en tiempo real, validación de turnos y victoria
├── img/                                                # Recursos gráficos e isotipos del juego
└── README.md                                           # Documentación técnica del proyecto
```

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vscode/vscode-original.svg" width="22" height="22" valign="middle" /> Arquitectura Técnica

1. **Lobby (`index.html` & `scripts/lobby.js`)**:
   - Captura el apodo del jugador.
   - Crea un nuevo documento en Firestore con el código único de sala o consulta una sala existente para validar el ingreso del oponente. Redirige dinámicamente a `game.html?gameId=ID`.
2. **Partida en Vivo (`game.html` & `scripts/game.js`)**:
   - Escucha activamente con listeners de Firestore (`onSnapshot`) las actualizaciones en tiempo real sobre el documento de la partida.
   - Comprueba combinaciones ganadoras (horizontales, verticales y diagonales) tras cada movimiento y emite el pulso de presencia (*heartbeat*).

---

<p align="center">
  <sub>Gato OX Multijugador — Realtime Firebase Game | Desarrollado por Jonathan Medina</sub>
</p>
