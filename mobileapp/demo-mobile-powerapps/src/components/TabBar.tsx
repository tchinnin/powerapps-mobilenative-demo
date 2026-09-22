/**
 * Floating glass tab pill — Démos | Infos.
 *
 * Deliberately NOT an expo-router Tabs layout. Only two destinations exist and
 * both sit at the root of the (app) group; a Tabs layout would nest every demo
 * detail screen inside a tab stack and put the pill behind the detail pages.
 * Navigation uses `replace`, so switching tabs never grows the stack and the
 * hardware back button still leaves the app rather than walking tab history.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Text, XStack, useTheme } from 'tamagui';

import { glass } from '../../brand/tokens';
import { GlassCard } from './Glass';

type TabKey = '/home' | '/infos';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: '/home', label: 'Démos', icon: 'list-outline' },
  { key: '/infos', label: 'Infos', icon: 'information-circle-outline' },
];

/** Height of the pill plus its bottom offset — screens pad their scroll by this. */
export const TAB_BAR_CLEARANCE = 92;

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <XStack position="absolute" b={26} l={0} r={0} justify="center" pointerEvents="box-none">
      <GlassCard tone="bar" rounded={9999} p={5}>
        <XStack gap="$1">
          {TABS.map((tab) => {
            const active = pathname === tab.key;
            return (
              <XStack
                key={tab.key}
                height={48}
                px="$6"
                items="center"
                justify="center"
                gap="$2"
                rounded={9999}
                bg={active ? glass.segment.thumb : 'transparent'}
                boxShadow={active ? '0px 2px 8px rgba(26,18,48,0.13)' : undefined}
                onPress={() => {
                  // Cast: see the note in home.tsx — Metro regenerates the
                  // typed-route union, /infos is not in it until then.
                  if (!active) router.replace(tab.key as Href);
                }}
                pressStyle={{ opacity: 0.7 }}
                role="tab"
                aria-label={tab.label}
                aria-selected={active}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={active ? theme.accentBase.val : glass.bar.inactiveLabel}
                />
                <Text
                  color={(active ? theme.accentBase.val : glass.bar.inactiveLabel) as never}
                  fontSize={15}
                  fontWeight="600"
                >
                  {tab.label}
                </Text>
              </XStack>
            );
          })}
        </XStack>
      </GlassCard>
    </XStack>
  );
}
