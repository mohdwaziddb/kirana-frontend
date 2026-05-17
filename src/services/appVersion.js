import Constants from "expo-constants";

export const APP_VERSION =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  "1.0.0";
