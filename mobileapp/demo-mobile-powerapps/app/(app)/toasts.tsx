import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Switch } from 'react-native';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { glass } from '../../brand/tokens';
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
import { GlassCard, GlassDivider } from '../../src/components/Glass';
import { findReadyDemo } from '../../src/demos/catalog';
import {
  getToastSupport,
  runWithSpinner,
  showAlert,
  showToast,
  type AlertPreset,
  type ToastHaptic,
  type ToastPosition,
  type ToastPreset,
} from '../../src/native/toast';

const DEMO = findReadyDemo('toasts')!;

type Mode = 'toast' | 'alert';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Simulated upload length — long enough to see the spinner, short enough to wait for. */
const SEND_MS = 2000;
/** Hard cap on the spinner alert, whatever happens to the task. */
const SPINNER_MAX_S = 10;

const TOAST_PRESETS: Record<
  ToastPreset,
  { label: string; title: string; message: string; icon: IconName; haptic: ToastHaptic }
> = {
  done: {
    label: 'Succès',
    title: 'Intervention enregistrée',
    message: "Synchronisée à l'instant",
    icon: 'checkmark-circle',
    haptic: 'success',
  },
  error: {
    label: 'Erreur',
    title: "Échec de l'envoi",
    message: 'Réessaie une fois connecté',
    icon: 'close-circle',
    haptic: 'error',
  },
  none: {
    label: 'Neutre',
    title: 'Brouillon sauvegardé',
    message: 'Sur cet appareil uniquement',
    icon: 'information-circle',
    haptic: 'warning',
  },
};

const ALERT_PRESETS: Record<
  AlertPreset,
  { label: string; title: string; message: string; icon: IconName; haptic: ToastHaptic }
> = {
  done: {
    label: 'Succès',
    title: 'Intervention clôturée',
    message: 'Le rapport part au client',
    icon: 'checkmark-circle',
    haptic: 'success',
  },
  error: {
    label: 'Erreur',
    title: 'Signature manquante',
    message: 'Fais signer le client avant de clôturer',
    icon: 'close-circle',
    haptic: 'error',
  },
  heart: {
    label: 'Favori',
    title: 'Ajouté aux favoris',
    message: 'Retrouve-le depuis l’accueil',
    icon: 'heart',
    haptic: 'success',
  },
};

const POSITION_LABELS: Record<ToastPosition, string> = { top: 'Haut', bottom: 'Bas' };

function timeLabel(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Same glass segmented control as the home filter, generic over its keys. */
function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <GlassCard
      height={32}
      rounded="$4"
      p="$0.5"
      bg={glass.segment.track}
      borderColor={glass.segment.trackBorder}
      highlight={false}
    >
      <XStack flex={1} gap="$0.5">
        {options.map((option) => {
          const active = option.key === value;
          return (
            <YStack
              key={option.key}
              flex={1}
              rounded="$3"
              items="center"
              justify="center"
              bg={active ? glass.segment.thumb : 'transparent'}
              boxShadow={active ? glass.segment.thumbShadow : undefined}
              onPress={() => onChange(option.key)}
              role="button"
              aria-label={`${label} : ${option.label}`}
            >
              <Text color="$text0" fontSize={14} fontWeight={active ? '600' : '400'}>
                {option.label}
              </Text>
            </YStack>
          );
        })}
      </XStack>
    </GlassCard>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2" px="$4" py="$3">
      <Text color="$text2" fontSize={13} lineHeight={18}>
        {label}
      </Text>
      {children}
    </YStack>
  );
}

/**
 * Hero preview of what the CTA is about to show: a pill at the chosen edge for
 * a toast, a centred card for an alert. It illustrates the configuration only —
 * the real message is drawn by the OS, above the app.
 */
function Preview({
  mode,
  position,
  icon,
  title,
}: {
  mode: Mode;
  position: ToastPosition;
  icon: IconName;
  title: string;
}) {
  const theme = useTheme();

  const iconNode = <Ionicons name={icon} size={mode === 'alert' ? 40 : 20} color={theme.accentBase.val} />;

  return (
    <YStack
      flex={1}
      p="$4"
      items="center"
      justify={mode === 'alert' ? 'center' : position === 'top' ? 'flex-start' : 'flex-end'}
    >
      {mode === 'toast' ? (
        <XStack
          items="center"
          gap="$2"
          px="$4"
          py="$2.5"
          rounded={9999}
          bg="rgba(255,255,255,0.94)"
          maxW="92%"
        >
          {iconNode}
          <Text color="$text0" fontSize={15} lineHeight={20} fontWeight="600" numberOfLines={1}>
            {title}
          </Text>
        </XStack>
      ) : (
        <YStack
          width={148}
          py="$4"
          px="$3"
          gap="$2"
          items="center"
          rounded="$7"
          bg="rgba(255,255,255,0.94)"
        >
          {iconNode}
          <Text color="$text0" fontSize={15} lineHeight={20} fontWeight="600" text="center">
            {title}
          </Text>
        </YStack>
      )}
      <Text
        position="absolute"
        l={14}
        b={mode === 'toast' && position === 'bottom' ? undefined : 11}
        t={mode === 'toast' && position === 'bottom' ? 11 : undefined}
        color="$accentOnAccent"
        opacity={0.72}
        fontSize={11}
        lineHeight={14}
        fontFamily="$mono"
      >
        [Aperçu]
      </Text>
    </YStack>
  );
}

