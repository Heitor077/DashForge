import { Category } from '../models/category.model';
import {
  DashboardSettings,
  DEFAULT_DASHBOARD_LAYOUT_OPTIONS,
  DEFAULT_DASHBOARD_PREFERENCES
} from '../models/dashboard-settings.model';
import { Shortcut } from '../models/shortcut.model';
import { ThemeDefinition } from '../models/theme-definition.model';
import { Wallpaper } from '../models/wallpaper.model';
import { WALLPAPER_LIBRARY } from './wallpaper-library';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Trabajo', icon: 'briefcase' },
  { id: 'tools', name: 'Herramientas', icon: 'wrench' },
  { id: 'media', name: 'Media', icon: 'play' }
];

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'angular-docs',
    name: 'Angular Docs',
    icon: 'angular',
    categoryId: 'work',
    type: 'url',
    value: 'https://angular.dev'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    categoryId: 'work',
    type: 'url',
    value: 'https://github.com'
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: 'vscode',
    categoryId: 'tools',
    type: 'url',
    value: 'https://code.visualstudio.com'
  },
  {
    id: 'downloads',
    name: 'Descargas',
    icon: 'folder',
    categoryId: 'tools',
    type: 'folder',
    value: 'C:/Users'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    categoryId: 'media',
    type: 'url',
    value: 'https://www.youtube.com'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    categoryId: 'media',
    type: 'url',
    value: 'https://open.spotify.com'
  }
];

const createTheme = (
  id: string,
  name: string,
  isDark: boolean,
  baseVariables: Record<string, string>,
  variants: Array<{ id: string; name: string; variables: Record<string, string> }>
): ThemeDefinition => ({
  id,
  name,
  isDark,
  baseVariables,
  defaultVariantId: variants[0].id,
  variants
});

const createAccentVariables = (
  primary: string,
  primaryContrast: string,
  accent: string,
  highlight: string
): Record<string, string> => ({
  '--color-primary': primary,
  '--color-primary-contrast': primaryContrast,
  '--color-accent': accent,
  '--color-highlight': highlight,
  '--color-interactive-border': primary,
  '--color-interactive-active': accent,
  '--color-interactive-glow': highlight,
  '--btn-primary-bg': primary,
  '--btn-primary-text': primaryContrast,
  '--btn-outline-text': primary
});

const createAccentVariant = (
  id: string,
  name: string,
  primary: string,
  primaryContrast: string,
  accent: string,
  highlight: string
) => ({
  id,
  name,
  variables: createAccentVariables(primary, primaryContrast, accent, highlight)
});

