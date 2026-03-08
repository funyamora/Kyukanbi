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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORE_KEY = "kyukoubi_store_v1";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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
    return dd.toISOString().slice(0, 10);
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
    const a = records[weekDates[i]]?.status;
    const b = records[weekDates[i + 1]]?.status;
    if (a === "kyukan" && b === "kyukan") return true;
  }
  return false;
}

/** 今日飲むと2連続休肝日を作れるか判定 */
export function canAchieveConsecutiveIfDrink(
  records: Record<string, DailyRecord>,
  weekDates: string[],
  today: string
): boolean {
  // 今日を飲酒OKとした場合のシミュレーション
  const simulated = { ...records, [today]: { ...(records[today] ?? defaultRecord(today)), status: "ok" as DayStatus } };
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
    if (raw) return JSON.parse(raw) as AppStore;
  } catch (_) {}
  return { records: {} };
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
