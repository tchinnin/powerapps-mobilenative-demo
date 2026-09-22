import { defaultConfig } from '@tamagui/config/v5';
import {
  createPowerAppsTamaguiConfig,
  withPowerAppsSemanticAliases,
} from '@microsoft/power-apps-native-host/config/tamaguiConfig';

// CUSTOMIZATION START - DO NOT REMOVE OR RENAME THE COMMENT
import { tokens as brandTokens } from './brand/tokens';

// Raw token objects: createPowerAppsTamaguiConfig calls createTokens itself, so
// passing Variable-wrapped tokens here would not match PowerAppsTamaguiConfigOverrides.
const tokens = {
  ...defaultConfig.tokens,
  space: { ...defaultConfig.tokens.space, ...brandTokens.space },
  size: { ...defaultConfig.tokens.size, ...brandTokens.size },
  radius: { ...defaultConfig.tokens.radius, ...brandTokens.radius },
};

export const appLightTheme = withPowerAppsSemanticAliases(
  defaultConfig.themes.light,
  brandTokens.color,
);

export const appDarkTheme = withPowerAppsSemanticAliases(
  defaultConfig.themes.dark,
  {
    primary: brandTokens.color.primary,
    accent: brandTokens.color.accent,
    statusSuccess: brandTokens.color.statusSuccess,
    statusWarning: brandTokens.color.statusWarning,
    statusDanger: brandTokens.color.statusDanger,
    statusInfo: brandTokens.color.statusInfo,
  },
);

const customConfig = {
  tokens,
  themes: {
    ...defaultConfig.themes,
    light: appLightTheme,
    dark: appDarkTheme,
  },
};
// CUSTOMIZATION END - DO NOT REMOVE OR RENAME THE COMMENT

export const tamaguiConfig = createPowerAppsTamaguiConfig(customConfig);
export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