export const DEFAULT_THEMES: ThemeDefinition[] = [
  createTheme(
    'graphite',
    'Graphite',
    true,
    {
      '--color-bg': '#07111f',
      '--color-surface': '#101d31',
      '--color-surface-soft': '#162740',
      '--color-border': '#2b405f',
      '--color-text': '#e8effa',
      '--color-text-muted': '#a5b6d2',
      '--shadow-elevated': '0 18px 45px rgba(2, 6, 23, 0.35)'
    },
    [
      createAccentVariant('blue', 'Blue', '#66b3ff', '#0b1f36', '#93cbff', '#7cc2ff'),
      createAccentVariant('emerald', 'Emerald', '#38d29f', '#06251f', '#79e5c2', '#63dcb3'),
      createAccentVariant('amber', 'Amber', '#f2ba49', '#2f2407', '#ffd98a', '#f8ca67'),
      createAccentVariant('indigo', 'Indigo', '#5a74e8', '#121b3e', '#a2b0ff', '#8798ff'),
      createAccentVariant('slate', 'Slate', '#6f829e', '#1d2836', '#b5c0d2', '#98abc2'),
      createAccentVariant('gold', 'Gold', '#c9a247', '#30250b', '#f0d28f', '#e3be6c'),
      {
        id: 'orbital',
        name: 'Orbital',
        variables: {
          ...createAccentVariables('#3aa0ff', '#06182a', '#8ac7ff', '#71b8ff'),
          '--color-bg': '#05080f',
          '--color-surface': '#0b1a2b',
          '--color-surface-soft': '#112236',
          '--color-border': 'rgba(58,160,255,0.28)',
          '--color-text': '#e6f1ff',
          '--color-text-muted': '#a8c0e2'
        }
      }
    ]
  ),
  createTheme(
    'sandstone',
    'Sandstone',
    false,
    {
      '--color-bg': '#f3eadb',
      '--color-surface': '#fff7e9',
      '--color-surface-soft': '#f4e8d4',
      '--color-border': '#ddc9aa',
      '--color-text': '#35281d',
      '--color-text-muted': '#735c46',
      '--shadow-elevated': '0 18px 45px rgba(82, 54, 26, 0.15)'
    },
    [
      createAccentVariant('terracotta', 'Terracotta', '#bb6a30', '#fff5e9', '#dca174', '#cc8551'),
      createAccentVariant('olive', 'Olive', '#6b7f3f', '#f1f6df', '#a7ba7a', '#8ea75e'),
      createAccentVariant('wine', 'Wine', '#8f3f55', '#ffeef3', '#c88ea0', '#ab687e'),
      createAccentVariant('amber', 'Amber', '#c48e34', '#fff6e8', '#e7be76', '#d6a955'),
      createAccentVariant('emerald', 'Emerald', '#2f9f79', '#effbf6', '#7fcfb0', '#62b999'),
      createAccentVariant('indigo', 'Indigo', '#5f75ce', '#eef1ff', '#a8b3ea', '#8c9ce0'),
      createAccentVariant('slate', 'Slate', '#708197', '#edf2f7', '#b7c1cb', '#9ba8b6'),
      createAccentVariant('gold', 'Gold', '#b88d37', '#fff7e8', '#dfc080', '#cfa85a'),
      {
        id: 'ember',
        name: 'Ember',
        variables: {
          ...createAccentVariables('#ff8c42', '#3b1f0d', '#ffc18e', '#ffab67'),
          '--color-bg': '#2a1e14',
          '--color-surface': '#3a2a1d',
          '--color-surface-soft': '#493526',
          '--color-border': 'rgba(255,210,122,0.24)',
          '--color-text': '#fff4e6',
          '--color-text-muted': '#dfc8ac'
        }
      }
    ]
  ),
  createTheme(
    'nocturne',
    'Nocturne',
    true,
    {
      '--color-bg': '#11121a',
      '--color-surface': '#1a1d29',
      '--color-surface-soft': '#232838',
      '--color-border': '#343a51',
      '--color-text': '#f2f4ff',
      '--color-text-muted': '#b6bbd2',
      '--shadow-elevated': '0 18px 45px rgba(7, 8, 12, 0.45)'
    },
    [
      createAccentVariant('violet', 'Violet', '#9d82ff', '#1f1740', '#ccbfff', '#b6a4ff'),
      createAccentVariant('cyan', 'Cyan', '#3bc8dd', '#082a31', '#88e5f2', '#68d9ea'),
      createAccentVariant('rose', 'Rose', '#f680b6', '#3c1228', '#ffb4d3', '#fa9fc7'),
      createAccentVariant('amber', 'Amber', '#d39a3f', '#2f2206', '#f0c77a', '#e0b25f'),
      createAccentVariant('emerald', 'Emerald', '#31b289', '#06251f', '#80dec1', '#65caab'),
      createAccentVariant('indigo', 'Indigo', '#6a80eb', '#161f45', '#aab7ff', '#91a2ff'),
      createAccentVariant('slate', 'Slate', '#7687a5', '#1d2738', '#b5bfd3', '#9caac2'),
      createAccentVariant('gold', 'Gold', '#c5a04a', '#302408', '#ecd08e', '#dbbc68')
    ]
  ),
  createTheme(
    'forest',
    'Forest',
    true,
    {
      '--color-bg': '#0b1814',
      '--color-surface': '#12261f',
      '--color-surface-soft': '#1a332a',
      '--color-border': '#305445',
      '--color-text': '#e5f8ee',
      '--color-text-muted': '#9dc4b1',
      '--shadow-elevated': '0 18px 45px rgba(6, 20, 16, 0.4)'
    },
    [
      createAccentVariant('mint', 'Mint', '#47d7a1', '#0b2c1f', '#8decc7', '#6ee1b3'),
      createAccentVariant('lime', 'Lime', '#a8da42', '#1f2f07', '#cfeb8f', '#b9e162'),
      createAccentVariant('ocean', 'Ocean', '#39a9d7', '#0b2432', '#8ed2ec', '#67c0e3'),
      createAccentVariant('amber', 'Amber', '#c6933b', '#2d2308', '#e8c279', '#d6ab57'),
      createAccentVariant('emerald', 'Emerald', '#31b083', '#062417', '#7dd8b5', '#61c79e'),
      createAccentVariant('indigo', 'Indigo', '#637de6', '#13203f', '#a6b8fb', '#89a0f2'),
      createAccentVariant('slate', 'Slate', '#7389a2', '#1a2731', '#b4c2d0', '#98aec3'),
      createAccentVariant('gold', 'Gold', '#bda14b', '#2d250b', '#e4d092', '#cdb76b'),
      {
        id: 'jurassic',
        name: 'Jurassic',
        variables: {
          ...createAccentVariables('#2ecc71', '#062015', '#8fe5b3', '#67d58f'),
          '--color-bg': '#0b1f17',
          '--color-surface': '#132f24',
          '--color-surface-soft': '#1b3a2d',
          '--color-border': 'rgba(163,255,181,0.25)',
          '--color-text': '#e8f5e9',
          '--color-text-muted': '#b3d7bf'
        }
      }
    ]
  ),
  createTheme(
    'volcanic',
    'Volcanic',
    true,
    {
      '--color-bg': '#130d0d',
      '--color-surface': '#1f1414',
      '--color-surface-soft': '#2a1b1b',
      '--color-border': '#5a3a37',
      '--color-text': '#f7ece8',
      '--color-text-muted': '#c9a9a0',
      '--shadow-elevated': '0 18px 45px rgba(20, 8, 8, 0.46)'
    },
    [
      createAccentVariant('ember', 'Ember', '#ff6f4f', '#2a0f09', '#ffae98', '#ff8a66'),
      createAccentVariant('crimson', 'Crimson', '#e5525f', '#2a0b12', '#f39ca4', '#eb7783'),
      createAccentVariant('copper', 'Copper', '#c97f44', '#2e190a', '#e2b18a', '#d59661'),
      createAccentVariant('amber', 'Amber', '#d89b3f', '#312306', '#efc981', '#e2b15c'),
      createAccentVariant('teal', 'Teal', '#2fa196', '#072622', '#79d0c7', '#5cbcb2'),
      createAccentVariant('indigo', 'Indigo', '#677ce6', '#151f46', '#aab6fb', '#8c9ef0'),
      createAccentVariant('slate', 'Slate', '#77859a', '#1d2733', '#bcc4cf', '#a0adbc'),
      createAccentVariant('gold', 'Gold', '#c4a14b', '#302509', '#e6cf92', '#d4b96b')
    ]
  ),
  createTheme(
    'oceanic',
    'Oceanic',
    true,
    {
      '--color-bg': '#071722',
      '--color-surface': '#0d2433',
      '--color-surface-soft': '#143144',
      '--color-border': '#2f5368',
      '--color-text': '#e7f6ff',
      '--color-text-muted': '#9ebccc',
      '--shadow-elevated': '0 18px 45px rgba(4, 16, 24, 0.42)'
    },
    [
      createAccentVariant('azure', 'Azure', '#3c9fe8', '#071d30', '#8accfb', '#6fbaf2'),
      createAccentVariant('turquoise', 'Turquoise', '#2eb5a8', '#072923', '#7edfd8', '#5fcfc4'),
      createAccentVariant('cyan', 'Cyan', '#35bbd4', '#062933', '#83e0ee', '#63cfdf'),
      createAccentVariant('indigo', 'Indigo', '#637de5', '#132042', '#a6b6fb', '#8b9ff2'),
      createAccentVariant('emerald', 'Emerald', '#34b48f', '#06251f', '#82dec2', '#64cbab'),
      createAccentVariant('amber', 'Amber', '#c99a46', '#302406', '#e5c989', '#d8b267'),
      createAccentVariant('slate', 'Slate', '#758ca6', '#1a2b3d', '#b7c7d8', '#9db1c7'),
      createAccentVariant('gold', 'Gold', '#c2a652', '#2f2609', '#e4d299', '#d4be74')
    ]
  ),
  createTheme(
    'frost',
    'Frost',
    false,
    {
      '--color-bg': '#edf4fb',
      '--color-surface': '#f8fbff',
      '--color-surface-soft': '#eaf2fa',
      '--color-border': '#c8d6e6',
      '--color-text': '#1d2a3a',
      '--color-text-muted': '#5e758d',
      '--shadow-elevated': '0 18px 45px rgba(39, 71, 102, 0.14)'
    },
    [
      createAccentVariant('arctic', 'Arctic', '#3c74d8', '#f0f6ff', '#8db3f2', '#6f9ae6'),
      createAccentVariant('teal', 'Teal', '#2e8f9d', '#ebfbff', '#7dc0cb', '#5caab6'),
      createAccentVariant('indigo', 'Indigo', '#556fcb', '#eef2ff', '#a1b1e8', '#8599dd'),
      createAccentVariant('rose', 'Rose', '#c06b91', '#fff1f7', '#e6acc4', '#d98fb0'),
      createAccentVariant('emerald', 'Emerald', '#2d9373', '#eafaf3', '#7ec8af', '#5fb297'),
      createAccentVariant('amber', 'Amber', '#b58336', '#fff5e4', '#dcb477', '#c89b55'),
      createAccentVariant('slate', 'Slate', '#6f839a', '#edf3f9', '#b4c0cd', '#98a9bb'),
      createAccentVariant('gold', 'Gold', '#b49342', '#fff7e8', '#dcc181', '#c8aa5f')
    ]
  ),
  createTheme(
    'nebula',
    'Nebula',
    true,
    {
      '--color-bg': '#0d1021',
      '--color-surface': '#171b33',
      '--color-surface-soft': '#212746',
      '--color-border': '#3a4673',
      '--color-text': '#edf0ff',
      '--color-text-muted': '#a9b0d4',
      '--shadow-elevated': '0 18px 45px rgba(7, 9, 20, 0.48)'
    },
    [
      createAccentVariant('violet', 'Violet', '#8f7bf0', '#1f1745', '#c6b9ff', '#ab9cf8'),
      createAccentVariant('cosmic', 'Cosmic', '#5d84ff', '#111d4a', '#a3bbff', '#859ff8'),
      createAccentVariant('magenta', 'Magenta', '#cf67b8', '#3c1032', '#eaa6db', '#dd86c8'),
      createAccentVariant('cyan', 'Cyan', '#34accd', '#06263a', '#82dcee', '#65cbe1'),
      createAccentVariant('emerald', 'Emerald', '#2da98b', '#072821', '#79d8c0', '#5cc8ac'),
      createAccentVariant('amber', 'Amber', '#c8963e', '#302306', '#e8c57c', '#d8ad59'),
      createAccentVariant('slate', 'Slate', '#7384a7', '#1a2740', '#b2bed8', '#99a8c8'),
      createAccentVariant('gold', 'Gold', '#c1a04a', '#2f2508', '#e3cc8f', '#d2b868')
    ]
  ),
  createTheme(
    'paper',
    'Paper',
    false,
    {
      '--color-bg': '#f2f4f7',
      '--color-surface': '#fbfcfe',
      '--color-surface-soft': '#eef1f5',
      '--color-border': '#d3d9e2',
      '--color-text': '#1d2430',
      '--color-text-muted': '#5d6878',
      '--shadow-elevated': '0 18px 45px rgba(40, 53, 71, 0.11)'
    },
    [
      createAccentVariant('indigo', 'Indigo', '#4f6fdf', '#edf2ff', '#9cb1f4', '#7f98ea'),
      createAccentVariant('teal', 'Teal', '#2f9496', '#e8f9f8', '#7dc4c6', '#5fb0b1'),
      createAccentVariant('slate', 'Slate', '#657b94', '#edf3f9', '#adb9c8', '#91a2b6'),
      createAccentVariant('emerald', 'Emerald', '#2f9677', '#eaf9f2', '#7ec6af', '#61b498'),
      createAccentVariant('amber', 'Amber', '#b68539', '#fff6e8', '#deb97d', '#cb9e58'),
      createAccentVariant('rose', 'Rose', '#be6f89', '#fff0f6', '#e1abc1', '#d38ea9'),
      createAccentVariant('gold', 'Gold', '#b79445', '#fff8ea', '#ddc587', '#c9ae63')
    ]
  ),
  createTheme(
    'obsidian',
    'Obsidian',
    true,
    {
      '--color-bg': '#0c0f14',
      '--color-surface': '#141922',
      '--color-surface-soft': '#1b2230',
      '--color-border': '#2f3a4d',
      '--color-text': '#e9edf6',
      '--color-text-muted': '#a0acc1',
      '--shadow-elevated': '0 18px 45px rgba(5, 7, 12, 0.52)'
    },
    [
      createAccentVariant('steel', 'Steel', '#6c84a6', '#182334', '#a8b7cc', '#8ea3bd'),
      createAccentVariant('indigo', 'Indigo', '#5f79e0', '#141f44', '#a4b5fa', '#889df2'),
      createAccentVariant('teal', 'Teal', '#2f9c96', '#072621', '#7fd0cb', '#61bdb7'),
      createAccentVariant('emerald', 'Emerald', '#31a882', '#06231d', '#7cd6b5', '#5ec39d'),
      createAccentVariant('amber', 'Amber', '#c1913f', '#2f2206', '#e5c37e', '#d2ab5a'),
      createAccentVariant('violet', 'Violet', '#8a76de', '#201646', '#c1b5f8', '#a999ef'),
      createAccentVariant('gold', 'Gold', '#bea050', '#2e2509', '#e1cc92', '#cfb972')
    ]
  ),
  createTheme(
    'studio',
    'Studio',
    false,
    {
      '--color-bg': '#eef2f6',
      '--color-surface': '#ffffff',
      '--color-surface-soft': '#f3f7fb',
      '--color-border': '#ccd8e5',
      '--color-text': '#1f2f43',
      '--color-text-muted': '#52657c',
      '--shadow-elevated': '0 18px 45px rgba(30, 52, 80, 0.12)'
    },
    [
      createAccentVariant('indigo', 'Indigo', '#4669e8', '#eef2ff', '#9bafff', '#7f97ff'),
      createAccentVariant('coral', 'Coral', '#dd6464', '#fff0f0', '#f3aaaa', '#e78484'),
      createAccentVariant('teal', 'Teal', '#2f9a96', '#e6f8f7', '#7ec7c3', '#5bb1ac'),
      createAccentVariant('amber', 'Amber', '#c88f33', '#fff6e7', '#e8c07b', '#d7a958'),
      createAccentVariant('emerald', 'Emerald', '#2f9f7a', '#eefaf5', '#7cccb1', '#60b894'),
      createAccentVariant('slate', 'Slate', '#6f849f', '#edf2f8', '#b5c1d0', '#98abc0'),
      createAccentVariant('gold', 'Gold', '#bc973f', '#fff7e9', '#e2c989', '#ceaf62')
    ]
  )
];

export const DEFAULT_WALLPAPERS: Wallpaper[] = WALLPAPER_LIBRARY;

export const DEFAULT_SETTINGS: DashboardSettings = {
  themeId: DEFAULT_THEMES[0].id,
  themeVariantId: DEFAULT_THEMES[0].defaultVariantId,
  wallpaperId: DEFAULT_WALLPAPERS[0].id,
  layoutOptions: DEFAULT_DASHBOARD_LAYOUT_OPTIONS,
  preferences: DEFAULT_DASHBOARD_PREFERENCES
};
