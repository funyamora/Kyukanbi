import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";
import { requestNotificationPermission } from "@/lib/notifications";

const TIME_OPTIONS = ["19:00", "20:00", "21:00", "22:00"];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { patchSettings } = useAppStore();

  const [step, setStep] = useState(0);
  const [weeklyGoalDays, setWeeklyGoalDays] = useState(2);
  const [requireConsecutive, setRequireConsecutive] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");

  const completeOnboarding = useCallback(async () => {
    await patchSettings({
      weeklyGoalDays,
      requireConsecutive,
      reminderEnabled,
      reminderTime,
    });
    if (reminderEnabled && Platform.OS !== "web") {
      await requestNotificationPermission();
    }
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  }, [patchSettings, weeklyGoalDays, requireConsecutive, reminderEnabled, reminderTime, router]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        {/* Step 0: Intro */}
        {step === 0 && (
          <View style={styles.content}>
            <Text style={styles.emoji}>🍵</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              休肝日を、無理なく続けよう
            </Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              週2日の連続休肝日を習慣化するアプリです。{"\n"}
              飲酒前に宣言し、代替行動を提案し、{"\n"}
              記録と振り返りで習慣を改善します。
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.btnPrimaryText}>はじめる</Text>
              </Pressable>
              <Pressable style={styles.btnSkip} onPress={completeOnboarding}>
                <Text style={[styles.btnSkipText, { color: colors.muted }]}>スキップ</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 1: Goal setting */}
        {step === 1 && (
          <View style={styles.content}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              目標を設定しよう
            </Text>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.row}>
                <View style={styles.rowLabelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    週の目標休肝日数
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.muted }]}>1〜5日で設定</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={[
                      styles.stepperBtn,
                      { backgroundColor: colors.background, opacity: weeklyGoalDays <= 1 ? 0.3 : 1 },
                    ]}
                    onPress={() => weeklyGoalDays > 1 && setWeeklyGoalDays((v) => v - 1)}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                    {weeklyGoalDays}
                  </Text>
                  <Pressable
                    style={[
                      styles.stepperBtn,
                      { backgroundColor: colors.background, opacity: weeklyGoalDays >= 5 ? 0.3 : 1 },
                    ]}
                    onPress={() => weeklyGoalDays < 5 && setWeeklyGoalDays((v) => v + 1)}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.row}>
                <View style={styles.rowLabelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    2連続休肝日を目指す
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.muted }]}>
                    連続で休むと肝臓の回復効果が高まります
                  </Text>
                </View>
                <Switch
                  value={requireConsecutive}
                  onValueChange={setRequireConsecutive}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.btnPrimaryText}>次へ</Text>
              </Pressable>
              <Pressable style={styles.btnSkip} onPress={completeOnboarding}>
                <Text style={[styles.btnSkipText, { color: colors.muted }]}>スキップ</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 2: Notification setting */}
        {step === 2 && (
          <View style={styles.content}>
            <Text style={styles.emoji}>🔔</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              通知を設定しよう
            </Text>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.row}>
                <View style={styles.rowLabelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    夜間リマインダー
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.muted }]}>
                    飲酒前に通知でお知らせ
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {reminderEnabled && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.timeLabel, { color: colors.foreground }]}>
                    リマインダー時刻
                  </Text>
                  <View style={styles.timeChips}>
                    {TIME_OPTIONS.map((t) => (
                      <Pressable
                        key={t}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: t === reminderTime ? colors.primary : colors.background,
                            borderColor: t === reminderTime ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setReminderTime(t)}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: t === reminderTime ? "#fff" : colors.foreground },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={completeOnboarding}
              >
                <Text style={styles.btnPrimaryText}>
                  {reminderEnabled ? "通知を許可して完了する" : "完了する"}
                </Text>
              </Pressable>
              <Pressable style={styles.btnSkip} onPress={completeOnboarding}>
                <Text style={[styles.btnSkipText, { color: colors.muted }]}>スキップ</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  description: { fontSize: 15, textAlign: "center", lineHeight: 24 },
  card: { borderRadius: 16, padding: 16, width: "100%" },
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
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, fontWeight: "700" },
  stepperValue: { fontSize: 20, fontWeight: "800", minWidth: 24, textAlign: "center" },
  timeLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  timeChips: { flexDirection: "row", gap: 8 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  timeChipText: { fontSize: 14, fontWeight: "600" },
  actions: { width: "100%", gap: 12, marginTop: 16 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: "center" },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  btnSkip: { alignItems: "center", padding: 8 },
  btnSkipText: { fontSize: 14, fontWeight: "500" },
});
