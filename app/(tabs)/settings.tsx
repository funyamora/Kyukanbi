import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";

const REMINDER_TIME_OPTIONS = ["18:00", "19:00", "20:00", "21:00", "22:00"];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, patchSettings, resetAllData } = useAppStore();
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  const hapticToggle = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const hapticTap = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleDecrement = useCallback(() => {
    if (settings.weeklyGoalDays > 1) {
      hapticTap();
      patchSettings({ weeklyGoalDays: settings.weeklyGoalDays - 1 });
    }
  }, [settings.weeklyGoalDays, patchSettings, hapticTap]);

  const handleIncrement = useCallback(() => {
    if (settings.weeklyGoalDays < 5) {
      hapticTap();
      patchSettings({ weeklyGoalDays: settings.weeklyGoalDays + 1 });
    }
  }, [settings.weeklyGoalDays, patchSettings, hapticTap]);

  const handleResetAll = useCallback(async () => {
    if (Platform.OS === "web") {
      const ok = window.confirm("すべての記録と設定が削除されます。この操作は取り消せません。");
      if (ok) {
        await resetAllData();
      }
    } else {
      Alert.alert(
        "全データリセット",
        "すべての記録と設定が削除されます。この操作は取り消せません。",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "リセット",
            style: "destructive",
            onPress: async () => {
              await resetAllData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
  }, [resetAllData]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>設定</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 目標設定 */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>目標設定</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* 週の目標休肝日数 */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>週の目標休肝日数</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>1〜5日で設定</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.background, opacity: settings.weeklyGoalDays <= 1 ? 0.3 : 1 },
                ]}
                onPress={handleDecrement}
                disabled={settings.weeklyGoalDays <= 1}
              >
                <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>−</Text>
              </Pressable>
              <Text style={[styles.stepperValue, { color: colors.foreground }]}>{settings.weeklyGoalDays}</Text>
              <Pressable
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.background, opacity: settings.weeklyGoalDays >= 5 ? 0.3 : 1 },
                ]}
                onPress={handleIncrement}
                disabled={settings.weeklyGoalDays >= 5}
              >
                <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* 2連続休肝日 */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>2連続休肝日を目指す</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>連続で休むと肝臓の回復効果が高まります</Text>
            </View>
            <Switch
              value={settings.requireConsecutive}
              onValueChange={(val) => {
                hapticToggle();
                patchSettings({ requireConsecutive: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 通知設定 */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>通知設定</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* 夜間リマインダー */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>夜間リマインダー</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>飲酒前に通知でお知らせ</Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(val) => {
                hapticToggle();
                patchSettings({ reminderEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {settings.reminderEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>リマインダー時刻</Text>
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => setShowTimeOptions((v) => !v)}
                >
                  <Text style={[styles.timeDisplay, { color: colors.primary }]}>
                    {settings.reminderTime} ▼
                  </Text>
                </Pressable>
              </View>
              {showTimeOptions && (
                <View style={styles.timeOptionsRow}>
                  {REMINDER_TIME_OPTIONS.map((time) => {
                    const isSelected = settings.reminderTime === time;
                    return (
                      <Pressable
                        key={time}
                        style={[
                          styles.timeOptionBtn,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          hapticTap();
                          patchSettings({ reminderTime: time });
                          setShowTimeOptions(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: isSelected ? "#fff" : colors.foreground },
                          ]}
                        >
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* 達成通知 */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>達成通知</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>目標達成時にお知らせ</Text>
            </View>
            <Switch
              value={settings.achievementNotification}
              onValueChange={(val) => {
                hapticToggle();
                patchSettings({ achievementNotification: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* データ管理 */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>データ管理</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={[styles.resetBtn, { backgroundColor: colors.error }]} onPress={handleResetAll}>
            <Text style={styles.resetBtnText}>全データリセット</Text>
          </Pressable>
          <Text style={[styles.resetNote, { color: colors.muted }]}>
            すべての記録と設定が初期化されます
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  scrollContent: { padding: 16, gap: 6 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  rowLabelGroup: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, fontWeight: "700" },
  stepperValue: { fontSize: 20, fontWeight: "800", minWidth: 24, textAlign: "center" },
  timeDisplay: { fontSize: 16, fontWeight: "700" },
  timeOptionsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  timeOptionBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timeOptionText: { fontSize: 14, fontWeight: "600" },
  phaseNote: { fontSize: 12, paddingHorizontal: 4, marginTop: 4 },
  resetBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  resetBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  resetNote: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
