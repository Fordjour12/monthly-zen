import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getBundleIdentifier = () => {
  if (IS_DEV) return "com.thedevelophantom.monthlyzen.dev";
  if (IS_PREVIEW) return "com.thedevelophantom.monthlyzen.preview";
  return "com.thedevelophantom.monthlyzen";
};

const getAppName = () => {
  if (IS_DEV) return "Monthly Zen (Dev)";
  if (IS_PREVIEW) return "Monthly Zen (Preview)";
  return "Monthly Zen";
};

const getScheme = () => {
  if (IS_DEV) return "monthly-zen-dev";
  if (IS_PREVIEW) return "monthly-zen-preview";
  return "monthly-zen";
};

export default (ctx: ConfigContext): ExpoConfig => {
  const baseConfig: ExpoConfig = {
    scheme: getScheme(),
    userInterfaceStyle: "automatic",
    orientation: "default",
    web: {
      bundler: "metro",
    },
    name: getAppName(),
    newArchEnabled: true,
    slug: "monthly-zen",
    icon: "./assets/images/icon.png",
    plugins: [
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Raleway/Raleway-Thin.ttf",
            "./assets/fonts/Raleway/Raleway-ThinItalic.ttf",
            "./assets/fonts/Raleway/Raleway-Light.ttf",
            "./assets/fonts/Raleway/Raleway-LightItalic.ttf",
            "./assets/fonts/Raleway/Raleway-Regular.ttf",
            "./assets/fonts/Raleway/Raleway-Italic.ttf",
            "./assets/fonts/Raleway/Raleway-Medium.ttf",
            "./assets/fonts/Raleway/Raleway-MediumItalic.ttf",
            "./assets/fonts/Raleway/Raleway-SemiBold.ttf",
            "./assets/fonts/Raleway/Raleway-SemiBoldItalic.ttf",
            "./assets/fonts/Raleway/Raleway-Bold.ttf",
            "./assets/fonts/Raleway/Raleway-BoldItalic.ttf",
            "./assets/fonts/Raleway/Raleway-ExtraBold.ttf",
            "./assets/fonts/Raleway/Raleway-ExtraBoldItalic.ttf",
            "./assets/fonts/Raleway/Raleway-Black.ttf",
            "./assets/fonts/Raleway/Raleway-BlackItalic.ttf",
          ],
        },
      ],
      [
        "expo-dev-client",
        {
          addGeneratedScheme: IS_DEV,
        },
      ],
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
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      package: getBundleIdentifier(),
    },
    ios: {
      bundleIdentifier: getBundleIdentifier(),
    },
    extra: {
      router: {},
    },
  };

  if (IS_DEV) {
    baseConfig.extra = {
      ...baseConfig.extra,
      // Add development-specific plugins or configurations
      devClient: true,
    };
  }

  return {
    ...baseConfig,
    ...ctx,
  };
};
