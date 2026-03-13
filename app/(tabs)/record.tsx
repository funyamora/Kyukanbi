import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";
import { formatDateJP, toLocalDateStr } from "@/lib/store";

const DRINK_OPTIONS = [
  { value: 1, label: "1杯", emoji: "🥃" },
  { value: 2, label: "2杯", emoji: "🥃🥃" },
  { value: 3, label: "3杯", emoji: "🥃🥃🥃" },
  { value: 4, label: "4杯以上", emoji: "🍻" },
];

const DRINK_DETAIL_OPTIONS = [
  { value: 4, label: "4杯" },
  { value: 5, label: "5杯" },
  { value: 6, label: "6杯" },
  { value: 7, label: "7杯" },
  { value: 8, label: "8杯以上" },
];

const SATISFACTION_OPTIONS = [
  { value: "great",   label: "満足",     emoji: "😊" },
  { value: "okay",    label: "まあまあ", emoji: "😐" },
  { value: "regret",  label: "後悔",     emoji: "😔" },
  { value: "toomuch", label: "飲みすぎ", emoji: "🤢" },
] as const;

type SatisfactionValue = "great" | "okay" | "regret" | "toomuch";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

export default function RecordScreen() {
  const colors = useColors();
  const { today, getRecord, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState(params.date ?? today);

  useEffect(() => {
    if (params.date) {
      setSelectedDate(params.date);
    }
  }, [params.date]);
  const isToday = selectedDate === today;
  const canGoForward = selectedDate < today;

  const rec = getRecord(selectedDate);
  const [actualDrinks, setActualDrinks] = useState<number | null>(rec.actualDrinks);
  const [satisfaction, setSatisfaction] = useState<SatisfactionValue | null>(rec.satisfaction);
  const [memo, setMemo] = useState(rec.memo ?? "");
  const [saved, setSaved] = useState(false);
  const [showDetailOptions, setShowDetailOptions] = useState(
    rec.actualDrinks !== null && rec.actualDrinks >= 4
  );

  const detailHeight = useSharedValue(
    rec.actualDrinks !== null && rec.actualDrinks >= 4 ? 1 : 0
  );
  const detailAnimStyle = useAnimatedStyle(() => ({
    height: detailHeight.value * 56,
    opacity: detailHeight.value,
    overflow: "hidden" as const,
  }));

  const openDetailOptions = useCallback(() => {
    setShowDetailOptions(true);
    detailHeight.value = withTiming(1, { duration: 150 });
  }, [detailHeight]);

  const closeDetailOptions = useCallback(() => {
    if (!showDetailOptions) return;
    setShowDetailOptions(false);
    detailHeight.value = withTiming(0, { duration: 120 });
  }, [detailHeight, showDetailOptions]);

  // Reset local state when selectedDate changes
  useEffect(() => {
    const r = getRecord(selectedDate);
    setActualDrinks(r.actualDrinks);
    setSatisfaction(r.satisfaction);
    setMemo(r.memo ?? "");
    setSaved(false);
    const hasDetail = r.actualDrinks !== null && r.actualDrinks >= 4;
    setShowDetailOptions(hasDetail);
    detailHeight.value = hasDetail ? 1 : 0;
  }, [selectedDate, getRecord, detailHeight]);

  const handleSave = useCallback(async () => {
    await patchRecord(selectedDate, { actualDrinks, satisfaction, memo });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [selectedDate, patchRecord, actualDrinks, satisfaction, memo]);

  const declared = rec.declaredLimit;
  const isOver = declared !== null && actualDrinks !== null && actualDrinks > declared;
  const isUnder = declared !== null && actualDrinks !== null && actualDrinks <= declared;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>記録</Text>
        <View style={styles.dateNav}>
          <Pressable
            style={({ pressed }) => [styles.dateNavBtn, pressed && { opacity: 0.5 }]}
            onPress={() => setSelectedDate(shiftDate(selectedDate, -1))}
          >
            <Text style={[styles.dateNavArrow, { color: colors.primary }]}>‹</Text>
          </Pressable>
          <View style={styles.dateNavCenter}>
            <Text style={[styles.dateNavText, { color: colors.foreground }]}>
              {formatDateJP(selectedDate)}
            </Text>
            {isToday && (
              <Text style={[styles.todayBadge, { color: colors.primary }]}>今日</Text>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.dateNavBtn,
              !canGoForward && { opacity: 0.25 },
              pressed && canGoForward && { opacity: 0.5 },
            ]}
            onPress={() => canGoForward && setSelectedDate(shiftDate(selectedDate, 1))}
            disabled={!canGoForward}
          >
            <Text style={[styles.dateNavArrow, { color: colors.primary }]}>›</Text>
          </Pressable>
        </View>
        {!isToday && (
          <Pressable
            style={({ pressed }) => [styles.todayBtn, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
            onPress={() => setSelectedDate(today)}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>今日に戻る</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Declared vs actual comparison */}
        {declared !== null && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              {isToday ? "今日の宣言 vs 実績" : "この日の宣言 vs 実績"}
            </Text>
            <View style={styles.compareRow}>
              <View style={[styles.compareCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.compareCardLabel, { color: colors.muted }]}>宣言した上限</Text>
                <Text style={[styles.compareCardNum, { color: colors.foreground }]}>{declared}</Text>
                <Text style={[styles.compareCardUnit, { color: colors.muted }]}>杯</Text>
              </View>
              <View style={[styles.compareCard, {
                backgroundColor: isOver ? "#FFF0EB" : isUnder ? "#E8F5E9" : colors.background,
                borderColor: isOver ? "#FF6B35" : isUnder ? "#4CAF50" : colors.border,
                borderWidth: 2,
              }]}>
                <Text style={[styles.compareCardLabel, { color: colors.muted }]}>実際に飲んだ</Text>
                <Text style={[styles.compareCardNum, { color: isOver ? "#FF6B35" : isUnder ? "#4CAF50" : colors.foreground }]}>
                  {actualDrinks ?? "—"}
                </Text>
                <Text style={[styles.compareCardUnit, { color: colors.muted }]}>杯</Text>
              </View>
            </View>
            {isOver && (
              <View style={[styles.resultBanner, { backgroundColor: "#FFF0EB" }]}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#C0392B" }}>
                  ⚠️ 上限オーバー（+{actualDrinks! - declared}杯）
                </Text>
              </View>
            )}
            {isUnder && (
              <View style={[styles.resultBanner, { backgroundColor: "#E8F5E9" }]}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#2E7D32" }}>
                  ✅ 宣言を守れました！
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Status — kyukan */}
        {rec.status === "kyukan" && (
          <View style={[styles.kyukanCard, { backgroundColor: "#E8F5E9" }]}>
            <Text style={{ fontSize: 36 }}>🍵</Text>
            <View>
              <Text style={[styles.kyukanTitle, { color: "#2E7D32" }]}>
                {isToday ? "今日は休肝日です" : "この日は休肝日です"}
              </Text>
              <Text style={[styles.kyukanSub, { color: "#4CAF50" }]}>飲んでいない場合は記録不要です</Text>
            </View>
          </View>
        )}

        {/* Actual drinks */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>実際の杯数を記録</Text>
          <View style={styles.drinkGrid}>
            {DRINK_OPTIONS.map((opt) => {
              const isSelected =
                opt.value === 4
                  ? actualDrinks !== null && actualDrinks >= 4
                  : actualDrinks === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.drinkCard,
                    {
                      borderColor: isSelected ? "#FF6B35" : colors.border,
                      backgroundColor: isSelected ? "#FFF0EB" : colors.background,
                    },
                  ]}
                  onPress={() => {
                    if (opt.value === 4) {
                      if (!showDetailOptions) {
                        setActualDrinks(4);
                        openDetailOptions();
                      }
                    } else {
                      setActualDrinks(opt.value);
                      closeDetailOptions();
                    }
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                  <Text style={[styles.drinkLabel, { color: isSelected ? "#FF6B35" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Animated.View style={detailAnimStyle}>
            <View style={styles.detailRow}>
              {DRINK_DETAIL_OPTIONS.map((opt) => {
                const isSelected = actualDrinks === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.detailCard,
                      {
                        borderColor: isSelected ? "#FF6B35" : colors.border,
                        backgroundColor: isSelected ? "#FFF0EB" : colors.background,
                      },
                    ]}
                    onPress={() => setActualDrinks(opt.value)}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: isSelected ? "#FF6B35" : colors.foreground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
          <Pressable
            style={[
              styles.zeroBtn,
              {
                borderColor: actualDrinks === 0 ? "#4CAF50" : colors.border,
                backgroundColor: actualDrinks === 0 ? "#E8F5E9" : colors.background,
              },
            ]}
            onPress={() => {
              setActualDrinks(0);
              closeDetailOptions();
            }}
          >
            <Text style={[styles.zeroBtnText, { color: actualDrinks === 0 ? "#4CAF50" : colors.muted }]}>
              🍵 飲まなかった（0杯）
            </Text>
          </Pressable>
        </View>

        {/* Satisfaction */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>満足度</Text>
          <View style={styles.satisfactionRow}>
            {SATISFACTION_OPTIONS.map((opt) => {
              const isSelected = satisfaction === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.satisfactionCard,
                    {
                      borderColor: isSelected ? "#4A90D9" : colors.border,
                      backgroundColor: isSelected ? "#EEF6FF" : colors.background,
                    },
                  ]}
                  onPress={() => setSatisfaction(opt.value)}
                >
                  <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                  <Text style={[styles.satisfactionLabel, { color: isSelected ? "#4A90D9" : colors.muted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Memo */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>メモ（任意）</Text>
          <TextInput
            style={[styles.memoInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="今日の一言メモ"
            placeholderTextColor={colors.muted}
            value={memo}
            onChangeText={setMemo}
            multiline
            returnKeyType="done"
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? "#4CAF50" : "#4A90D9" },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? "✅ 保存しました！" : "✅ 記録を保存する"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  dateNav: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  dateNavBtn: { padding: 8 },
  dateNavArrow: { fontSize: 28, fontWeight: "600", lineHeight: 32 },
  dateNavCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dateNavText: { fontSize: 16, fontWeight: "700" },
  todayBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  todayBtn: { alignSelf: "center", marginTop: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  todayBtnText: { fontSize: 12, fontWeight: "600" },
  scrollContent: { padding: 16, gap: 14 },
  section: { borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  compareRow: { flexDirection: "row", gap: 12 },
  compareCard: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: "transparent",
  },
  compareCardLabel: { fontSize: 11, marginBottom: 8 },
  compareCardNum: { fontSize: 40, fontWeight: "800", lineHeight: 44 },
  compareCardUnit: { fontSize: 12, marginTop: 2 },
  resultBanner: { marginTop: 12, borderRadius: 10, padding: 12, alignItems: "center" },
  kyukanCard: {
    borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  kyukanTitle: { fontSize: 16, fontWeight: "700" },
  kyukanSub: { fontSize: 12, marginTop: 2 },
  drinkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  drinkCard: {
    flex: 1, minWidth: "42%", borderRadius: 12, borderWidth: 2,
    padding: 14, alignItems: "center",
  },
  drinkLabel: { fontSize: 13, fontWeight: "700" },
  detailRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  detailCard: {
    flex: 1, borderRadius: 10, borderWidth: 1.5,
    paddingVertical: 10, alignItems: "center",
  },
  detailLabel: { fontSize: 13, fontWeight: "700" },
  zeroBtn: {
    borderRadius: 12, borderWidth: 1.5,
    padding: 12, alignItems: "center",
  },
  zeroBtnText: { fontSize: 14, fontWeight: "600" },
  satisfactionRow: { flexDirection: "row", gap: 8 },
  satisfactionCard: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    padding: 12, alignItems: "center", gap: 6,
  },
  satisfactionLabel: { fontSize: 11, fontWeight: "600" },
  memoInput: {
    borderRadius: 10, borderWidth: 1,
    padding: 12, fontSize: 14, minHeight: 60,
  },
  bottomBar: { padding: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
