import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-context";

interface TriviaLink {
  title: string;
  description: string;
  url: string;
}

const TRIVIA_LINKS: TriviaLink[] = [
  {
    title: "お酒は少量でも体に良くない",
    description: "日本人の多くはお酒に弱い。 そのことを理解して、楽しんでほしい。",
    url: "https://sk-kumamoto.jp/sk_times/29114/",
  },
  {
    title: "マジですか？「アルコールは少量でも健康に良くない」という研究結果",
    description: "最近の研究によるエビデンスで、飲酒は量にかかわらず健康に害を及ぼす可能性があることがはっきりしてきた",
    url: "https://globe.asahi.com/article/14838407",
  },
  {
    title: "脳を萎縮させる、毎日の飲酒習慣",
    description: "お酒は脳にとっては看過できない大きな悪影響があることが、昨今の研究で明らかになってきました。",
    url: "https://www.axa.co.jp/100-year-life/health/20231228p/",
  },
  {
    title: "休肝日の効果",
    description: "週2日以上の休肝日を設けることで、肝臓の回復と飲酒量の自然な減少が期待できます。",
    url: "https://www.e-healthnet.mhlw.go.jp/information/alcohol/a-03-003.html",
  },
  {
    title: "アルコールと生活習慣病",
    description: "長期の多量飲酒は高血圧・脂質異常症・糖尿病などのリスクを高めます。",
    url: "https://www.e-healthnet.mhlw.go.jp/information/alcohol/a-01-003.html",
  },
];

export default function ConfirmDrinkScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { today, patchRecord } = useAppStore();

  const trivia = useMemo(
    () => TRIVIA_LINKS[Math.floor(Math.random() * TRIVIA_LINKS.length)],
    []
  );

  const handleDrinkWithRules = useCallback(() => {
    router.replace("/declaration");
  }, [router]);

  const handleAlternative = useCallback(() => {
    router.replace("/alternative");
  }, [router]);

  const handleNoDrink = useCallback(async () => {
    await patchRecord(today, { status: "kyukan" });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [today, patchRecord, router]);

  const handleOpenLink = useCallback(() => {
    Linking.openURL(trivia.url);
  }, [trivia.url]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        {/* Close button */}
        <View style={styles.closeRow}>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>

        {/* Main question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionEmoji}>🤔</Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            本当に飲みますか？
          </Text>
        </View>

        {/* Trivia card */}
        <View style={[styles.triviaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.triviaLabel, { color: colors.primary }]}>💡 知っていますか？</Text>
          <Text style={[styles.triviaTitle, { color: colors.foreground }]}>{trivia.title}</Text>
          <Text style={[styles.triviaDesc, { color: colors.muted }]}>{trivia.description}</Text>
          <Pressable
            style={({ pressed }) => [styles.triviaLink, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
            onPress={handleOpenLink}
          >
            <Text style={[styles.triviaLinkText, { color: colors.primary }]}>詳しく見る →</Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action buttons */}
        <View style={styles.actionSection}>
          <Pressable
            style={({ pressed }) => [styles.btnNoDrink, pressed && { opacity: 0.8 }]}
            onPress={handleNoDrink}
          >
            <Text style={styles.btnNoDrinkText}>✅ やっぱり飲まない</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnAlternative, pressed && { opacity: 0.8 }]}
            onPress={handleAlternative}
          >
            <Text style={styles.btnAlternativeText}>💡 替わりの行動で気を紛らわす</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnDrink, { borderColor: colors.muted }, pressed && { opacity: 0.6 }]}
            onPress={handleDrinkWithRules}
          >
            <Text style={[styles.btnDrinkText, { color: colors.muted }]}>🍺 ルールを決めてから飲む</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeRow: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: "600",
  },
  questionSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 28,
  },
  questionEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  triviaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  triviaLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  triviaTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  triviaDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  triviaLink: {
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  triviaLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionSection: {
    gap: 10,
  },
  btnNoDrink: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  btnNoDrinkText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  btnAlternative: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#667EEA",
  },
  btnAlternativeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  btnDrink: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnDrinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
