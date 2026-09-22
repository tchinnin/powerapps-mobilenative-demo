/**
 * Signed-in user's Office 365 photo, shown in the home header.
 *
 * The face degrades in three steps so the header never looks broken:
 *   photo → initials → generic person icon.
 *
 * Tapping it opens a UIKit-style attached menu carrying the full name. The menu
 * is only wired once a name is known — an empty menu would be worse than none,
 * so before that the avatar stays inert.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Popover, Text, YStack, useTheme } from 'tamagui';

import authConfig from '../../auth.config.json';
import { useMyProfile } from '../hooks/useMyProfile';

/** Resolved by scripts/resolve-environment.js at scaffold time. */
const ENVIRONMENT_NAME: string | undefined = authConfig.environment?.displayName;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AvatarFace({
  size,
  photoUri,
  displayName,
  dimmed,
  label,
}: {
  size: number;
  photoUri?: string | null;
  displayName?: string;
  dimmed: boolean;
  label: string;
}) {
  const theme = useTheme();

  return (
    <YStack
      width={size}
      height={size}
      rounded={size / 2}
      overflow="hidden"
      items="center"
      justify="center"
      bg="$accentSoft"
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          accessibilityLabel={label}
        />
      ) : displayName ? (
        <Text color="$accentDeep" fontSize={15} lineHeight={20} fontWeight="600">
          {initialsOf(displayName)}
        </Text>
      ) : (
        <Ionicons
          name="person-outline"
          size={Math.round(size * 0.5)}
          color={dimmed ? theme.text3.val : theme.accentBase.val}
        />
      )}
    </YStack>
  );
}

/**
 * The UIKit pop: opacity eases in while the card springs up from its top-right
 * corner, i.e. from under the avatar it is anchored to.
 *
 * Reanimated rather than Tamagui's `animation` prop — that prop is not typed in
 * this template's Tamagui config, for either the stock or the branded config.
 */
function MenuCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 110 });
    scale.value = withSpring(1, { damping: 16, stiffness: 260, mass: 0.6 });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          transformOrigin: 'top right',
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: theme.surface1.val,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.18)',
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function ProfileAvatar({ size = 36 }: { size?: number }) {
  const { data: profile, isLoading } = useMyProfile();
  const [open, setOpen] = React.useState(false);

  const displayName = profile?.displayName;
  const label = displayName ? `Connecté en tant que ${displayName}` : 'Profil utilisateur';

  const face = (
    <AvatarFace
      size={size}
      photoUri={profile?.photoUri}
      displayName={displayName}
      dimmed={isLoading}
      label={label}
    />
  );

  if (!displayName) {
    return (
      <YStack aria-label={label}>
        {face}
      </YStack>
    );
  }

  return (
    <Popover placement="bottom-end" offset={10} allowFlip open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {/* 36px face + 4px hitSlop each side = 44px touch target. */}
        <YStack
          role="button"
          aria-label={`${label}. Ouvrir le menu du profil`}
          hitSlop={4}
          pressStyle={{ opacity: 0.6 }}
        >
          {face}
        </YStack>
      </Popover.Trigger>

      <Popover.Content unstyled p={0} borderWidth={0} bg="transparent">
        <MenuCard>
          <YStack minW={220} maxW={280} height={44} px="$4" justify="center">
            <Text color="$text0" fontSize={17} lineHeight={22} fontWeight="600" numberOfLines={1}>
              {displayName}
            </Text>
          </YStack>
        </MenuCard>
      </Popover.Content>
    </Popover>
  );
}
