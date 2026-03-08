import { describe, it, expect } from "vitest";
import {
  checkNewBadges,
  computeWeekdayAverages,
  computeMonthlySummary,
  defaultRecord,
  type DailyRecord,
} from "../lib/store";

// Helper to create a record with specific status and drinks
function makeRecord(
  date: string,
  overrides: Partial<DailyRecord> = {}
): DailyRecord {
  return { ...defaultRecord(date), ...overrides };
}

describe("computeWeekdayAverages", () => {
  it("returns all zeros for empty data", () => {
    const result = computeWeekdayAverages({});
    expect(result).toHaveLength(7);
    result.forEach((d) => expect(d.avg).toBe(0));
  });

  it("computes averages correctly for given records", () => {
    // Create records for 4 Mondays with known drinks
    const records: Record<string, DailyRecord> = {};
    const today = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const jsDay = d.getDay();
      // Give Mondays (jsDay=1) 4 drinks, others 0
      if (jsDay === 1) {
        records[key] = makeRecord(key, { actualDrinks: 4, status: "ok" });
      }
    }
    const result = computeWeekdayAverages(records);
    // Monday is index 0 in our output
    expect(result[0].label).toBe("月");
    expect(result[0].avg).toBe(4);
  });
});

describe("checkNewBadges", () => {
  it("unlocks first_kyukan with one kyukan record", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan" }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_kyukan");
  });

  it("unlocks first_consecutive with 2 consecutive kyukan days", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan" }),
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan" }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_consecutive");
  });

  it("does not return already earned badges", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan" }),
    };
    const result = checkNewBadges(records, ["first_kyukan"], 2);
    expect(result).not.toContain("first_kyukan");
  });

  it("unlocks first_weekly_goal when weekly target is met", () => {
    // Week of Mon 2026-03-02 to Sun 2026-03-08, need 2 kyukan days
    const records: Record<string, DailyRecord> = {
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan" }),
      "2026-03-03": makeRecord("2026-03-03", { status: "kyukan" }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_weekly_goal");
  });
});

describe("computeMonthlySummary", () => {
  it("computes diff correctly between months", () => {
    const records: Record<string, DailyRecord> = {
      // March: 3 kyukan days
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan" }),
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan" }),
      "2026-03-03": makeRecord("2026-03-03", { status: "kyukan" }),
      // February: 1 kyukan day
      "2026-02-10": makeRecord("2026-02-10", { status: "kyukan" }),
    };
    // month=2 means March (0-indexed)
    const result = computeMonthlySummary(records, 2026, 2, 2);
    expect(result.kyukanDays).toBe(3);
    expect(result.prevMonthKyukanDays).toBe(1);
    expect(result.diff).toBe(2);
  });

  it("returns correct comment based on achievement rate", () => {
    // March has 31 days => ~5 weeks => target = 10 days with weeklyGoalDays=2
    // 10 kyukan days = 100%
    const records: Record<string, DailyRecord> = {};
    for (let i = 1; i <= 10; i++) {
      const key = `2026-03-${String(i).padStart(2, "0")}`;
      records[key] = makeRecord(key, { status: "kyukan" });
    }
    const result = computeMonthlySummary(records, 2026, 2, 2);
    expect(result.achievementRate).toBe(100);
    expect(result.comment).toContain("目標達成");
  });

  it("returns encouraging comment for low achievement", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan" }),
    };
    const result = computeMonthlySummary(records, 2026, 2, 2);
    expect(result.achievementRate).toBeLessThan(50);
    expect(result.comment).toContain("伸びしろ");
  });
});
