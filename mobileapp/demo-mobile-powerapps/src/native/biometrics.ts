// src/native/biometrics.ts
// Biometric authentication wrapper for Power Apps mobile apps.
// Backed by expo-local-authentication (template-shipped). All functions return
// discriminated-union results — never throw.
//
// No biometric template ever reaches this layer: the OS compares the face or
// fingerprint itself and hands back a yes/no. There is nothing to store.

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

// --- Result types ---

/** What the device can actually offer, resolved before showing any CTA. */
export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'none';

export type BiometricCapability = {
  /** The device has biometric hardware at all. */
  hasHardware: boolean;
  /** The user has actually enrolled a face / finger. */
  isEnrolled: boolean;
  kind: BiometricKind;
  /** 'Face ID', 'Touch ID', 'Empreinte digitale'… — ready for display. */
  label: string;
};

export type BiometricFailure = {
  ok: false;
  reason: 'no-hardware' | 'not-enrolled' | 'cancelled' | 'lockout' | 'unsupported' | 'error';
  message?: string;
};

export type AuthResult = { ok: true; kind: BiometricKind } | BiometricFailure;

const UNSUPPORTED: BiometricFailure = {
  ok: false,
  reason: 'unsupported',
  message: "L'authentification biométrique n'est pas disponible sur cette plateforme.",
};

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * iOS brands its sensors; Android does not. Naming them correctly matters here —
 * a prompt that says "Face ID" on a fingerprint phone reads as a bug.
 */
function labelFor(kind: BiometricKind): string {
  if (kind === 'face') return Platform.OS === 'ios' ? 'Face ID' : 'Reconnaissance faciale';
  if (kind === 'fingerprint') return Platform.OS === 'ios' ? 'Touch ID' : 'Empreinte digitale';
  if (kind === 'iris') return 'Reconnaissance de l’iris';
  return 'Aucune biométrie';
}

// --- Capability ---

/** What this device supports. Safe to call on every render path. */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  const none: BiometricCapability = {
    hasHardware: false,
    isEnrolled: false,
    kind: 'none',
    label: labelFor('none'),
  };

  if (!isNativePlatform()) return none;

  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    let kind: BiometricKind = 'none';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      kind = 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      kind = 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      kind = 'iris';
    }

    return { hasHardware, isEnrolled, kind, label: labelFor(kind) };
  } catch {
    return none;
  }
}

// --- Authentication ---

/**
 * Run the native biometric prompt.
 * `allowPasscodeFallback` lets the OS offer the device passcode after a failed
 * scan — keep it on for an unlock flow, turn it off when the whole point is to
 * prove a biometric specifically.
 */
export async function authenticate(options?: {
  promptMessage?: string;
  cancelLabel?: string;
  allowPasscodeFallback?: boolean;
}): Promise<AuthResult> {
  if (!isNativePlatform()) return UNSUPPORTED;

  const capability = await getBiometricCapability();

  if (!capability.hasHardware) {
    return {
      ok: false,
      reason: 'no-hardware',
      message: "Cet appareil n'a pas de capteur biométrique.",
    };
  }

  if (!capability.isEnrolled) {
    return {
      ok: false,
      reason: 'not-enrolled',
      message: `Aucune donnée ${capability.label} n'est enregistrée sur cet appareil.`,
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage ?? 'Confirmez votre identité',
      cancelLabel: options?.cancelLabel ?? 'Annuler',
      disableDeviceFallback: options?.allowPasscodeFallback === false,
    });

    if (result.success) return { ok: true, kind: capability.kind };

    // `error` is a stable string code from the native layer.
    const code = 'error' in result ? result.error : 'unknown';

    if (code === 'user_cancel' || code === 'app_cancel' || code === 'system_cancel') {
      return { ok: false, reason: 'cancelled' };
    }
    if (code === 'lockout') {
      return {
        ok: false,
        reason: 'lockout',
        message: 'Trop de tentatives. Déverrouillez l’appareil avec son code.',
      };
    }
    if (code === 'not_enrolled') {
      return { ok: false, reason: 'not-enrolled' };
    }
    if (code === 'not_available') {
      return { ok: false, reason: 'no-hardware' };
    }

    return { ok: false, reason: 'error', message: code };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

export { LocalAuthentication };
