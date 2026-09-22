/**
 * Glassmorphism primitives — the React Native stand-in for the prototype's
 * `backdrop-filter: blur(26px) saturate(185%)`.
 *
 * RN has no backdrop filter and `expo-blur` is not in the template (adding it
 * would cross the native-module boundary, hard rule 2). So "glass" here is a
 * composition of four cheap, real things:
 *
 *   translucent fill  →  lets the canvas gradient read through
 *   hairline border   →  the lit edge of a pane
 *   1px inset highlight at the top  →  light catching the top bevel
 *   soft drop shadow  →  lifts the pane off the canvas
 *
 * The effect holds because the canvas underneath is a smooth gradient with soft
 * colour washes: there is no high-frequency detail that a real blur would need
 * to smear. Put a photo behind these and the illusion breaks — that is the
 * known limit of this approach.
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { YStack, type YStackProps } from 'tamagui';

import { glass } from '../../brand/tokens';

/**
 * One soft colour wash.
 *
 * A real Gaussian blur is unavailable, so the radial falloff is built by
 * stacking concentric circles at low alpha: alpha accumulates towards the
 * centre and thins towards the rim. `LAYERS` trades smoothness against
 * view count — below ~14 the banding becomes visible on a light canvas.
 */
const ORB_LAYERS = 18;

function Orb({
  color,
  opacity,
  size,
  height,
  top,
  bottom,
  left,
  right,
}: {
  color: string;
  opacity: number;
  size: number;
  height?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  const boxHeight = height ?? size;
  // Per-layer alpha, so the accumulated centre lands on `opacity`.
  const step = opacity / ORB_LAYERS;

  return (
    <YStack
      position="absolute"
      t={top}
      b={bottom}
      l={left}
      r={right}
      width={size}
      height={boxHeight}
      items="center"
      justify="center"
      pointerEvents="none"
    >
      {Array.from({ length: ORB_LAYERS }).map((_, index) => {
        const scale = 1 - index / ORB_LAYERS;
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: size * scale,
              height: boxHeight * scale,
              borderRadius: 9999,
              backgroundColor: color,
              opacity: step,
            }}
          />
        );
      })}
    </YStack>
  );
}

/**
 * The app canvas: gradient plus the three washes, painted once per screen
 * behind everything else. Screens render their content as `children`.
 */
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <YStack flex={1}>
      <LinearGradient
        colors={glass.canvas}
        locations={glass.canvasStops}
        // 165° in CSS ≈ top-left to bottom-right, tilted towards vertical.
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Orb {...glass.orbs.violet} size={260} top={-60} left={-40} />
      <Orb {...glass.orbs.blue} size={240} top={300} right={-70} />
      <Orb {...glass.orbs.amber} size={300} height={220} bottom={-50} left={40} />
      <YStack flex={1}>{children}</YStack>
    </YStack>
  );
}

type GlassTone = 'surface' | 'bar' | 'overlay';

const TONES = {
  surface: glass.surface,
  bar: glass.bar,
  overlay: { ...glass.overlay, highlight: 'rgba(255,255,255,0.85)', shadow: undefined },
} as const;

export type GlassCardProps = YStackProps & {
  tone?: GlassTone;
  /** Turn off the 1px top bevel — wrong on a pane that is clipped at the top. */
  highlight?: boolean;
};

/**
 * The repeated glass pane. Everything that was a `#ffffffa1` card in the
 * prototype is this component.
 */
export function GlassCard({
  tone = 'surface',
  highlight = true,
  children,
  ...props
}: GlassCardProps) {
  const spec = TONES[tone];

  return (
    <YStack
      bg={spec.fill}
      borderWidth={1}
      borderColor={spec.border}
      boxShadow={'shadow' in spec ? spec.shadow : undefined}
      overflow="hidden"
      {...props}
    >
      {highlight && (
        <YStack
          position="absolute"
          t={0}
          l={0}
          r={0}
          height={1}
          bg={spec.highlight}
          pointerEvents="none"
          z={1}
        />
      )}
      {children}
    </YStack>
  );
}

/**
 * Hairline row separator. The prototype insets it past the icon column so the
 * rule starts at the text, which is the iOS table convention.
 */
export function GlassDivider({ inset = 0 }: { inset?: number }) {
  return <YStack height={StyleSheet.hairlineWidth} ml={inset} bg="rgba(60,60,67,0.20)" />;
}

/** Diagonal texture painted over the dark hero panel. */
export function MediaStripes() {
  return (
    <YStack position="absolute" t={0} r={0} b={0} l={0} overflow="hidden" pointerEvents="none">
      {Array.from({ length: 28 }).map((_, index) => (
        <YStack
          key={index}
          position="absolute"
          t={-140}
          l={index * 20 - 140}
          width={10}
          height={480}
          bg={glass.media.stripe as never}
          rotate="45deg"
        />
      ))}
    </YStack>
  );
}
