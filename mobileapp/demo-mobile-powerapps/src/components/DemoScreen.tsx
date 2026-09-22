/**
 * Shared chrome for a capability demo page, ported from the Claude Design
 * prototype "Power Apps Mobile.dc.html".
 *
 * Structure, top to bottom: back link → title + lead → dark hero panel →
 * capability chips → "ce que ça démontre" checklist → result card → CTA bar.
 * Both /photo and /qr-code render exactly this; only the hero content and what
 * the CTA triggers differ.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button, Text, XStack, YStack, useTheme } from 'tamagui';

import { glass } from '../../brand/tokens';
import type { DemoTag, TagTone } from '../demos/catalog';
import { AppBackground, GlassCard, GlassDivider, MediaStripes } from './Glass';

export { AppBackground };

const TAG_TONES = {
  tint: { bg: '$accentSoft', text: '$accentDeep' },
  green: { bg: '$statusCompleteBg', text: '$statusComplete' },
  amber: { bg: '$statusPendingBg', text: '$statusPending' },
  blue: { bg: '$statusInProgressBg', text: '$statusInProgress' },
} as const satisfies Record<TagTone, { bg: string; text: string }>;

export function DemoBackLink({ onPress, label = 'Démos' }: { onPress: () => void; label?: string }) {
  const theme = useTheme();

  return (
    <XStack
      height={44}
      items="center"
      gap="$1"
      px="$2"
      self="flex-start"
      pressStyle={{ opacity: 0.6 }}
      onPress={onPress}
      role="button"
      aria-label={`Retour à ${label}`}
    >
      <Ionicons name="chevron-back" size={20} color={theme.accentBase.val} />
      <Text color="$accentBase" fontSize={17} lineHeight={22}>
        {label}
      </Text>
    </XStack>
  );
}

export function DemoTitle({ title, long }: { title: string; long: string }) {
  return (
    <YStack gap="$1.5">
      <Text color="$text0" fontSize={32} lineHeight={38} fontWeight="700">
        {title}
      </Text>
      <Text color="$text2" fontSize={15} lineHeight={20}>
        {long}
      </Text>
    </YStack>
  );
}

/** The scanline the prototype sweeps under the hero icon (2.6s, ease-in-out). */
function Scanline() {
  const offset = useSharedValue(-58);

  React.useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(58, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-58, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const theme = useTheme();

  return (
    <Animated.View
      style={[
        { width: 132, height: 2, borderRadius: 2, backgroundColor: theme.accentBase.val },
        style,
      ]}
    />
  );
}

/**
 * Dark media panel. `children` replaces the placeholder entirely — that is how
 * the real camera preview and the captured photo get in.
 */
export function DemoHero({
  icon,
  caption,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  caption: string;
  children?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <YStack
      height={196}
      rounded="$7"
      overflow="hidden"
      bg={glass.media.fill}
      borderWidth={1}
      borderColor={glass.media.border}
    >
      {children ?? (
        <>
          <MediaStripes />
          <YStack flex={1} items="center" justify="center" gap="$3">
            <Ionicons name={icon} size={48} color={theme.accentBase.val} />
            <Scanline />
          </YStack>
          <Text
            position="absolute"
            l={14}
            b={11}
            color="$accentOnAccent"
            opacity={0.72}
            fontSize={11}
            lineHeight={14}
            fontFamily="$mono"
          >
            {caption}
          </Text>
        </>
      )}
    </YStack>
  );
}

export function CapabilityChips({ chips }: { chips: DemoTag[] }) {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {chips.map((chip) => (
        <XStack
          key={chip.label}
          bg={TAG_TONES[chip.tone].bg}
          px="$3"
          py="$1.5"
          rounded="$10"
          items="center"
        >
          <Text color={TAG_TONES[chip.tone].text} fontSize={12} lineHeight={16} fontWeight="500">
            {chip.label}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
}

export function DemonstratesList({ items }: { items: string[] }) {
  const theme = useTheme();

  return (
    <YStack gap="$2">
      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        CE QUE ÇA DÉMONTRE
      </Text>
      <GlassCard rounded="$6">
        {items.map((item, index) => (
          <YStack key={item}>
            {index > 0 && <GlassDivider inset={44} />}
            <XStack items="center" gap="$2.5" px="$4" py="$3">
              <Ionicons name="checkmark" size={18} color={theme.accentBase.val} />
              <Text flex={1} color="$text0" fontSize={16} lineHeight={21}>
                {item}
              </Text>
            </XStack>
          </YStack>
        ))}
      </GlassCard>
    </YStack>
  );
}

/** Success card the prototype pops in once the capability returned something. */
export function DemoResultCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style}>
      <GlassCard rounded="$6" flexDirection="row" px="$4" py="$3.5" gap="$3">
        <YStack
          width={28}
          height={28}
          rounded="$10"
          items="center"
          justify="center"
          bg="$statusCompleteBg"
        >
          <Ionicons name="checkmark" size={16} color={theme.statusComplete.val} />
        </YStack>
        <YStack flex={1} gap="$1">
          <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
            {label}
          </Text>
          <Text color="$text2" fontSize={13} lineHeight={18} fontFamily="$mono">
            {value}
          </Text>
        </YStack>
      </GlassCard>
    </Animated.View>
  );
}

/** Inline notice for a refused permission, a cancel, or a failure. */
export function DemoNotice({ message }: { message: string }) {
  return (
    <YStack bg="$statusPendingBg" rounded="$6" px="$4" py="$3">
      <Text color="$statusPending" fontSize={15} lineHeight={20}>
        {message}
      </Text>
    </YStack>
  );
}

export function DemoCta({
  label,
  onPress,
  busy = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const primary = variant === 'primary';

  return (
    <Button
      flex={1}
      height={50}
      rounded="$6"
      bg={primary ? '$accentBase' : glass.surface.fill}
      borderWidth={primary ? 0 : 1}
      borderColor={primary ? undefined : glass.surface.border}
      opacity={busy ? 0.62 : 1}
      disabled={busy}
      onPress={onPress}
      aria-label={label}
    >
      <Text
        color={primary ? '$accentOnAccent' : '$accentBase'}
        fontSize={17}
        lineHeight={22}
        fontWeight="600"
      >
        {label}
      </Text>
    </Button>
  );
}

/** Labelled glass section — "ENREGISTREUR", "ZONE DE SIGNATURE", "POSITION"… */
export function DemoSection({
  label,
  children,
  ...props
}: { label: string } & React.ComponentProps<typeof GlassCard>) {
  return (
    <YStack gap="$2">
      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        {label}
      </Text>
      <GlassCard rounded="$6" {...props}>
        {children}
      </GlassCard>
    </YStack>
  );
}

/**
 * The page frame every demo shares: glass canvas, back link, scrolling body and
 * a pinned CTA bar. Screens supply only what is genuinely theirs — the hero
 * content, any capability-specific section, and what the CTA does.
 */
export function DemoScaffold({
  onBack,
  children,
  footer,
}: {
  onBack: () => void;
  children: React.ReactNode;
  /** The pinned action bar. Omit for a demo whose interaction is inline. */
  footer?: React.ReactNode;
}) {
  return (
    <AppBackground>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <YStack flex={1}>
          <YStack px="$2">
            <DemoBackLink onPress={onBack} />
          </YStack>

          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <YStack px="$4" gap="$4.5">
              {children}
            </YStack>
          </ScrollView>

          {footer ? (
            <XStack px="$4" pt="$3" gap="$3">
              {footer}
            </XStack>
          ) : null}
        </YStack>
      </SafeAreaView>
    </AppBackground>
  );
}
