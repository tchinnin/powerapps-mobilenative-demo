import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PowerAppsProvider,
  lightTheme as hostLightTheme,
  darkTheme as hostDarkTheme,
} from '@microsoft/power-apps-native-host';
import type { ThemeTokens } from '@microsoft/power-apps-native-host';

import appConfig from '../app.json';
import authConfig from '../auth.config.json';
import tamaguiConfig, { appDarkTheme, appLightTheme } from '../tamagui.config';
// @ts-ignore - power.config.json is auto-generated at build time
import powerConfig from '../power.config.json';
// @ts-ignore - connectorSchemas is auto-generated at build time
import { schemaMap } from '../src/generated/connectorSchemas';

const brandedLightTheme: ThemeTokens = {
  ...hostLightTheme,
  surface0: appLightTheme.surface0,
  surface1: appLightTheme.surface1,
  surface2: appLightTheme.surface2,
  surface3: appLightTheme.surface3,
  surface4: appLightTheme.color6,
  text0: appLightTheme.text0,
  text1: appLightTheme.text1,
  text2: appLightTheme.text2,
  text3: appLightTheme.text3,
  accentDeep: appLightTheme.accentDeep,
  accentBase: appLightTheme.accentBase,
  accentSoft: appLightTheme.accentSoft,
  accentOnAccent: appLightTheme.accentOnAccent,
};

const brandedDarkTheme: ThemeTokens = {
  ...hostDarkTheme,
  surface0: appDarkTheme.surface0,
  surface1: appDarkTheme.surface1,
  surface2: appDarkTheme.surface2,
  surface3: appDarkTheme.surface3,
  surface4: appDarkTheme.color6,
  text0: appDarkTheme.text0,
  text1: appDarkTheme.text1,
  text2: appDarkTheme.text2,
  text3: appDarkTheme.text3,
  accentDeep: appDarkTheme.accentDeep,
  accentBase: appDarkTheme.accentBase,
  accentSoft: appDarkTheme.accentSoft,
  accentOnAccent: appDarkTheme.accentOnAccent,
};

declare const require: (id: string) => unknown;
function isMissingOfflineProfile(error: unknown): boolean {
  return error instanceof Error && (
    error.message === "Cannot find module '../offline-profile.json'" ||
    error.message === 'Cannot find module'
  );
}

let offlineProfile: Record<string, unknown> | undefined;
try {
  offlineProfile = require('../offline-profile.json') as Record<string, unknown>;
} catch (error: unknown) {
  if (!isMissingOfflineProfile(error)) throw error;
  offlineProfile = undefined;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // GestureHandlerRootView must be the OUTERMOST component, per
    // react-native-gesture-handler's own requirement — gestures below it run on
    // the native UI thread and arbitrate there instead of in JS. expo-router
    // does not provide it, so it is added here. This wraps the existing
    // provider chain without reordering it; the order below is load-bearing.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PowerAppsProvider
          appConfig={appConfig}
          msalConfig={authConfig.msal}
          powerConfig={powerConfig}
          schemaMap={schemaMap}
          tamaguiConfig={tamaguiConfig}
          offlineProfile={offlineProfile}
          theme={brandedLightTheme}
          darkTheme={brandedDarkTheme}
          defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
        >
          <StatusBar style="auto" />
          <Slot />
        </PowerAppsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
