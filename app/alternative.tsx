import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";

const MOODS = [
  { id: "stress", label: "ストレス", emoji: "😤" },
  { id: "bored",  label: "暇",       emoji: "😴" },
  { id: "habit",  label: "なんとなく", emoji: "😑" },
  { id: "meal",   label: "食後",     emoji: "🍽️" },
  { id: "reward", label: "ご褒美",   emoji: "🎉" },
];

interface Action {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  moods: string[];
}

const ACTIONS: Action[] = [
  { id: "sparkling", emoji: "🫧", title: "炭酸水を飲む",     desc: "口寂しさを満たせます",     moods: ["habit", "meal", "bored"] },
  { id: "tea",       emoji: "🍵", title: "温かい飲み物を飲む", desc: "リラックス効果があります",  moods: ["stress", "habit"] },
  { id: "teeth",     emoji: "🦷", title: "先に歯を磨く",     desc: "飲む気が失せやすいです",    moods: ["habit", "bored"] },
  { id: "walk",      emoji: "🚶", title: "軽く散歩する",     desc: "気分転換になります",        moods: ["stress", "bored"] },
  { id: "stretch",   emoji: "🧘", title: "ストレッチをする",  desc: "体の緊張をほぐします",      moods: ["stress"] },
  { id: "bath",      emoji: "🛁", title: "お風呂に入る",     desc: "リラックスして眠れます",    moods: ["stress", "reward"] },
  { id: "snack",     emoji: "🍫", title: "甘いものを食べる",  desc: "満足感が得られます",        moods: ["reward", "meal"] },
  { id: "game",      emoji: "🎮", title: "ゲームをする",     desc: "気が紛れます",              moods: ["bored", "habit"] },
];

export default function AlternativeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { today, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const [selectedMood, setSelectedMood] = useState<string>("habit");

  const filteredActions = ACTIONS.filter((a) => a.moods.includes(selectedMood));

  const handleDrinkAfterAll = useCallback(() => {
    router.replace("/declaration");
  }, [router]);

  const handleNodrink = useCallback(async () => {
    await patchRecord(today, { status: "kyukan" });
    router.back();
  }, [today, patchRecord, router]);

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, color: colors.primary }}>‹ 戻る</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>代替行動</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={filteredActions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.heroBanner}>
              <Text style={{ fontSize: 36 }}>💡</Text>
              <Text style={styles.heroTitle}>飲む前に、ちょっと待って</Text>
              <Text style={styles.heroSub}>お酒の代わりにできることがあります</Text>
            </View>

            {/* Mood chips */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>今の気分は？</Text>
              <View style={styles.chipWrap}>
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.purple : colors.background,
                          borderColor: isSelected ? colors.purple : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedMood(m.id)}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? "#fff" : colors.foreground }]}>
                        {m.emoji} {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.listHeader, { color: colors.muted }]}>おすすめの代替行動</Text>
          </>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 32, marginRight: 14 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                {item.title}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.muted }]}>{item.desc}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.btnHalf, { borderColor: colors.orange, borderWidth: 2 }, pressed && { opacity: 0.8 }]}
            onPress={handleDrinkAfterAll}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.orange }}>🍺 やっぱり飲む</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnHalf, { backgroundColor: colors.background }, pressed && { opacity: 0.8 }]}
            onPress={handleNodrink}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>今日は飲まない</Text>
          </Pressable>
        </View>
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
    borderRadius: 20, padding: 24, alignItems: "center", gap: 8,
    backgroundColor: "#667EEA",
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  section: { borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: "600" },
  listHeader: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
  actionCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: 14, flexDirection: "row", alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  actionDesc: { fontSize: 12 },
  bottomActions: { padding: 16, paddingTop: 12, gap: 10, borderTopWidth: 1 },
  btnRow: { flexDirection: "row", gap: 10 },
  btnHalf: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
});
