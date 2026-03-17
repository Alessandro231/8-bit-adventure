---
name: 8bit_level_architect
description: Diseña y expande niveles para juegos 2D en React, asegurando coherencia en la física, colisiones y estética pixel-art.
tags: [gamedev, react, logic, 8bit]
---

# Instructions

Cuando el usuario solicite crear un nuevo nivel o expandir el juego "8-Bit Adventure", actúa como un arquitecto de niveles siguiendo estos pasos:

1. **Análisis de Estado:** Revisa el archivo `App.jsx` o donde resida el motor del juego para identificar el array de objetos que define las plataformas y enemigos.
2. **Generación de JSON:** Crea un nuevo objeto de nivel siguiendo esta estructura:
   - `id`: número incremental del nivel.
   - `platforms`: array de objetos `{ x, y, w, h }`.
   - `entities`: array de objetos `{ type: 'coin'|'enemy', x, y }`.
3. **Validación de Jugabilidad:**
   - Asegúrate de que ninguna plataforma esté a una distancia superior a 150px en el eje X del salto anterior (límite del salto del personaje azul).
   - Verifica que el "Red Circle" (enemigo) tenga espacio suficiente para patrullar sin caerse de su plataforma base.
4. **Actualización de UI:** Si se añade un nivel, incrementa la variable de estado `level` y reinicia la posición del personaje al `spawn_point` inicial.
5. **Estética:** Mantén los colores definidos en `index.css`:
   - Personaje: `#3498db` (Azul)
   - Enemigo: `#e74c3c` (Rojo)
   - Monedas: `#f1c40f` (Dorado)