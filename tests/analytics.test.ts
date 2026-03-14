import { describe, it, expect } from "vitest";
import {
  checkNewBadges,
  computeWeekdayAverages,
  computeMonthlySummary,
  defaultRecord,
  toLocalDateStr,
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

  it("returns all 7 correct Japanese day labels", () => {
    const result = computeWeekdayAverages({});
    const labels = result.map((d) => d.label);
    expect(labels).toEqual(["月", "火", "水", "木", "金", "土", "日"]);
  });

  it("computes averages correctly for given records", () => {
    // Create records for 4 Mondays with known drinks
    const records: Record<string, DailyRecord> = {};
    const today = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toLocalDateStr(d);
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
  it("does not unlock first_kyukan without satisfaction", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).not.toContain("first_kyukan");
  });

  it("unlocks first_kyukan with kyukan record and satisfaction", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", satisfaction: "great", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_kyukan");
  });

  it("does not unlock first_consecutive without satisfaction on both days", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", satisfaction: "great", actualDrinks: 0 }),
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).not.toContain("first_consecutive");
  });

  it("unlocks first_consecutive with 2 consecutive kyukan days with satisfaction", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", satisfaction: "great", actualDrinks: 0 }),
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan", satisfaction: "okay", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_consecutive");
  });

  it("does not return already earned badges", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", satisfaction: "great", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, ["first_kyukan"], 2);
    expect(result).not.toContain("first_kyukan");
  });

  it("unlocks first_weekly_goal when weekly target is met", () => {
    // Week of Mon 2026-03-02 to Sun 2026-03-08, need 2 kyukan days
    const records: Record<string, DailyRecord> = {
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan", actualDrinks: 0 }),
      "2026-03-03": makeRecord("2026-03-03", { status: "kyukan", actualDrinks: 0 }),
    };
    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("first_weekly_goal");
  });

  it("unlocks three_weeks_streak when 3 consecutive weeks meet goal", () => {
    const records: Record<string, DailyRecord> = {};
    // Week 1: Mon 2026-02-16 to Sun 2026-02-22
    records["2026-02-16"] = makeRecord("2026-02-16", { status: "kyukan", actualDrinks: 0 });
    records["2026-02-17"] = makeRecord("2026-02-17", { status: "kyukan", actualDrinks: 0 });
    // Week 2: Mon 2026-02-23 to Sun 2026-03-01
    records["2026-02-23"] = makeRecord("2026-02-23", { status: "kyukan", actualDrinks: 0 });
    records["2026-02-24"] = makeRecord("2026-02-24", { status: "kyukan", actualDrinks: 0 });
    // Week 3: Mon 2026-03-02 to Sun 2026-03-08
    records["2026-03-02"] = makeRecord("2026-03-02", { status: "kyukan", actualDrinks: 0 });
    records["2026-03-03"] = makeRecord("2026-03-03", { status: "kyukan", actualDrinks: 0 });

    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("three_weeks_streak");
  });

  it("unlocks one_month_streak when 4 consecutive weeks meet goal", () => {
    const records: Record<string, DailyRecord> = {};
    // Week 1: Mon 2026-02-09 to Sun 2026-02-15
    records["2026-02-09"] = makeRecord("2026-02-09", { status: "kyukan", actualDrinks: 0 });
    records["2026-02-10"] = makeRecord("2026-02-10", { status: "kyukan", actualDrinks: 0 });
    // Week 2: Mon 2026-02-16 to Sun 2026-02-22
    records["2026-02-16"] = makeRecord("2026-02-16", { status: "kyukan", actualDrinks: 0 });
    records["2026-02-17"] = makeRecord("2026-02-17", { status: "kyukan", actualDrinks: 0 });
    // Week 3: Mon 2026-02-23 to Sun 2026-03-01
    records["2026-02-23"] = makeRecord("2026-02-23", { status: "kyukan", actualDrinks: 0 });
    records["2026-02-24"] = makeRecord("2026-02-24", { status: "kyukan", actualDrinks: 0 });
    // Week 4: Mon 2026-03-02 to Sun 2026-03-08
    records["2026-03-02"] = makeRecord("2026-03-02", { status: "kyukan", actualDrinks: 0 });
    records["2026-03-03"] = makeRecord("2026-03-03", { status: "kyukan", actualDrinks: 0 });

    const result = checkNewBadges(records, [], 2);
    expect(result).toContain("one_month_streak");
  });
});

describe("computeMonthlySummary", () => {
  it("computes diff correctly between months", () => {
    const records: Record<string, DailyRecord> = {
      // March: 3 kyukan days
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", actualDrinks: 0 }),
      "2026-03-02": makeRecord("2026-03-02", { status: "kyukan", actualDrinks: 0 }),
      "2026-03-03": makeRecord("2026-03-03", { status: "kyukan", actualDrinks: 0 }),
      // February: 1 kyukan day
      "2026-02-10": makeRecord("2026-02-10", { status: "kyukan", actualDrinks: 0 }),
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
      records[key] = makeRecord(key, { status: "kyukan", actualDrinks: 0 });
    }
    const result = computeMonthlySummary(records, 2026, 2, 2);
    expect(result.achievementRate).toBe(100);
    expect(result.comment).toContain("目標達成");
  });

  it("returns encouraging comment for low achievement", () => {
    const records: Record<string, DailyRecord> = {
      "2026-03-01": makeRecord("2026-03-01", { status: "kyukan", actualDrinks: 0 }),
    };
    const result = computeMonthlySummary(records, 2026, 2, 2);
    expect(result.achievementRate).toBeLessThan(50);
    expect(result.comment).toContain("伸びしろ");
  });
});
