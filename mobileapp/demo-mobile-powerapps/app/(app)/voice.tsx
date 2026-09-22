import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { glass, tokens } from '../../brand/tokens';
import {
  CapabilityChips,
  DemoCta,
  DemoHero,
  DemoNotice,
  DemoResultCard,
  DemoScaffold,
  DemoSection,
  DemonstratesList,
  DemoTitle,
} from '../../src/components/DemoScreen';
import { findReadyDemo } from '../../src/demos/catalog';
import {
  RecordingPresets,
  formatDuration,
  startRecording,
  stopRecording,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from '../../src/native/audio';

const DEMO = findReadyDemo('voice')!;

/** The recording red. `theme.statusDanger` is optional in the dark alias set. */
const DANGER = tokens.color.statusDanger;

const BAR_COUNT = 28;
const BAR_MIN = 4;
const BAR_MAX = 46;
const IDLE_BARS = Array.from({ length: BAR_COUNT }, () => BAR_MIN);

/**
 * expo-audio reports metering in dBFS: roughly -160 (silence) to 0 (clipping),
 * and voice sits around -40..-5. Mapping the useful band rather than the full
 * range is what makes the waveform move visibly instead of twitching.
 */
function meterToHeight(db: number | undefined): number {
  if (db === undefined || Number.isNaN(db)) return BAR_MIN;
  const floor = -50;
  const normalized = Math.max(0, Math.min(1, (db - floor) / -floor));
  return Math.round(BAR_MIN + normalized * (BAR_MAX - BAR_MIN));
}

function Waveform({ bars, active }: { bars: number[]; active: boolean }) {
  const theme = useTheme();

  return (
    <XStack height={64} items="center" justify="center" gap={3}>
      {bars.map((height, index) => (
        <YStack
          key={index}
          width={4}
          height={active ? height : Math.max(BAR_MIN, Math.round(height * 0.6))}
          rounded={2}
          bg={(active ? theme.accentBase.val : 'rgba(120,120,128,0.25)') as never}
        />
      ))}
    </XStack>
  );
}

export default function VoiceDemoScreen() {
  const router = useRouter();
  const theme = useTheme();

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 120);

  const [bars, setBars] = React.useState<number[]>(IDLE_BARS);
  const [memo, setMemo] = React.useState<{ uri: string; durationMillis: number } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const isRecording = recorderState.isRecording;

  const player = useAudioPlayer(memo?.uri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);

  // Roll one new sample per metering tick, so the waveform scrolls right-to-left
  // the way a level meter does, rather than redrawing all 28 bars at once.
  React.useEffect(() => {
    if (!isRecording) return;
    setBars((previous) => [...previous.slice(1), meterToHeight(recorderState.metering)]);
  }, [isRecording, recorderState.metering]);

  const handleToggleRecord = React.useCallback(async () => {
    setNotice(null);

    if (isRecording) {
      setBusy(true);
      const result = await stopRecording(recorder);
      setBusy(false);

      if (result.ok) {
        setMemo({ uri: result.uri, durationMillis: result.durationMillis });
      } else {
        setNotice(result.message ?? "L'enregistrement a échoué.");
        setBars(IDLE_BARS);
      }
      return;
    }

    setBusy(true);
    setMemo(null);
    setBars(IDLE_BARS);
    const started = await startRecording(recorder);
    setBusy(false);

    if (!started.ok) {
      setNotice(
        started.reason === 'permission-denied'
          ? "Accès au micro refusé. Autorise-le dans les réglages de l'appareil."
          : (started.message ?? "L'enregistrement n'a pas pu démarrer."),
      );
    }
  }, [isRecording, recorder]);

  const togglePlayback = React.useCallback(() => {
    if (!memo) return;
    if (playerStatus.playing) {
      player.pause();
      return;
    }
    // Replay from the top once the memo has run to the end.
    if (playerStatus.didJustFinish || playerStatus.currentTime >= playerStatus.duration) {
      player.seekTo(0);
    }
    player.play();
  }, [memo, player, playerStatus]);

  const elapsed = isRecording ? recorderState.durationMillis : (memo?.durationMillis ?? 0);

  const hint = isRecording
    ? 'Enregistrement en cours'
    : memo
      ? 'Prêt à être réécouté'
      : 'Touchez pour enregistrer';

  const ctaLabel = isRecording
    ? "Arrêter l'enregistrement"
    : memo
      ? 'Nouvel enregistrement'
      : DEMO.cta;

  const progress =
    playerStatus.duration > 0
      ? Math.min(100, (playerStatus.currentTime / playerStatus.duration) * 100)
      : 0;

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={<DemoCta label={busy ? DEMO.running : ctaLabel} busy={busy} onPress={handleToggleRecord} />}
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero} />

      <CapabilityChips chips={DEMO.tags} />

      <DemoSection label="ENREGISTREUR" p="$4">
        <Waveform bars={bars} active={isRecording} />

        <XStack mt="$2.5" items="center" justify="space-between">
          <Text
            color={(isRecording ? DANGER : theme.text0.val) as never}
            fontSize={22}
            lineHeight={28}
            fontWeight="600"
            fontFamily="$mono"
          >
            {formatDuration(elapsed)}
          </Text>
          <Text color="$text2" fontSize={13} lineHeight={18}>
            {hint}
          </Text>
        </XStack>

        <XStack mt="$3.5" items="center" justify="center">
          <YStack
            width={68}
            height={68}
            rounded={9999}
            items="center"
            justify="center"
            borderWidth={3}
            borderColor="rgba(255,255,255,0.85)"
            bg={(isRecording ? DANGER : theme.accentBase.val) as never}
            boxShadow="0px 6px 18px rgba(26,18,48,0.14)"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleToggleRecord}
            role="button"
            aria-label={isRecording ? "Arrêter l'enregistrement" : 'Démarrer un enregistrement'}
          >
            <YStack
              width={isRecording ? 24 : 46}
              height={isRecording ? 24 : 46}
              rounded={isRecording ? 6 : 9999}
              bg="$accentOnAccent"
            />
          </YStack>
        </XStack>
      </DemoSection>

      {memo && (
        <DemoSection label="MÉMO" flexDirection="row" items="center" gap="$3" px="$4" py="$3">
          <YStack
            width={40}
            height={40}
            rounded={9999}
            items="center"
            justify="center"
            bg="$accentBase"
            pressStyle={{ opacity: 0.8 }}
            onPress={togglePlayback}
            role="button"
            aria-label={playerStatus.playing ? 'Mettre en pause' : 'Lire le mémo'}
          >
            <Ionicons
              name={playerStatus.playing ? 'pause' : 'play'}
              size={16}
              color={theme.accentOnAccent.val}
            />
          </YStack>

          <YStack flex={1} gap="$1.5">
            <Text color="$text0" fontSize={16} lineHeight={21} fontWeight="600">
              Mémo vocal
            </Text>
            <YStack height={4} rounded={2} bg="rgba(120,120,128,0.20)" overflow="hidden">
              <YStack height={4} rounded={2} width={`${progress}%`} bg="$accentBase" />
            </YStack>
          </YStack>

          <Text color="$text2" fontSize={13} fontFamily="$mono">
            {formatDuration(memo.durationMillis)}
          </Text>
        </DemoSection>
      )}

      {memo && (
        <DemoResultCard
          label={DEMO.resultLabel}
          value={`${formatDuration(memo.durationMillis)} — ${memo.uri.split('/').pop() ?? 'mémo.m4a'}`}
        />
      )}
      {notice && <DemoNotice message={notice} />}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Le fichier reste sur l'appareil — rien n'est envoyé au serveur.
      </Text>
    </DemoScaffold>
  );
}
