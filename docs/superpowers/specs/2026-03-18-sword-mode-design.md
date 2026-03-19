# Sword Mode Design Specification

**Date:** 2026-03-18  
**Author:** Alessandro231 (con asistencia de Qwen)  
**Status:** Approved  
**Version:** 1.0

---

## 📋 Overview

### Propósito
Implementar un power-up de "Modo Espada Temporal" que permite al jugador atacar y eliminar enemigos durante un tiempo limitado, añadiendo una capa de profundidad ofensiva al gameplay.

### Scope
- Sistema de bloques ? golpeables
- Power-up de espada con duración limitada
- Mecánica de ataque direccional
- UI de tiempo restante
- Integración con sistema de combate existente

### No-Goals (Fuera de Scope)
- Sistema de combos avanzados
- Múltiples tipos de armas
- Upgrades de espada
- Sistema de experiencia

---

## 🎮 Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DEL POWER-UP ESPADA                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Jugador explora]                                              │
│       ↓                                                         │
│  [Encuentra Bloque ?] → Sprite especial (dorado con "?")       │
│       ↓                                                         │
│  [Salta y golpea desde abajo]                                   │
│       ↓                                                         │
│  [Espada aparece sobre el bloque] → Jugador la recoge           │
│       ↓                                                         │
│  [MODO ESPADA ACTIVO - 10 segundos]                            │
│  • Barra en HUD comienza a vaciarse                            │
│  • Personaje con sprite de espada equipada                     │
│  • Tecla Z ataca en 3 direcciones                              │
│       ↓                                                         │
│  [Último segundo: parpadeo + sin ataque]                       │
│       ↓                                                         │
│  [Espada desaparece] → Vuelve a estado normal                  │
│       ↓                                                         │
│  [Bloque ? → Bloque vacío] (sprite gris, reutilizable)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura Técnica

### Estados del Jugador

```javascript
player: {
  // Estados existentes
  x: number,
  y: number,
  vx: number,
  vy: number,
  onGround: boolean,
  facingRight: boolean,
  
  // Nuevos estados para Modo Espada
  hasSword: boolean,           // ¿Tiene la espada equipada?
  swordTimer: number,          // Tiempo restante en ms
  swordActive: boolean,        // ¿Puede atacar? (false en último segundo)
  isAttacking: boolean,        // ¿Está en animación de ataque?
  attackDirection: 'left' | 'right' | 'up' | null,
  attackTimer: number,         // Timer del cooldown de ataque
}
```

### Estados del Bloque ?

```javascript
powerUpBlock: {
  x: number,
  y: number,
  width: number,
  height: number,
  type: 'sword',               // Tipo de power-up (escalable a otros)
  active: boolean,             // ¿Contiene item?
  hit: boolean,                // ¿Ya fue golpeado?
  animationFrame: number,      // Para animación de flotación
}
```

### Estados del Juego (App)

```javascript
// Nuevos estados en App.jsx
const [swordMode, setSwordMode] = useState(false)
const [swordTimeLeft, setSwordTimeLeft] = useState(0)
const [swordCharges, setSwordCharges] = useState(0) // Para HUD
```

---

## ⚔️ Sistema de Ataque

### Input Mapping

| Input | Condición | Acción |
|-------|-----------|--------|
| `Z` + `→` | hasSword && swordActive && !isAttacking | Atacar derecha |
| `Z` + `←` | hasSword && swordActive && !isAttacking | Atacar izquierda |
| `Z` + `↑` | hasSword && swordActive && !isAttacking | Atacar arriba |

### Hitbox de Ataque

```javascript
// Dimensiones del hitbox según dirección
const ATTACK_HITBOX = {
  horizontal: { width: 40, height: 24, offsetX: 32 },  // Frente al personaje
  upward: { width: 32, height: 32, offsetY: -32 },     // Sobre el personaje
}

// Duración del hitbox activo
const ATTACK_DURATION = 200  // ms
const ATTACK_COOLDOWN = 300  // ms entre ataques
```

### Lógica de Ataque

```
1. Jugador presiona Z + dirección
2. Verificar: hasSword && swordActive && !isAttacking
3. Setear: isAttacking = true, attackDirection = dirección
4. Crear hitbox en la dirección especificada
5. Verificar colisión hitbox vs enemigos
6. Si colisión: eliminar enemigo, +200 puntos
7. Esperar ATTACK_DURATION (200ms)
8. Setear: isAttacking = false
9. Cooldown: ATTACK_COOLDOWN (300ms) antes del siguiente ataque
```

