import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { BADGE_DEFINITIONS } from "@/lib/store";

interface BadgeListProps {
  earnedBadges: string[];
}

export function BadgeList({ earnedBadges }: BadgeListProps) {
  const colors = useColors();
  const earned = useMemo(() => new Set(earnedBadges), [earnedBadges]);

  const data = useMemo(
    () =>
      BADGE_DEFINITIONS.map((b) => ({
        ...b,
        isEarned: earned.has(b.id),
      })),
    [earned]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>バッジ</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.badgeItem, { opacity: item.isEarned ? 1 : 0.3 }]}>
            <View
              style={[
                styles.badgeCircle,
                {
                  backgroundColor: item.isEarned ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{item.emoji}</Text>
            </View>
            <Text
              style={[styles.badgeName, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, paddingVertical: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  listContent: { paddingHorizontal: 16, gap: 14 },
  badgeItem: { alignItems: "center", width: 64 },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { fontSize: 10, textAlign: "center", marginTop: 4, lineHeight: 14 },
});
