import { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { useColors } from "@/hooks/use-colors";

interface WeekdayChartProps {
  data: { dayIndex: number; label: string; avg: number }[];
}

const CHART_HEIGHT = 120;
const BAR_PADDING = 8;
const LABEL_HEIGHT = 20;
const VALUE_HEIGHT = 16;

export function WeekdayChart({ data }: WeekdayChartProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64; // padding 16*2 + section padding 16*2

  const maxAvg = useMemo(() => Math.max(...data.map((d) => d.avg), 1), [data]);
  const maxDayIndex = useMemo(() => {
    let maxIdx = 0;
    let maxVal = 0;
    data.forEach((d) => {
      if (d.avg > maxVal) {
        maxVal = d.avg;
        maxIdx = d.dayIndex;
      }
    });
    return maxVal > 0 ? maxIdx : -1;
  }, [data]);

  const barWidth = (chartWidth - BAR_PADDING * 8) / 7;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT + VALUE_HEIGHT;

  const peakLabel = useMemo(() => {
    if (maxDayIndex < 0) return null;
    const d = data[maxDayIndex];
    return `${d.label}曜日が最も飲みやすい傾向があります`;
  }, [data, maxDayIndex]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        曜日別 平均飲酒量（過去4週間）
      </Text>
      <View style={styles.chartWrap}>
        <Svg width={chartWidth} height={svgHeight}>
          {data.map((d, i) => {
            const x = BAR_PADDING + i * (barWidth + BAR_PADDING);
            const barH = d.avg > 0 ? Math.max((d.avg / maxAvg) * CHART_HEIGHT, 6) : 3;
            const y = VALUE_HEIGHT + CHART_HEIGHT - barH;
            const isMax = d.dayIndex === maxDayIndex;

            return (
              <Rect
                key={d.dayIndex}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={isMax ? colors.orange : colors.primary}
              />
            );
          })}
          {data.map((d, i) => {
            const x = BAR_PADDING + i * (barWidth + BAR_PADDING) + barWidth / 2;
            const barH = d.avg > 0 ? Math.max((d.avg / maxAvg) * CHART_HEIGHT, 6) : 3;
            const valueY = VALUE_HEIGHT + CHART_HEIGHT - barH - 4;

            return (
              <SvgText
                key={`val-${d.dayIndex}`}
                x={x}
                y={valueY}
                fontSize={10}
                fill={colors.muted}
                textAnchor="middle"
              >
                {d.avg > 0 ? d.avg.toFixed(1) : ""}
              </SvgText>
            );
          })}
          {data.map((d, i) => {
            const x = BAR_PADDING + i * (barWidth + BAR_PADDING) + barWidth / 2;
            return (
              <SvgText
                key={`lbl-${d.dayIndex}`}
                x={x}
                y={svgHeight - 2}
                fontSize={11}
                fill={colors.muted}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}
        </Svg>
      </View>
      {peakLabel && (
        <Text style={[styles.comment, { color: colors.foreground }]}>
          {peakLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  chartWrap: { alignItems: "center" },
  comment: { fontSize: 12, marginTop: 10, textAlign: "center" },
});
