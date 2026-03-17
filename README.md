# 🎮 8-Bit Adventure

Un juego de plataformas 2D estilo 8-bit creado con React + Vite.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🕹️ Demo

![Game Screenshot](./screenshot.png)

## ✨ Características

- **3 Niveles únicos** con dificultad progresiva
- **Estética retro 8-bit** con sprites pixelados
- **Sistema de monedas** para coleccionar
- **Enemigos con IA** que patrullan plataformas
- **Sistema de vidas** y puntuación
- **Cámara con scroll** horizontal
- **Física de plataformas** con gravedad y saltos

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/8-bit-adventure.git

# Entrar al directorio
cd 8-bit-adventure

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| `←` / `A` | Mover izquierda |
| `→` / `D` | Mover derecha |
| `↑` / `W` / `ESPACIO` | Saltar |

## 📁 Estructura del Proyecto

```
game-8bit/
├── src/
│   ├── App.jsx          # Componente principal del juego
│   ├── main.jsx         # Punto de entrada
│   ├── index.css        # Estilos retro
│   └── levels.js        # Configuración de niveles
├── public/
├── package.json
└── vite.config.js
```

## 🗺️ Niveles

| Nivel | Nombre | Dificultad | Monedas | Enemigos |
|-------|--------|------------|---------|----------|
| 1 | Green Hills | ⭐ Fácil | 12 | 3 |
| 2 | Sky Fortress | ⭐⭐ Medio | 18 | 4 |
| 3 | Dark Castle | ⭐⭐⭐ Difícil | 24 | 4 |

## 🛠️ Tecnologías

- **React 19** - Framework UI
- **Vite 8** - Build tool
- **Canvas API** - Renderizado del juego
- **CSS3** - Estilos pixel-art

## 📋 Roadmap - Tipo Mario Bros

### Fase 1: Mejoras Básicas ✅
- [x] Sistema de niveles externo
- [x] Múltiples niveles con progresión
- [ ] Power-ups (mushroom, star, flower)
- [ ] Bloques rompibles (? blocks)

### Fase 2: Mecánicas Avanzadas
- [ ] Saltar sobre enemigos (ya implementado)
- [ ] Disparar proyectiles (fire flower)
- [ ] Transformaciones (small → super → fire)
- [ ] Bloques secretos ocultos

### Fase 3: Contenido Extra
- [ ] Mundo mapa (overworld)
- [ ] Tubos y zonas secretas
- [ ] Jefes finales por mundo
- [ ] Modo 2 jugadores local

### Fase 4: Pulido
- [ ] Sonidos y música 8-bit
- [ ] Animaciones de sprites
- [ ] Efectos de partículas
- [ ] Menú de selección de nivel

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Inspirado en Super Mario Bros de Nintendo
- Font: 'Press Start 2P' de Google Fonts

---

**Hecho con ❤️ y mucho café**
