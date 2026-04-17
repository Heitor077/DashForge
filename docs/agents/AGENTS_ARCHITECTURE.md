# AGENTS-ARCHITECTURE.md

## Alcance
Estas reglas aplican a la arquitectura del frontend Angular.

## Arquitectura
- Mantener Angular standalone
- Mantener arquitectura feature-based
- Cada feature debe agrupar páginas, componentes y servicios relacionados
- No mover archivos existentes sin necesidad clara

## Organización
- core: servicios y modelos transversales
- features: funcionalidad agrupada por dominio
- shared: componentes reutilizables y utilidades visuales

## Reglas
- Evitar componentes gigantes
- Evitar lógica de negocio en componentes presentacionales
- Usar interfaces tipadas para shortcuts, categorías y temas
- Mantener naming consistente y descriptivo
- No introducir librerías adicionales sin necesidad real

## Servicios
- theme.service: gestión del tema activo
- storage.service: persistencia local
- launcher.service: capa abstracta para abrir URLs, carpetas o recursos
- shortcuts.service: CRUD y estado de accesos

## Cambios
- Antes de tocar varios archivos, indicar cuáles y por qué
- Priorizar cambios seguros y revisables

## Nuevos servicios

- theme.service:
  - gestionar tema activo
  - aplicar CSS variables
  - gestionar wallpapers

- wallpaper.service (opcional o integrado en theme):
  - gestionar fondos
  - aplicar blur/overlay

## Reglas
- No mezclar lógica de temas en componentes
- Todo debe pasar por servicios