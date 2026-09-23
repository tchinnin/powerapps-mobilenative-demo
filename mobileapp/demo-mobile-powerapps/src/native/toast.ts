// src/native/toast.ts
// System toast / alert wrapper for Power Apps mobile apps.
// Backed by `burnt` 0.12.2 (template-shipped). All functions return
// discriminated-union results — never throw.
//
// Per platform, as read from burnt's own sources:
//   iOS     — real native module (BurntModule.swift → SPIndicator for toasts,
//             SPAlert for alerts). Presets, position and haptics all honoured.
//   Android — no native code at all: burnt maps both calls onto React Native's
//             ToastAndroid. Only the title shows; message, preset, haptic and
//             dismissAllAlerts() are ignored.
//   Web     — needs `sonner` and a <Toaster /> at the root, which this app does
//             not mount. Reported as unsupported instead.
//
// WHY `require` AND NOT `import`
// ------------------------------
// burnt's iOS entry calls `requireNativeModule('Burnt')` at module scope. If the
// rewrap binary does not embed that module (the fate of expo-haptics), a static
// import would throw while the route file loads and take the whole screen down.
// Loading it lazily inside a try/catch turns that into an `unavailable` result.
//
// HAPTICS
// -------
// `haptic` is played by burnt's Swift code (SPIndicator / SPAlert present
// with a UINotificationFeedbackGenerator pattern). It does not touch
// expo-haptics, which stays banned. iOS only; Android ignores it.

import { Platform } from 'react-native';

// --- Types ---

export type ToastPreset = 'done' | 'error' | 'none';
export type AlertPreset = 'done' | 'error' | 'heart';
export type ToastHaptic = 'success' | 'warning' | 'error' | 'none';
export type ToastPosition = 'top' | 'bottom';

export type ToastFailure = {
  ok: false;
  reason: 'unsupported' | 'unavailable' | 'error';
  message: string;
};

export type ToastResult = { ok: true } | ToastFailure;

/** What the running platform can actually render — drives the honest notice. */
export type ToastSupport = 'full' | 'title-only' | 'none';

type BurntApi = typeof import('burnt');

// burnt's AlertOptions type omits `haptic`, but BurntModule.swift reads it
// (`@Field var haptic: AlertHaptic`). Widen the payload to pass it through.
type AlertPayload = Parameters<BurntApi['alert']>[0] & { haptic?: ToastHaptic };

const UNSUPPORTED: ToastFailure = {
  ok: false,
  reason: 'unsupported',
  message: 'Les toasts système sont une démo native : ouvre-la sur iPhone ou Android.',
};

const UNAVAILABLE: ToastFailure = {
  ok: false,
  reason: 'unavailable',
  message:
    "Le module natif Burnt n'est pas embarqué dans ce binaire : les toasts système ne peuvent pas s'afficher.",
};

export function getToastSupport(): ToastSupport {
  if (Platform.OS === 'ios') return 'full';
  if (Platform.OS === 'android') return 'title-only';
  return 'none';
}

let cached: BurntApi | null | undefined;

/** Loads burnt once. `null` means the native module is missing from the binary. */
function loadBurnt(): BurntApi | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('burnt') as BurntApi;
  } catch {
    cached = null;
  }
  return cached;
}

function run(call: (burnt: BurntApi) => unknown): ToastResult {
  if (getToastSupport() === 'none') return UNSUPPORTED;

  const burnt = loadBurnt();
  if (!burnt) return UNAVAILABLE;

  try {
    // burnt returns void or a promise depending on the platform; a rejection
    // from the native side is still worth swallowing rather than surfacing
    // as an unhandled promise.
    const pending = call(burnt);
    if (pending && typeof (pending as Promise<unknown>).catch === 'function') {
      (pending as Promise<unknown>).catch(() => undefined);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : "Le toast n'a pas pu s'afficher.",
    };
  }
}

// --- Public API ---

/** Discreet banner — SPIndicator on iOS, ToastAndroid on Android. */
export function showToast(options: {
  title: string;
  message?: string;
  preset: ToastPreset;
  from: ToastPosition;
  haptic: ToastHaptic;
  /** Seconds. */
  duration?: number;
}): ToastResult {
  return run((burnt) =>
    burnt.toast({
      title: options.title,
      message: options.message,
      preset: options.preset,
      from: options.from,
      haptic: options.haptic,
      duration: options.duration ?? 3,
    }),
  );
}

/** Centred card — SPAlert on iOS, falls back to a toast on Android. */
export function showAlert(options: {
  title: string;
  message?: string;
  preset: AlertPreset;
  haptic: ToastHaptic;
  /** Seconds. */
  duration?: number;
}): ToastResult {
  const payload: AlertPayload = {
    title: options.title,
    message: options.message,
    preset: options.preset,
    haptic: options.haptic,
    duration: options.duration ?? 2,
  };
  return run((burnt) => burnt.alert(payload));
}

/**
 * Shows a spinner alert while `task` runs, then swaps it for a done/error
 * alert. The spinner carries a hard `maxSeconds` timeout so a hung task can
 * never leave an infinite spinner on screen, and is always dismissed in
 * `finally`.
 */
export async function runWithSpinner<T>(
  task: () => Promise<T>,
  options: {
    title: string;
    doneTitle: string;
    errorTitle: string;
    haptic: boolean;
    maxSeconds?: number;
  },
): Promise<{ shown: ToastResult; value?: T; error?: unknown }> {
  const shown = run((burnt) =>
    burnt.alert({ title: options.title, preset: 'spinner', duration: options.maxSeconds ?? 10 }),
  );

  let value: T | undefined;
  let error: unknown;
  try {
    value = await task();
  } catch (caught) {
    error = caught;
  } finally {
    run((burnt) => burnt.dismissAllAlerts());
  }

  if (shown.ok) {
    showAlert(
      error === undefined
        ? { title: options.doneTitle, preset: 'done', haptic: options.haptic ? 'success' : 'none' }
        : { title: options.errorTitle, preset: 'error', haptic: options.haptic ? 'error' : 'none' },
    );
  }

  return { shown, value, error };
}
