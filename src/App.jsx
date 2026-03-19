import { useState, useEffect, useCallback, useRef } from 'react'
import { loadLevel, hasNextLevel, getNextLevel, LEVELS } from './levels'

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const PLAYER_SIZE = 32
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 5
const DASH_SPEED = 18
const DASH_DURATION = 150
const MAX_DASH_CHARGES = 3
const DASH_RECHARGE_TIME = 2000

// Constantes del sistema de espada
const SWORD_DURATION = 10000        // 10 segundos total
const SWORD_WARNING_TIME = 3000     // 3 segundos: advertencia amarilla
const SWORD_CRITICAL_TIME = 1000    // 1 segundo: advertencia roja, sin ataque
const ATTACK_DURATION = 200         // ms que el hitbox está activo
const ATTACK_COOLDOWN = 300         // ms entre ataques
const ATTACK_POINTS = 200           // Puntos por enemigo
// Sprites 8-bit simplificados (1 = pixel, 0 = transparente)
const PLAYER_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 1, 3, 3, 1, 1, 0],
  [0, 1, 3, 3, 3, 3, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

const COIN_SPRITE = [
  [0, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 0],
]

const ENEMY_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 1, 1, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

// Colores estilo 8-bit
const COLORS = {
  1: '#5D9CEC', // Azul claro
  2: '#4A89DC', // Azul medio
  3: '#326FB5', // Azul oscuro
  sky: '#87CEEB',
  ground: '#8B4513',
  grass: '#228B22',
  coin: '#FFD700',
  coinInner: '#FFA500',
  enemy: '#DC143C',
  enemyInner: '#8B0000',
}

// Colores por nivel para el cielo
const LEVEL_SKY_COLORS = {
  1: '#87CEEB', // Verde hills - cielo azul claro
  2: '#FFB6C1', // Sky fortress - cielo rosado
  3: '#2C3E50', // Dark castle - cielo oscuro
}

function App() {
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState('start')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [dashCharges, setDashCharges] = useState(MAX_DASH_CHARGES)
  const [level, setLevel] = useState(1)
  const [levelName, setLevelName] = useState('')

  const gameRef = useRef({
    player: {
      x: 50, y: 300, vx: 0, vy: 0, onGround: false, facingRight: true,
      isDashing: false, dashTimer: 0,
      // Estados de la espada
      hasSword: false,
      swordTimer: 0,
      swordActive: false,
      isAttacking: false,
      attackDirection: null,
      attackCooldown: 0,
    },
    dashState: { charges: MAX_DASH_CHARGES, rechargeTimer: 0, hasDashed: false, trail: [] },
    keys: {},
    platforms: [],
    coins: [],
    enemies: [],
    powerUpBlocks: [],      // Nuevos: bloques ?
    swordItem: null,        // Item espada flotando
    camera: { x: 0 },
    levelWidth: 2000,
  })

  // Estados React para UI de espada
  const [swordTimeLeft, setSwordTimeLeft] = useState(0)
  const [swordActive, setSwordActive] = useState(false)
  const [playerRefHasSword, setPlayerRefHasSword] = useState(false)

  // Inicializar nivel desde archivo externo
  const initLevel = useCallback((lvlId) => {
    const levelData = loadLevel(lvlId)
    const game = gameRef.current

    // Resetear jugador al spawn point del nivel
    game.player = {
      x: levelData.spawnPoint.x,
      y: levelData.spawnPoint.y,
      vx: 0,
      vy: 0,
      onGround: false,
      facingRight: true,
      isDashing: false,
      dashTimer: 0
    }
    game.dashState = { charges: MAX_DASH_CHARGES, rechargeTimer: 0, hasDashed: false, trail: [] }
    setDashCharges(MAX_DASH_CHARGES)
    game.camera = { x: 0 }
    game.levelWidth = levelData.levelWidth

    // Cargar plataformas
    game.platforms = levelData.platforms

    // Cargar monedas (con estado collected)
    game.coins = levelData.coins.map(coin => ({ ...coin, collected: false }))

    // Cargar enemigos
    game.enemies = levelData.enemies.map(enemy => ({
      ...enemy,
      dead: false,
      hitBySword: false
    }))

    // Cargar bloques ? (power-ups)
    game.powerUpBlocks = levelData.powerUpBlocks ? levelData.powerUpBlocks.map(block => ({
      ...block,
      hit: false,
      animationFrame: 0,
      animationTimer: 0,
    })) : []

    // Item espada (null si no hay ninguno activo)
    game.swordItem = null

    // Resetear estados de espada en el jugador
    game.player.hasSword = false
    game.player.swordTimer = 0
    game.player.swordActive = false

    setSwordTimeLeft(0)
    setSwordActive(false)

    setLevelName(levelData.name)
  }, [])

  // Dibujar sprite pixelado
  const drawSprite = (ctx, sprite, x, y, size, colors) => {
    const pixelSize = size / sprite.length
    sprite.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel !== 0) {
          ctx.fillStyle = colors[pixel] || colors[1]
          ctx.fillRect(
            x + colIndex * pixelSize,
            y + rowIndex * pixelSize,
            pixelSize,
            pixelSize
          )
        }
      })
    })
  }

  // Dibujar jugador
  const drawPlayer = (ctx, player, dashState, timestamp) => {
    // Dibujar after-images
    dashState.trail.forEach(t => {
      ctx.save()
      ctx.globalAlpha = t.alpha
      if (!t.facingRight) {
        ctx.translate(t.x + PLAYER_SIZE, t.y)
        ctx.scale(-1, 1)
        drawSprite(ctx, PLAYER_SPRITE, 0, 0, PLAYER_SIZE, { ...COLORS, 1: '#00FFFF', 2: '#87CEEB', 3: '#4682B4' })
      } else {
        drawSprite(ctx, PLAYER_SPRITE, t.x, t.y, PLAYER_SIZE, { ...COLORS, 1: '#00FFFF', 2: '#87CEEB', 3: '#4682B4' })
      }
      ctx.restore()
    })

    // Hacer parpadear al original si está en dash (faseando)
    if (player.isDashing && Math.floor(timestamp / 30) % 2 === 0) {
      return
    }

    ctx.save()
    if (!player.facingRight) {
      ctx.translate(player.x + PLAYER_SIZE, player.y)
      ctx.scale(-1, 1)
      drawSprite(ctx, PLAYER_SPRITE, 0, 0, PLAYER_SIZE, COLORS)
    } else {
      drawSprite(ctx, PLAYER_SPRITE, player.x, player.y, PLAYER_SIZE, COLORS)
    }

    // Dibujar espada equipada si el jugador la tiene
    if (player.hasSword) {
      drawEquippedSword(ctx, player, player.facingRight, timestamp)
    }

    ctx.restore()
  }

  // Dibujar espada equipada en el jugador
  const drawEquippedSword = (ctx, player, facingRight, time) => {
    const x = player.x
    const y = player.y
    const size = 32

    // Animación de flotación suave de la espada
    const floatY = Math.sin(time / 200) * 2

    ctx.save()

    if (facingRight) {
      // Espada apuntando hacia la derecha (posición de reposo)
      const swordX = x + size - 4
      const swordY = y + 12 + floatY

      // Hoja de la espada
      ctx.fillStyle = '#C0C0C0'  // Plateado
      ctx.fillRect(swordX, swordY, 16, 4)

      // Punta
      ctx.fillStyle = '#E8E8E8'
      ctx.fillRect(swordX + 14, swordY, 4, 4)

      // Guarda
      ctx.fillStyle = '#FFD700'  // Dorado
      ctx.fillRect(swordX - 2, swordY - 4, 6, 12)

      // Mango
      ctx.fillStyle = '#8B4513'  // Marrón
      ctx.fillRect(swordX - 6, swordY - 2, 6, 6)
    } else {
      // Espejo para izquierda
      const swordX = x - 12
      const swordY = y + 12 + floatY

      // Hoja
      ctx.fillStyle = '#C0C0C0'
      ctx.fillRect(swordX, swordY, 16, 4)

      // Punta
      ctx.fillStyle = '#E8E8E8'
      ctx.fillRect(swordX, swordY, 4, 4)

      // Guarda
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(swordX + 14, swordY - 4, 6, 12)

      // Mango
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(swordX + 18, swordY - 2, 6, 6)
    }

    // Brillo de la espada
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'
    ctx.beginPath()
    ctx.arc(x + size/2, y + 16 + floatY, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Obtener hitbox de ataque según dirección
  const getAttackHitbox = (player, direction) => {
    const x = player.x
    const y = player.y

    if (direction === 'right') {
      return { x: x + PLAYER_SIZE, y: y + 4, width: 40, height: 24 }
    } else if (direction === 'left') {
      return { x: x - 40, y: y + 4, width: 40, height: 24 }
    } else if (direction === 'up') {
      return { x: x, y: y - 32, width: 32, height: 32 }
    }
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // Dibujar hitbox de ataque (para debug)
  const drawAttackHitbox = (ctx, player, direction) => {
    if (!player.isAttacking) return

    const hitbox = getAttackHitbox(player, direction)
    ctx.save()
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)
    ctx.restore()
  }

  // Dibujar efecto visual de ataque de espada
  const drawSwordAttack = (ctx, player, direction, timer) => {
    const x = player.x
    const y = player.y
    const progress = timer / ATTACK_DURATION  // 1.0 a 0.0

    ctx.save()

    // Color del efecto (blanco brillante al inicio, se desvanece)
    const alpha = Math.max(0.3, progress) * 0.9
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`
    ctx.lineWidth = 4

    if (direction === 'right') {
      // Arco de ataque hacia la derecha
      const arcX = x + PLAYER_SIZE + 10
      const arcY = y + PLAYER_SIZE / 2

      // Arco principal
      ctx.beginPath()
      ctx.arc(arcX, arcY, 30, -Math.PI / 3, Math.PI / 3, false)
      ctx.stroke()

      // Rastro del ataque (se expande)
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`
      ctx.fillRect(x + PLAYER_SIZE, y + 4, progress * 45, 24)

      // Línea de la espada
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`
      ctx.beginPath()
      ctx.moveTo(x + PLAYER_SIZE, y + 16)
      ctx.lineTo(x + PLAYER_SIZE + progress * 45, y + 16)
      ctx.stroke()

    } else if (direction === 'left') {
      // Arco de ataque hacia la izquierda
      const arcX = x - 10
      const arcY = y + PLAYER_SIZE / 2

      // Arco
      ctx.beginPath()
      ctx.arc(arcX, arcY, 30, Math.PI * 0.67, Math.PI * 1.33, false)
      ctx.stroke()

      // Rastro
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`
      ctx.fillRect(x - progress * 45, y + 4, progress * 45, 24)

      // Línea
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`
      ctx.beginPath()
      ctx.moveTo(x, y + 16)
      ctx.lineTo(x - progress * 45, y + 16)
      ctx.stroke()

    } else if (direction === 'up') {
      // Arco de ataque hacia arriba
      const arcX = x + PLAYER_SIZE / 2
      const arcY = y - 10

      // Arco
      ctx.beginPath()
      ctx.arc(arcX, arcY, 30, Math.PI * 0.9, Math.PI * 2.1, false)
      ctx.stroke()

      // Rastro
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`
      ctx.fillRect(x + 4, y - progress * 40, 24, progress * 40)

      // Línea
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`
      ctx.beginPath()
      ctx.moveTo(x + 16, y)
      ctx.lineTo(x + 16, y - progress * 40)
      ctx.stroke()
    }

    ctx.restore()
  }

  // Dibujar enemigo
  const drawEnemy = (ctx, enemy, time, timestamp) => {
    if (enemy.dead) return  // No dibujar si está muerto

    const squish = Math.sin(time / 100) * 2
    drawSprite(ctx, ENEMY_SPRITE, enemy.x, enemy.y - squish, 32, {
      1: COLORS.enemy,
      2: '#FF6B6B',
      3: COLORS.enemyInner,
    })
  }

  // Dibujar moneda
  const drawCoin = (ctx, coin, time) => {
    if (coin.collected) return
    const bounce = Math.sin(time / 200) * 3
    drawSprite(ctx, COIN_SPRITE, coin.x, coin.y + bounce, 24, {
      1: COLORS.coin,
      2: COLORS.coinInner,
      3: '#FFFF00',
    })
  }

  // Dibujar enemigo
  const drawEnemy = (ctx, enemy, time) => {
    const squish = Math.sin(time / 100) * 2
    drawSprite(ctx, ENEMY_SPRITE, enemy.x, enemy.y - squish, 32, {
      1: COLORS.enemy,
      2: '#FF6B6B',
      3: COLORS.enemyInner,
    })
  }

  // Dibujar bloque ? (power-up)
  const drawPowerUpBlock = (ctx, block, time) => {
    const x = block.x
    const y = block.y
    const size = 32

    // Animación de shake después de golpear
    let shakeX = 0
    if (block.animationTimer > 0) {
      shakeX = Math.sin((block.animationTimer / 300) * Math.PI) * 4
    }

    if (block.active && !block.hit) {
      // Bloque ? activo - dorado con signo de interrogación
      ctx.fillStyle = '#FFD700'  // Dorado
      ctx.fillRect(x + shakeX, y, size, size)

      // Borde más oscuro
      ctx.fillStyle = '#B8860B'
      ctx.fillRect(x + shakeX, y, size, 4)  // Top
      ctx.fillRect(x + shakeX, y + size - 4, size, 4)  // Bottom
      ctx.fillRect(x + shakeX, y, 4, size)  // Left
      ctx.fillRect(x + shakeX + size - 4, y, 4, size)  // Right

      // Signo de interrogación
      ctx.fillStyle = '#8B4513'
      ctx.font = 'bold 24px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', x + shakeX + size / 2, y + size / 2 + 2)

      // Animación de flotación suave
      const floatY = Math.sin(time / 300) * 2
      ctx.fillStyle = '#FFA500'
      ctx.fillRect(x + shakeX + 2, y - 4 + floatY, 4, 4)
    } else {
      // Bloque usado - gris vacío
      ctx.fillStyle = '#696969'  // Gris oscuro
      ctx.fillRect(x + shakeX, y, size, size)

      // Borde más claro
      ctx.fillStyle = '#808080'
      ctx.fillRect(x + shakeX, y, size, 4)
      ctx.fillRect(x + shakeX, y + size - 4, size, 4)
      ctx.fillRect(x + shakeX, y, 4, size)
      ctx.fillRect(x + shakeX + size - 4, y, 4, size)

      // Puntos vacíos
      ctx.fillStyle = '#404040'
      ctx.fillRect(x + shakeX + 8, y + 10, 4, 4)
      ctx.fillRect(x + shakeX + 20, y + 10, 4, 4)
    }
  }

  // Dibujar item espada flotante
  const drawSwordItem = (ctx, item, time) => {
    const x = item.x
    const y = item.y + item.floatOffset
    const size = 24

    // Espada simple pixel-art
    ctx.save()

    // Hoja de la espada
    ctx.fillStyle = '#C0C0C0'  // Plateado
    ctx.fillRect(x + 10, y, 4, 16)

    // Punta de la espada
    ctx.fillStyle = '#E8E8E8'
    ctx.fillRect(x + 10, y, 4, 4)

    // Guarda de la espada
    ctx.fillStyle = '#FFD700'  // Dorado
    ctx.fillRect(x + 6, y + 14, 12, 4)

    // Mango de la espada
    ctx.fillStyle = '#8B4513'  // Marrón
    ctx.fillRect(x + 10, y + 18, 4, 6)

    // Pomelo
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(x + 8, y + 22, 8, 4)

    // Brillo de flotación
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(x + 12, y + 12, 16, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Loop del juego
  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const game = gameRef.current

    let animationId
    let lastTime = 0

    const update = (timestamp) => {
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      const { player, keys, platforms, coins, enemies, camera, levelWidth, powerUpBlocks, swordItem } = game

      // Timer de la espada (si está activa)
      if (player.hasSword && player.swordTimer > 0) {
        player.swordTimer -= deltaTime
        if (player.swordTimer <= 0) {
          // Espada se acaba
          player.hasSword = false
          player.swordActive = false
          setSwordTimeLeft(0)
          setSwordActive(false)
          setPlayerRefHasSword(false)
        } else {
          // Actualizar UI
          const timeLeft = player.swordTimer / 1000
          setSwordTimeLeft(timeLeft)
          // Último segundo: no puede atacar
          player.swordActive = player.swordTimer >= 1000
          setSwordActive(player.swordActive)
          setPlayerRefHasSword(true)
        }
      } else if (player.hasSword) {
        setPlayerRefHasSword(true)
      }

      // Cooldown de ataque
      if (player.attackCooldown > 0) {
        player.attackCooldown -= deltaTime
      }

      // Input de ataque con espada (tecla Z)
      if (player.hasSword && player.swordActive && keys['z'] && player.attackCooldown <= 0) {
        // Determinar dirección del ataque
        let attackDir = null
        if (keys['ArrowRight'] || keys['d']) {
          attackDir = 'right'
          player.facingRight = true
        } else if (keys['ArrowLeft'] || keys['a']) {
          attackDir = 'left'
          player.facingRight = false
        } else if (keys['ArrowUp'] || keys['w']) {
          attackDir = 'up'
        } else {
          // Dirección por defecto: hacia donde mira
          attackDir = player.facingRight ? 'right' : 'left'
        }

        // Iniciar ataque
        player.isAttacking = true
        player.attackDirection = attackDir
        player.attackTimer = ATTACK_DURATION
        player.attackCooldown = ATTACK_COOLDOWN
      }

      // Timer del ataque
      if (player.isAttacking && player.attackTimer > 0) {
        player.attackTimer -= deltaTime
        if (player.attackTimer <= 0) {
          player.isAttacking = false
          player.attackDirection = null
        }
      }

      // Animación de bloques ? golpeados
      powerUpBlocks.forEach(block => {
        if (block.animationTimer > 0) {
          block.animationTimer -= deltaTime
          if (block.animationTimer <= 0) {
            block.animationFrame = 0
          }
        }
      })

      // Recoger item espada
      if (game.swordItem && !game.swordItem.collected) {
        const item = game.swordItem
        // Actualizar flotación
        item.floatTimer += deltaTime
        item.floatOffset = Math.sin(item.floatTimer / 200) * 5

        // Verificar colisión con jugador
        if (
          player.x < item.x + 24 &&
          player.x + PLAYER_SIZE > item.x &&
          player.y < item.y + 24 &&
          player.y + PLAYER_SIZE > item.y
        ) {
          // ¡Recogida!
          item.collected = true
          player.hasSword = true
          player.swordTimer = 10000  // 10 segundos
          player.swordActive = true
          game.swordItem = null
          setSwordTimeLeft(10)
          setSwordActive(true)
        }
      }

      // Movimiento del jugador
      if (player.isDashing) {
        player.dashTimer -= deltaTime
        if (player.dashTimer <= 0) {
          player.isDashing = false
        } else {
          player.vy = 0 // Sin gravedad en el dash
          player.vx = player.facingRight ? DASH_SPEED : -DASH_SPEED
          
          // Crear rastro
          game.dashState.trail.push({ x: player.x, y: player.y, facingRight: player.facingRight, alpha: 0.5 })
        }
      } else {
        if (keys['ArrowLeft'] || keys['a']) {
          player.vx = -MOVE_SPEED
          player.facingRight = false
        } else if (keys['ArrowRight'] || keys['d']) {
          player.vx = MOVE_SPEED
          player.facingRight = true
        } else {
          player.vx = 0
        }

        // Salto
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
          player.vy = JUMP_FORCE
          player.onGround = false
        }
      }

      // Input y control del Dash
      if (keys['Shift'] && game.dashState.charges > 0 && !player.isDashing && !game.dashState.hasDashed) {
        game.dashState.charges--
        setDashCharges(game.dashState.charges)
        player.isDashing = true
        player.dashTimer = DASH_DURATION
        game.dashState.hasDashed = true
      }
      if (!keys['Shift']) {
        game.dashState.hasDashed = false
      }

      // Recarga de Dash
      if (game.dashState.charges < MAX_DASH_CHARGES && !player.isDashing) {
        game.dashState.rechargeTimer += deltaTime
        if (game.dashState.rechargeTimer >= DASH_RECHARGE_TIME) {
          game.dashState.charges++
          game.dashState.rechargeTimer = 0
          setDashCharges(game.dashState.charges)
        }
      } else if (player.isDashing) {
        game.dashState.rechargeTimer = 0 // No recarga mientras se desliza
      }

      // Difuminar rastro (trail)
      game.dashState.trail.forEach(t => t.alpha -= 0.05 * (deltaTime / 16))
      game.dashState.trail = game.dashState.trail.filter(t => t.alpha > 0)

      // Gravedad
      if (!player.isDashing) {
        player.vy += GRAVITY
      }

      // Aplicar velocidad
      player.x += player.vx
      player.y += player.vy

      // Límites del nivel
      if (player.x < 0) player.x = 0
      if (player.x > levelWidth - PLAYER_SIZE) player.x = levelWidth - PLAYER_SIZE

      // Colisión con plataformas
      player.onGround = false
      platforms.forEach(platform => {
        if (
          player.x < platform.x + platform.width &&
          player.x + PLAYER_SIZE > platform.x &&
          player.y + PLAYER_SIZE > platform.y &&
          player.y + PLAYER_SIZE < platform.y + platform.height &&
          player.vy >= 0
        ) {
          player.y = platform.y - PLAYER_SIZE
          player.vy = 0
          player.onGround = true
        }
      })

      // Colisión con bloques ? (golpear desde abajo)
      powerUpBlocks.forEach(block => {
        if (!block.hit && !block.active) {
          // Bloque ya usado, solo colisión sólida
          if (
            player.x < block.x + 32 &&
            player.x + PLAYER_SIZE > block.x &&
            player.y < block.y + 32 &&
            player.y + PLAYER_SIZE > block.y
          ) {
            // Colisión desde abajo
            if (player.vy < 0 && player.y > block.y + 16) {
              player.y = block.y + 32
              player.vy = 0
              // Animación de golpe
              block.animationFrame = 1
              block.animationTimer = 300
            }
          }
        } else if (block.active && !block.hit) {
          // Bloque activo - verificar golpe desde abajo
          if (
            player.x < block.x + 32 &&
            player.x + PLAYER_SIZE > block.x &&
            player.y + PLAYER_SIZE > block.y &&
            player.y + PLAYER_SIZE < block.y + 16 &&  // Solo parte inferior
            player.vy < 0  // Movimiento hacia arriba
          ) {
            // ¡Golpeado!
            block.hit = true
            block.active = false
            block.animationFrame = 1
            block.animationTimer = 300

            // Crear item espada flotando sobre el bloque
            game.swordItem = {
              x: block.x + 4,
              y: block.y - 40,
              type: 'sword',
              floatOffset: 0,
              floatTimer: 0,
              collected: false,
            }
          }
        }
      })

      // Caída al vacío
      if (player.y > CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState('gameover')
          } else {
            player.x = 50
            player.y = 300
            player.vy = 0
            game.dashState.charges = MAX_DASH_CHARGES
            setDashCharges(MAX_DASH_CHARGES)
            player.isDashing = false
          }
          return newLives
        })
      }

      // Colisión con monedas
      coins.forEach(coin => {
        if (!coin.collected &&
          player.x < coin.x + 24 &&
          player.x + PLAYER_SIZE > coin.x &&
          player.y < coin.y + 24 &&
          player.y + PLAYER_SIZE > coin.y
        ) {
          coin.collected = true
          setScore(prev => prev + 100)
        }
      })

      // Verificar victoria (todas las monedas recolectadas)
      if (coins.every(c => c.collected)) {
        // Verificar si hay siguiente nivel
        if (hasNextLevel(level)) {
          // Pasar al siguiente nivel
          const nextLevelData = getNextLevel(level)
          setLevel(prev => prev + 1)
          initLevel(level + 1)
          // Mostrar mensaje de nivel completado
          setGameState('level-complete')
        } else {
          // Juego completado
          setGameState('win')
        }
      }

      // Actualizar enemigos
      enemies.forEach(enemy => {
        // Si el enemigo ya está muerto, ignorar
        if (enemy.dead) return

        enemy.x += enemy.vx
        if (enemy.x <= enemy.startX || enemy.x >= enemy.endX) {
          enemy.vx *= -1
        }

        // Verificar colisión con ataque de espada
        if (player.isAttacking && player.attackDirection && !enemy.hitBySword) {
          const hitbox = getAttackHitbox(player, player.attackDirection)
          if (
            hitbox.x < enemy.x + 28 &&
            hitbox.x + hitbox.width > enemy.x + 4 &&
            hitbox.y < enemy.y + 28 &&
            hitbox.y + hitbox.height > enemy.y + 4
          ) {
            // Enemigo eliminado por espada
            enemy.dead = true
            enemy.hitBySword = true
            setScore(prev => prev + ATTACK_POINTS)
          }
        }

        // Colisión con jugador (solo si no está en dash ni atacando)
        if (
          !player.isDashing && !player.isAttacking &&
          !enemy.dead &&
          player.x < enemy.x + 28 &&
          player.x + PLAYER_SIZE > enemy.x + 4 &&
          player.y < enemy.y + 28 &&
          player.y + PLAYER_SIZE > enemy.y + 4
        ) {
          // Si el jugador cae sobre el enemigo
          if (player.vy > 0 && player.y + PLAYER_SIZE < enemy.y + 16) {
            enemy.dead = true
            player.vy = JUMP_FORCE / 2
            setScore(prev => prev + 200)
          } else {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameState('gameover')
              } else {
                player.x = 50
                player.y = 300
                player.vy = 0
                game.dashState.charges = MAX_DASH_CHARGES
                setDashCharges(MAX_DASH_CHARGES)
                player.isDashing = false
                // Perder espada al morir
                player.hasSword = false
                player.swordTimer = 0
                player.swordActive = false
                setSwordTimeLeft(0)
                setSwordActive(false)
              }
              return newLives
            })
          }
        }
      })

      // Limpiar enemigos muertos
      game.enemies = enemies.filter(e => !e.dead)

      // Actualizar cámara
      camera.x = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, levelWidth - CANVAS_WIDTH))

      // Dibujar cielo (color según nivel)
      const skyColor = LEVEL_SKY_COLORS[level] || COLORS.sky
      ctx.fillStyle = skyColor
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.save()
      ctx.translate(-camera.x, 0)

      // Dibujar plataformas
      platforms.forEach(platform => {
        if (platform.type === 'ground') {
          ctx.fillStyle = COLORS.grass
          ctx.fillRect(platform.x, platform.y, platform.width, 10)
          ctx.fillStyle = COLORS.ground
          ctx.fillRect(platform.x, platform.y + 10, platform.width, platform.height - 10)
        } else if (platform.type === 'block') {
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
          // Detalle de ladrillos
          ctx.fillStyle = '#A0522D'
          for (let i = 0; i < platform.width; i += 20) {
            ctx.fillRect(platform.x + i, platform.y, 18, platform.height - 2)
          }
        } else {
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
          ctx.fillStyle = '#228B22'
          ctx.fillRect(platform.x, platform.y, platform.width, 5)
        }
      })

      // Dibujar monedas
      coins.forEach(coin => drawCoin(ctx, coin, timestamp))

      // Dibujar enemigos
      enemies.forEach(enemy => drawEnemy(ctx, enemy, timestamp, timestamp))

      // Dibujar bloques ?
      powerUpBlocks.forEach(block => {
        drawPowerUpBlock(ctx, block, timestamp)
      })

      // Dibujar item espada flotando
      if (game.swordItem && !game.swordItem.collected) {
        drawSwordItem(ctx, game.swordItem, timestamp)
      }

      // Dibujar jugador
      drawPlayer(ctx, player, game.dashState, timestamp)

      // Dibujar efecto de ataque de espada
      if (player.isAttacking && player.attackDirection) {
        drawSwordAttack(ctx, player, player.attackDirection, player.attackTimer)
      }

      ctx.restore()

      animationId = requestAnimationFrame(update)
    }

    animationId = requestAnimationFrame(update)

    return () => cancelAnimationFrame(animationId)
  }, [gameState])

  // Control de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key] = true
    }
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const startGame = () => {
    initLevel(1)
    setScore(0)
    setLives(3)
    setLevel(1)
    setSwordTimeLeft(0)
    setSwordActive(false)
    setGameState('playing')
  }

  const nextLevel = () => {
    initLevel(level)
    setGameState('playing')
  }

  return (
    <div className="game-container">
      <h1 className="title">🎮 8-BIT ADVENTURE</h1>

      <div className="hud">
        <div className="hud-item">SCORE: {score.toString().padStart(6, '0')}</div>
        <div className="hud-item">LIVES: {'❤️'.repeat(lives)}</div>
        <div className="hud-item">DASH: {'⚡'.repeat(dashCharges)}</div>
        <div className="hud-item">LEVEL: {level} - {levelName}</div>
      </div>

      {/* Barra de espada (solo cuando está activa) */}
      {playerRefHasSword && (
        <div className="sword-bar-container">
          <div className="sword-bar">
            <span className="sword-icon">⚔️</span>
            <div className="sword-time-bar">
              <div
                className={`sword-time-fill ${swordTimeLeft <= 3 ? 'warning' : ''} ${swordTimeLeft <= 1 ? 'critical' : ''}`}
                style={{ width: `${(swordTimeLeft / 10) * 100}%` }}
              />
            </div>
            <span className="sword-time-text">{swordTimeLeft.toFixed(1)}s</span>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />

      <div className="controls-info">
        <p>⬅️ ➡️ or A/D - Move | ⬆️ or W or SPACE - Jump | SHIFT - Dash | Z - Attack (with sword)</p>
        <p className="sword-hint">💡 Tip: Hit ? blocks from below to get the sword!</p>
      </div>

      {gameState === 'start' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="menu-title">8-BIT ADVENTURE</h2>
            <p className="menu-subtitle">Collect all coins!</p>
            <button className="start-btn" onClick={startGame}>
              START GAME
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="menu-title gameover">GAME OVER</h2>
            <p className="menu-score">Final Score: {score}</p>
            <button className="start-btn" onClick={startGame}>
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {gameState === 'win' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="menu-title winner">🎉 YOU WIN! 🎉</h2>
            <p className="menu-score">Final Score: {score}</p>
            <button className="start-btn" onClick={startGame}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {gameState === 'level-complete' && (
        <div className="overlay">
          <div className="menu-box">
            <h2 className="menu-title winner">LEVEL {level - 1} COMPLETE!</h2>
            <p className="menu-subtitle">Get ready for Level {level}</p>
            <p className="menu-score">Score: {score}</p>
            <button className="start-btn" onClick={nextLevel}>
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
