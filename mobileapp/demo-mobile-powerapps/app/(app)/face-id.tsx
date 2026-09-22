import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, XStack, YStack, useTheme } from 'tamagui';

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
import { GlassDivider } from '../../src/components/Glass';
import { findReadyDemo } from '../../src/demos/catalog';
import {
  authenticate,
  getBiometricCapability,
  type BiometricCapability,
} from '../../src/native/biometrics';

const DEMO = findReadyDemo('faceid')!;

const FAILURE_MESSAGES = {
  'no-hardware': "Cet appareil n'a pas de capteur biométrique.",
  'not-enrolled': "Aucune biométrie n'est enregistrée sur cet appareil.",
  cancelled: 'Authentification annulée.',
  lockout: "Trop de tentatives. Déverrouille l'appareil avec son code.",
  unsupported: "L'authentification biométrique n'est pas disponible sur cette plateforme.",
  error: "L'authentification a échoué.",
} as const;

function Row({ label, value }: { label: string; value: string }) {
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

export default function FaceIdDemoScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [capability, setCapability] = React.useState<BiometricCapability | null>(null);
  const [unlockedAt, setUnlockedAt] = React.useState<Date | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Resolved once on mount so the CTA can name the real sensor — a button
  // reading "Face ID" on a fingerprint-only phone looks like a bug.
  React.useEffect(() => {
    let cancelled = false;
    void getBiometricCapability().then((result) => {
      if (!cancelled) setCapability(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = React.useCallback(async () => {
    setBusy(true);
    setNotice(null);

    const result = await authenticate({
      promptMessage: 'Confirmez votre identité pour déverrouiller la démo',
    });

    if (result.ok) {
      setUnlockedAt(new Date());
    } else {
      setUnlockedAt(null);
      setNotice(result.message ?? FAILURE_MESSAGES[result.reason]);
    }

    setBusy(false);
  }, []);

  const sensorLabel = capability?.label ?? 'Biométrie';
  const available = capability?.hasHardware === true && capability.isEnrolled;

  const ctaLabel = busy ? DEMO.running : unlockedAt ? 'Re-vérifier' : `Déverrouiller avec ${sensorLabel}`;

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={<DemoCta label={ctaLabel} busy={busy} onPress={run} />}
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
        {unlockedAt ? (
          <YStack flex={1} items="center" justify="center" gap="$3">
            <YStack
              width={64}
              height={64}
              rounded={9999}
              items="center"
              justify="center"
              bg="rgba(29,122,53,0.22)"
            >
              <Ionicons name="lock-open" size={32} color={theme.statusComplete.val} />
            </YStack>
            <Text color="$accentOnAccent" fontSize={16} lineHeight={21} fontWeight="600">
              Déverrouillé
            </Text>
          </YStack>
        ) : undefined}
      </DemoHero>

      <CapabilityChips chips={DEMO.tags} />

      <DemoSection label="CAPTEUR">
        <Row label="Type" value={sensorLabel} />
        <GlassDivider inset={16} />
        <Row label="Matériel" value={capability?.hasHardware ? 'Présent' : 'Absent'} />
        <GlassDivider inset={16} />
        <Row label="Biométrie enrôlée" value={capability?.isEnrolled ? 'Oui' : 'Non'} />
        <GlassDivider inset={16} />
        <Row
          label="État"
          value={
            capability === null ? 'Détection…' : available ? 'Prêt' : 'Indisponible'
          }
        />
      </DemoSection>

      {unlockedAt && (
        <DemoResultCard
          label={DEMO.resultLabel}
          value={`${sensorLabel} — ${unlockedAt.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}`}
        />
      )}
      {notice && <DemoNotice message={notice} />}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        La comparaison est faite par le système — aucun gabarit biométrique n'est accessible à
        l'application.
      </Text>
    </DemoScaffold>
  );
}
