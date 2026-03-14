# CLAUDE.md — 休肝日つくーる

このファイルはClaude Codeがプロジェクトを理解するための情報をまとめたものです。
作業を始める前に必ず読んでください。

---

## プロジェクト概要

「休肝日つくーる」は、週2日の連続休肝日を習慣化するためのiOS/Androidアプリです。
飲酒前に宣言し、代替行動を提案し、記録と振り返りで習慣を改善するサイクルを提供します。

---

## 技術スタック

| カテゴリ | 採用技術 |
| :--- | :--- |
| フレームワーク | Expo SDK 54 / React Native 0.81 |
| 言語 | TypeScript 5.9 |
| ルーティング | Expo Router v6（ファイルベース） |
| スタイリング | NativeWind v4（Tailwind CSS） |
| 状態管理 | React Context + AsyncStorage |
| アニメーション | react-native-reanimated 4.x |
| ジェスチャー | react-native-gesture-handler |
| アイコン | @expo/vector-icons（MaterialIcons） |
| テスト | Vitest |

**バックエンド・DB・認証は現時点で未使用です。** データはすべてAsyncStorageにローカル保存します。

---

## ファイル構成（重要ファイルのみ）

```
kyukoubi-tsukuru/
├── CLAUDE.md                    ← このファイル
├── theme.config.js              ← カラートークン定義（ここだけ変更する）
├── tailwind.config.js           ← Tailwind設定（theme.config.jsを参照）
├── app.config.ts                ← Expoアプリ設定
│
├── doc/
│   ├── 技術スタック設計書.md    ← 採用技術とアーキテクチャ
│   ├── データモデル設計書.md    ← 型定義・AsyncStorageキー・データ操作関数
│   ├── 画面設計書.md            ← 5タブ＋モーダル画面の詳細設計・画面遷移図
│   ├── バッジシステム設計書.md  ← バッジ定義・解除条件・通知連携
│   ├── コンポーネント一覧.md    ← 再利用コンポーネントのProps・使用例
│   └── design.md               ← デザイン方針・カラーパレット
│
├── lib/
│   ├── store.ts                 ← 型定義・AsyncStorage操作・バッジ・分析関数
│   ├── app-context.tsx          ← AppProvider・useAppStore フック
│   ├── notifications.ts         ← 通知（リマインダー・達成通知）
│   ├── theme-provider.tsx       ← テーマ切替（ThemeProvider・useThemeContext）
│   └── utils.ts                 ← cn()（clsx + tailwind-merge）
│
├── hooks/
│   ├── use-colors.ts            ← useColors() テーマカラーパレット取得
│   └── use-color-scheme.ts      ← useColorScheme() 現在のカラースキーム取得
│
├── app/
│   ├── _layout.tsx              ← ルートレイアウト（ThemeProvider・AppProvider等をラップ）
│   ├── onboarding.tsx           ← オンボーディング画面（fullScreenModal）
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← タブバー設定（タブ追加時はここを変更）
│   │   ├── index.tsx            ← ホーム画面
│   │   ├── weekly.tsx           ← 週間計画画面
│   │   ├── record.tsx           ← 記録画面
│   │   ├── review.tsx           ← 振り返り画面
│   │   └── settings.tsx         ← 設定画面
│   ├── confirm-drink.tsx       ← 飲酒確認画面（「本当に飲みますか？」モーダル）
│   ├── declaration.tsx          ← 飲酒前宣言画面（モーダル遷移）
│   └── alternative.tsx          ← 代替行動画面（モーダル遷移）
│
├── components/
│   ├── screen-container.tsx     ← 全画面で使うSafeAreaラッパー（必ず使う）
│   ├── BadgeList.tsx            ← バッジ一覧（横スクロールFlatList）
│   ├── WeekdayChart.tsx         ← 曜日別飲酒量グラフ（SVG棒グラフ）
│   ├── haptic-tab.tsx           ← ハプティクス付きタブボタン
│   └── ui/
│       └── icon-symbol.tsx      ← アイコンマッピング（タブ追加前に必ずここに追加）
│
└── tests/
    ├── store.test.ts            ← ストア関数のユニットテスト
    ├── analytics.test.ts        ← 分析・バッジ関数のテスト
    ├── notifications.test.ts    ← 通知関数のテスト
    └── onboarding.test.ts       ← オンボーディングのテスト
```

---

## データ設計

### 型定義（lib/store.ts）

