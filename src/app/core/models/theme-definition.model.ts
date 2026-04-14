export interface ThemeVariant {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  isDark: boolean;
  baseVariables: Record<string, string>;
  defaultVariantId: string;
  variants: ThemeVariant[];
}
