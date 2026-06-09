/**
 * HMS (Huawei Mobile Services) Compatibility Layer
 *
 * Detects whether the app is running on a Huawei device without Google Play Services
 * and provides HMS-safe alternatives for common GMS-dependent features.
 *
 * Usage:
 *   import { isHuawei, getPushToken, getMapProvider } from "@/lib/hms";
 *
 * When building for Huawei AppGallery, set HMS_ENABLED=true in eas.json huawei profile.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Returns true if running on a Huawei device without Google Play Services.
 * On iOS this is always false.
 */
export function isHuawei(): boolean {
  if (Platform.OS !== "android") return false;
  // HMS_ENABLED is injected via eas.json huawei profile env
  return Constants.expoConfig?.extra?.hmsEnabled === true ||
    process.env.HMS_ENABLED === "true";
}

/**
 * Push notification token — uses HMS Push Kit on Huawei, FCM otherwise.
 * Install @hmscore/react-native-hms-push for Huawei support.
 */
export async function getPushToken(): Promise<string | null> {
  if (isHuawei()) {
    // TODO: Install @hmscore/react-native-hms-push and uncomment:
    // const { HmsPushInstanceId } = await import("@hmscore/react-native-hms-push");
    // const result = await HmsPushInstanceId.getToken("");
    // return result.result;
    console.warn("[HMS] Push Kit not yet configured. Install @hmscore/react-native-hms-push.");
    return null;
  }
  // Standard Expo push token
  try {
    const { getExpoPushTokenAsync } = await import("expo-notifications");
    const token = await getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

/**
 * Map provider — returns "huawei" on HMS devices, "google" otherwise.
 * Use this to conditionally render Huawei Map Kit vs Google Maps.
 */
export function getMapProvider(): "google" | "huawei" {
  return isHuawei() ? "huawei" : "google";
}

/**
 * Location — uses HMS Location Kit on Huawei, expo-location otherwise.
 */
export async function getCurrentLocation() {
  if (isHuawei()) {
    // TODO: Install @hmscore/react-native-hms-location and uncomment:
    // const { HMSLocation } = await import("@hmscore/react-native-hms-location");
    // return HMSLocation.FusedLocation.Native.getLastLocation();
    console.warn("[HMS] Location Kit not yet configured. Install @hmscore/react-native-hms-location.");
    return null;
  }
  const { getCurrentPositionAsync, requestForegroundPermissionsAsync } = await import("expo-location");
  const { status } = await requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  return getCurrentPositionAsync({});
}

/**
 * In-app purchases — uses HMS IAP on Huawei, expo-in-app-purchases otherwise.
 */
export function getIAPProvider(): "hms-iap" | "google-play" | "app-store" {
  if (isHuawei()) return "hms-iap";
  if (Platform.OS === "android") return "google-play";
  return "app-store";
}
