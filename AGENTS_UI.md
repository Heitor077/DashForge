# AGENTS-UI.md

## Objetivo visual
La aplicación debe sentirse moderna, premium, clara y usable.

## Estilo
- Mucho aire visual
- Tarjetas con bordes suaves
- Sombras elegantes, nunca exageradas
- Iconos claros y legibles
- Hover states suaves
- Animaciones discretas
- Buena jerarquía tipográfica

## Temas
Los colores deben venir de variables CSS globales.
No hardcodear colores por componente salvo casos muy justificados.

## Componentes visuales
- shortcut-card debe ser limpio, reconocible y consistente
- settings panel debe ser claro y ordenado
- modales simples, bonitos y rápidos
- dashboard grid con buen comportamiento responsive

## Evitar
- saturación de efectos
- glassmorphism excesivo que rompa legibilidad
- tarjetas con demasiado texto
- gradientes agresivos
- estilos inconsistentes entre features

## Temas y fondos

La aplicación debe soportar múltiples temas y wallpapers dinámicos.

### Temas
- No hardcodear estilos en componentes
- Usar CSS variables globales
- Permitir variantes sobre un mismo tema base

### Fondos
- Soportar:
  - imagen
  - gradiente
  - video (preparado, no obligatorio en primera fase)
- Aplicar overlay para legibilidad
- Permitir blur de fondo

### UX visual
- El fondo nunca debe romper la legibilidad
- Las tarjetas deben contrastar correctamente
- Evitar saturación visual