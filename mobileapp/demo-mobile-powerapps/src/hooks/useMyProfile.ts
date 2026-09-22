/**
 * Current user's Office 365 profile + photo, through the office365users
 * connector. The connection itself is resolved by PowerAppsProvider: if no
 * Connected connection exists for the connector, the host renders its own
 * ConnectionSetupScreen (OAuth consent) before any of this runs.
 *
 * The photo is decoration — every failure path resolves to `photoUri: null`
 * rather than throwing, so the header falls back to initials.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@microsoft/power-apps-native-host';

import { Office365UsersService } from '../generated/services/Office365UsersService';

export type MyProfile = {
  id: string;
  displayName: string;
  mail?: string;
  /** `data:` URI ready for <Image source={{ uri }} />, or null when unavailable. */
  photoUri: string | null;
};

/**
 * The connector returns the photo as base64 without a MIME prefix on most
 * tenants, but already-prefixed data URIs have been observed — accept both.
 */
function toDataUri(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`;
}

async function fetchPhoto(userId: string): Promise<string | null> {
  try {
    const photo = await Office365UsersService.UserPhoto_V2(userId);
    return photo.success ? toDataUri(photo.data) : null;
  } catch {
    // 404 is the normal answer for a user with no photo set.
    return null;
  }
}

export function useMyProfile() {
  const { isSignedIn, hasRealAccount } = useAuth();

  return useQuery({
    queryKey: ['office365users', 'myProfile'],
    // hasRealAccount, not isSignedIn: a login-bypassed demo session reports
    // isSignedIn true but cannot acquire a token, so the call would 401.
    enabled: isSignedIn && hasRealAccount,
    staleTime: 15 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<MyProfile | null> => {
      const profile = await Office365UsersService.MyProfile_V2('id,displayName,mail');
      if (!profile.success || !profile.data?.id) {
        throw profile.error ?? new Error('Profil Office 365 indisponible');
      }

      const { id, displayName, mail } = profile.data;
      return {
        id,
        displayName: displayName ?? mail ?? 'Utilisateur',
        mail,
        photoUri: await fetchPhoto(id),
      };
    },
  });
}
