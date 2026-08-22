import { ConfigContext, ExpoConfig } from "expo/config";

// The google-signin plugin throws during config resolution if iosUrlScheme is
// present but empty, so only pass a config object once a real value exists —
// otherwise fall back to the plain string form (iOS Google Sign-In just won't
// work yet, same as before this change; Android/web are unaffected either way).
const googleSigninPlugin: [string, { iosUrlScheme: string }] | string = process
  .env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
  ? [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME },
    ]
  : "@react-native-google-signin/google-signin";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "goye-mobile-app",
  slug: "goye-mobile-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "goyemobileapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.goye.app",
    // Real file must be added locally by whoever has Firebase console access —
    // see .env.example. Ignored by git (see .gitignore).
    googleServicesFile: "./GoogleService-Info.plist",
  },
  android: {
  package: "com.goye.app",
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  adaptiveIcon: {
    backgroundColor: "#E6F4FE",
    foregroundImage: "./assets/images/adaptive-icon-foreground.png",
    backgroundImage: "./assets/images/adaptive-icon-background.png",
    monochromeImage: "./assets/images/adaptive-icon-monochrome.png",
  },
  edgeToEdgeEnabled: true,
  predictiveBackGestureEnabled: false,
},
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "expo-video",
    googleSigninPlugin,
    "expo-localization",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: "c505a171-7492-4cf4-80a7-c651288a2cc7",
    },
  },
});