---

## 🎨 Diseño Visual

### HUD - Barra de Espada

```
┌─────────────────────────────────────────────────────────────────┐
│  SCORE: 001200    LIVES: ❤️❤️❤️    LEVEL: 2 - Sky Fortress    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  ⚔️ [████████████████████] 10.0s                               │
└─────────────────────────────────────────────────────────────────┘
```

**Estados de la barra:**

| Tiempo | Apariencia | Comportamiento |
|--------|------------|----------------|
| 10-4s | Barra verde llena | Normal |
| 3-2s | Barra amarilla, 50% | Parpadeo lento (2Hz) |
| 1-0s | Barra roja, 25% | Parpadeo rápido (4Hz), swordActive=false |

### Sprites

#### Jugador

```
Normal:          Con Espada:       Atacando (derecha):
┌────┐          ┌────┐──⚔️         ┌────┐────⚔️⚔️
│░░░░│          │░░░░│              │░░░░│
│░░░░│          │░░░░│              │░░░░│
└────┘          └────┘              └────┘
```

#### Bloques

```
Bloque ?:        Bloque Vacío:     Espada item:
┌────┐           ┌────┐             ┌─⚔️─┐
│ ?  │           │    │             │ ⚔️ │ (flota arriba)
│    │           │ ·· │             └────┘
└────┘           └────┘
(dorado)         (gris)
```

### Animaciones

| Elemento | Duración | Frames | Descripción |
|----------|----------|--------|-------------|
| Bloque ? golpeado | 300ms | 3 | Shake vertical, item spawn |
| Espada flotando | 1000ms | 8 | Float sinusoidal (±5px) |
| Ataque espada | 200ms | 4 | Swing de 45° |
| Parpadeo final | 1000ms | 8 | Alpha 0.5 ↔ 1.0 |

---

## 📊 Balance y Números

### Duración del Power-Up

```javascript
const SWORD_DURATION = 10000        // 10 segundos total
const SWORD_WARNING_TIME = 3000     // 3 segundos antes: advertencia amarilla
const SWORD_CRITICAL_TIME = 1000    // 1 segundo antes: advertencia roja, sin ataque
const SWORD_ACTIVE_TIME = 9000      // Tiempo útil de ataque (0-9s)
```

### Ataque

```javascript
const ATTACK_DURATION = 200         // ms que el hitbox está activo
const ATTACK_COOLDOWN = 300         // ms entre ataques
const ATTACK_DAMAGE = 1             // 1 hit = enemigo eliminado
const ATTACK_POINTS = 200           // Puntos por enemigo
```

### Hitbox

```javascript
const HITBOX_HORIZONTAL = {
  width: 40,
  height: 24,
  offsetX: 32,  // Desde el borde del personaje
  offsetY: 4,
}

const HITBOX_UPWARD = {
  width: 32,
  height: 32,
  offsetX: 0,
  offsetY: -32,  // Sobre el personaje
}
```

### Distribución por Nivel

| Nivel | Nombre | Bloques ? | Ubicación |
|-------|--------|-----------|-----------|
| 1 | Green Hills | 2 | 1 obvio (x: 600), 1 secreto (x: 1400) |
| 2 | Sky Fortress | 3 | Distribuidos (x: 400, 1100, 1900) |
| 3 | Dark Castle | 2 | Bien escondidos (x: 900, 2200) |

---

## 🎮 Controles

### Mapa Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAPA DE CONTROLES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MOVIMIENTO BÁSICO:                                             │
│  • ← / A        → Mover izquierda                               │
│  • → / D        → Mover derecha                                 │
│  • ↑ / W / SPACE → Saltar                                       │
│  • Shift        → Dash                                          │
│                                                                  │
│  CON ESPADA:                                                    │
│  • Z            → Atacar con espada                             │
│  • Z + ←        → Atacar izquierda                              │
│  • Z + →        → Atacar derecha                                │
│  • Z + ↑        → Atacar arriba                                 │
│                                                                  │
│  COMBO POSIBLES:                                                │
│  • Saltar + Z (en aire) → Ataque hacia arriba                  │
│  • Dash + Z → Ataque normal (misma hitbox, sin penalty) [FUTURE]│
│  • Saltar encima de enemigo → Eliminar (sin espada)            │
│  • Z + enemigo → Eliminar (con espada)                         │
│                                                                  │
│  NOTA: Dash + Z está marcado como [FUTURE] - no se implementa  │
│  en esta iteración. Se deja como placeholder para expansión.   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación por Fases

