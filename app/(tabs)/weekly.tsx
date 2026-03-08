import { useCallback, useEffect, useState } from "react";
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
import {
  DayStatus,
  formatMonthDayJP,
  getDayLabel,
  getWeekDates,
  hasConsecutiveKyukan,
} from "@/lib/store";

const STATUS_CYCLE: DayStatus[] = ["undecided", "kyukan", "ok"];
const STATUS_CONFIG: Record<DayStatus, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  kyukan:    { label: "休肝日",    emoji: "🍵", bg: "#E8F5E9", text: "#2E7D32", border: "#4CAF50" },
  ok:        { label: "飲酒OK日",  emoji: "🍺", bg: "#FFF3E0", text: "#E65100", border: "#FF6B35" },
  undecided: { label: "未定",      emoji: "？", bg: "#F2F2F7", text: "#8E8E93", border: "#E5E5EA" },
};

function getWeekOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return d;
}

export default function WeeklyScreen() {
  const colors = useColors();
  const { store, today, getRecord, patchRecord } = useAppStore();
  const insets = useSafeAreaInsets();

  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    setWeekDates(getWeekDates(getWeekOffset(weekOffset)));
  }, [weekOffset]);

  const hasConsecutive = hasConsecutiveKyukan(store.records, weekDates);

  const kyukanDays = weekDates.filter((d) => getRecord(d).status === "kyukan").length;

  const handleToggle = useCallback(
    async (date: string) => {
      const current = getRecord(date).status;
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      await patchRecord(date, { status: next });
    },
    [getRecord, patchRecord]
  );

  const weekLabel = () => {
    if (weekDates.length < 7) return "";
    const s = weekDates[0];
    const e = weekDates[6];
    const sd = new Date(s), ed = new Date(e);
    return `${sd.getMonth() + 1}月${sd.getDate()}日（月）〜 ${ed.getMonth() + 1}月${ed.getDate()}日（日）`;
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>週間計画</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>{weekLabel()}</Text>
      </View>

      <FlatList
        data={weekDates}
        keyExtractor={(item) => item}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Week navigation */}
            <View style={[styles.weekNav, { backgroundColor: colors.surface }]}>
              <Pressable
                style={({ pressed }) => [styles.navBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
                onPress={() => setWeekOffset((v) => v - 1)}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>‹</Text>
              </Pressable>
              <Text style={[styles.weekNavLabel, { color: colors.foreground }]}>
                {weekOffset === 0 ? "今週" : weekOffset > 0 ? `+${weekOffset}週` : `${weekOffset}週`}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.navBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
                onPress={() => setWeekOffset((v) => v + 1)}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>›</Text>
              </Pressable>
            </View>

            {/* Alert / achievement */}
            {hasConsecutive ? (
              <View style={[styles.alertCard, { backgroundColor: "#E8F5E9", borderLeftColor: "#4CAF50" }]}>
                <Text style={{ fontSize: 20 }}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: "#2E7D32" }]}>2連続休肝日 達成！</Text>
                  <Text style={[styles.alertText, { color: "#2E7D32" }]}>
                    今週は2日連続の休肝日が設定されています。素晴らしいです！
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.alertCard, { backgroundColor: "#FFF0EB", borderLeftColor: "#FF6B35" }]}>
                <Text style={{ fontSize: 20 }}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: "#C0392B" }]}>2連続休肝日が未達成です</Text>
                  <Text style={[styles.alertText, { color: "#C0392B" }]}>
                    2日連続の休肝日を設定すると達成できます。
                  </Text>
                </View>
              </View>
            )}

            {/* Summary */}
            <View style={[styles.summaryRow, { backgroundColor: colors.surface }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: "#4CAF50" }]}>{kyukanDays}</Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>休肝日</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: "#FF6B35" }]}>
                  {weekDates.filter((d) => getRecord(d).status === "ok").length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>飲酒OK日</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: colors.muted }]}>
                  {weekDates.filter((d) => getRecord(d).status === "undecided").length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>未定</Text>
              </View>
            </View>

            <Text style={[styles.listSectionLabel, { color: colors.muted }]}>曜日ごとの設定</Text>
          </>
        }
        renderItem={({ item: date }) => {
          const rec = getRecord(date);
          const conf = STATUS_CONFIG[rec.status];
          const isToday = date === today;
          const dayLabel = getDayLabel(date);
          const dateLabel = formatMonthDayJP(date);

          return (
            <Pressable
              style={({ pressed }) => [
                styles.dayRow,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => handleToggle(date)}
            >
              <View style={styles.dayLeft}>
                <Text style={[styles.dayLabelBig, isToday && { color: "#4A90D9" }]}>
                  {dayLabel}
                </Text>
                <Text style={[styles.dayDate, { color: colors.muted }]}>
                  {dateLabel.replace(/（.+）/, "")}
                  {isToday ? " 今日" : ""}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                <Text style={{ fontSize: 16 }}>{conf.emoji}</Text>
                <Text style={[styles.statusBadgeText, { color: conf.text }]}>
                  {conf.label}{isToday ? "（今日）" : ""}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={[styles.legend, { backgroundColor: colors.surface }]}>
            <Text style={[styles.legendTitle, { color: colors.muted }]}>凡例（タップで切り替え）</Text>
            <View style={styles.legendRow}>
              {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                    <Text style={{ fontSize: 12 }}>{conf.emoji}</Text>
                  </View>
                  <Text style={[styles.legendLabel, { color: colors.muted }]}>{conf.label}</Text>
                </View>
              ))}
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  scrollContent: { gap: 12, padding: 16 },
  weekNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, padding: 12,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  weekNavLabel: { fontSize: 15, fontWeight: "700" },
  alertCard: {
    borderLeftWidth: 4, borderRadius: 12,
    padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10,
  },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  alertText: { fontSize: 12, lineHeight: 18 },
  summaryRow: {
    borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: { fontSize: 28, fontWeight: "800" },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 36 },
  listSectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  dayRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  dayLeft: { width: 52 },
  dayLabelBig: { fontSize: 18, fontWeight: "800" },
  dayDate: { fontSize: 11, marginTop: 1 },
  statusBadge: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    alignSelf: "center",
    maxWidth: 180,
  },
  statusBadgeText: { fontSize: 13, fontWeight: "700" },
  chevron: { fontSize: 20, marginLeft: 8 },
  legend: { borderRadius: 14, padding: 14, marginTop: 4 },
  legendTitle: { fontSize: 11, fontWeight: "600", marginBottom: 10 },
  legendRow: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  legendLabel: { fontSize: 12 },
});
