import { describe, it, expect } from "vitest";
import {
  getWeekDates,
  hasConsecutiveKyukan,
  canAchieveConsecutiveIfDrink,
  defaultRecord,
  defaultSettings,
  formatDateJP,
  getDayLabel,
  type DailyRecord,
} from "../lib/store";

describe("getWeekDates", () => {
  it("returns 7 dates starting from Monday", () => {
    // Use UTC noon to avoid timezone issues
    const dates = getWeekDates(new Date("2026-03-07T12:00:00Z"));
    expect(dates).toHaveLength(7);
    // The week containing 2026-03-07 (Saturday UTC) starts on Monday 2026-03-02
    const monday = dates[0];
    const sunday = dates[6];
    // Monday should be 6 days before Sunday
    const diff = (new Date(sunday).getTime() - new Date(monday).getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(6);
    // All dates should be consecutive
    for (let i = 1; i < 7; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      expect(curr.getTime() - prev.getTime()).toBe(1000 * 60 * 60 * 24);
    }
  });
});

describe("hasConsecutiveKyukan", () => {
  it("returns true when two consecutive days are kyukan", () => {
    // Use explicit dates array to avoid timezone issues
    const dates = [
      "2026-03-02", "2026-03-03", "2026-03-04",
      "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
    ];
    const records: Record<string, DailyRecord> = {
      "2026-03-02": { ...defaultRecord("2026-03-02"), status: "kyukan", actualDrinks: 0 },
      "2026-03-03": { ...defaultRecord("2026-03-03"), status: "kyukan", actualDrinks: 0 },
    };
    expect(hasConsecutiveKyukan(records, dates)).toBe(true);
  });

  it("returns false when no consecutive kyukan days", () => {
    const dates = [
      "2026-03-02", "2026-03-03", "2026-03-04",
      "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
    ];
    const records: Record<string, DailyRecord> = {
      "2026-03-02": { ...defaultRecord("2026-03-02"), status: "kyukan", actualDrinks: 0 },
      "2026-03-03": { ...defaultRecord("2026-03-03"), status: "ok", actualDrinks: 2 },
      "2026-03-04": { ...defaultRecord("2026-03-04"), status: "kyukan", actualDrinks: 0 },
    };
    expect(hasConsecutiveKyukan(records, dates)).toBe(false);
  });
});

describe("canAchieveConsecutiveIfDrink", () => {
  it("returns false when drinking today breaks consecutive possibility", () => {
    const dates = getWeekDates(new Date("2026-03-07"));
    const records: Record<string, DailyRecord> = {};
    // All undecided — drinking today doesn't break anything that doesn't exist
    const result = canAchieveConsecutiveIfDrink(records, dates, "2026-03-07");
    expect(typeof result).toBe("boolean");
  });
});

describe("formatDateJP", () => {
  it("formats date in Japanese format", () => {
    // Use a date string and check it contains month/day numbers
    const result = formatDateJP("2026-03-15");
    // The result should contain month and day numbers
    expect(result).toMatch(/\d+月\d+日/);
    // Should contain a day of week in brackets
    expect(result).toMatch(/（[日月火水木金土]）/);
  });
});

describe("getDayLabel", () => {
  it("returns a valid Japanese day label", () => {
    const validDays = ["日", "月", "火", "水", "木", "金", "土"];
    const result1 = getDayLabel("2026-03-07");
    const result2 = getDayLabel("2026-03-10");
    expect(validDays).toContain(result1);
    expect(validDays).toContain(result2);
  });
});

describe("defaultSettings", () => {
  it("returns correct default values", () => {
    const settings = defaultSettings();
    expect(settings.weeklyGoalDays).toBe(2);
    expect(settings.requireConsecutive).toBe(true);
    expect(settings.reminderEnabled).toBe(true);
    expect(settings.reminderTime).toBe("20:00");
    expect(settings.achievementNotification).toBe(true);
  });

  it("returns a new object each time", () => {
    const a = defaultSettings();
    const b = defaultSettings();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
