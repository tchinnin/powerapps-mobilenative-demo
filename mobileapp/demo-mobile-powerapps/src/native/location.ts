// src/native/location.ts
// One-shot foreground location wrapper for Power Apps mobile apps.
// Backed by expo-location (template-shipped). All functions return
// discriminated-union results — never throw.
//
// Scope: a single foreground fix plus reverse geocoding. Continuous background
// tracking is a different capability (@microsoft/power-apps-native-bglocation),
// which this template does not ship — do not emulate it here with a polling loop.

import * as Location from 'expo-location';
import { Platform } from 'react-native';

// --- Result types ---

export type LocationFailure = {
  ok: false;
  reason: 'permission-denied' | 'services-disabled' | 'unsupported' | 'error';
  message?: string;
};

export type Fix = {
  latitude: number;
  longitude: number;
  /** Radius of 68% confidence, in metres. Null when the platform withholds it. */
  accuracy: number | null;
  altitude: number | null;
  /** Epoch milliseconds of the fix. */
  timestamp: number;
};

export type FixResult = { ok: true; fix: Fix } | LocationFailure;

export type ReverseGeocodeResult =
  | { ok: true; address: string }
  | LocationFailure;

const UNSUPPORTED: LocationFailure = {
  ok: false,
  reason: 'unsupported',
  message: "La géolocalisation n'est pas disponible sur cette plateforme.",
};

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

// --- Permission ---

/** True when foreground location is already granted, without prompting. */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Prompts for foreground location. Returns false on refusal or error. */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

// --- Fix ---

/**
 * Take a single foreground position fix.
 * Distinguishes a refused permission from a device whose location services are
 * switched off entirely, because the two need different wording on screen.
 */
export async function getCurrentPosition(options?: {
  accuracy?: Location.LocationAccuracy;
}): Promise<FixResult> {
  if (!isNativePlatform()) return UNSUPPORTED;

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        ok: false,
        reason: 'services-disabled',
        message: 'Les services de localisation sont désactivés sur cet appareil.',
      };
    }
  } catch {
    // Non-fatal: fall through and let the fix itself fail if it must.
  }

  const granted = await requestLocationPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission-denied',
      message: "L'accès à la position a été refusé.",
    };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: options?.accuracy ?? Location.Accuracy.Balanced,
    });

    return {
      ok: true,
      fix: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
        timestamp: position.timestamp,
      },
    };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

// --- Reverse geocoding ---

/**
 * Turn a fix into a one-line readable address.
 * Reverse geocoding is best-effort — a fix with no known address is an ordinary
 * outcome, not a failure, so the caller gets `'error'` only on a real fault.
 */
export async function reverseGeocode(fix: Pick<Fix, 'latitude' | 'longitude'>): Promise<ReverseGeocodeResult> {
  if (!isNativePlatform()) return UNSUPPORTED;

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: fix.latitude,
      longitude: fix.longitude,
    });

    const place = results[0];
    if (!place) return { ok: true, address: 'Adresse inconnue' };

    const line = [
      [place.streetNumber, place.street].filter(Boolean).join(' '),
      [place.postalCode, place.city].filter(Boolean).join(' '),
      place.country,
    ]
      .filter((part) => part && part.length > 0)
      .join(', ');

    return { ok: true, address: line.length > 0 ? line : 'Adresse inconnue' };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

// --- Formatting ---

/** The `48.856614, 2.352222` form the demo surfaces. */
export function formatCoordinates(fix: Pick<Fix, 'latitude' | 'longitude'>): string {
  return `${fix.latitude.toFixed(6)}, ${fix.longitude.toFixed(6)}`;
}

/** `±8 m`, or an explicit unknown when the platform withheld accuracy. */
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return 'précision inconnue';
  return `±${Math.round(accuracy)} m`;
}

export { Location };
