# AGENTS-DESKTOP.md

## Objetivo
Preparar el proyecto para una futura migración a Electron sin acoplar Angular al entorno de escritorio desde el principio.

## Reglas
- Toda acción de apertura debe pasar por launcher.service
- No usar APIs del navegador directamente dentro de tarjetas o modales si luego eso dificultará migrar a Electron
- Diseñar launcher.service con interfaz adaptable:
  - openUrl()
  - openFolder()
  - openResource()

## Estrategia
- En entorno web, openUrl puede funcionar ya
- openFolder y openResource pueden dejarse como placeholders o comportamiento limitado
- La firma pública del servicio debe quedar lista para implementación Electron futura