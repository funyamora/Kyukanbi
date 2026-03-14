import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BadgeList } from "@/components/BadgeList";
import { ScreenContainer } from "@/components/screen-container";
import { WeekdayChart } from "@/components/WeekdayChart";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";
import {
  DailyRecord,
  computeMonthlySummary,
  computeWeekdayAverages,
  formatWeekRange,
  getWeekDates,
  hasConsecutiveKyukan,
  isConfirmedKyukan,
  toLocalDateStr,
} from "@/lib/store";

type TabType = "week" | "month";

function getMonthDates(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(toLocalDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getWeekOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return d;
}

interface Stats {
  kyukanDays: number;
  drinkDays: number;
  totalDrinks: number;
  limitKeptRate: number;
  hasConsecutive: boolean;
  reasonRanking: { reason: string; count: number }[];
  dailyDrinks: { date: string; drinks: number; isKyukan: boolean }[];
}

function computeStats(records: Record<string, DailyRecord>, dates: string[]): Stats {
  const relevant = dates.map((d) => records[d]).filter(Boolean);
  const kyukanDays = relevant.filter((r) => isConfirmedKyukan(r)).length;
  const drinkDays = relevant.filter((r) => r.status === "ok").length;
  const totalDrinks = relevant.reduce((s, r) => s + (r.actualDrinks ?? 0), 0);

  const drinkRecords = relevant.filter((r) => r.status === "ok" && r.declaredLimit !== null && r.actualDrinks !== null);
  const limitKeptRate = drinkRecords.length > 0
    ? Math.round((drinkRecords.filter((r) => r.actualDrinks! <= r.declaredLimit!).length / drinkRecords.length) * 100)
    : 0;

  const reasonMap: Record<string, number> = {};
  relevant.forEach((r) => {
    if (r.drinkingReason) reasonMap[r.drinkingReason] = (reasonMap[r.drinkingReason] ?? 0) + 1;
  });
  const reasonRanking = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const dailyDrinks = dates.map((date) => {
    const r = records[date];
    return {
      date,
      drinks: r?.actualDrinks ?? 0,
      isKyukan: isConfirmedKyukan(r),
    };
  });

  return { kyukanDays, drinkDays, totalDrinks, limitKeptRate, hasConsecutive: hasConsecutiveKyukan(records, dates), reasonRanking, dailyDrinks };
}

function computePrevStats(records: Record<string, DailyRecord>, dates: string[], prevDates: string[]): Stats {
  return computeStats(records, prevDates);
}

export default function ReviewScreen() {
  const colors = useColors();
  const { store, settings } = useAppStore();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabType>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(getWeekOffset(weekOffset)), [weekOffset]);
  const prevWeekDates = useMemo(() => getWeekDates(getWeekOffset(weekOffset - 1)), [weekOffset]);

  const now = new Date();
  const monthYear = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthDates = useMemo(() => getMonthDates(monthYear.getFullYear(), monthYear.getMonth()), [monthOffset]);
  const prevMonthDates = useMemo(() => {
    const pm = new Date(monthYear.getFullYear(), monthYear.getMonth() - 1, 1);
    return getMonthDates(pm.getFullYear(), pm.getMonth());
  }, [monthOffset]);

  const dates = tab === "week" ? weekDates : monthDates;
  const prevDates = tab === "week" ? prevWeekDates : prevMonthDates;

  const stats = useMemo(() => computeStats(store.records, dates), [store.records, dates]);
  const prevStats = useMemo(() => computePrevStats(store.records, dates, prevDates), [store.records, dates, prevDates]);

  // 曜日別平均
  const weekdayData = useMemo(() => computeWeekdayAverages(store.records), [store.records]);

  // 月次サマリー
  const monthlySummary = useMemo(
    () =>
      tab === "month"
        ? computeMonthlySummary(
            store.records,
            monthYear.getFullYear(),
            monthYear.getMonth(),
            settings.weeklyGoalDays
          )
        : null,
    [store.records, tab, monthOffset, settings.weeklyGoalDays]
  );

  const periodLabel = tab === "week"
    ? formatWeekRange(weekDates)
    : `${monthYear.getFullYear()}年${monthYear.getMonth() + 1}月`;

  const maxDrinks = Math.max(...stats.dailyDrinks.map((d) => d.drinks), 1);

  const insights: string[] = [];
  if (stats.kyukanDays > prevStats.kyukanDays) {
    insights.push(`先週より休肝日が${stats.kyukanDays - prevStats.kyukanDays}日増えました`);
  }
  if (stats.reasonRanking[0]) {
    insights.push(`「${stats.reasonRanking[0].reason}」のときに飲みやすい傾向があります`);
  }
  if (stats.limitKeptRate < 50 && stats.drinkDays > 0) {
    insights.push("上限を超えることが多い週でした。宣言を活用してみましょう");
  }

  const handleShare = useCallback(async () => {
    if (!monthlySummary) return;
    const monthName = `${monthYear.getFullYear()}年${monthYear.getMonth() + 1}月`;
    const diffText = monthlySummary.diff >= 0
      ? `+${monthlySummary.diff}日`
      : `${monthlySummary.diff}日`;
    const message = [
      "【休肝日つくーる 月次レポート】",
      monthName,
      `休肝日: ${monthlySummary.kyukanDays}日（先月比 ${diffText}）`,
      `達成率: ${monthlySummary.achievementRate}%`,
      monthlySummary.comment,
    ].join("\n");
    try {
      await Share.share({ message });
    } catch (_) {}
  }, [monthlySummary, monthYear]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>振り返り</Text>
      </View>

      {/* Badge list */}
      <BadgeList earnedBadges={store.badges ?? []} />

      {/* Tab */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["week", "month"] as TabType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabItem, tab === t && [styles.tabItemActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.muted }]}>
              {t === "week" ? "週" : "月"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Period navigation */}
        <View style={[styles.periodNav, { backgroundColor: colors.surface }]}>
          <Pressable
            style={({ pressed }) => [styles.navBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
            onPress={() => tab === "week" ? setWeekOffset((v) => v - 1) : setMonthOffset((v) => v - 1)}
          >
            <Text style={{ fontSize: 18, color: colors.foreground }}>‹</Text>
          </Pressable>
          <Text style={[styles.periodLabel, { color: colors.foreground }]}>{periodLabel}</Text>
          <Pressable
            style={({ pressed }) => [styles.navBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
            onPress={() => tab === "week" ? setWeekOffset((v) => v + 1) : setMonthOffset((v) => v + 1)}
          >
            <Text style={{ fontSize: 18, color: colors.foreground }}>›</Text>
          </Pressable>
        </View>

        {/* KPI cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.kpiLabel}>休肝日数</Text>
            <Text style={styles.kpiNum}>{stats.kyukanDays}</Text>
            <Text style={styles.kpiUnit}>日</Text>
            {stats.kyukanDays !== prevStats.kyukanDays && (
              <Text style={styles.kpiDiff}>
                {stats.kyukanDays > prevStats.kyukanDays ? "▲" : "▼"} 前期比 {Math.abs(stats.kyukanDays - prevStats.kyukanDays)}日
              </Text>
            )}
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>飲酒日数</Text>
            <Text style={[styles.kpiNum, { color: colors.foreground }]}>{stats.drinkDays}</Text>
            <Text style={[styles.kpiUnit, { color: colors.muted }]}>日</Text>
            {stats.drinkDays !== prevStats.drinkDays && (
              <Text style={[styles.kpiDiff, { color: stats.drinkDays < prevStats.drinkDays ? colors.success : colors.orange }]}>
                {stats.drinkDays < prevStats.drinkDays ? "▼" : "▲"} 前期比 {Math.abs(stats.drinkDays - prevStats.drinkDays)}日
              </Text>
            )}
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>総杯数</Text>
            <Text style={[styles.kpiNum, { color: colors.foreground }]}>{stats.totalDrinks}</Text>
            <Text style={[styles.kpiUnit, { color: colors.muted }]}>杯</Text>
            {stats.totalDrinks !== prevStats.totalDrinks && (
              <Text style={[styles.kpiDiff, { color: stats.totalDrinks < prevStats.totalDrinks ? colors.success : colors.orange }]}>
                {stats.totalDrinks < prevStats.totalDrinks ? "▼" : "▲"} 前期比 {Math.abs(stats.totalDrinks - prevStats.totalDrinks)}杯
              </Text>
            )}
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>上限順守率</Text>
            <Text style={[styles.kpiNum, { color: stats.limitKeptRate >= 70 ? colors.success : colors.orange }]}>{stats.limitKeptRate}</Text>
            <Text style={[styles.kpiUnit, { color: colors.muted }]}>%</Text>
          </View>
        </View>

        {/* Monthly summary card (month tab only) */}
        {tab === "month" && monthlySummary && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>月次サマリー</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {monthlySummary.kyukanDays}日
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>休肝日</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: monthlySummary.diff >= 0 ? colors.success : colors.orange },
                  ]}
                >
                  {monthlySummary.diff >= 0 ? "+" : ""}
                  {monthlySummary.diff}日
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>先月比</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {monthlySummary.achievementRate}%
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>達成率</Text>
              </View>
            </View>
            <Text style={[styles.summaryComment, { color: colors.foreground }]}>
              {monthlySummary.comment}
            </Text>
          </View>
        )}

        {/* Bar chart */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            {tab === "week" ? "今週の杯数推移" : "今月の杯数推移"}
          </Text>
          <View style={styles.chart}>
            {stats.dailyDrinks.map((d, i) => {
              const barH = d.drinks > 0 ? Math.max((d.drinks / maxDrinks) * 80, 8) : 4;
              const dayLabel = tab === "week"
                ? ["月", "火", "水", "木", "金", "土", "日"][i] ?? ""
                : `${new Date(d.date).getDate()}`;
              return (
                <View key={d.date} style={styles.chartBar}>
                  <View style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: d.isKyukan ? colors.success : d.drinks > 0 ? colors.orange : colors.border,
                    },
                  ]} />
                  {tab === "week" && (
                    <Text style={[styles.chartLabel, { color: colors.muted }]}>{dayLabel}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>休肝日</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>飲酒日</Text>
            </View>
          </View>
        </View>

        {/* Weekday chart */}
        <WeekdayChart data={weekdayData} />

        {/* Reason ranking */}
        {stats.reasonRanking.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>飲みたい理由ランキング</Text>
            {stats.reasonRanking.map((item, idx) => {
              const maxCount = stats.reasonRanking[0].count;
              const barW = `${(item.count / maxCount) * 100}%`;
              const rankColors = ["#F0A500", "#8E8E93", "#CD7F32"];
              return (
                <View key={item.reason} style={styles.rankRow}>
                  <Text style={[styles.rankNum, { color: rankColors[idx] ?? colors.muted }]}>{idx + 1}</Text>
                  <Text style={[styles.rankReason, { color: colors.foreground }]}>{item.reason}</Text>
                  <View style={styles.rankBarWrap}>
                    <View style={[styles.rankBar, { width: barW as any, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.rankCount, { color: colors.muted }]}>{item.count}回</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={[styles.insightCard, { borderLeftColor: colors.primary, backgroundColor: "#EEF6FF" }]}>
            {insights.map((ins, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={{ fontSize: 8, color: colors.primary, marginTop: 5 }}>●</Text>
                <Text style={[styles.insightText, { color: "#1A3A5C" }]}>{ins}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Share button (month tab only) */}
        {tab === "month" && monthlySummary && (
          <Pressable
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleShare}
          >
            <Text style={styles.shareBtnText}>月次レポートを共有</Text>
          </Pressable>
        )}

        {/* Empty state */}
        {stats.kyukanDays === 0 && stats.drinkDays === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>まだデータがありません</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>ホームから今日の記録を始めましょう</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  tabBar: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: {},
  tabText: { fontSize: 15, fontWeight: "700" },
  scrollContent: { padding: 16, gap: 14 },
  periodNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, padding: 12,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  periodLabel: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "center" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flex: 1, minWidth: "44%", borderRadius: 16, padding: 16,
  },
  kpiLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  kpiNum: { fontSize: 36, fontWeight: "800", color: "#fff", lineHeight: 40 },
  kpiUnit: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  kpiDiff: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  section: { borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  summaryComment: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 100, gap: 4 },
  chartBar: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "100%", borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10 },
  chartLegend: { flexDirection: "row", gap: 16, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  rankNum: { fontSize: 16, fontWeight: "800", width: 20 },
  rankReason: { fontSize: 13, width: 100 },
  rankBarWrap: { flex: 1, height: 8, backgroundColor: "#E5E5EA", borderRadius: 4, overflow: "hidden" },
  rankBar: { height: 8, borderRadius: 4 },
  rankCount: { fontSize: 12, width: 32, textAlign: "right" },
  insightCard: { borderLeftWidth: 4, borderRadius: 12, padding: 14, gap: 6 },
  insightRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  insightText: { fontSize: 13, lineHeight: 20, flex: 1 },
  shareBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center" },
});
