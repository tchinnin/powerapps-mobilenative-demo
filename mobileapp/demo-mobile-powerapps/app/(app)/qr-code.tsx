import React from 'react';
import { useRouter } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import {
  CapabilityChips,
  DemoScaffold,
  DemoCta,
  DemoHero,
  DemoResultCard,
  DemonstratesList,
  DemoTitle,
} from '../../src/components/DemoScreen';
import { findReadyDemo } from '../../src/demos/catalog';
import { BarcodeScannerView, type ScannerResult } from '../../src/native/barcodeScanner';

const DEMO = findReadyDemo('qr')!;

/** Corner brackets + sweeping bar, as drawn in the prototype's viewfinder. */
function ScanFrame() {
  return (
    <YStack flex={1} items="center" justify="center">
      <YStack width={148} height={148}>
        <YStack
          position="absolute" t={0} l={0} width={34} height={34}
          borderColor="$accentOnAccent" borderTopWidth={3} borderLeftWidth={3}
          borderTopLeftRadius={10}
        />
        <YStack
          position="absolute" t={0} r={0} width={34} height={34}
          borderColor="$accentOnAccent" borderTopWidth={3} borderRightWidth={3}
          borderTopRightRadius={10}
        />
        <YStack
          position="absolute" b={0} l={0} width={34} height={34}
          borderColor="$accentOnAccent" borderBottomWidth={3} borderLeftWidth={3}
          borderBottomLeftRadius={10}
        />
        <YStack
          position="absolute" b={0} r={0} width={34} height={34}
          borderColor="$accentOnAccent" borderBottomWidth={3} borderRightWidth={3}
          borderBottomRightRadius={10}
        />
        <YStack position="absolute" t={73} l={8} r={8} height={2} rounded="$1" bg="$accentBase" />
      </YStack>
    </YStack>
  );
}

export default function QrCodeDemoScreen() {
  const router = useRouter();
  const [scanning, setScanning] = React.useState(false);
  const [result, setResult] = React.useState<ScannerResult | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

  const handleScanned = React.useCallback((scan: ScannerResult) => {
    setResult(scan);
    setScanning(false);
  }, []);

  const startScan = React.useCallback(() => {
    setResult(null);
    setResetKey((key) => key + 1);
    setScanning(true);
  }, []);

  const ctaLabel = scanning
    ? 'Arrêter le scan'
    : result
      ? 'Scanner à nouveau'
      : DEMO.cta;

  return (
    <DemoScaffold
      onBack={() => router.back()}
      footer={
        <DemoCta
          label={ctaLabel}
          onPress={() => (scanning ? setScanning(false) : startScan())}
        />
      }
    >
      <DemoTitle title={DEMO.title} long={DEMO.long} />

      <DemoHero icon={DEMO.icon} caption={DEMO.hero}>
        {scanning ? (
          <BarcodeScannerView
            onScanned={handleScanned}
            paused={!scanning}
            resetKey={resetKey}
            overlay={<ScanFrame />}
          />
        ) : undefined}
      </DemoHero>

      <CapabilityChips chips={DEMO.tags} />

      {result && (
        <DemoResultCard
          label={DEMO.resultLabel}
          value={`${result.type} · ${result.data}`}
        />
      )}

      <DemonstratesList items={DEMO.bullets} />

      <Text ml="$4" color="$text2" fontSize={13} lineHeight={18}>
        Valeur renvoyée à l'écran appelant.
      </Text>
    </DemoScaffold>
  );
}
