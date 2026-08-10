import { useSignUp } from "@/contexts/SignUpContext";
import { useUser } from "@/contexts/UserContext";
import { googleAuth } from "@/services/api";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { getApps, initializeApp } from "firebase/app";
import { router } from "expo-router";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDrpeUgCXyMwbiB5mxkZeJDevaCi96iQOA",
  authDomain: "goye-media.firebaseapp.com",
  projectId: "goye-media",
  storageBucket: "goye-media.firebasestorage.app",
  messagingSenderId: "202109054723",
  appId: "1:202109054723:web:ad78ce716c45fd0ddf0336",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

GoogleSignin.configure({
  webClientId: '202109054723-djcegt0ctvgcqdqou19gbf32gdqc6acd.apps.googleusercontent.com',
  // Required for the native iOS sign-in flow; Android ignores this field.
  // No default exists yet (iOS was never configured before), so this is the
  // one value that must come from .env — see .env.example.
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

export function useGoogleSignIn() {
  const { setField } = useSignUp();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo.data?.idToken
        ? userInfo.data
        : await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error("No ID token received");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseResult = await signInWithCredential(auth, credential);
      const firebaseIdToken = await firebaseResult.user.getIdToken();

      const response = await googleAuth(firebaseIdToken);

      const needsProfileCompletion = response.status?.requiresProfileCompletion === true;

      // Super Admin is web-only — same rule as the email/password login
      // flow in login.tsx. Backend returns admin users with role
      // "goye_admin" (raw, not yet normalized like login.tsx does), under
      // either response.user or response.data.user depending on path.
      const googleUser = response.user || response.data?.user;
      const isSuperAdminAccount =
        googleUser?.role === 'goye_admin' &&
        (!googleUser?.adminRole || googleUser.adminRole === 'super_admin');

      if (isSuperAdminAccount) {
        await signOutGoogle();
        Alert.alert(
          'Web Only',
          'Super Admin access is only available on the GOYE web dashboard. Please sign in from a web browser.'
        );
        return;
      }

      if (!needsProfileCompletion) {
        // Existing complete user → setUser, index.tsx handles redirect.
        // response.refreshToken was previously never saved (only accessToken
        // was passed here, unlike the regular-login flow in login.tsx which
        // passes both) — a Google-signed-in session had no way to renew its
        // access token, so it worked until the first expiry (~15min) and
        // then silently failed every authenticated call and bounced back to
        // login. Mirrors the same missing-write bug fixed on web this
        // session, just for refreshToken instead of user_id.
        await setUser(response.user, response.accessToken, response.refreshToken);
        return;
      }

      // New user → don't call setUser, just save fields for signup flow
      setField("firstName", response.user?.first_name || firebaseResult.user.displayName?.split(" ")[0] || "");
      setField("lastName", response.user?.last_name || firebaseResult.user.displayName?.split(" ")[1] || "");
      setField("email", response.user?.email_address || firebaseResult.user.email || "");
      setField("isGoogleAuth", true);
      setField("googleToken", response.accessToken || "");

      router.push('/(auth)/create-password');

    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled sign-in");
      } else if (err.code === statusCodes.IN_PROGRESS) {
        console.log("Sign-in already in progress");
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available");
      } else {
        console.error("Google sign-in error:", err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const signOutGoogle = async () => {
    try {
      await GoogleSignin.signOut();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Google sign-out error:', error);
    }
  };

  return { signInWithGoogle, signOutGoogle, loading };
}