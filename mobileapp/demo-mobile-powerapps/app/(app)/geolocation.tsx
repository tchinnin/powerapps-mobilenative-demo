import React from 'react';
import { useRouter } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

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
  formatAccuracy,
  formatCoordinates,
  getCurrentPosition,
  reverseGeocode,
  type Fix,
} from '../../src/native/location';

const DEMO = findReadyDemo('geo')!;

const FAILURE_MESSAGES = {
  'permission-denied': "Accès à la position refusé. Autorise-le dans les réglages de l'appareil.",
  'services-disabled': 'Les services de localisation sont désactivés sur cet appareil.',
  unsupported: "La géolocalisation n'est pas disponible sur cette plateforme.",
  error: 'Le relevé de position a échoué.',
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <XStack justify="space-between" gap="$3" px="$4" py="$3">
      <Text color="$text2" fontSize={16} lineHeight={21}>
        {label}
      </Text>
      <Text
        flex={1}
        color="$text0"
        fontSize={16}
        lineHeight={21}
        fontWeight="600"
        text="right"
      >
        {value}
      </Text>
    </XStack>
  );
}

export default function GeolocationDemoScreen() {
  const router = useRouter();
  const [fix, setFix] = React.useState<Fix | null>(null);
  const [address, setAddress] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(async () => {
    setBusy(true);
    setNotice(null);

    const result = await getCurrentPosition();

    if (!result.ok) {
      setNotice(result.message ?? FAILURE_MESSAGES[result.reason]);
      setBusy(false);
      return;
    }

    setFix(result.fix);
    setAddress(null);

    // The fix is the demo; the address is a bonus. Showing coordinates
    // immediately and filling the address after keeps the page responsive
    // even when reverse geocoding is slow or unavailable.
    const geocoded = await reverseGeocode(result.fix);
    if (geocoded.ok) setAddress(geocoded.address);

    setBusy(false);
  }, []);

  const timestamp = fix
    ? new Date(fix.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={
        <DemoCta
          label={busy ? DEMO.running : fix ? 'Relever à nouveau' : DEMO.cta}
          busy={busy}
          onPress={run}
        />
      }
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
        {fix ? (
          <YStack flex={1} items="center" justify="center" gap="$2" px="$5">
            <Text
              color="$accentOnAccent"
              fontSize={22}
              lineHeight={28}
              fontWeight="600"
              fontFamily="$mono"
              text="center"
            >
              {formatCoordinates(fix)}
            </Text>
            <Text color="$accentOnAccent" opacity={0.7} fontSize={13} lineHeight={18}>
              {formatAccuracy(fix.accuracy)}
            </Text>
          </YStack>
        ) : undefined}
      </DemoHero>

      <CapabilityChips chips={DEMO.tags} />

      {fix && (
        <DemoSection label="RELEVÉ">
          <Row label="Latitude" value={fix.latitude.toFixed(6)} />
          <GlassDivider inset={16} />
          <Row label="Longitude" value={fix.longitude.toFixed(6)} />
          <GlassDivider inset={16} />
          <Row label="Précision" value={formatAccuracy(fix.accuracy)} />
          {fix.altitude !== null && (
            <>
              <GlassDivider inset={16} />
              <Row label="Altitude" value={`${Math.round(fix.altitude)} m`} />
            </>
          )}
          <GlassDivider inset={16} />
          <Row label="Heure" value={timestamp ?? '—'} />
          <GlassDivider inset={16} />
          <Row label="Adresse" value={address ?? (busy ? 'Recherche…' : 'Indisponible')} />
        </DemoSection>
      )}

      {fix && (
        <DemoResultCard
          label={DEMO.resultLabel}
          value={`${formatCoordinates(fix)} — ${formatAccuracy(fix.accuracy)}`}
        />
      )}
      {notice && <DemoNotice message={notice} />}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Relevé ponctuel au premier plan — aucun suivi en arrière-plan.
      </Text>
    </DemoScaffold>
  );
}
