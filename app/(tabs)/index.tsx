import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";
import {
  DayStatus,
  canAchieveConsecutiveIfDrink,
  formatDateJP,
  getDayLabel,
  getWeekDates,
  hasConsecutiveKyukan,
} from "@/lib/store";

const STATUS_CONFIG: Record<DayStatus, { label: string; emoji: string; bg: string; text: string }> = {
  kyukan:    { label: "休肝日",    emoji: "🍵", bg: "#E8F5E9", text: "#2E7D32" },
  ok:        { label: "飲酒OK日",  emoji: "🍺", bg: "#FFF3E0", text: "#E65100" },
  undecided: { label: "未定",      emoji: "？", bg: "#F2F2F7", text: "#8E8E93" },
};

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { store, today, getRecord, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    setWeekDates(getWeekDates());
  }, []);

  const todayRecord = getRecord(today);
  const todayStatus = todayRecord.status;
  const statusConf = STATUS_CONFIG[todayStatus];

  const hasConsecutive = hasConsecutiveKyukan(store.records, weekDates);
  const canAchieveIfDrink = canAchieveConsecutiveIfDrink(store.records, weekDates, today);

  // ─── Animations ──────────────────────────────────────────────────────────────
  const cardScale = useSharedValue(1);
  const cardOverlayOpacity = useSharedValue(0);
  const prevStatusRef = useRef<DayStatus>(todayStatus);
  const prevHasConsecutiveRef = useRef(hasConsecutive);

  useEffect(() => {
    if (prevStatusRef.current !== todayStatus) {
      prevStatusRef.current = todayStatus;
      cardScale.value = withSequence(
        withTiming(0.97, { duration: 75 }),
        withTiming(1.0, { duration: 75 })
      );
      if (todayStatus === "kyukan" && Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [todayStatus, cardScale]);

  useEffect(() => {
    if (!prevHasConsecutiveRef.current && hasConsecutive) {
      cardOverlayOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    prevHasConsecutiveRef.current = hasConsecutive;
  }, [hasConsecutive, cardOverlayOpacity]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOverlayOpacity.value,
  }));

  const handleNodrink = useCallback(async () => {
    await patchRecord(today, { status: "kyukan" });
  }, [today, patchRecord]);

  const handleDrink = useCallback(() => {
    router.push("/declaration");
  }, [router]);

  const handleAlternative = useCallback(() => {
    router.push("/alternative");
  }, [router]);

  // 今日飲むとどうなるかのメッセージ
  const getImpactMessage = () => {
    if (todayStatus === "kyukan") return null;
    if (hasConsecutive) return null;
    if (!canAchieveIfDrink) {
      return "今日飲むと、今週の2連休肝が難しくなります";
    }
    return "今日休むと、今週の2連休肝達成率が上がります";
  };

  const impactMessage = getImpactMessage();

  // 今日のカード背景色
  const todayCardBg =
    todayStatus === "kyukan"
      ? "#4A90D9"
      : todayStatus === "ok"
      ? "#FF6B35"
      : "#667EEA";

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>休肝日つくーる</Text>
        <Pressable
          style={[styles.settingsBtn, { backgroundColor: colors.background }]}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's status card */}
        <Animated.View style={[styles.todayCard, { backgroundColor: todayCardBg }, cardAnimatedStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#4CAF50", borderRadius: 20 },
              overlayAnimatedStyle,
            ]}
          />
          <View style={styles.todayCardInner}>
            <Text style={styles.todayDateLabel}>{formatDateJP(today)}</Text>
            <Text style={styles.todayStatusSub}>今日は</Text>
            <View style={styles.todayStatusRow}>
              <Text style={styles.todayStatusEmoji}>{statusConf.emoji}</Text>
              <Text style={styles.todayStatusLabel}>{statusConf.label}</Text>
            </View>
            {todayStatus === "kyukan" && (
              <View style={styles.todaySubBadge}>
                <Text style={styles.todaySubBadgeText}>今日は休む日です。よく眠れます。</Text>
              </View>
            )}
            {todayStatus === "ok" && todayRecord.declaredLimit && (
              <View style={styles.todaySubBadge}>
                <Text style={styles.todaySubBadgeText}>上限 {todayRecord.declaredLimit}杯で宣言済み</Text>
              </View>
            )}
            {todayStatus === "undecided" && (
              <View style={styles.todaySubBadge}>
                <Text style={styles.todaySubBadgeText}>今日どうするか決めましょう</Text>
              </View>
            )}
          </View>
          {/* decorative circle */}
          <View style={styles.decorCircle} />
        </Animated.View>

        {/* Impact warning */}
        {impactMessage && (
          <View style={[styles.warningCard, { backgroundColor: "#FFF3CD", borderLeftColor: "#F0A500" }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: "#7A5C00" }]}>注意</Text>
              <Text style={[styles.warningText, { color: "#7A5C00" }]}>{impactMessage}</Text>
            </View>
          </View>
        )}

        {/* Weekly progress */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.muted }]}>今週の休肝日</Text>
          <View style={styles.weekRow}>
            {weekDates.map((date) => {
              const rec = getRecord(date);
              const isToday = date === today;
              const displayStatus: DayStatus =
                date < today
                  ? rec.actualDrinks !== null
                    ? rec.actualDrinks === 0 ? "kyukan" : "ok"
                    : "undecided"
                  : date === today && rec.actualDrinks !== null
                    ? rec.actualDrinks === 0 ? "kyukan" : "ok"
                    : rec.status;
              const conf = STATUS_CONFIG[displayStatus];
              return (
                <Pressable
                  key={date}
                  style={({ pressed }) => [styles.dayCell, pressed && { opacity: 0.6 }]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    if (date <= today) {
                      router.navigate({ pathname: "/(tabs)/record", params: { date } });
                    } else {
                      router.navigate("/(tabs)/weekly");
                    }
                  }}
                >
                  <Text style={[styles.dayLabel, isToday && { color: "#4A90D9", fontWeight: "800" }]}>
                    {getDayLabel(date)}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: isToday ? "#4A90D9" : conf.bg },
                    ]}
                  >
                    {isToday ? (
                      <Text style={{ fontSize: 9, color: "#fff", fontWeight: "800" }}>今日</Text>
                    ) : (
                      <Text style={{ fontSize: 14 }}>{conf.emoji}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.progressSummary, { borderTopColor: colors.border }]}>
            <Text style={[styles.progressLabel, { color: colors.foreground }]}>2連続休肝日</Text>
            {hasConsecutive ? (
              <View style={[styles.badge, { backgroundColor: "#E8F5E9" }]}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#2E7D32" }}>✅ 達成済み</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: "#FFF3CD" }]}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#7A5C00" }}>⚠️ 未達成</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionSection}>
          {todayStatus !== "kyukan" && (
            <Pressable
              style={({ pressed }) => [styles.btnNodrink, pressed && { opacity: 0.8 }]}
              onPress={handleNodrink}
            >
              <Text style={styles.btnNodrinkText}>✅ 今日は飲まない</Text>
            </Pressable>
          )}
          {todayStatus === "kyukan" && (
            <View style={styles.btnNodrinkDone}>
              <Text style={styles.btnNodrinkText}>✅ 今日は休肝日に設定済み</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.btnDrink, { borderColor: colors.muted }, pressed && { opacity: 0.6 }]}
            onPress={handleDrink}
          >
            <Text style={[styles.btnDrinkText, { color: colors.muted }]}>🍺 今日は飲む（上限を宣言する）</Text>
          </Pressable>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.btnGhost, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
              onPress={handleAlternative}
            >
              <Text style={[styles.btnGhostText, { color: colors.foreground }]}>💡 代替行動を見る</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  settingsBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  scrollContent: { padding: 16, gap: 14 },
  todayCard: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  todayCardInner: { zIndex: 1 },
  decorCircle: {
    position: "absolute",
    top: -30, right: -30,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  todayDateLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 4 },
  todayStatusSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 2 },
  todayStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  todayStatusEmoji: { fontSize: 36 },
  todayStatusLabel: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  todaySubBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  todaySubBadgeText: { fontSize: 13, color: "#fff" },
  warningCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  warningIcon: { fontSize: 20 },
  warningTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  warningText: { fontSize: 13, lineHeight: 18 },
  card: { borderRadius: 16, padding: 16 },
  cardTitle: {
    fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 14,
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCell: { flex: 1, alignItems: "center", gap: 6 },
  dayLabel: { fontSize: 11, color: "#8E8E93", fontWeight: "600" },
  dayDot: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  progressSummary: {
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  actionSection: { gap: 10 },
  btnDrink: {
    borderRadius: 14, padding: 14,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnDrinkText: { fontSize: 14, fontWeight: "500" },
  btnNodrink: {
    borderRadius: 14, padding: 18,
    alignItems: "center",
    backgroundColor: "#4A90D9",
  },
  btnNodrinkDone: {
    borderRadius: 14, padding: 18,
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  btnNodrinkText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  btnRow: { flexDirection: "row", gap: 10 },
  btnGhost: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: "center",
  },
  btnGhostText: { fontSize: 14, fontWeight: "600" },
});
