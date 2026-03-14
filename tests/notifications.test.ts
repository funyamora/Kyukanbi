import { describe, it, expect, vi } from "vitest";

// React Native モジュールをモック
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock("expo-constants", () => ({
  default: { executionEnvironment: "standalone" },
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(),
  setNotificationHandler: vi.fn(),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
}));

import { checkConsecutiveAchievement } from "../lib/notifications";
import { defaultRecord } from "../lib/store";
import type { DailyRecord } from "../lib/store";

describe("checkConsecutiveAchievement", () => {
  it("returns true when 2 consecutive kyukan days exist in the week", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-04": { ...defaultRecord("2026-03-04"), status: "kyukan", actualDrinks: 0 },
      "2026-03-05": { ...defaultRecord("2026-03-05"), status: "kyukan", actualDrinks: 0 },
    };
    expect(checkConsecutiveAchievement(records, "2026-03-05")).toBe(true);
  });

  it("returns false when no consecutive kyukan days", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-03": { ...defaultRecord("2026-03-03"), status: "kyukan", actualDrinks: 0 },
      "2026-03-04": { ...defaultRecord("2026-03-04"), status: "ok", actualDrinks: 2 },
      "2026-03-05": { ...defaultRecord("2026-03-05"), status: "kyukan", actualDrinks: 0 },
    };
    expect(checkConsecutiveAchievement(records, "2026-03-05")).toBe(false);
  });

  it("returns false when only 1 kyukan day", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-04": { ...defaultRecord("2026-03-04"), status: "kyukan", actualDrinks: 0 },
    };
    expect(checkConsecutiveAchievement(records, "2026-03-04")).toBe(false);
  });
});
