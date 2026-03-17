import { useState, useEffect, useCallback, useRef } from 'react'
import { loadLevel, hasNextLevel, getNextLevel, LEVELS } from './levels'

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const PLAYER_SIZE = 32
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 5

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
  const [level, setLevel] = useState(1)
  const [levelName, setLevelName] = useState('')

  const gameRef = useRef({
    player: { x: 50, y: 300, vx: 0, vy: 0, onGround: false, facingRight: true },
    keys: {},
    platforms: [],
    coins: [],
    enemies: [],
    camera: { x: 0 },
    levelWidth: 2000,
  })

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
      facingRight: true
    }
    game.camera = { x: 0 }
    game.levelWidth = levelData.levelWidth

    // Cargar plataformas
    game.platforms = levelData.platforms

    // Cargar monedas (con estado collected)
    game.coins = levelData.coins.map(coin => ({ ...coin, collected: false }))

    // Cargar enemigos
    game.enemies = levelData.enemies.map(enemy => ({ ...enemy }))

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
  const drawPlayer = (ctx, player) => {
    ctx.save()
    if (!player.facingRight) {
      ctx.translate(player.x + PLAYER_SIZE, player.y)
      ctx.scale(-1, 1)
      drawSprite(ctx, PLAYER_SPRITE, 0, 0, PLAYER_SIZE, COLORS)
    } else {
      drawSprite(ctx, PLAYER_SPRITE, player.x, player.y, PLAYER_SIZE, COLORS)
    }
    ctx.restore()
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

      const { player, keys, platforms, coins, enemies, camera, levelWidth } = game

      // Movimiento del jugador
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

      // Gravedad
      player.vy += GRAVITY

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
        enemy.x += enemy.vx
        if (enemy.x <= enemy.startX || enemy.x >= enemy.endX) {
          enemy.vx *= -1
        }

        // Colisión con jugador
        if (
          player.x < enemy.x + 28 &&
          player.x + PLAYER_SIZE > enemy.x + 4 &&
          player.y < enemy.y + 28 &&
          player.y + PLAYER_SIZE > enemy.y + 4
        ) {
          // Si el jugador cae sobre el enemigo
          if (player.vy > 0 && player.y + PLAYER_SIZE < enemy.y + 16) {
            enemy.x = -100 // Eliminar enemigo
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
              }
              return newLives
            })
          }
        }
      })

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
      enemies.forEach(enemy => drawEnemy(ctx, enemy, timestamp))

      // Dibujar jugador
      drawPlayer(ctx, player)

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
        <div className="hud-item">LEVEL: {level} - {levelName}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />

      <div className="controls-info">
        <p>⬅️ ➡️ or A/D - Move | ⬆️ or W or SPACE - Jump</p>
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
