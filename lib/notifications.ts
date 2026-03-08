import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppStore, DailyRecord } from "./store";
import { getWeekDates, hasConsecutiveKyukan } from "./store";

const isExpoGo = Constants.executionEnvironment === "storeClient";
const PERMISSION_REQUESTED_KEY = "notification_permission_requested";
const REMINDER_ID = "reminder_daily";

// ─── 権限管理 ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web" || isExpoGo) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kyukoubi_reminder", {
      name: "休肝日リマインダー",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, "true");
  return finalStatus === "granted";
}

// ─── リマインダースケジューリング ────────────────────────────────────────────

export async function scheduleReminder(time: string, store: AppStore): Promise<void> {
  if (Platform.OS === "web" || isExpoGo) return;

  // 既存のリマインダーをキャンセル
  await cancelReminder();

  const [hour, minute] = time.split(":").map(Number);
  const today = new Date().toISOString().slice(0, 10);
  const status = store.records[today]?.status;

  let title: string;
  let body: string;

  if (status === "kyukan") {
    title = "今日は休肝日です🍵";
    body = "よく眠れますよ。記録をつけておきましょう";
  } else if (status === "ok") {
    title = "今日の飲酒量を記録しましょう🍺";
    body = "宣言した上限は守れましたか？";
  } else {
    title = "今日はどうしますか？";
    body = "まだ決めていません。今日の予定を入力しましょう";
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title,
      body,
      data: { screen: "/(tabs)/record" },
      ...(Platform.OS === "android" && { channelId: "kyukoubi_reminder" }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReminder(): Promise<void> {
  if (Platform.OS === "web" || isExpoGo) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

// ─── 達成通知 ────────────────────────────────────────────────────────────────

export async function sendAchievementNotification(): Promise<void> {
  if (Platform.OS === "web" || isExpoGo) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎉 2連続休肝日達成！",
      body: "今週の目標を達成しました。この調子で続けましょう！",
      data: { screen: "/(tabs)/review" },
      ...(Platform.OS === "android" && { channelId: "kyukoubi_reminder" }),
    },
    trigger: null,
  });
}

// ─── 達成判定ヘルパー ────────────────────────────────────────────────────────

export function checkConsecutiveAchievement(
  records: Record<string, DailyRecord>,
  date: string
): boolean {
  const weekDates = getWeekDates(new Date(date + "T12:00:00"));
  return hasConsecutiveKyukan(records, weekDates);
}