export default function ToastsDemoScreen() {
  const router = useRouter();
  const support = getToastSupport();

  const [mode, setMode] = React.useState<Mode>('toast');
  const [toastPreset, setToastPreset] = React.useState<ToastPreset>('done');
  const [alertPreset, setAlertPreset] = React.useState<AlertPreset>('done');
  const [position, setPosition] = React.useState<ToastPosition>('top');
  const [haptic, setHaptic] = React.useState(false);

  const [last, setLast] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  const current = mode === 'toast' ? TOAST_PRESETS[toastPreset] : ALERT_PRESETS[alertPreset];

  const trigger = React.useCallback(() => {
    setNotice(null);
    const vibration: ToastHaptic = haptic ? current.haptic : 'none';

    const result =
      mode === 'toast'
        ? showToast({
            title: current.title,
            message: current.message,
            preset: toastPreset,
            from: position,
            haptic: vibration,
          })
        : showAlert({
            title: current.title,
            message: current.message,
            preset: alertPreset,
            haptic: vibration,
          });

    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    const parts = [
      mode === 'toast' ? 'Toast' : 'Alerte',
      current.label,
      ...(mode === 'toast' && support === 'full' ? [POSITION_LABELS[position]] : []),
      ...(haptic && support === 'full' ? ['vibration'] : []),
    ];
    setLast(`${parts.join(' · ')} — ${timeLabel(new Date())}`);
  }, [alertPreset, current, haptic, mode, position, support, toastPreset]);

  const simulateSend = React.useCallback(async () => {
    setNotice(null);
    setSending(true);

    const { shown } = await runWithSpinner(
      () => new Promise<void>((resolve) => setTimeout(resolve, SEND_MS)),
      {
        title: 'Envoi…',
        doneTitle: 'Intervention envoyée',
        errorTitle: "Échec de l'envoi",
        haptic,
        maxSeconds: SPINNER_MAX_S,
      },
    );

    setSending(false);
    if (!shown.ok) {
      setNotice(shown.message);
      return;
    }
    setLast(`Envoi simulé · spinner puis succès — ${timeLabel(new Date())}`);
  }, [haptic]);

  const ctaLabel = mode === 'toast' ? 'Afficher le toast' : "Afficher l'alerte";

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={
        <>
          <DemoCta label={ctaLabel} onPress={trigger} busy={sending} />
          <DemoCta
            label={sending ? 'Envoi…' : 'Simuler un envoi'}
            onPress={() => void simulateSend()}
            busy={sending}
            variant="secondary"
          />
        </>
      }
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
        <Preview mode={mode} position={position} icon={current.icon} title={current.title} />
      </DemoHero>

      <CapabilityChips chips={DEMO.tags} />

      {support === 'none' && (
        <DemoNotice message="Démo native uniquement : ouvre l'app sur iPhone ou Android pour voir les messages système." />
      )}
      {support === 'title-only' && (
        <DemoNotice message="Sur Android, burnt passe par le Toast système : seul le titre s'affiche, sans icône, message ni vibration. L'alerte devient elle aussi un toast." />
      )}

      <DemoSection label="MESSAGE">
        <OptionRow label="Type">
          <Segmented
            label="Type"
            value={mode}
            onChange={setMode}
            options={[
              { key: 'toast', label: 'Toast' },
              { key: 'alert', label: 'Alerte' },
            ]}
          />
        </OptionRow>
        <GlassDivider inset={16} />
        <OptionRow label="Style">
          {mode === 'toast' ? (
            <Segmented
              label="Style"
              value={toastPreset}
              onChange={setToastPreset}
              options={(Object.keys(TOAST_PRESETS) as ToastPreset[]).map((key) => ({
                key,
                label: TOAST_PRESETS[key].label,
              }))}
            />
          ) : (
            <Segmented
              label="Style"
              value={alertPreset}
              onChange={setAlertPreset}
              options={(Object.keys(ALERT_PRESETS) as AlertPreset[]).map((key) => ({
                key,
                label: ALERT_PRESETS[key].label,
              }))}
            />
          )}
        </OptionRow>
        {mode === 'toast' && (
          <>
            <GlassDivider inset={16} />
            <OptionRow label="Position (iOS)">
              <Segmented
                label="Position"
                value={position}
                onChange={setPosition}
                options={[
                  { key: 'top', label: POSITION_LABELS.top },
                  { key: 'bottom', label: POSITION_LABELS.bottom },
                ]}
              />
            </OptionRow>
          </>
        )}
        <GlassDivider inset={16} />
        <XStack items="center" justify="space-between" gap="$3" px="$4" py="$3">
          <YStack flex={1} gap="$1">
            <Text color="$text0" fontSize={16} lineHeight={21}>
              Vibration (iOS)
            </Text>
            <Text color="$text2" fontSize={13} lineHeight={18}>
              Motif succès, alerte ou erreur joué par le système
            </Text>
          </YStack>
          <Switch
            value={haptic}
            onValueChange={setHaptic}
            accessibilityLabel="Vibration (iOS)"
          />
        </XStack>
      </DemoSection>

      {last && <DemoResultCard label={DEMO.resultLabel} value={last} />}
      {notice && <DemoNotice message={notice} />}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Le message est dessiné par le système, au-dessus de l'app : il reste visible pendant une
        navigation. La vibration vient du module natif de burnt, pas d'expo-haptics.
      </Text>
    </DemoScaffold>
  );
}
