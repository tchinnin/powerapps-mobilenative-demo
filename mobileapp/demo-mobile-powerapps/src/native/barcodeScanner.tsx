// src/native/barcodeScanner.tsx
// Barcode / QR scanner control for Power Apps mobile apps.
// Uses expo-camera CameraView. Never throws; permission state is rendered inline.

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult, BarcodeType } from 'expo-camera';

export type ScannerResult = {
  ok: true;
  data: string;
  type: string;
  raw: BarcodeScanningResult;
};

export type BarcodeScannerViewProps = {
  onScanned: (result: ScannerResult) => void;
  paused?: boolean;
  resetKey?: unknown;
  barcodeTypes?: BarcodeType[];
  style?: StyleProp<ViewStyle>;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
};

const DEFAULT_BARCODE_TYPES = [
  'aztec',
  'qr',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'datamatrix',
  'code39',
  'code93',
  'code128',
  'pdf417',
  'itf14',
  'codabar',
] as BarcodeType[];

export function BarcodeScannerView({
  onScanned,
  paused = false,
  resetKey,
  barcodeTypes = DEFAULT_BARCODE_TYPES,
  style,
  overlay,
  children,
}: BarcodeScannerViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockedRef = React.useRef(false);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  React.useEffect(() => {
    if (!paused) {
      scanLockedRef.current = false;
    }
  }, [paused, resetKey]);

  const handleBarcodeScanned = React.useCallback((event: BarcodeScanningResult) => {
    if (paused || scanLockedRef.current) return;
    scanLockedRef.current = true;
    onScanned({ ok: true, data: event.data, type: event.type, raw: event });
  }, [onScanned, paused]);

  if (!permission) {
    return <View style={[styles.fallback, style]}><Text>Checking camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return <View style={[styles.fallback, style]}><Text>Camera permission is required to scan codes.</Text></View>;
  }

  return (
    <View style={[styles.container, style]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={!paused}
        barcodeScannerSettings={{ barcodeTypes }}
        onBarcodeScanned={paused ? undefined : handleBarcodeScanned}
      />
      {overlay || children ? <View pointerEvents="box-none" style={styles.overlay}>{overlay ?? children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
});
