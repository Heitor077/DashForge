import { Wallpaper } from '../models/wallpaper.model';

export const WALLPAPER_LIBRARY: Wallpaper[] = [
  {
    id: 'aurora-gradient',
    label: 'Aurora',
    type: 'gradient',
    value: 'radial-gradient(circle at 18% 16%, #264b90 0%, #0f1730 45%, #05070f 100%)',
    overlay: { color: '#03060f', opacity: 0.35 }
  },
  {
    id: 'midnight-silk-gradient',
    label: 'Midnight Silk',
    type: 'gradient',
    value: 'linear-gradient(138deg, #0a1226 0%, #1a2f56 46%, #121018 100%)',
    overlay: { color: '#04070f', opacity: 0.34 }
  },
  {
    id: 'ember-dune-gradient',
    label: 'Ember Dune',
    type: 'gradient',
    value: 'linear-gradient(132deg, #2a1622 0%, #73403a 43%, #d58d63 100%)',
    overlay: { color: '#170a0d', opacity: 0.36 }
  },
  {
    id: 'polar-mist-gradient',
    label: 'Polar Mist',
    type: 'gradient',
    value: 'linear-gradient(142deg, #dce8f3 0%, #9ab3c9 48%, #4e6982 100%)',
    overlay: { color: '#0c1520', opacity: 0.26 }
  },
  {
    id: 'deep-ocean-gradient',
    label: 'Deep Ocean',
    type: 'gradient',
    value: 'linear-gradient(148deg, #041520 0%, #0d3a4d 44%, #247f92 100%)',
    overlay: { color: '#031017', opacity: 0.34 }
  },
  {
    id: 'velvet-dusk-gradient',
    label: 'Velvet Dusk',
    type: 'gradient',
    value: 'radial-gradient(circle at 72% 24%, #6e3c82 0%, #261436 45%, #07070f 100%)',
    overlay: { color: '#080510', opacity: 0.38 }
  },
  {
    id: 'jade-flow-gradient',
    label: 'Jade Flow',
    type: 'gradient',
    value: 'linear-gradient(145deg, #103026 0%, #1f6b58 44%, #84d0b3 100%)',
    overlay: { color: '#08130f', opacity: 0.3 }
  },
  {
    id: 'rose-haze-gradient',
    label: 'Rose Haze',
    type: 'gradient',
    value: 'linear-gradient(140deg, #2f1b2f 0%, #744765 45%, #c88da7 100%)',
    overlay: { color: '#150d14', opacity: 0.34 }
  },
  {
    id: 'jurassic-pulse-gradient',
    label: 'Jurassic Pulse',
    type: 'gradient',
    value: 'radial-gradient(circle at 16% 20%, #1f4f3c 0%, #0f2f22 42%, #06140f 100%)',
    overlay: { color: '#06150f', opacity: 0.38 }
  },
  {
    id: 'orbital-blue-gradient',
    label: 'Orbital Blue',
    type: 'gradient',
    value: 'radial-gradient(circle at 78% 18%, #184a82 0%, #0a1d33 38%, #03060b 100%)',
    overlay: { color: '#030712', opacity: 0.36 }
  },
  {
    id: 'desert-ember-gradient',
    label: 'Desert Ember',
    type: 'gradient',
    value: 'linear-gradient(138deg, #2a1e14 0%, #604127 44%, #b87845 100%)',
    overlay: { color: '#160d08', opacity: 0.32 }
  },
  {
    id: 'alpine-dawn-image',
    label: 'Alpine Dawn',
    type: 'image',
    value: 'url("wallpapers/alpine-dawn.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#081018', opacity: 0.44 },
    blurPx: 4
  },
  {
    id: 'metro-night-image',
    label: 'Metro Night',
    type: 'image',
    value: 'url("wallpapers/metro-night.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#060912', opacity: 0.48 },
    blurPx: 5
  },
  {
    id: 'studio-desk-image',
    label: 'Studio Desk',
    type: 'image',
    value: 'url("wallpapers/studio-desk.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#11151f', opacity: 0.42 },
    blurPx: 4
  },
  {
    id: 'twilight-hills-image',
    label: 'Twilight Hills',
    type: 'image',
    value: 'url("wallpapers/twilight-hills.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#080b16', opacity: 0.46 },
    blurPx: 5
  },
  {
    id: 'abstract-wave-image',
    label: 'Abstract Wave',
    type: 'image',
    value: 'url("wallpapers/abstract-wave.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#06111a', opacity: 0.4 },
    blurPx: 3
  },
  {
    id: 'nordic-lake-image',
    label: 'Nordic Lake',
    type: 'image',
    value: 'url("wallpapers/nordic-lake.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#09121a', opacity: 0.42 },
    blurPx: 4
  },
  {
    id: 'custom-image',
    label: 'Personalizado',
    type: 'image',
    value: 'url("wallpapers/alpine-dawn.svg")',
    position: 'center',
    size: 'cover',
    overlay: { color: '#060912', opacity: 0.4 },
    blurPx: 2
  }
];
