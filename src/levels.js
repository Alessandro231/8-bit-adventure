// Niveles para 8-Bit Adventure
// Distancia máxima de salto segura: 150px (eje X)
// Altura máxima de salto: ~180px

export const LEVELS = [
  {
    id: 1,
    name: "Green Hills",
    levelWidth: 2000,
    spawnPoint: { x: 50, y: 300 },
    platforms: [
      // Suelo base
      { x: 0, y: 420, width: 2000, height: 60, type: 'ground' },
      // Plataformas bajas - Tutorial de salto
      { x: 200, y: 320, width: 100, height: 20, type: 'platform' },
      { x: 400, y: 260, width: 100, height: 20, type: 'platform' },
      { x: 600, y: 320, width: 100, height: 20, type: 'platform' },
      // Plataforma media
      { x: 800, y: 220, width: 150, height: 20, type: 'platform' },
      { x: 1050, y: 300, width: 100, height: 20, type: 'platform' },
      { x: 1250, y: 240, width: 120, height: 20, type: 'platform' },
      { x: 1500, y: 320, width: 100, height: 20, type: 'platform' },
      // Bloques de apoyo
      { x: 320, y: 380, width: 40, height: 40, type: 'block' },
      { x: 720, y: 380, width: 40, height: 40, type: 'block' },
      { x: 1150, y: 380, width: 40, height: 40, type: 'block' },
    ],
    coins: [
      { x: 230, y: 280 },
      { x: 260, y: 280 },
      { x: 430, y: 220 },
      { x: 460, y: 220 },
      { x: 630, y: 280 },
      { x: 850, y: 180 },
      { x: 880, y: 180 },
      { x: 910, y: 180 },
      { x: 1080, y: 260 },
      { x: 1300, y: 200 },
      { x: 1330, y: 200 },
      { x: 1530, y: 280 },
    ],
    enemies: [
      { x: 500, y: 388, vx: 2, startX: 450, endX: 600 },
      { x: 900, y: 388, vx: -2, startX: 850, endX: 1000 },
      { x: 1350, y: 388, vx: 2, startX: 1300, endX: 1450 },
    ],
    // Bloques ? con espada - 2 bloques (1 obvio, 1 secreto)
    powerUpBlocks: [
      { x: 600, y: 280, type: 'sword', active: true },  // Obvio: sobre plataforma central
      { x: 1400, y: 380, type: 'sword', active: true },  // Secreto: antes del final
    ],
  },
  {
    id: 2,
    name: "Sky Fortress",
    levelWidth: 2400,
    spawnPoint: { x: 50, y: 350 },
    platforms: [
      // Suelo base con huecos (pitfalls)
      { x: 0, y: 420, width: 600, height: 60, type: 'ground' },
      { x: 750, y: 420, width: 500, height: 60, type: 'ground' },
      { x: 1400, y: 420, width: 1000, height: 60, type: 'ground' },
      
      // Escalera inicial - distancia controlada (~120px)
      { x: 180, y: 340, width: 80, height: 20, type: 'platform' },
      { x: 320, y: 280, width: 80, height: 20, type: 'platform' },
      
      // Plataforma central con enemigo
      { x: 500, y: 350, width: 120, height: 20, type: 'platform' },
      
      // Sección de hueco - plataformas pequeñas
      { x: 680, y: 300, width: 60, height: 20, type: 'platform' },
      { x: 820, y: 250, width: 60, height: 20, type: 'platform' },
      { x: 960, y: 200, width: 100, height: 20, type: 'platform' },
      
      // Torre central - desafío vertical
      { x: 1150, y: 350, width: 50, height: 20, type: 'platform' },
      { x: 1250, y: 280, width: 50, height: 20, type: 'platform' },
      { x: 1350, y: 220, width: 80, height: 20, type: 'platform' },
      
      // Plataforma final larga
      { x: 1550, y: 320, width: 150, height: 20, type: 'platform' },
      { x: 1800, y: 260, width: 120, height: 20, type: 'platform' },
      { x: 2050, y: 320, width: 100, height: 20, type: 'platform' },
      
      // Bloques de apoyo estratégicos
      { x: 280, y: 380, width: 40, height: 40, type: 'block' },
      { x: 1100, y: 380, width: 40, height: 40, type: 'block' },
      { x: 1480, y: 380, width: 40, height: 40, type: 'block' },
      { x: 1950, y: 380, width: 40, height: 40, type: 'block' },
    ],
    coins: [
      // Monedas en escalera inicial
      { x: 200, y: 300 },
      { x: 340, y: 240 },
      
      // Monedas en plataforma central
      { x: 530, y: 310 },
      { x: 560, y: 310 },
      
      // Monedas sobre el hueco - riesgo/recompensa
      { x: 695, y: 260 },
      { x: 835, y: 210 },
      
      // Tesoro en plataforma alta
      { x: 990, y: 160 },
      { x: 1020, y: 160 },
      { x: 1050, y: 160 },
      
      // Monedas en torre
      { x: 1165, y: 310 },
      { x: 1265, y: 240 },
      { x: 1380, y: 180 },
      
      // Monedas finales
      { x: 1600, y: 280 },
      { x: 1630, y: 280 },
      { x: 1850, y: 220 },
      { x: 2080, y: 280 },
    ],
    enemies: [
      // Enemigo en plataforma central
      { x: 520, y: 318, vx: 2, startX: 500, endX: 600 },
      // Enemigo en plataforma final larga
      { x: 1580, y: 288, vx: 2, startX: 1550, endX: 1680 },
      // Enemigo patrullando suelo inferior
      { x: 1600, y: 388, vx: -2, startX: 1500, endX: 1800 },
      // Enemigo guardián final
      { x: 1900, y: 388, vx: 2, startX: 1850, endX: 2100 },
    ],
    // Bloques ? con espada - 3 bloques (distribuidos)
    powerUpBlocks: [
      { x: 400, y: 310, type: 'sword', active: true },  // Inicio: plataforma baja
      { x: 1100, y: 310, type: 'sword', active: true },  // Medio: torre
      { x: 1900, y: 380, type: 'sword', active: true },  // Final: suelo
    ],
  },
  {
    id: 3,
    name: "Dark Castle",
    levelWidth: 2800,
    spawnPoint: { x: 50, y: 350 },
    platforms: [
      // Suelo inicial seguro
      { x: 0, y: 420, width: 400, height: 60, type: 'ground' },
      
      // Escalera espiral ascendente
      { x: 150, y: 340, width: 70, height: 20, type: 'platform' },
      { x: 280, y: 280, width: 70, height: 20, type: 'platform' },
      { x: 420, y: 220, width: 100, height: 20, type: 'platform' },
      
      // Sección de plataformas móviles simuladas
      { x: 580, y: 280, width: 50, height: 20, type: 'platform' },
      { x: 700, y: 340, width: 50, height: 20, type: 'platform' },
      { x: 820, y: 280, width: 50, height: 20, type: 'platform' },
      { x: 940, y: 220, width: 80, height: 20, type: 'platform' },
      
      // Suelo intermedio con enemigo
      { x: 1100, y: 420, width: 400, height: 60, type: 'ground' },
      
      // Torre del castillo - desafío máximo
      { x: 1200, y: 340, width: 50, height: 20, type: 'platform' },
      { x: 1300, y: 280, width: 50, height: 20, type: 'platform' },
      { x: 1400, y: 220, width: 50, height: 20, type: 'platform' },
      { x: 1500, y: 160, width: 100, height: 20, type: 'platform' },
      
      // Bajada controlada
      { x: 1680, y: 220, width: 60, height: 20, type: 'platform' },
      { x: 1800, y: 280, width: 60, height: 20, type: 'platform' },
      { x: 1920, y: 340, width: 80, height: 20, type: 'platform' },
      
      // Suelo final
      { x: 2100, y: 420, width: 700, height: 60, type: 'ground' },
      
      // Plataforma final elevada
      { x: 2300, y: 320, width: 150, height: 20, type: 'platform' },
      { x: 2550, y: 260, width: 100, height: 20, type: 'platform' },
      
      // Bloques de precisión
      { x: 350, y: 380, width: 30, height: 40, type: 'block' },
      { x: 1050, y: 380, width: 30, height: 40, type: 'block' },
      { x: 2050, y: 380, width: 30, height: 40, type: 'block' },
    ],
    coins: [
      // Escalera inicial
      { x: 170, y: 300 },
      { x: 300, y: 240 },
      { x: 450, y: 180 },
      
      // Sección zigzag
      { x: 595, y: 240 },
      { x: 715, y: 300 },
      { x: 835, y: 240 },
      { x: 970, y: 180 },
      
      // Monedas en suelo intermedio
      { x: 1200, y: 380 },
      { x: 1250, y: 380 },
      { x: 1350, y: 380 },
      
      // Torre - monedas valiosas
      { x: 1215, y: 300 },
      { x: 1315, y: 240 },
      { x: 1415, y: 180 },
      { x: 1530, y: 120 },
      { x: 1560, y: 120 },
      
      // Bajada
      { x: 1700, y: 180 },
      { x: 1820, y: 240 },
      { x: 1950, y: 300 },
      
      // Tesoro final
      { x: 2350, y: 280 },
      { x: 2380, y: 280 },
      { x: 2410, y: 280 },
      { x: 2590, y: 220 },
      { x: 2620, y: 220 },
    ],
    enemies: [
      // Enemigo en suelo intermedio
      { x: 1200, y: 388, vx: 2, startX: 1150, endX: 1350 },
      // Enemigo guardián de torre
      { x: 1450, y: 388, vx: -2, startX: 1400, endX: 1550 },
      // Enemigo en plataforma final
      { x: 2350, y: 288, vx: 2, startX: 2300, endX: 2430 },
      // Enemigo final boss-like
      { x: 2500, y: 388, vx: 3, startX: 2450, endX: 2650 },
    ],
    // Bloques ? con espada - 2 bloques (bien escondidos)
    powerUpBlocks: [
      { x: 900, y: 180, type: 'sword', active: true },  // Secreto: zona alta
      { x: 2200, y: 380, type: 'sword', active: true },  // Secreto: suelo final
    ],
  },
]

// Helper para cargar un nivel específico
export function loadLevel(levelId) {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0]
}

// Helper para verificar si existe el siguiente nivel
export function hasNextLevel(currentLevelId) {
  return currentLevelId < LEVELS.length
}

// Helper para obtener el siguiente nivel
export function getNextLevel(currentLevelId) {
  const currentIndex = LEVELS.findIndex(l => l.id === currentLevelId)
  if (currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1]
  }
  return null
}
