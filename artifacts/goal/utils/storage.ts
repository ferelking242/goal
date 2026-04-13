import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const APP_PACKAGE = "com.goal.app";

export const AppStorage = {
  cacheDir: FileSystem.cacheDirectory ?? "",
  dataDir: FileSystem.documentDirectory ?? "",
  mediaDir:
    Platform.OS === "android"
      ? `${FileSystem.documentDirectory}media/`
      : FileSystem.documentDirectory ?? "",
};

export async function initAppStorage(): Promise<void> {
  const dirs = [AppStorage.cacheDir, AppStorage.dataDir, AppStorage.mediaDir];

  for (const dir of dirs) {
    if (!dir) continue;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

export async function readCache<T>(key: string): Promise<T | null> {
  const path = `${AppStorage.cacheDir}${key}.json`;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const path = `${AppStorage.cacheDir}${key}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
}

export async function clearCache(key?: string): Promise<void> {
  if (key) {
    const path = `${AppStorage.cacheDir}${key}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) await FileSystem.deleteAsync(path);
  } else {
    const info = await FileSystem.getInfoAsync(AppStorage.cacheDir);
    if (info.exists) {
      await FileSystem.deleteAsync(AppStorage.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(AppStorage.cacheDir, {
        intermediates: true,
      });
    }
  }
}

export async function saveMedia(
  filename: string,
  uri: string
): Promise<string> {
  const dest = `${AppStorage.mediaDir}${filename}`;
  await FileSystem.makeDirectoryAsync(AppStorage.mediaDir, {
    intermediates: true,
  });
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
