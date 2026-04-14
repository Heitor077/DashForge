# Dashboard Interactivo

Launcher de escritorio con Angular + Electron.

## Scripts principales

### Desarrollo

```bash
# Web (Angular)
npm run start:web

# Desktop (Angular + Electron)
npm run start:desktop
```

### Build web

```bash
npm run build:web
```

Salida: `dist/dash-boar-interactivo/browser/`

### Build desktop (Windows)

```bash
# Empaquetado sin instalador (win-unpacked)
npm run build:desktop:dir

# Instalador Windows (NSIS)
npm run build:desktop:installer

# Alias recomendado para instalador
npm run build:desktop
```

Salida: `release/`

## Diferencia entre build web y build desktop

- `build:web` solo compila Angular.
- `build:desktop:*` compila Angular y luego empaqueta Electron con `electron-builder`.

## Icono de aplicación

- Placeholder actual: `electron/assets/icon.ico`.
- Para branding final, reemplazar ese archivo por un `.ico` multi-resolución (incluyendo 256x256).

## Notas

- Configuración desktop en `package.json` bajo `build`.
- `electron-builder` está configurado para Windows (`nsis`) con salida en `release/`.
