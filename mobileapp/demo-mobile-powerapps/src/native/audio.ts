// src/native/audio.ts
// Audio recording + playback wrapper for Power Apps mobile apps.
// Backed by expo-audio (template-shipped). All functions return
// discriminated-union results — never throw.
//
// expo-audio is hook-based: the recorder and player are React objects, not
// imperative singletons. So this wrapper does two things:
//   1. owns the permission / session / stop-and-collect logic (plain async fns),
//   2. re-exports the hooks, so screens still import audio only from here and
//      never reach into `expo-audio` directly.

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioRecorder,
} from 'expo-audio';
import { Platform } from 'react-native';

// --- Result types ---

export type AudioFailure = {
  ok: false;
  reason: 'permission-denied' | 'unsupported' | 'nothing-recorded' | 'error';
  message?: string;
};

/** A finished recording, ready to be played back or attached. */
export type RecordingResult =
  | { ok: true; uri: string; durationMillis: number }
  | AudioFailure;

export type AudioSessionResult = { ok: true } | AudioFailure;

const UNSUPPORTED: AudioFailure = {
  ok: false,
  reason: 'unsupported',
  message: "L'enregistrement audio n'est pas disponible sur cette plateforme.",
};

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

// --- Permission ---

/** True when the microphone permission is already granted, without prompting. */
export async function hasRecordingPermission(): Promise<boolean> {
  try {
    const { granted } = await getRecordingPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Prompts for the microphone permission. Returns false on refusal or error. */
export async function requestRecordingPermission(): Promise<boolean> {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

// --- Session ---

/**
 * Put the audio session in recording mode. Must run before `recorder.record()`
 * on iOS, otherwise the recording is silent.
 */
export async function beginRecordingSession(): Promise<AudioSessionResult> {
  if (!isNativePlatform()) return UNSUPPORTED;

  const granted = await requestRecordingPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission-denied',
      message: "L'accès au micro a été refusé.",
    };
  }

  try {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

/**
 * Leave recording mode so playback routes to the speaker rather than the
 * earpiece. Call after stopping a recording.
 */
export async function endRecordingSession(): Promise<AudioSessionResult> {
  if (!isNativePlatform()) return UNSUPPORTED;
  try {
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

// --- Recording ---

/**
 * Prepare and start a recording on a recorder obtained from `useAudioRecorder`.
 * Handles permission and session setup, so the screen only branches on the result.
 */
export async function startRecording(recorder: AudioRecorder): Promise<AudioSessionResult> {
  const session = await beginRecordingSession();
  if (!session.ok) return session;

  try {
    await recorder.prepareToRecordAsync();
    recorder.record();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

/**
 * Stop the recording and collect its URI + duration.
 * `durationMillis` is read before `stop()` because the recorder resets it after.
 */
export async function stopRecording(recorder: AudioRecorder): Promise<RecordingResult> {
  if (!isNativePlatform()) return UNSUPPORTED;

  let durationMillis = 0;
  try {
    durationMillis = recorder.getStatus().durationMillis ?? 0;
  } catch {
    durationMillis = 0;
  }

  try {
    await recorder.stop();
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }

  await endRecordingSession();

  const uri = recorder.uri;
  if (!uri) {
    return {
      ok: false,
      reason: 'nothing-recorded',
      message: "L'enregistrement n'a produit aucun fichier.",
    };
  }

  return { ok: true, uri, durationMillis };
}

// --- Formatting ---

/** mm:ss for a duration in milliseconds. */
export function formatDuration(millis: number): string {
  const total = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// --- Hook re-exports ---
// Screens import these from the wrapper so `expo-audio` stays behind one door.

export {
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
};
export type { AudioRecorder };