```typescript
type DayStatus = "kyukan" | "ok" | "undecided";

interface DailyRecord {
  date: string;                  // "YYYY-MM-DD"
  status: DayStatus;
  declaredLimit: number | null;  // 宣言した上限杯数
  drinkingReason: string | null; // 飲みたい理由
  actualDrinks: number | null;   // 実際の杯数
  satisfaction: "great" | "okay" | "regret" | "toomuch" | null;
  memo: string;
  alternativeAction: string | null;
}

interface AppStore {
  records: Record<string, DailyRecord>; // key: "YYYY-MM-DD"
  badges: string[];                      // 解除済みバッジIDの配列
}

interface AppSettings {
  weeklyGoalDays: number;         // 1〜5、デフォルト 2
  requireConsecutive: boolean;    // 2連続休肝日を目指すか
  reminderEnabled: boolean;       // 夜間リマインダー ON/OFF
  reminderTime: string;           // "HH:mm" 形式
  achievementNotification: boolean; // 達成通知 ON/OFF
}
```

### バッジシステム（lib/store.ts）

```typescript
const BADGE_DEFINITIONS = [
  { id: "first_kyukan",       emoji: "🥉", name: "初めての休肝日" },
  { id: "first_consecutive",  emoji: "🥈", name: "初めての2連続" },
  { id: "first_weekly_goal",  emoji: "🥇", name: "週間目標達成" },
  { id: "three_weeks_streak", emoji: "💎", name: "3週連続達成" },
  { id: "one_month_streak",   emoji: "🌟", name: "1ヶ月継続" },
] as const;

// 実績ベースで休肝日が確定しているか（actualDrinks === 0 として記録済み）
// バッジ判定・週間目標・月次サマリーなど全箇所で利用する
function isConfirmedKyukan(record: DailyRecord | undefined): boolean

// 新しいバッジの解除判定。戻り値は新たに獲得したバッジIDの配列
// ※ 休肝日の判定は isConfirmedKyukan（実績ベース）で行う
function checkNewBadges(records, existingBadges, weeklyGoalDays): string[]
```

### 分析関数（lib/store.ts）

```typescript
// 過去28日間の曜日別平均飲酒杯数（dayIndex: 0=月〜6=日）
function computeWeekdayAverages(records): { dayIndex: number; label: string; avg: number }[]

// 月次サマリー（前月比・達成率・コメント）
function computeMonthlySummary(records, year, month, weeklyGoalDays): {
  kyukanDays: number; prevMonthKyukanDays: number; diff: number;
  achievementRate: number; comment: string;
}
```

### AsyncStorageキー

| キー | 内容 |
| :--- | :--- |
| `kyukoubi_store_v1` | AppStore（全DailyRecord + badges） |
| `kyukoubi_settings_v1` | AppSettings（目標・通知設定） |
| `onboarding_completed` | オンボーディング完了フラグ（`"true"`） |

新しいデータを追加するときは、キー名を `kyukoubi_xxx_v1` の形式で統一してください。

### データ操作（lib/app-context.tsx）

画面からデータを操作するときは必ず `useAppStore()` フックを使います。

```typescript
const {
  store,           // AppStore
  today,           // "YYYY-MM-DD"
  getRecord,       // (date: string) => DailyRecord
  patchRecord,     // (date, patch) => Promise<void>  ※内部でバッジチェック・通知連携あり
  refreshStore,    // () => Promise<void>
  settings,        // AppSettings
  patchSettings,   // (patch: Partial<AppSettings>) => Promise<void>
  resetAllData,    // () => Promise<void>  ※全データ・設定・オンボーディングをリセット
} = useAppStore();

// 今日のレコードを取得
const record = getRecord(today);

// レコードを更新（バッジ判定・達成通知が自動で行われる）
await patchRecord(today, { status: "kyukan" });

// 設定を更新
await patchSettings({ weeklyGoalDays: 3 });
```

---

## スタイリングルール

### カラートークン

`theme.config.js` で定義されたトークンをNativeWindのクラスとして使います。
カラーの変更は必ず `theme.config.js` だけを編集してください。

| トークン | ライト | ダーク | 用途 |
| :--- | :--- | :--- | :--- |
| `primary` | `#4A90D9` | `#5BA3E8` | ボタン・アクセント |
| `background` | `#F5F5F7` | `#1C1C1E` | 画面背景 |
| `surface` | `#FFFFFF` | `#2C2C2E` | カード・タブバー |
| `foreground` | `#1C1C1E` | `#F5F5F7` | 本文テキスト |
| `muted` | `#8E8E93` | `#AEAEB2` | サブテキスト |
| `border` | `#E5E5EA` | `#38383A` | 区切り線 |
| `success` | `#4CAF50` | `#66BB6A` | 休肝日・達成 |
| `warning` | `#F0A500` | `#FBBF24` | 警告・注意 |
| `error` | `#EF4444` | `#F87171` | エラー・上限超過 |
| `orange` | `#FF6B35` | `#FF8C5A` | 飲酒OK・強調 |
| `purple` | `#667EEA` | `#7B93F5` | 代替行動 |

