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
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'stableDeviceId';

function randomId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
