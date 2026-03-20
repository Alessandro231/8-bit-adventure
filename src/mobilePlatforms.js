const FRAME_TIME_60FPS = 1000 / 60
const SUPPORT_EPSILON = 6
const CRUSH_EPSILON = 6

const overlapsOnX = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x
const overlapsOnY = (a, b) => a.y < b.y + b.height && a.y + a.height > b.y

const intersects = (a, b) => overlapsOnX(a, b) && overlapsOnY(a, b)

export function createMobilePlatforms(platforms = []) {
  return platforms.map((platform, index) => {
    const origin = {
      x: platform.origin?.x ?? platform.x ?? 0,
      y: platform.origin?.y ?? platform.y ?? 0,
    }

    return {
      id: platform.id ?? `mobile-${index}`,
      kind: 'mobile',
      axis: platform.axis ?? 'x',
      width: platform.width ?? 96,
      height: platform.height ?? 20,
      origin,
      range: platform.range ?? 200,
      speed: platform.speed ?? 2.5,
      direction: platform.direction ?? 1,
      pauseMs: platform.pauseMs ?? 300,
      pauseTimer: 0,
      startActive: platform.startActive !== false,
      active: platform.startActive !== false,
      travel: 0,
      x: origin.x,
      y: origin.y,
      vx: 0,
      vy: 0,
      type: 'mobile',
    }
  })
}

export function updateMobilePlatforms(dt, platforms = []) {
  platforms.forEach(platform => {
    const prevX = platform.x
    const prevY = platform.y
    platform.vx = 0
    platform.vy = 0

    if (!platform.active) return

    if (platform.pauseTimer > 0) {
      platform.pauseTimer = Math.max(0, platform.pauseTimer - dt)
      return
    }

    const step = platform.speed * (dt / FRAME_TIME_60FPS) * platform.direction
    let nextTravel = platform.travel + step

    if (nextTravel >= platform.range) {
      nextTravel = platform.range
      platform.direction = -1
      platform.pauseTimer = platform.pauseMs
    } else if (nextTravel <= 0) {
      nextTravel = 0
      platform.direction = 1
      platform.pauseTimer = platform.pauseMs
    }

    platform.travel = nextTravel

    if (platform.axis === 'y') {
      platform.y = platform.origin.y + platform.travel
    } else {
      platform.x = platform.origin.x + platform.travel
    }

    platform.vx = platform.x - prevX
    platform.vy = platform.y - prevY
  })
}

export function resolvePlayerOnMobilePlatforms(player, platforms = [], playerSize = 32) {
  const playerFeet = player.y + playerSize
  let support = null
  let minDistance = Number.POSITIVE_INFINITY

  platforms.forEach(platform => {
    const horizontalOverlap = player.x < platform.x + platform.width && player.x + playerSize > platform.x
    const closeToTop = playerFeet >= platform.y - SUPPORT_EPSILON && playerFeet <= platform.y + 10

    if (!horizontalOverlap || !closeToTop || player.vy < 0) return

    const distance = Math.abs(playerFeet - platform.y)
    if (distance < minDistance) {
      minDistance = distance
      support = platform
    }
  })

  if (!support) {
    player.supportVelocityX = 0
    player.supportedByMobileId = null
    return null
  }

  player.y = support.y - playerSize
  if (player.vy > 0) player.vy = 0
  player.onGround = true
  player.x += support.vx
  player.supportVelocityX = support.vx
  player.supportedByMobileId = support.id

  return support
}

const hasBlockingStatic = (playerRect, staticPlatforms, direction) => {
  if (direction === 'right') {
    return staticPlatforms.some(platform =>
      overlapsOnY(playerRect, platform) &&
      Math.abs(playerRect.x + playerRect.width - platform.x) <= CRUSH_EPSILON
    )
  }

  if (direction === 'left') {
    return staticPlatforms.some(platform =>
      overlapsOnY(playerRect, platform) &&
      Math.abs(playerRect.x - (platform.x + platform.width)) <= CRUSH_EPSILON
    )
  }

  if (direction === 'up') {
    return staticPlatforms.some(platform =>
      overlapsOnX(playerRect, platform) &&
      Math.abs(playerRect.y - (platform.y + platform.height)) <= CRUSH_EPSILON
    )
  }

  if (direction === 'down') {
    return staticPlatforms.some(platform =>
      overlapsOnX(playerRect, platform) &&
      Math.abs(playerRect.y + playerRect.height - platform.y) <= CRUSH_EPSILON
    )
  }

  return false
}

export function isPlayerCrushedByMobilePlatform(player, platforms = [], staticPlatforms = [], playerSize = 32) {
  const playerRect = { x: player.x, y: player.y, width: playerSize, height: playerSize }
  const playerCenterX = player.x + playerSize / 2
  const playerCenterY = player.y + playerSize / 2

  for (const platform of platforms) {
    const platformRect = { x: platform.x, y: platform.y, width: platform.width, height: platform.height }
    if (!intersects(playerRect, platformRect)) continue

    const platformCenterX = platform.x + platform.width / 2
    const platformCenterY = platform.y + platform.height / 2

    if (platform.vx > 0 && platformCenterX < playerCenterX && hasBlockingStatic(playerRect, staticPlatforms, 'right')) {
      return true
    }
    if (platform.vx < 0 && platformCenterX > playerCenterX && hasBlockingStatic(playerRect, staticPlatforms, 'left')) {
      return true
    }
    if (platform.vy < 0 && platformCenterY > playerCenterY && hasBlockingStatic(playerRect, staticPlatforms, 'up')) {
      return true
    }
    if (platform.vy > 0 && platformCenterY < playerCenterY && hasBlockingStatic(playerRect, staticPlatforms, 'down')) {
      return true
    }
  }

  return false
}

export function resolveEnemyPlatformTransport(enemies = [], platforms = [], enemySize = 32) {
  enemies.forEach(enemy => {
    if (enemy.dead) return

    const enemyFeet = enemy.y + enemySize
    let support = null
    let minDistance = Number.POSITIVE_INFINITY

    platforms.forEach(platform => {
      const horizontalOverlap = enemy.x < platform.x + platform.width && enemy.x + enemySize > platform.x
      const closeToTop = enemyFeet >= platform.y - SUPPORT_EPSILON && enemyFeet <= platform.y + 10
      if (!horizontalOverlap || !closeToTop) return

      const distance = Math.abs(enemyFeet - platform.y)
      if (distance < minDistance) {
        minDistance = distance
        support = platform
      }
    })

    if (!support) return

    enemy.y = support.y - enemySize
    enemy.x += support.vx
  })
}
