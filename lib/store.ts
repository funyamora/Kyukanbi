import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayStatus = "kyukan" | "ok" | "undecided";

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  declaredLimit: number | null; // 宣言した上限杯数
  drinkingReason: string | null; // 飲みたい理由
  actualDrinks: number | null; // 実際の杯数
  satisfaction: "great" | "okay" | "regret" | "toomuch" | null;
  memo: string;
  alternativeAction: string | null; // 実行した代替行動
}

export interface AppStore {
  records: Record<string, DailyRecord>; // key: YYYY-MM-DD
  badges: string[]; // 解除済みバッジIDの配列
}

export interface AppSettings {
  weeklyGoalDays: number; // 1〜5、デフォルト 2
  requireConsecutive: boolean; // 2連続休肝日を目指すか
  reminderEnabled: boolean; // 夜間リマインダー ON/OFF
  reminderTime: string; // "HH:mm" 形式
  achievementNotification: boolean; // 達成通知 ON/OFF
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 実績ベースで休肝日が確定しているか（actualDrinks が 0 として記録済み） */
export function isConfirmedKyukan(record: DailyRecord | undefined): boolean {
  return record?.actualDrinks !== null && record?.actualDrinks !== undefined && record?.actualDrinks === 0;
}

/** ローカルタイムゾーンで "YYYY-MM-DD" を返す（toISOStringはUTC基準なので使わない） */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STORE_KEY = "kyukoubi_store_v1";
const SETTINGS_KEY = "kyukoubi_settings_v1";

export function defaultSettings(): AppSettings {
  return {
    weeklyGoalDays: 2,
    requireConsecutive: true,
    reminderEnabled: true,
    reminderTime: "20:00",
    achievementNotification: true,
  };
}

export function todayStr(): string {
  return toLocalDateStr(new Date());
}

export function getWeekDates(referenceDate?: Date): string[] {
  const d = referenceDate ? new Date(referenceDate) : new Date();
  const day = d.getDay(); // 0=Sun
  // Monday-start week
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return toLocalDateStr(dd);
  });
}

export function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function formatMonthDayJP(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

export function getDayLabel(dateStr: string): string {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[new Date(dateStr).getDay()];
}

/** 週の中に2日連続の休肝日があるか判定 */
export function hasConsecutiveKyukan(records: Record<string, DailyRecord>, weekDates: string[]): boolean {
  for (let i = 0; i < weekDates.length - 1; i++) {
    if (isConfirmedKyukan(records[weekDates[i]]) && isConfirmedKyukan(records[weekDates[i + 1]])) return true;
  }
  return false;
}

/** 今日飲むと2連続休肝日を作れるか判定 */
export function canAchieveConsecutiveIfDrink(
  records: Record<string, DailyRecord>,
  weekDates: string[],
  today: string
): boolean {
  // 今日を飲酒とした場合のシミュレーション（実績ベース）
  const simulated = { ...records, [today]: { ...(records[today] ?? defaultRecord(today)), status: "ok" as DayStatus, actualDrinks: 1 } };
  return hasConsecutiveKyukan(simulated, weekDates);
}

export function defaultRecord(date: string): DailyRecord {
  return {
    date,
    status: "undecided",
    declaredLimit: null,
    drinkingReason: null,
    actualDrinks: null,
    satisfaction: null,
    memo: "",
    alternativeAction: null,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export async function loadStore(): Promise<AppStore> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppStore;
      if (!parsed.badges) parsed.badges = [];
      return parsed;
    }
  } catch (_) {}
  return { records: {}, badges: [] };
}

export async function saveStore(store: AppStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (_) {}
}

export async function updateRecord(date: string, patch: Partial<DailyRecord>): Promise<AppStore> {
  const store = await loadStore();
  const existing = store.records[date] ?? defaultRecord(date);
  store.records[date] = { ...existing, ...patch };
  await saveStore(store);
  return store;
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch (_) {}
  return defaultSettings();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([STORE_KEY, SETTINGS_KEY, "onboarding_completed"]);
}

// ─── Badge Definitions ───────────────────────────────────────────────────────

export const BADGE_DEFINITIONS = [
  { id: "first_kyukan", emoji: "🥉", name: "初めての休肝日" },
  { id: "first_consecutive", emoji: "🥈", name: "初めての2連続" },
  { id: "first_weekly_goal", emoji: "🥇", name: "週間目標達成" },
  { id: "three_weeks_streak", emoji: "💎", name: "3週連続達成" },
  { id: "one_month_streak", emoji: "🌟", name: "1ヶ月継続" },
] as const;

export type BadgeId = (typeof BADGE_DEFINITIONS)[number]["id"];

/** 週の月曜日を返す（ISO基準） */
function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - ((day + 6) % 7));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** 指定週で休肝日数 >= goalDays を達成しているか */
function weekGoalMet(
  records: Record<string, DailyRecord>,
  monday: Date,
  goalDays: number
): boolean {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toLocalDateStr(d);
    if (isConfirmedKyukan(records[key])) count++;
  }
  return count >= goalDays;
}

/**
 * 新たに解除されたバッジIDを返す。
 * 既に解除済みのバッジは含まない。
 */
