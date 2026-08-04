// utils/deviceId.ts
//
// The backend's login handler does `credentials.deviceId || generateDeviceId()`
// (UserController.ts) and keys the UserSession row on that deviceId — it's
// meant to be a stable per-device identifier so re-logging in on the same
// device revokes/reuses the same session row. Mobile's login/signup/Google
// requests never sent one, so the backend generated a fresh random deviceId
// on every single login — meaning every login orphaned the previous
// session row instead of ever revoking it, and "this device" was never
// actually stable across app restarts.
// The backend keys each login's UserSession row uniquely on deviceId — two
// devices ever landing on the same value means the second login revokes and
// overwrites the first device's session row outright, logging it out. This
// MUST come from a real CSPRNG: Math.random() in RN's JS engine (Hermes/JSC)
// is not guaranteed well-seeded per install, and two app instances launched
// close together (e.g. during testing) can plausibly draw correlated
// sequences from it — confirmed as the cause of one login logging out an
// unrelated device. expo-crypto's getRandomBytesAsync uses the platform's
// real secure RNG instead.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// _v2: devices that already generated an ID under the old Math.random()
// scheme need a fresh, properly-random one — reading the old key forward
// would keep whatever collision risk it already has baked in indefinitely.
const DEVICE_ID_KEY = 'stableDeviceId_v2';

async function randomId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = await randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
