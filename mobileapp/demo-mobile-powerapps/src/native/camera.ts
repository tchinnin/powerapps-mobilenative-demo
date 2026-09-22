// src/native/camera.ts
// Camera capture and image picker wrapper for Power Apps mobile apps.
// Uses expo-image-picker for both camera capture and gallery selection.
// All functions return discriminated-union results — never throw.

import * as ImagePicker from 'expo-image-picker';

// --- Result types ---

export type PhotoResult =
  | { ok: true; uri: string; width: number; height: number; mimeType?: string; fileSize?: number }
  | { ok: false; reason: 'permission-denied' | 'cancelled' | 'unsupported' | 'error'; message?: string };

// --- Permission ---

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

// --- Capture ---

/**
 * Launch the device camera and capture a photo.
 * Returns `{ ok: false, reason: 'unsupported' }` when native camera capture is unavailable.
 */
export async function takePhoto(options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PhotoResult> {
  const granted = await requestCameraPermission();
  if (!granted) return { ok: false, reason: 'permission-denied' };

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: options?.quality ?? 0.8,
      allowsEditing: options?.allowsEditing ?? false,
      exif: false,
    });

    if (result.canceled) return { ok: false, reason: 'cancelled' };

    const asset = result.assets[0];
    return {
      ok: true,
      uri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      mimeType: asset.mimeType ?? undefined,
      fileSize: asset.fileSize ?? undefined,
    };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

/**
 * Open the device photo gallery and pick an image.
 * Works on all platforms including web (uses native file picker).
 */
export async function pickImage(options?: {
  quality?: number;
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
}): Promise<PhotoResult> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return { ok: false, reason: 'permission-denied' };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: options?.quality ?? 0.8,
      allowsEditing: options?.allowsEditing ?? false,
      allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
      exif: false,
    });

    if (result.canceled) return { ok: false, reason: 'cancelled' };

    const asset = result.assets[0];
    return {
      ok: true,
      uri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      mimeType: asset.mimeType ?? undefined,
      fileSize: asset.fileSize ?? undefined,
    };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}