export function checkNewBadges(
  records: Record<string, DailyRecord>,
  existingBadges: string[],
  weeklyGoalDays: number
): string[] {
  const newBadges: string[] = [];
  const earned = new Set(existingBadges);

  // first_kyukan: いずれかのレコードが kyukan かつ満足度記録済み
  if (!earned.has("first_kyukan")) {
    if (Object.values(records).some((r) => isConfirmedKyukan(r) && r.satisfaction !== null)) {
      newBadges.push("first_kyukan");
    }
  }

  // first_consecutive: 日付順で2日連続 kyukan（両日とも満足度記録済み）
  if (!earned.has("first_consecutive")) {
    const sortedDates = Object.keys(records).sort();
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      const rPrev = records[sortedDates[i - 1]];
      const rCurr = records[sortedDates[i]];
      if (
        diffDays === 1 &&
        isConfirmedKyukan(rPrev) && rPrev?.satisfaction !== null &&
        isConfirmedKyukan(rCurr) && rCurr?.satisfaction !== null
      ) {
        newBadges.push("first_consecutive");
        break;
      }
    }
  }

  // first_weekly_goal: いずれかの週で目標達成
  if (!earned.has("first_weekly_goal")) {
    const allDates = Object.keys(records).sort();
    if (allDates.length > 0) {
      const firstMonday = getMonday(new Date(allDates[0]));
      const lastDate = new Date(allDates[allDates.length - 1]);
      const d = new Date(firstMonday);
      while (d <= lastDate) {
        if (weekGoalMet(records, d, weeklyGoalDays)) {
          newBadges.push("first_weekly_goal");
          break;
        }
        d.setDate(d.getDate() + 7);
      }
    }
  }

  // three_weeks_streak / one_month_streak: N週連続で目標達成
  if (!earned.has("three_weeks_streak") || !earned.has("one_month_streak")) {
    const allDates = Object.keys(records).sort();
    if (allDates.length > 0) {
      const firstMonday = getMonday(new Date(allDates[0]));
      const lastDate = new Date(allDates[allDates.length - 1]);
      let streak = 0;
      let maxStreak = 0;
      const d = new Date(firstMonday);
      while (d <= lastDate) {
        if (weekGoalMet(records, d, weeklyGoalDays)) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
        d.setDate(d.getDate() + 7);
      }
      if (!earned.has("three_weeks_streak") && maxStreak >= 3) {
        newBadges.push("three_weeks_streak");
      }
      if (!earned.has("one_month_streak") && maxStreak >= 4) {
        newBadges.push("one_month_streak");
      }
    }
  }

  return newBadges;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/**
 * 過去28日間の曜日別平均飲酒杯数を返す。
 * dayIndex: 0=月, 1=火, ..., 6=日
 */
export function computeWeekdayAverages(
  records: Record<string, DailyRecord>
): { dayIndex: number; label: string; avg: number }[] {
  const labels = ["月", "火", "水", "木", "金", "土", "日"];
  const totals = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];

  const today = new Date();
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toLocalDateStr(d);
    const r = records[key];
    if (r && r.actualDrinks !== null) {
      const jsDay = d.getDay(); // 0=Sun
      const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon
      totals[idx] += r.actualDrinks;
      counts[idx]++;
    }
  }

  return labels.map((label, i) => ({
    dayIndex: i,
    label,
    avg: counts[i] > 0 ? Math.round((totals[i] / counts[i]) * 10) / 10 : 0,
  }));
}

/**
 * 月次サマリーを計算する。
 */
export function computeMonthlySummary(
  records: Record<string, DailyRecord>,
  year: number,
  month: number,
  weeklyGoalDays: number
): {
  kyukanDays: number;
  prevMonthKyukanDays: number;
  diff: number;
  achievementRate: number;
  comment: string;
} {
  // 今月の休肝日数
  const monthDates = getMonthDatesForSummary(year, month);
  const kyukanDays = monthDates.filter((d) => isConfirmedKyukan(records[d])).length;

  // 先月の休肝日数
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDates = getMonthDatesForSummary(prevYear, prevMonth);
  const prevMonthKyukanDays = prevDates.filter((d) => isConfirmedKyukan(records[d])).length;

  const diff = kyukanDays - prevMonthKyukanDays;

  // 達成率: 月の週数 × weeklyGoalDays が目標
  const weeksInMonth = Math.ceil(monthDates.length / 7);
  const target = weeksInMonth * weeklyGoalDays;
  const achievementRate = target > 0 ? Math.min(Math.round((kyukanDays / target) * 100), 100) : 0;

  let comment: string;
  if (achievementRate >= 100) {
    comment = "目標達成！この調子で続けましょう💪";
  } else if (achievementRate >= 75) {
    comment = "あと少しで目標達成です！";
  } else if (achievementRate >= 50) {
    comment = "順調に進んでいます。もう少し頑張りましょう";
  } else {
    comment = "まだ伸びしろがあります。少しずつ増やしていきましょう";
  }

  return { kyukanDays, prevMonthKyukanDays, diff, achievementRate, comment };
}

function getMonthDatesForSummary(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(toLocalDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