### Fase 1: Sistema de Bloques ? (Día 1)
- [ ] Crear componente `PowerUpBlock` en `levels.js`
- [ ] Implementar detección de golpe desde abajo
- [ ] Animación de bloque golpeado
- [ ] Spawn del item espada

### Fase 2: Power-Up de Espada (Día 2)
- [ ] Recoger item espada
- [ ] Estados `hasSword`, `swordTimer`, `swordActive`
- [ ] Timer de 10 segundos
- [ ] UI de barra en HUD

### Fase 3: Sistema de Ataque (Día 3)
- [ ] Input de tecla Z
- [ ] Detección de dirección
- [ ] Crear hitbox de ataque
- [ ] Colisión hitbox vs enemigos
- [ ] Cooldown y animación

### Fase 4: Pulido Visual (Día 4)
- [ ] Sprite de espada equipada
- [ ] Animación de ataque (swing)
- [ ] Parpadeo de advertencia
- [ ] Sprite de bloque vacío
- [ ] Efectos de partículas (opcional)

### Fase 5: Integración en Niveles (Día 5)
- [ ] Colocar 2-3 bloques por nivel
- [ ] Balance de ubicación
- [ ] Playtesting
- [ ] Ajuste de números

---

## 🧪 Testing Criteria

### Functional Tests

- [ ] Jugador puede golpear bloque ? saltando desde abajo
- [ ] Espada aparece sobre el bloque después de golpear
- [ ] Recoger espada activa el modo por 10 segundos
- [ ] Barra de HUD muestra tiempo restante correctamente
- [ ] Tecla Z ataca en dirección correcta
- [ ] Hitbox elimina enemigos al contactar
- [ ] Cooldown de 300ms entre ataques funciona
- [ ] Último segundo: parpadeo + no puede atacar
- [ ] Bloque se vuelve gris después de usado
- [ ] Espada desaparece a los 10 segundos

### Edge Cases (Comportamientos Definidos)

| Situación | Comportamiento Esperado |
|-----------|------------------------|
| Tiempo se acaba durante ataque | La animación termina pero el hitbox NO daña. Espada desaparece inmediatamente después. |
| 2 enemigos en el hitbox | Ambos son eliminados. Cada uno da +200 puntos (total +400). |
| Golpear bloque ya usado | Nada sucede. El bloque permanece en sprite vacío. |
| Caer al vacío con espada | Espada se pierde inmediatamente. Game over o respawn normal según vidas. |
| Atacar y dash al mismo tiempo | Dash tiene prioridad. El ataque no se ejecuta durante el dash. |
| Enemigo eliminado durante parpadeo | Válido si el hitbox estaba activo. +200 puntos normales. |

---

## 📈 Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Uso de espada | 80% de jugadores la obtienen | Contador de bloques golpeados |
| Satisfacción | 4/5 estrellas | Feedback post-nivel (console.log o localStorage) |
| Balance | 50-70% de enemigos eliminados con espada | Contador de kills con espada vs total |
| Claridad | 90% entiende cómo obtenerla | % de jugadores que golpean bloque en primer intento |

**NOTA:** Las métricas se implementan con localStorage para esta iteración. Analytics externo es FUTURE.

---

## 🔗 Referencias

### Inspiraciones
- **Super Mario Bros:** Estrella de poder (temporal, ofensiva)
- **Zelda:** Ataque con espada direccional
- **Hollow Knight:** Sistema de charms y habilidades temporales
- **Celeste:** Feedback visual claro de estados

### Assets Necesarios
- Sprite de bloque ? (dorado, 32x32px)
- Sprite de bloque vacío (gris, 32x32px)
- Sprite de espada item (flotando, 24x24px)
- Sprite de jugador con espada (variación del actual)
- Frames de animación de ataque (4 frames)
- Icono de espada para HUD (16x16px)

---

## 📝 Changelog

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-03-18 | 1.0 | Diseño inicial aprobado | Alessandro231 |

---

## ✅ Aprobaciones

- [x] Diseño aprobado por usuario
- [ ] Spec review por subagent (pendiente)
- [ ] Plan de implementación (siguiente paso)
