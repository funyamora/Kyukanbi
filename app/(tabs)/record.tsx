import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";
import { formatDateJP } from "@/lib/store";

const DRINK_OPTIONS = [
  { value: 1, label: "1杯", emoji: "🥃" },
  { value: 2, label: "2杯", emoji: "🥃🥃" },
  { value: 3, label: "3杯", emoji: "🥃🥃🥃" },
  { value: 4, label: "4杯以上", emoji: "🍻" },
];

const SATISFACTION_OPTIONS = [
  { value: "great",   label: "満足",     emoji: "😊" },
  { value: "okay",    label: "まあまあ", emoji: "😐" },
  { value: "regret",  label: "後悔",     emoji: "😔" },
  { value: "toomuch", label: "飲みすぎ", emoji: "🤢" },
] as const;

type SatisfactionValue = "great" | "okay" | "regret" | "toomuch";

export default function RecordScreen() {
  const colors = useColors();
  const { today, getRecord, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const rec = getRecord(today);
  const [actualDrinks, setActualDrinks] = useState<number | null>(rec.actualDrinks);
  const [satisfaction, setSatisfaction] = useState<SatisfactionValue | null>(rec.satisfaction);
  const [memo, setMemo] = useState(rec.memo ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    await patchRecord(today, { actualDrinks, satisfaction, memo });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [today, patchRecord, actualDrinks, satisfaction, memo]);

  const declared = rec.declaredLimit;
  const isOver = declared !== null && actualDrinks !== null && actualDrinks > declared;
  const isUnder = declared !== null && actualDrinks !== null && actualDrinks <= declared;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>記録</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>{formatDateJP(today)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Declared vs actual comparison */}
        {declared !== null && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>今日の宣言 vs 実績</Text>
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

        {/* Today's status — kyukan */}
        {rec.status === "kyukan" && (
          <View style={[styles.kyukanCard, { backgroundColor: "#E8F5E9" }]}>
            <Text style={{ fontSize: 36 }}>🍵</Text>
            <View>
              <Text style={[styles.kyukanTitle, { color: "#2E7D32" }]}>今日は休肝日です</Text>
              <Text style={[styles.kyukanSub, { color: "#4CAF50" }]}>飲んでいない場合は記録不要です</Text>
            </View>
          </View>
        )}

        {/* Actual drinks */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>実際の杯数を記録</Text>
          <View style={styles.drinkGrid}>
            {DRINK_OPTIONS.map((opt) => {
              const isSelected = actualDrinks === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.drinkCard,
                    {
                      borderColor: isSelected ? "#FF6B35" : colors.border,
                      backgroundColor: isSelected ? "#FFF0EB" : colors.background,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setActualDrinks(opt.value)}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                  <Text style={[styles.drinkLabel, { color: isSelected ? "#FF6B35" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.zeroBtn,
              { borderColor: actualDrinks === 0 ? "#4CAF50" : colors.border, backgroundColor: actualDrinks === 0 ? "#E8F5E9" : colors.background },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setActualDrinks(0)}
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
                  style={({ pressed }) => [
                    styles.satisfactionCard,
                    {
                      borderColor: isSelected ? "#4A90D9" : colors.border,
                      backgroundColor: isSelected ? "#EEF6FF" : colors.background,
                    },
                    pressed && { opacity: 0.8 },
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
