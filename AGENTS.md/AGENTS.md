# AGENTS.md - 8-Bit Adventure Development

## 🕹️ Game Overview
- **Genre:** 2D Retro Platformer (8-bit style).
- **Core Mechanics:** Left/Right movement, Jump, Coin collection, Enemy avoidance (Red Circle), Level progression.
- **UI:** Top bar includes Score (6 digits), Lives (Hearts), and Level number.

## 🛠️ Tech Stack & Structure
- **Framework:** React + Vite.
- **Styling:** CSS puro con variables para colores 8-bit.
- **Font:** 'Press Start 2P', cursive (importada en index.css).
- **Root Directory:** `./game-8bit/` (Todas las rutas deben ser relativas a esta carpeta).

## 📜 Development Rules
- **Component Patterns:** Usar componentes funcionales de React. Separar la lógica del juego (GameLoop) del renderizado (UI).
- **Assets:** Los sprites deben ser representaciones CSS o SVGs simples para mantener el estilo pixel-art sin depender de archivos externos pesados.
- **New Levels:** Cada nivel debe ser un objeto en un archivo `levels.js` que defina la posición de plataformas, enemigos y monedas.

## 🚀 Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## 🐙 Versión y Git
- **Tooling:** GitHub CLI (`gh`) está configurado y autenticado.
- **Workflow:** Antes de realizar cambios grandes, el agente debe asegurarse de estar en la rama correcta (`git branch`).
- **Commits:** Seguir el estándar de Conventional Commits (ej: `feat:`, `fix:`, `docs:`).