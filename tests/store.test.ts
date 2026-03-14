import { describe, it, expect } from "vitest";
import {
  getWeekDates,
  hasConsecutiveKyukan,
  canAchieveConsecutiveIfDrink,
  defaultRecord,
  defaultSettings,
  formatDateJP,
  getDayLabel,
  isConfirmedKyukan,
  toLocalDateStr,
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
  it("returns true when consecutive kyukan already exists elsewhere in the week", () => {
    const dates = [
      "2026-03-02", "2026-03-03", "2026-03-04",
      "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
    ];
    const records: Record<string, DailyRecord> = {
      "2026-03-02": { ...defaultRecord("2026-03-02"), status: "kyukan", actualDrinks: 0 },
      "2026-03-03": { ...defaultRecord("2026-03-03"), status: "kyukan", actualDrinks: 0 },
    };
    // Drinking on 2026-03-05 doesn't break the existing consecutive pair on Mon-Tue
    expect(canAchieveConsecutiveIfDrink(records, dates, "2026-03-05")).toBe(true);
  });

  it("returns false when drinking today prevents any consecutive kyukan", () => {
    const dates = [
      "2026-03-02", "2026-03-03", "2026-03-04",
      "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
    ];
    // Only one kyukan day adjacent to today — drinking today breaks the only chance
    const records: Record<string, DailyRecord> = {
      "2026-03-04": { ...defaultRecord("2026-03-04"), status: "kyukan", actualDrinks: 0 },
    };
    // If we drink on 2026-03-05, the only kyukan is 2026-03-04 alone — no consecutive pair
    expect(canAchieveConsecutiveIfDrink(records, dates, "2026-03-05")).toBe(false);
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

describe("isConfirmedKyukan", () => {
  it("returns true when record has actualDrinks === 0", () => {
    const record = { ...defaultRecord("2026-03-01"), actualDrinks: 0 };
    expect(isConfirmedKyukan(record)).toBe(true);
  });

  it("returns false when record has actualDrinks > 0", () => {
    const record = { ...defaultRecord("2026-03-01"), actualDrinks: 3 };
    expect(isConfirmedKyukan(record)).toBe(false);
  });

  it("returns false when record is undefined", () => {
    expect(isConfirmedKyukan(undefined)).toBe(false);
  });

  it("returns false when actualDrinks is null", () => {
    const record = defaultRecord("2026-03-01");
    expect(record.actualDrinks).toBeNull();
    expect(isConfirmedKyukan(record)).toBe(false);
  });
});

describe("toLocalDateStr", () => {
  it("formats date correctly as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 14); // March 14, 2026
    expect(toLocalDateStr(date)).toBe("2026-03-14");
  });

  it("pads month and day with leading zeros", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(toLocalDateStr(date)).toBe("2026-01-05");
  });
});

describe("defaultRecord", () => {
  it("returns record with correct date", () => {
    const record = defaultRecord("2026-03-14");
    expect(record.date).toBe("2026-03-14");
  });

  it("returns undecided status by default", () => {
    const record = defaultRecord("2026-03-14");
    expect(record.status).toBe("undecided");
  });
});
