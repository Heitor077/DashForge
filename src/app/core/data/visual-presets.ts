import { VisualPreset } from '../models/visual-preset.model';

export const VISUAL_PRESETS: VisualPreset[] = [
  {
    id: 'graphite-aurora',
    label: 'Graphite Aurora',
    description: 'Oscuro elegante con contraste equilibrado y reflejo frio.',
    source: 'system',
    config: {
      themeId: 'graphite',
      themeVariantId: 'blue',
      wallpaperId: 'aurora-gradient',
      blur: 1,
      surfaceOpacity: 0.9
    }
  },
  {
    id: 'graphite-metro',
    label: 'Metro Focus',
    description: 'Escena nocturna con acento profesional y lectura firme.',
    source: 'system',
    config: {
      themeId: 'graphite',
      themeVariantId: 'blue',
      wallpaperId: 'metro-night-image',
      overlay: { color: '#050911', opacity: 0.52 },
      blur: 4,
      surfaceOpacity: 0.92
    }
  },
  {
    id: 'nocturne-velvet',
    label: 'Velvet Night',
    description: 'Ambiente profundo para sesiónes largas de trabajo.',
    source: 'system',
    config: {
      themeId: 'nocturne',
      themeVariantId: 'violet',
      wallpaperId: 'velvet-dusk-gradient',
      blur: 2,
      surfaceOpacity: 0.91
    }
  },
  {
    id: 'nocturne-twilight',
    label: 'Twilight Peaks',
    description: 'Paisaje discreto con contraste alto para tarjetas.',
    source: 'system',
    config: {
      themeId: 'nocturne',
      themeVariantId: 'violet',
      wallpaperId: 'twilight-hills-image',
      overlay: { color: '#060913', opacity: 0.5 },
      blur: 5,
      surfaceOpacity: 0.93
    }
  },
  {
    id: 'forest-jade',
    label: 'Jade Forest',
    description: 'Tono organico, calmado y consistente.',
    source: 'system',
    config: {
      themeId: 'forest',
      themeVariantId: 'mint',
      wallpaperId: 'jade-flow-gradient',
      blur: 1,
      surfaceOpacity: 0.89
    }
  },
  {
    id: 'forest-lake',
    label: 'Nordic Forest',
    description: 'Fondo natural limpio con lectura estable.',
    source: 'system',
    config: {
      themeId: 'forest',
      themeVariantId: 'mint',
      wallpaperId: 'nordic-lake-image',
      overlay: { color: '#09121b', opacity: 0.45 },
      blur: 4,
      surfaceOpacity: 0.9
    }
  },
  {
    id: 'jurassic-pulse',
    label: 'Jurassic Pulse',
    description: 'Selva profunda con energia organica y contraste elegante.',
    source: 'system',
    config: {
      themeId: 'forest',
      themeVariantId: 'jurassic',
      wallpaperId: 'jurassic-pulse-gradient',
      overlay: { color: '#06160f', opacity: 0.4 },
      blur: 2,
      surfaceOpacity: 0.91
    }
  },
  {
    id: 'sandstone-ember',
    label: 'Warm Ember',
    description: 'Paleta calida y refinada para un look premium claro.',
    source: 'system',
    config: {
      themeId: 'sandstone',
      themeVariantId: 'terracotta',
      wallpaperId: 'ember-dune-gradient',
      overlay: { color: '#190f11', opacity: 0.34 },
      blur: 0,
      surfaceOpacity: 0.87
    }
  },
  {
    id: 'sandstone-polar',
    label: 'Polar Sand',
    description: 'Luz suave con profundidad moderada.',
    source: 'system',
    config: {
      themeId: 'sandstone',
      themeVariantId: 'terracotta',
      wallpaperId: 'polar-mist-gradient',
      overlay: { color: '#0e1722', opacity: 0.24 },
      blur: 1,
      surfaceOpacity: 0.85
    }
  },
  {
    id: 'desert-ember',
    label: 'Desert Ember',
    description: 'Calidez de desierto al atardecer con lectura comoda y tono refinado.',
    source: 'system',
    config: {
      themeId: 'sandstone',
      themeVariantId: 'ember',
      wallpaperId: 'desert-ember-gradient',
      overlay: { color: '#190f08', opacity: 0.33 },
      blur: 1,
      surfaceOpacity: 0.89
    }
  },
  {
    id: 'studio-wave',
    label: 'Studio Wave',
    description: 'Estetica creativa con vibracion controlada.',
    source: 'system',
    config: {
      themeId: 'studio',
      themeVariantId: 'indigo',
      wallpaperId: 'abstract-wave-image',
      overlay: { color: '#08131d', opacity: 0.37 },
      blur: 3,
      surfaceOpacity: 0.88
    }
  },
  {
    id: 'studio-desk',
    label: 'Desk Light',
    description: 'Preset claro para trabajo diario con maxima legibilidad.',
    source: 'system',
    config: {
      themeId: 'studio',
      themeVariantId: 'indigo',
      wallpaperId: 'studio-desk-image',
      overlay: { color: '#11151f', opacity: 0.3 },
      blur: 2,
      surfaceOpacity: 0.84
    }
  },
  {
    id: 'graphite-ocean',
    label: 'Ocean Console',
    description: 'Combinacion sobria para foco tecnico.',
    source: 'system',
    config: {
      themeId: 'graphite',
      themeVariantId: 'blue',
      wallpaperId: 'deep-ocean-gradient',
      blur: 1,
      surfaceOpacity: 0.9
    }
  },
  {
    id: 'orbital-blue',
    label: 'Orbital Blue',
    description: 'Vista orbital sobria con acento tecnologico y profundidad fria.',
    source: 'system',
    config: {
      themeId: 'graphite',
      themeVariantId: 'orbital',
      wallpaperId: 'orbital-blue-gradient',
      overlay: { color: '#040813', opacity: 0.38 },
      blur: 2,
      surfaceOpacity: 0.92
    }
  },
  {
    id: 'nocturne-rose',
    label: 'Rose Nocturne',
    description: 'Acento expresivo sin perder lectura.',
    source: 'system',
    config: {
      themeId: 'nocturne',
      themeVariantId: 'rose',
      wallpaperId: 'rose-haze-gradient',
      blur: 1,
      surfaceOpacity: 0.9
    }
  }
];

