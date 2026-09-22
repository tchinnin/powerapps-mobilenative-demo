import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { glass } from '../../brand/tokens';
import { AppBackground, GlassCard, GlassDivider } from '../../src/components/Glass';
import { TAB_BAR_CLEARANCE, TabBar } from '../../src/components/TabBar';

const REPO_URL = 'https://github.com/tchinnin/powerapps-mobilenative-demo';

/**
 * Platform string read from the device rather than hardcoded — on a
 * demonstrator whose whole point is native capability, a fake OS version in the
 * "Infos" panel would undercut everything else on the page.
 */
function usePlatformLabel(): string {
  return React.useMemo(() => {
    const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
    const version = Device.osVersion ?? String(Platform.Version ?? '');
    return version ? `${os} ${version}` : os;
  }, []);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justify="space-between" gap="$3" px="$4" py="$3">
      <Text color="$text2" fontSize={16} lineHeight={21}>
        {label}
      </Text>
      <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
        {value}
      </Text>
    </XStack>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
      {children}
    </Text>
  );
}

export default function InfosScreen() {
  const theme = useTheme();
  const platform = usePlatformLabel();

  const today = React.useMemo(
    () =>
      new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [],
  );

  const openRepo = React.useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync(REPO_URL);
    } catch {
      // Opening a browser is best-effort; failing to do so must not crash the
      // page, and there is nothing useful to tell the user if it does.
    }
  }, []);

  return (
    <AppBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <YStack flex={1}>
          <YStack px="$4" pt="$2" gap="$1">
            <Text color="$text0" fontSize={34} lineHeight={41} fontWeight="700">
              Infos
            </Text>
            <Text color="$text2" fontSize={15} lineHeight={20}>
              Ce que contient ce démonstrateur
            </Text>
          </YStack>

          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingTop: 20,
              paddingBottom: TAB_BAR_CLEARANCE,
            }}
          >
            <YStack gap="$5">
              <YStack gap="$1.5">
                <SectionLabel>À PROPOS</SectionLabel>
                <GlassCard rounded="$6" px="$4" pt="$3.5" pb="$4" gap="$2.5">
                  <Text color="$text0" fontSize={16} lineHeight={22}>
                    Cette application est une démo des possibilités offertes par les applications
                    mobiles natives dans Power Apps, construites en React Native et exécutées au
                    sein de Power Apps Mobile.
                  </Text>
                  <Text color="$text0" fontSize={16} lineHeight={22}>
                    Elle présente une liste non exhaustive de fonctionnalités, chacune accompagnée
                    d'un exemple concret de son implémentation, pour servir de référence et
                    d'inspiration.
                  </Text>
                </GlassCard>
              </YStack>

              <YStack gap="$1.5">
                <SectionLabel>INFORMATIONS</SectionLabel>
                <GlassCard rounded="$6">
                  <InfoRow label="Créé par" value="Théophile CHIN NIN" />
                  <GlassDivider inset={16} />
                  <InfoRow label="Plateforme" value={platform} />
                  <GlassDivider inset={16} />
                  <InfoRow label="Date" value={today} />
                </GlassCard>
              </YStack>

              <YStack gap="$1.5">
                <SectionLabel>CODE SOURCE</SectionLabel>
                <GlassCard rounded="$6">
                  <XStack
                    items="center"
                    gap="$3"
                    px="$4"
                    py="$3.5"
                    pressStyle={{ bg: 'rgba(120,120,128,0.08)' }}
                    onPress={openRepo}
                    role="link"
                    aria-label="Ouvrir le code source sur GitHub"
                  >
                    <YStack
                      width={34}
                      height={34}
                      rounded="$4"
                      items="center"
                      justify="center"
                      bg={glass.brandTile.fill}
                    >
                      <Ionicons name="logo-github" size={20} color={glass.brandTile.glyph} />
                    </YStack>
                    <YStack flex={1} gap="$0.5">
                      <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
                        Code source disponible sur GitHub
                      </Text>
                      <Text color="$text2" fontSize={13} lineHeight={18}>
                        github.com/tchinnin/powerapps-mobilenative-demo
                      </Text>
                    </YStack>
                    <Ionicons name="chevron-forward" size={16} color={theme.text3.val} />
                  </XStack>
                </GlassCard>
              </YStack>
            </YStack>
          </ScrollView>
        </YStack>
      </SafeAreaView>
      <TabBar />
    </AppBackground>
  );
}
