import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Vibration } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { glass, tokens } from '../../brand/tokens';
import {
  CapabilityChips,
  DemoCta,
  DemoHero,
  DemoScaffold,
  DemonstratesList,
  DemoTitle,
} from '../../src/components/DemoScreen';
import { GlassCard, GlassDivider } from '../../src/components/Glass';
import { findReadyDemo } from '../../src/demos/catalog';

const DEMO = findReadyDemo('swipe')!;

/** Past this many points the gesture commits instead of springing back. */
const COMMIT_THRESHOLD = 90;
/**
 * Horizontal travel before the pan activates. Below this the gesture has not
 * claimed anything, so the ScrollView keeps it — this is what makes vertical
 * scrolling over a card still work.
 */
const ACTIVE_OFFSET_X = 12;
/** Vertical travel that makes the pan fail outright and hand back the scroll. */
const FAIL_OFFSET_Y = 16;
const LONG_PRESS_MS = 480;
/** How far the finger may wander and still count as a long press. */
const LONG_PRESS_SLOP = 12;
/** Android honours the duration; iOS ignores it and plays its fixed system buzz. */
const LONG_PRESS_VIBRATION_MS = 15;

/**
 * React Native core `Vibration`, not `expo-haptics` (banned: its native module
 * is not in the rewrap binary). Guarded so a missing module never takes the
 * menu down with it.
 */
function vibrate() {
  try {
    Vibration.vibrate(LONG_PRESS_VIBRATION_MS);
  } catch {
    // No vibrator, or the module is absent — the menu is feedback enough.
  }
}

type Resolution = 'done' | 'later';

type Card = { id: string; code: string; title: string; meta: string };

const CARDS: Card[] = [
  { id: 'c1', code: 'P12', title: 'Remplacement pompe P-12', meta: 'Site Nanterre · 09:00' },
  { id: 'c2', code: 'CV4', title: 'Contrôle vanne CV-4', meta: 'Site Courbevoie · 11:30' },
  { id: 'c3', code: 'TH9', title: 'Relevé thermique TH-9', meta: 'Site Puteaux · 15:00' },
];

const MENU_ACTIONS = [
  { label: 'Ouvrir la fiche', destructive: false },
  { label: 'Appeler le client', destructive: false },
  { label: 'Affecter à un collègue', destructive: false },
  { label: 'Reporter à demain', destructive: true },
];

