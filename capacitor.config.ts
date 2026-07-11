import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.weekwise.app",
  appName: "WeekWise",
  webDir: "dist/client",
  server: {
    url: "https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app",
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
