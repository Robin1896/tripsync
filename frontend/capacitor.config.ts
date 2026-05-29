import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "nl.robinzegers.tripsync",
  appName: "TripSync.",
  webDir: "public",

  server: {
    url: "https://tripsync.vercel.app",
    allowNavigation: ["tripsync.vercel.app"],
    androidScheme: "https",
  },

  ios: {
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#f4efe6",
  },

  android: {
    backgroundColor: "#f4efe6",
  },
};

export default config;
