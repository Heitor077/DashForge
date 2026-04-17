# AGENTS-DATA.md

## Modelos
Definir interfaces claras para:
- Shortcut
- Category
- ThemeDefinition
- DashboardSettings

## Persistencia
- Usar localStorage en la primera fase
- Centralizar lecturas/escrituras en storage.service
- No acceder a localStorage directamente desde componentes

## Reglas
- Validar datos mínimos antes de guardar
- Mantener compatibilidad con futuras migraciones
- Preparar exportación/importación JSON de configuración
- Evitar estructuras ambiguas o difíciles de migrar

## Nuevos modelos

Añadir soporte para:

- ThemeDefinition
- Wallpaper
- DashboardSettings extendido

DashboardSettings debe incluir:
- themeId
- wallpaperId
- layoutOptions (opcional)

Persistencia:
- Todo debe guardarse en localStorage
- Preparar estructura para futura exportación/importación