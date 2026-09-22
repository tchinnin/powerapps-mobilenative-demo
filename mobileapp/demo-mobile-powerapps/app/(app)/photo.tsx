import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { Button, Text, XStack, YStack, useTheme } from 'tamagui';

import { glass } from '../../brand/tokens';
import {
  CapabilityChips,
  DemoScaffold,
  DemoCta,
  DemoHero,
  DemoNotice,
  DemoResultCard,
  DemonstratesList,
  DemoTitle,
} from '../../src/components/DemoScreen';
import { findReadyDemo } from '../../src/demos/catalog';
import { pickImage, takePhoto, type PhotoResult } from '../../src/native/camera';

const DEMO = findReadyDemo('photo')!;

const FAILURE_MESSAGES: Record<Exclude<PhotoResult, { ok: true }>['reason'], string> = {
  'permission-denied': "Autorisation refusée. Autorise l'accès dans les réglages de l'appareil.",
  cancelled: 'Capture annulée.',
  unsupported: "La capture native n'est pas disponible sur cet appareil.",
  error: 'La capture a échoué.',
};

function describe(photo: Extract<PhotoResult, { ok: true }>): string {
  const size = photo.fileSize ? `${Math.round(photo.fileSize / 1024)} Ko` : 'taille inconnue';
  return `${photo.mimeType ?? 'image'} — ${size} — ${photo.width}×${photo.height}`;
}

export default function PhotoDemoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [photo, setPhoto] = React.useState<Extract<PhotoResult, { ok: true }> | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(async (action: () => Promise<PhotoResult>) => {
    setBusy(true);
    setNotice(null);
    const result = await action();
    if (result.ok) {
      setPhoto(result);
    } else {
      setNotice(result.message ?? FAILURE_MESSAGES[result.reason]);
    }
    setBusy(false);
  }, []);

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={
        <>
          <DemoCta
            label={busy ? DEMO.running : photo ? 'Reprendre une photo' : DEMO.cta}
            busy={busy}
            onPress={() => run(() => takePhoto({ allowsEditing: true }))}
          />
          <Button
            height={50}
            rounded="$6"
            bg={glass.surface.fill}
            borderWidth={1}
            borderColor={glass.surface.border}
            opacity={busy ? 0.62 : 1}
            disabled={busy}
            onPress={() => run(() => pickImage({ allowsEditing: true }))}
            aria-label="Choisir une image dans la galerie"
          >
      <Ionicons name="images-outline" size={20} color={theme.accentBase.val} />
          </Button>
        </>
      }
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel="Photo capturée"
          />
        ) : undefined}
      </DemoHero>

      <CapabilityChips chips={DEMO.tags} />

      {photo && <DemoResultCard label={DEMO.resultLabel} value={describe(photo)} />}
      {notice && <DemoNotice message={notice} />}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Conservée en mémoire — rien n'est envoyé au serveur.
      </Text>
    </DemoScaffold>
  );
}