function SwipeCard({
  card,
  resolution,
  onResolve,
  onLongPress,
}: {
  card: Card;
  resolution: Resolution | undefined;
  onResolve: (id: string, resolution: Resolution) => void;
  onLongPress: (card: Card) => void;
}) {
  const theme = useTheme();
  const translateX = useSharedValue(0);

  const done = theme.statusComplete.val as string;
  const later = theme.statusPending.val as string;

  /**
   * Both gestures run on the native UI thread. Arbitration is declarative:
   * `activeOffsetX` means the pan only wins once the finger has committed
   * horizontally, and `failOffsetY` hands the gesture back to the ScrollView
   * the moment it looks vertical. That is the whole reason this is no longer a
   * PanResponder — JS-side responder negotiation ran a frame late and the
   * ScrollView could steal a swipe that was already under way.
   */
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onUpdate((event) => {
          translateX.value = event.translationX;
        })
        .onEnd((event) => {
          if (event.translationX > COMMIT_THRESHOLD) {
            runOnJS(onResolve)(card.id, 'done');
          } else if (event.translationX < -COMMIT_THRESHOLD) {
            runOnJS(onResolve)(card.id, 'later');
          }
          // The card always returns home; the state change is what persists.
          translateX.value = withTiming(0, {
            duration: 260,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          });
        }),
    [card.id, onResolve, translateX],
  );

  const longPress = React.useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(LONG_PRESS_MS)
        .maxDistance(LONG_PRESS_SLOP)
        .onStart(() => {
          runOnJS(onLongPress)(card);
        }),
    [card, onLongPress],
  );

  // Race, not Exclusive: Exclusive made the long press wait for the pan to
  // *fail*, which only happens when the finger lifts — so the menu opened on
  // release. With Race, whichever activates first cancels the other: the long
  // press fires while the finger is still down (like iOS), and a drag past
  // ACTIVE_OFFSET_X — or LONG_PRESS_SLOP — still kills it before it can fire.
  const gesture = React.useMemo(() => Gesture.Race(pan, longPress), [pan, longPress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Rail colour and labels are derived on the UI thread from the same shared
  // value, so they track the finger exactly instead of lagging behind setState.
  const railStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-COMMIT_THRESHOLD, 0, COMMIT_THRESHOLD],
      [later, '#e5e5ea', done],
    ),
  }));
  const doneLabelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(1, translateX.value / COMMIT_THRESHOLD) : 0,
  }));
  const laterLabelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(1, -translateX.value / COMMIT_THRESHOLD) : 0,
  }));

  const stateLabel =
    resolution === 'done' ? 'Terminée' : resolution === 'later' ? 'Reportée' : 'À faire';
  const stateColor =
    resolution === 'done'
      ? theme.statusComplete.val
      : resolution === 'later'
        ? theme.statusPending.val
        : theme.text2.val;

  return (
    <Animated.View style={[{ borderRadius: 14, overflow: 'hidden' }, railStyle]}>
      <XStack position="absolute" t={0} b={0} l={0} r={0} items="center" justify="space-between" px="$4.5">
        <Animated.View style={doneLabelStyle}>
          <Text color="$accentOnAccent" fontSize={14} fontWeight="600">
            Terminer
          </Text>
        </Animated.View>
        <Animated.View style={laterLabelStyle}>
          <Text color="$accentOnAccent" fontSize={14} fontWeight="600">
            Reporter
          </Text>
        </Animated.View>
      </XStack>

      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <XStack
            items="center"
            gap="$3"
            px="$4"
            py="$3.5"
            bg="rgba(255,255,255,0.83)"
            opacity={resolution ? 0.55 : 1}
          >
            <YStack
              width={34}
              height={34}
              rounded="$4"
              items="center"
              justify="center"
              bg="$accentSoft"
            >
              <Text color="$accentBase" fontSize={13} fontWeight="600">
                {card.code}
              </Text>
            </YStack>
            <YStack flex={1} gap="$0.5">
              <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
                {card.title}
              </Text>
              <Text color="$text2" fontSize={13} lineHeight={18}>
                {card.meta}
              </Text>
            </YStack>
            <Text color={stateColor as never} fontSize={12} lineHeight={16} fontWeight="600">
              {stateLabel}
            </Text>
          </XStack>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function ContextMenu({ card, onClose }: { card: Card; onClose: () => void }) {
  const theme = useTheme();

  return (
    <YStack
      position="absolute"
      t={0}
      b={0}
      l={0}
      r={0}
      z={20}
      bg={glass.overlay.scrim}
      items="center"
      justify="center"
      gap="$2.5"
      px="$6"
      onPress={onClose}
      role="button"
      aria-label="Fermer le menu contextuel"
    >
      <GlassCard tone="overlay" rounded="$6" width="100%" flexDirection="row" items="center" gap="$3" px="$4" py="$3.5">
        <YStack width={34} height={34} rounded="$4" items="center" justify="center" bg="$accentSoft">
          <Text color="$accentBase" fontSize={13} fontWeight="600">
            {card.code}
          </Text>
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
            {card.title}
          </Text>
          <Text color="$text2" fontSize={13} lineHeight={18}>
            {card.meta}
          </Text>
        </YStack>
      </GlassCard>

      <GlassCard tone="overlay" rounded="$6" width={236}>
        {MENU_ACTIONS.map((action, index) => (
          <YStack key={action.label}>
            {index > 0 && <GlassDivider />}
            <YStack
              px="$4"
              py="$3.5"
              pressStyle={{ bg: 'rgba(120,120,128,0.12)' }}
              onPress={onClose}
              role="button"
              aria-label={action.label}
            >
              <Text
                color={(action.destructive ? tokens.color.statusDanger : theme.text0.val) as never}
                fontSize={17}
                lineHeight={22}
              >
                {action.label}
              </Text>
            </YStack>
          </YStack>
        ))}
      </GlassCard>

      <Text color="$accentOnAccent" opacity={0.75} fontSize={13} lineHeight={18}>
        Touchez le fond pour fermer
      </Text>
    </YStack>
  );
}

export default function SwipeDemoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [resolved, setResolved] = React.useState<Record<string, Resolution>>({});
  const [menuCard, setMenuCard] = React.useState<Card | null>(null);

  const handleResolve = React.useCallback((id: string, resolution: Resolution) => {
    setResolved((previous) => ({ ...previous, [id]: resolution }));
  }, []);

  const handleLongPress = React.useCallback((card: Card) => {
    vibrate();
    setMenuCard(card);
  }, []);

  const resolvedCount = Object.keys(resolved).length;

  return (
    <>
      {/*
        The stack's own swipe-back is a native edge gesture owned by
        react-native-screens, outside gesture-handler's arbitration — so a
        left-to-right card swipe started near the edge popped the screen instead
        of resolving the card. Disabled for this route only; the back link in
        the chrome remains the way out.
      */}
      <Stack.Screen options={{ gestureEnabled: false }} />

      <DemoScaffold
        onBack={() => router.back()}
        footer={
          <DemoCta
            label={DEMO.cta}
            onPress={() => {
              setResolved({});
              setMenuCard(null);
            }}
          />
        }
      >
        <DemoTitle title={DEMO.title} long={DEMO.long} />

        <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
          <YStack flex={1} items="center" justify="center" gap="$2.5">
            <XStack items="center" gap="$4">
              <Ionicons name="arrow-back" size={26} color={theme.statusPending.val} />
              <Ionicons name="hand-left-outline" size={40} color={theme.accentOnAccent.val} />
              <Ionicons name="arrow-forward" size={26} color={theme.statusComplete.val} />
            </XStack>
            <Text color="$accentOnAccent" opacity={0.75} fontSize={13} lineHeight={18}>
              {resolvedCount} / {CARDS.length} traitées
            </Text>
          </YStack>
        </DemoHero>

        <CapabilityChips chips={DEMO.tags} />

        <YStack gap="$2">
          <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
            TOURNÉE DU JOUR
          </Text>
          <Text ml="$4" mb="$1" color="$text2" fontSize={13} lineHeight={18}>
            Glissez à droite pour terminer, à gauche pour reporter. Appui long pour le menu.
          </Text>
          <YStack gap="$2">
            {CARDS.map((card) => (
              <SwipeCard
                key={card.id}
                card={card}
                resolution={resolved[card.id]}
                onResolve={handleResolve}
                onLongPress={handleLongPress}
              />
            ))}
          </YStack>
        </YStack>

        <DemonstratesList items={DEMO.bullets} />

        <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
          L'appui long vibre via l'API Vibration de React Native. Le retour haptique fin
          (expo-haptics) n'est pas encore disponible dans ce template.
        </Text>
      </DemoScaffold>

      {menuCard && <ContextMenu card={menuCard} onClose={() => setMenuCard(null)} />}
    </>
  );
}
