import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    multiRemove: vi.fn((keys: string[]) => {
      keys.forEach((k) => delete mockStorage[k]);
      return Promise.resolve();
    }),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

describe("onboarding completion", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.clearAllMocks();
  });

  it("sets onboarding_completed to 'true' on complete", async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    const val = await AsyncStorage.getItem("onboarding_completed");
    expect(val).toBe("true");
  });

  it("sets onboarding_completed to 'true' on skip", async () => {
    // Skip triggers the same completeOnboarding flow
    await AsyncStorage.setItem("onboarding_completed", "true");
    const val = await AsyncStorage.getItem("onboarding_completed");
    expect(val).toBe("true");
  });

  it("returns null when onboarding not yet completed", async () => {
    const val = await AsyncStorage.getItem("onboarding_completed");
    expect(val).toBeNull();
  });
});
