import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

const TIMER_SECONDS = 5 * 60;

export default function AlternativeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { today, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const [selectedMood, setSelectedMood] = useState<string>("habit");
  const [selectedAction, setSelectedAction] = useState<string>("sparkling");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredActions = ACTIONS.filter((a) => a.moods.includes(selectedMood));

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const toggleTimer = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(TIMER_SECONDS);
      setTimerRunning(true);
    } else {
      setTimerRunning((v) => !v);
    }
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(1, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleDone = useCallback(async () => {
    const action = ACTIONS.find((a) => a.id === selectedAction);
    await patchRecord(today, { status: "kyukan", alternativeAction: action?.title ?? null });
    router.back();
  }, [today, patchRecord, selectedAction, router]);

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
          <Text style={{ fontSize: 16, color: "#4A90D9" }}>‹ 戻る</Text>
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
              <Text style={styles.heroSub}>5分だけ別のことをしてみましょう</Text>
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
                          backgroundColor: isSelected ? "#667EEA" : colors.background,
                          borderColor: isSelected ? "#667EEA" : colors.border,
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
        renderItem={({ item }) => {
          const isSelected = selectedAction === item.id;
          return (
            <Pressable
              style={[
                styles.actionCard,
                {
                  backgroundColor: isSelected ? "#EEF2FF" : colors.surface,
                  borderColor: isSelected ? "#667EEA" : colors.border,
                },
              ]}
              onPress={() => setSelectedAction(item.id)}
            >
              <Text style={{ fontSize: 32, marginRight: 14 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: isSelected ? "#667EEA" : colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.actionDesc, { color: colors.muted }]}>{item.desc}</Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: isSelected ? "#667EEA" : colors.border }]}>
                {isSelected && <View style={[styles.radioInner, { backgroundColor: "#667EEA" }]} />}
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          /* Timer */
          <View style={[styles.timerCard, { backgroundColor: "#1C1C1E" }]}>
            <View>
              <Text style={styles.timerLabel}>5分タイマー</Text>
              <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.timerBtn, { backgroundColor: "#4A90D9" }, pressed && { opacity: 0.85 }]}
              onPress={toggleTimer}
            >
              <Text style={styles.timerBtnText}>{timerRunning ? "⏸ 停止" : "▶ スタート"}</Text>
            </Pressable>
          </View>
        }
      />

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, { backgroundColor: "#667EEA" }, pressed && { opacity: 0.85 }]}
          onPress={handleDone}
        >
          <Text style={styles.btnPrimaryText}>✅ これをやってみる</Text>
        </Pressable>
        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.btnHalf, { borderColor: "#FF6B35", borderWidth: 2 }, pressed && { opacity: 0.8 }]}
            onPress={handleDrinkAfterAll}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FF6B35" }}>🍺 やっぱり飲む</Text>
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
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  timerCard: {
    borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 4,
  },
  timerLabel: { fontSize: 12, color: "#8E8E93", marginBottom: 4 },
  timerDisplay: { fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  timerBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  timerBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  bottomActions: { padding: 16, paddingTop: 12, gap: 10, borderTopWidth: 1 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: "center" },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  btnRow: { flexDirection: "row", gap: 10 },
  btnHalf: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
});