### 必須ルール

**Pressableにclassは使わない。** `className` を使うと `onPress` が発火しないバグがあります。
必ず `style` propを使ってください。

```typescript
// NG
<Pressable className="bg-primary p-4" onPress={handlePress}>

// OK
<Pressable style={styles.button} onPress={handlePress}>
```

**全画面は ScreenContainer でラップする。**

```typescript
import { ScreenContainer } from "@/components/screen-container";

export default function MyScreen() {
  return (
    <ScreenContainer className="p-4">
      {/* 内容 */}
    </ScreenContainer>
  );
}
```

**リストは必ずFlatListを使う。** `ScrollView` + `.map()` は使わないでください。

---

## アイコン追加のルール

新しいアイコンをタブやUIに使う前に、必ず `components/ui/icon-symbol.tsx` の `MAPPING` に追加してください。追加せずに使うとアプリがクラッシュします。

現在のマッピング:

```typescript
const MAPPING = {
  "house.fill":                          "home",
  "calendar":                            "calendar-today",
  "pencil":                              "edit",
  "chart.bar.fill":                      "bar-chart",
  "gearshape.fill":                      "settings",
  "paperplane.fill":                     "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right":                       "chevron-right",
  "chevron.left":                        "chevron-left",
  "xmark":                               "close",
  "checkmark":                           "check",
  "exclamationmark.triangle.fill":       "warning",
  "checkmark.circle.fill":               "check-circle",
  "clock.fill":                          "access-time",
  "arrow.left":                          "arrow-back",
};
```

---

## タブ追加のルール

新しいタブを追加するときは以下の順番で作業します。

1. `components/ui/icon-symbol.tsx` にアイコンマッピングを追加
2. `app/(tabs)/新画面名.tsx` を作成
3. `app/(tabs)/_layout.tsx` に `<Tabs.Screen>` を追加

---

## 飲酒確認画面の豆知識リンク管理

ホーム画面の「今日は飲む」ボタンを押すと表示される確認画面（`app/confirm-drink.tsx`）には、飲酒を思いとどまらせるための豆知識リンクがランダムで1つ表示されます。

リンクの追加・変更は `app/confirm-drink.tsx` の `TRIVIA_LINKS` 配列を直接編集してください。

```typescript
const TRIVIA_LINKS: TriviaLink[] = [
  {
    title: "表示タイトル",
    description: "簡単な説明文（1〜2行）",
    url: "https://...",
  },
  // ...
];
```

- 信頼性の高い公的機関の情報（厚労省、e-ヘルスネット等）を優先する
- `url` は `Linking.openURL` でブラウザ起動されるため、外部URLを指定する

---

## アニメーションのガイドライン

- Duration: インタラクション 80〜150ms、画面遷移 200〜300ms
- スケール変化: 0.95〜0.98の範囲（0.9以下は使わない）
- `withTiming` を優先し、`withSpring` は使わない（バウンシーになりすぎる）
- `Animated.createAnimatedComponent(Svg)` は使わない（Webでクラッシュする）。代わりに `Animated.View` で `Svg` をラップする

---

## ハプティクスのガイドライン

```typescript
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Platform分岐を必ず入れる（Webではクラッシュする）
if (Platform.OS !== "web") {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);   // ボタンタップ
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // トグル切替
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 達成
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);   // エラー
}
```

---

## テストの書き方

テストファイルは `tests/` ディレクトリに配置します。
実行コマンド: `pnpm test`

```typescript
import { describe, it, expect } from "vitest";
import { 関数名 } from "@/lib/store";

describe("関数名", () => {
  it("期待する動作の説明", () => {
    expect(関数名(引数)).toBe(期待値);
  });
});
```

AsyncStorageを使う関数のテストは `vi.mock` でモックしてください。

---

## 開発コマンド

```bash
pnpm install          # 依存パッケージのインストール
pnpm dev              # サーバー＋Metro同時起動
pnpm dev:metro        # Webプレビューのみ起動（http://localhost:8081）
pnpm ios              # iOSシミュレーター起動
pnpm android          # Androidエミュレーター起動
pnpm test             # ユニットテスト実行
pnpm check            # TypeScript型チェック
pnpm lint             # ESLintチェック
pnpm format           # Prettierでコードフォーマット
```

---

## 作業開始前のチェックリスト

作業を始める前に必ず以下を確認してください。

1. 変更するファイルを特定し、関連する型定義（`lib/store.ts`）を確認する
2. 新しいアイコンを使う場合は `components/ui/icon-symbol.tsx` に先に追加する
3. 実装後は `pnpm check` と `pnpm test` を実行してエラーがないことを確認する
