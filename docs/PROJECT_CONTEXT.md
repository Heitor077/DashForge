# PROJECT_CONTEXT.md — Interactive Desktop Dashboard

## Objetivo del proyecto
Crear un dashboard interactivo estilo launcher personal para escritorio, pensado para tener a mano accesos directos a:
- páginas web frecuentes
- carpetas del PC
- archivos o recursos importantes
- categorías personalizadas

La aplicación debe sentirse moderna, visual, rápida y limpia. 
El enfoque no es un panel de métricas empresariales, sino una “home personalizada” elegante y funcional.

## Meta final
Llegar a una app con:
- dashboard visual con tarjetas
- CRUD completo de accesos
- categorías
- selector de temas visuales
- persistencia local
- drag & drop para reordenar
- panel de configuración
- arquitectura preparada para migración a Electron
- futura capacidad de abrir rutas reales del sistema

## Stack
- Angular standalone
- TypeScript
- CSS moderno con variables y tokens de tema
- Angular CDK para drag & drop
- localStorage en primera fase
- Electron en fase posterior

## Filosofía de implementación
- Empezar por una base robusta pero no sobreingenierizada
- Mantener arquitectura feature-based
- Separar claramente UI, estado y persistencia
- Evitar refactors masivos no solicitados
- Hacer cambios pequeños, seguros y fáciles de revisar
- No romper estructura existente sin justificarlo

## Diseño visual
La app debe tener un look premium y moderno.
Inspiración:
- dashboard minimal limpio
- dark mode elegante
- glassmorphism suave
- variante neon/cyber opcional

## Temas a soportar
- light-minimal
- dark-premium
- glass-amber
- neon-cyber
- sakura-soft

Los temas deben implementarse con CSS variables o design tokens, no con estilos duplicados por componente.

## Estructura deseada
- core para servicios y modelos globales
- features para dashboard, shortcuts, settings, categories
- shared para UI reutilizable

## Prioridades
1. arquitectura limpia
2. dashboard usable
3. sistema de temas sólido
4. CRUD de accesos
5. persistencia
6. drag & drop
7. preparación para Electron

## Reglas importantes
- No crear archivos innecesarios
- No duplicar lógica
- Reutilizar componentes cuando tenga sentido
- Mantener separación entre TS / HTML / CSS
- No mezclar lógica de sistema operativo dentro de componentes Angular
- Toda futura lógica de apertura de links/rutas debe pasar por un servicio abstracto tipo launcher.service

## Resultado esperado
Un proyecto mantenible, visualmente atractivo y listo para evolucionar de web app local a desktop app real con Electron.