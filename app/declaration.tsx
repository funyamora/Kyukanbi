import { useRouter } from "expo-router";
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

const LIMIT_OPTIONS = [
  { value: 1, label: "1杯まで", emoji: "🥃" },
  { value: 2, label: "2杯まで", emoji: "🥃🥃" },
  { value: 3, label: "3杯まで", emoji: "🥃🥃🥃" },
  { value: 4, label: "4杯以上", emoji: "🍻" },
];

const REASON_OPTIONS = [
  "なんとなく", "ストレス", "食事と一緒",
  "ご褒美", "習慣", "誘われた",
  "暇だった", "寝る前に落ち着きたい",
];

export default function DeclarationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { today, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const [selectedLimit, setSelectedLimit] = useState<number>(2);
  const [selectedReason, setSelectedReason] = useState<string>("ストレス");
  const [memo, setMemo] = useState("");

  const handleConfirm = useCallback(async () => {
    await patchRecord(today, {
      status: "ok",
      declaredLimit: selectedLimit,
      drinkingReason: selectedReason,
      memo,
    });
    router.back();
  }, [today, patchRecord, selectedLimit, selectedReason, memo, router]);

  const handleAlternative = useCallback(() => {
    router.replace("/alternative");
  }, [router]);

  const handleCancel = useCallback(async () => {
    await patchRecord(today, { status: "kyukan" });
    router.back();
  }, [today, patchRecord, router]);

  return (
    <ScreenContainer
      containerClassName="bg-background"
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, color: "#4A90D9" }}>‹ 戻る</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>飲酒前の宣言</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <Text style={{ fontSize: 40 }}>🍺</Text>
          <Text style={styles.heroTitle}>飲む前にルールを決めよう</Text>
          <Text style={styles.heroSub}>宣言することで、飲みすぎを防ぎやすくなります</Text>
        </View>

        {/* Limit selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>今日の上限杯数</Text>
          <View style={styles.limitGrid}>
            {LIMIT_OPTIONS.map((opt) => {
              const isSelected = selectedLimit === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.limitCard,
                    { borderColor: isSelected ? "#FF6B35" : colors.border, backgroundColor: isSelected ? "#FFF0EB" : colors.background },
                  ]}
                  onPress={() => setSelectedLimit(opt.value)}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                  <Text style={[styles.limitLabel, { color: isSelected ? "#FF6B35" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reason selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>飲みたい理由</Text>
          <View style={styles.chipWrap}>
            {REASON_OPTIONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <Pressable
                  key={r}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? "#4A90D9" : colors.background,
                      borderColor: isSelected ? "#4A90D9" : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={[styles.chipText, { color: isSelected ? "#fff" : colors.foreground }]}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional memo */}
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

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, { backgroundColor: "#FF6B35" }, pressed && { opacity: 0.85 }]}
          onPress={handleConfirm}
        >
          <Text style={styles.btnPrimaryText}>🍺 この条件で飲む</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
          onPress={handleAlternative}
        >
          <Text style={[styles.btnSecondaryText, { color: "#4A90D9" }]}>💡 代替行動を見る</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnText, pressed && { opacity: 0.6 }]}
          onPress={handleCancel}
        >
          <Text style={[styles.btnTextLabel, { color: colors.muted }]}>やっぱり今日は飲まない</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, gap: 14 },
  heroBanner: {
    backgroundColor: "#FF6B35", borderRadius: 20,
    padding: 24, alignItems: "center", gap: 8,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  section: { borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  limitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  limitCard: {
    flex: 1, minWidth: "42%", borderRadius: 12, borderWidth: 2,
    padding: 14, alignItems: "center",
  },
  limitLabel: { fontSize: 13, fontWeight: "700" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: "600" },
  memoInput: {
    borderRadius: 10, borderWidth: 1,
    padding: 12, fontSize: 14, minHeight: 60,
  },
  bottomActions: {
    padding: 16, paddingTop: 12, gap: 10,
    borderTopWidth: 1,
  },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: "center" },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  btnSecondary: { borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 2, borderColor: "#4A90D9" },
  btnSecondaryText: { fontSize: 15, fontWeight: "700" },
  btnText: { alignItems: "center", padding: 8 },
  btnTextLabel: { fontSize: 14 },
});
