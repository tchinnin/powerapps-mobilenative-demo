import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Text, YStack, useTheme } from 'tamagui';

import { glass, tokens } from '../../brand/tokens';
import {
  CapabilityChips,
  DemoCta,
  DemonstratesList,
  DemoResultCard,
  DemoScaffold,
  DemoTitle,
} from '../../src/components/DemoScreen';
import { MediaStripes } from '../../src/components/Glass';
import { findReadyDemo } from '../../src/demos/catalog';

const DEMO = findReadyDemo('gestures')!;

const STAGE_HEIGHT = 340;
const PLAN_WIDTH = 200;
const PLAN_HEIGHT = 140;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
/** Released within this many degrees of a right angle, the plan snaps square. */
const SNAP_DEGREES = 8;
/** Zoom step for the VoiceOver / TalkBack adjustable actions. */
const A11Y_ZOOM_STEP = 1.25;
const SPRING = { damping: 18, stiffness: 180 };

const QUARTER_TURN = Math.PI / 2;
const SNAP_RADIANS = (SNAP_DEGREES * Math.PI) / 180;

type Transform = {
  scale: SharedValue<number>;
  rotation: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

function formatNumber(value: number, digits: number) {
  return value.toFixed(digits).replace('.', ',');
}

/**
 * Live readout of the transform. It owns its own state so the 60 fps updates
 * re-render this card only, never the gesture stage above it.
 */
function TransformReadout({ scale, rotation, translateX, translateY }: Transform) {
  const [readout, setReadout] = React.useState({ zoom: 1, angle: 0, x: 0, y: 0 });

  useAnimatedReaction(
    () => {
      const degrees = (rotation.value * 180) / Math.PI;
      return {
        zoom: Math.round(scale.value * 10) / 10,
        // Normalised to [-180, 180) so a full turn reads 0°, not 360°.
        angle: Math.round((((degrees % 360) + 540) % 360) - 180),
        x: Math.round(translateX.value),
        y: Math.round(translateY.value),
      };
    },
    (next, previous) => {
      if (
        !previous ||
        next.zoom !== previous.zoom ||
        next.angle !== previous.angle ||
        next.x !== previous.x ||
        next.y !== previous.y
      ) {
        runOnJS(setReadout)(next);
      }
    },
  );

  return (
    <DemoResultCard
      label={DEMO.resultLabel}
      value={`Zoom ${formatNumber(readout.zoom, 1)}× · ${readout.angle}° · x ${readout.x}, y ${readout.y}`}
    />
  );
}

/** A floor-plan card: grid, a marker and a legend — something worth zooming into. */
function PlanCard() {
  const theme = useTheme();
  // Cast as swipe.tsx does: a resolved theme string is not a typed Tamagui colour.
  const accent = theme.accentBase.val as never;

  return (
    <YStack
      width={PLAN_WIDTH}
      height={PLAN_HEIGHT}
      rounded="$6"
      overflow="hidden"
      bg="rgba(255,255,255,0.94)"
      borderWidth={1}
      borderColor="rgba(255,255,255,0.8)"
    >
      {[1, 2, 3, 4, 5, 6, 7].map((column) => (
        <YStack
          key={`v${column}`}
          position="absolute"
          t={0}
          b={0}
          l={(PLAN_WIDTH / 8) * column}
          width={1}
          bg={accent}
          opacity={0.12}
        />
      ))}
      {[1, 2, 3, 4, 5].map((row) => (
        <YStack
          key={`h${row}`}
          position="absolute"
          l={0}
          r={0}
          t={(PLAN_HEIGHT / 6) * row}
          height={1}
          bg={accent}
          opacity={0.12}
        />
      ))}
      {/* Two "rooms", so rotation reads at a glance. */}
      <YStack
        position="absolute"
        t={14}
        l={14}
        width={74}
        height={52}
        rounded="$3"
        borderWidth={2}
        borderColor={accent}
        opacity={0.55}
      />
      <YStack
        position="absolute"
        b={30}
        r={16}
        width={92}
        height={44}
        rounded="$3"
        borderWidth={2}
        borderColor={accent}
        opacity={0.55}
      />
      <YStack position="absolute" t={24} r={40}>
        <Ionicons name="location" size={22} color={tokens.color.statusDanger} />
      </YStack>
      <Text position="absolute" l={12} b={8} color="$text0" fontSize={11} lineHeight={14} fontWeight="600">
        Plan · Site Nanterre · P-12
      </Text>
    </YStack>
  );
}

export default function GesturesDemoScreen() {
  const router = useRouter();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // Stage centre in stage coordinates: focal points arrive relative to the
  // stage, the plan's transform is relative to its centre.
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(STAGE_HEIGHT / 2);

  const [touching, setTouching] = React.useState(false);

  const reset = React.useCallback(() => {
    scale.value = withSpring(1, SPRING);
    rotation.value = withSpring(0, SPRING);
    translateX.value = withSpring(0, SPRING);
    translateY.value = withSpring(0, SPRING);
  }, [rotation, scale, translateX, translateY]);

  /**
   * All four recognisers run natively and at the same time — that is what
   * `Simultaneous` means, and what a WebView cannot give: there, the browser
   * owns pinch (page zoom) and two-finger rotation is not an event at all.
   *
   * Every gesture applies its *incremental* change (`onChange`) to the shared
   * transform instead of an absolute value, so they compose cleanly: the pinch
   * zooms around the point between the fingers, the rotation turns around its
   * anchor, and the pan carries the whole thing with them.
   */
  const gesture = React.useMemo(() => {
    const pinch = Gesture.Pinch().onChange((event) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * event.scaleChange));
      const factor = nextScale / scale.value;
      // Keep the point under the fingers fixed: t' = f - k (f - t).
      const focalX = event.focalX - centerX.value;
      const focalY = event.focalY - centerY.value;
      translateX.value = focalX - factor * (focalX - translateX.value);
      translateY.value = focalY - factor * (focalY - translateY.value);
      scale.value = nextScale;
    });

    const rotate = Gesture.Rotation()
      .onChange((event) => {
        // Turn around the anchor between the fingers: t' = a + R(d) (t - a).
        const anchorX = event.anchorX - centerX.value;
        const anchorY = event.anchorY - centerY.value;
        const dx = translateX.value - anchorX;
        const dy = translateY.value - anchorY;
        const cos = Math.cos(event.rotationChange);
        const sin = Math.sin(event.rotationChange);
        translateX.value = anchorX + dx * cos - dy * sin;
        translateY.value = anchorY + dx * sin + dy * cos;
        rotation.value += event.rotationChange;
      })
      .onEnd(() => {
        const nearest = Math.round(rotation.value / QUARTER_TURN) * QUARTER_TURN;
        if (Math.abs(rotation.value - nearest) < SNAP_RADIANS) {
          rotation.value = withSpring(nearest, SPRING);
        }
      });

    const pan = Gesture.Pan()
      .averageTouches(true)
      .onBegin(() => {
        runOnJS(setTouching)(true);
      })
      .onChange((event) => {
        translateX.value += event.changeX;
        translateY.value += event.changeY;
      })
      .onFinalize(() => {
        runOnJS(setTouching)(false);
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((_event, success) => {
        if (success) {
          runOnJS(reset)();
        }
      });

    return Gesture.Simultaneous(pinch, rotate, pan, doubleTap);
  }, [centerX, centerY, reset, rotation, scale, translateX, translateY]);

  const planStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const handleStageLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      centerX.value = event.nativeEvent.layout.width / 2;
      centerY.value = event.nativeEvent.layout.height / 2;
    },
    [centerX, centerY],
  );

  // Pinch and rotation have no VoiceOver / TalkBack equivalent, so the stage is
  // an adjustable element: swipe up / down with one finger to zoom.
  const handleAccessibilityAction = React.useCallback(
    (event: AccessibilityActionEvent) => {
      const step = event.nativeEvent.actionName === 'increment' ? A11Y_ZOOM_STEP : 1 / A11Y_ZOOM_STEP;
      scale.value = withSpring(
        Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * step)),
        SPRING,
      );
    },
    [scale],
  );

  return (
    <DemoScaffold
      onBack={() => router.back()}
      scrollEnabled={!touching}
      footer={<DemoCta label={DEMO.cta} onPress={reset} />}
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <GestureDetector gesture={gesture}>
        <Animated.View
          onLayout={handleStageLayout}
          style={{
            height: STAGE_HEIGHT,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: glass.media.fill,
            borderWidth: 1,
            borderColor: glass.media.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Plan manipulable"
          accessibilityHint="Balayez vers le haut ou le bas pour zoomer. Le bouton Recentrer le plan remet la vue à zéro."
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={handleAccessibilityAction}
        >
          <MediaStripes />
          <Animated.View style={planStyle}>
            <PlanCard />
          </Animated.View>
          <Text
            position="absolute"
            l={14}
            b={11}
            color="$accentOnAccent"
            opacity={0.75}
            fontSize={12}
            lineHeight={16}
          >
            Pincez · pivotez · glissez · double-tap
          </Text>
        </Animated.View>
      </GestureDetector>

      <TransformReadout
        scale={scale}
        rotation={rotation}
        translateX={translateX}
        translateY={translateY}
      />

      <CapabilityChips chips={DEMO.tags} />

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Les gestes sont reconnus et animés sur le thread UI natif : le plan suit les doigts même si
        le JavaScript est occupé. Dans une WebView, le navigateur garde le pincement pour zoomer la
        page et ne fournit pas la rotation à deux doigts.
      </Text>
    </DemoScaffold>
  );
}
