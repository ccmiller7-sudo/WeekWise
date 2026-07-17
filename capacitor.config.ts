import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.weekwise.app",
  appName: "WeekWise Finance",
  webDir: "dist/client",
  server: {
    url: "https://week-wise-xi.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#f9fafb",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#4f46e5",
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
