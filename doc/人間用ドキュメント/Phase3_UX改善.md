# Phase 3 — UX改善（オンボーディング・アニメーション）

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| オンボーディング | 初回起動時の3ステップ目標設定フロー |
| ホーム画面アニメーション | 今日のステータスカードの状態変化アニメーション |
| 達成フィードバック | 2連続休肝日達成時のハプティクス＋アニメーション |
| スワイプ操作 | 週間計画画面でスワイプして状態変更 |

---

## プロンプト（ここからClaude Codeに渡す）

```
「休肝日つくーる」アプリにオンボーディング画面とUX改善を実装してください。

## プロジェクト情報

- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4, Expo Router v6
- データ管理: React Context + AsyncStorage（バックエンドなし）
- react-native-reanimated 4.x はすでに package.json に含まれています
- react-native-gesture-handler はすでに package.json に含まれています
- expo-haptics はすでに package.json に含まれています

## 前Phaseの完了サマリー

（ここにPhase 2の完了サマリーを貼り付ける）

## 実装する機能

### 機能1: オンボーディング画面

表示条件: AsyncStorage に `"onboarding_completed"` キーがない場合のみ

3ステップ構成:
- **Step 1: アプリ紹介**
  - 絵文字: 🍵
  - タイトル: 「休肝日を、無理なく続けよう」
  - 説明: 「週2日の連続休肝日を目標に、飲酒習慣を少しずつ改善しましょう」
- **Step 2: 目標設定**
  - タイトル: 「今週の目標を決めましょう」
  - 週の目標休肝日数を選択（1〜5日、デフォルト2日）
  - 2連続休肝日を目指すかのトグル
- **Step 3: 通知設定**
  - タイトル: 「リマインダーを設定しましょう」
  - 夜間リマインダーのON/OFF
  - 通知時刻の選択（デフォルト20:00）
  - 「通知を許可する」ボタン（expo-notificationsの権限リクエスト）

ナビゲーション:
- `app/onboarding.tsx` として実装する
- `app/_layout.tsx` で `onboarding_completed` をチェックし、未完了なら `/onboarding` へリダイレクト
- 完了後は `/(tabs)` へリダイレクト
- 「スキップ」リンクで完了扱いにして `/(tabs)` へ遷移

### 機能2: ホーム画面アニメーション（app/(tabs)/index.tsx）

- 今日のステータスが変わったとき（未定→休肝日 など）にカードが軽くスケールアップ（0.97→1.0、duration 150ms）
- 休肝日を選択したときに軽いハプティクス（`ImpactFeedbackStyle.Light`）
- 2連続休肝日達成時に大きなハプティクス（`NotificationFeedbackType.Success`）＋カードが緑に変化するアニメーション（duration 300ms）

### 機能3: 週間計画画面のスワイプ操作（app/(tabs)/weekly.tsx）

- 各曜日セルを**左スワイプ** → 「飲酒OK」に変更
- 各曜日セルを**右スワイプ** → 「休肝日」に変更
- スワイプ中に背景色がプレビュー表示される

## 実装方針・制約

### アニメーションのガイドライン

- Duration: インタラクション 80〜150ms、遷移 200〜300ms
- スケール変化: 0.95〜0.98の範囲（0.9以下は使わない）
- `withTiming` を優先し、`withSpring` は使わない（バウンシーになりすぎる）
- `Animated.createAnimatedComponent(Svg)` は使わない（Webでクラッシュする）。代わりに `Animated.View` で `Svg` をラップする

### ジェスチャーハンドラーの注意点

- `GestureHandlerRootView` が `app/_layout.tsx` でラップされているか確認してから実装する
- ジェスチャーコールバック内でJSの関数を呼ぶときは `runOnJS()` でラップする
- スワイプと縦スクロールの競合は `simultaneousWithExternalGesture` で解決する

### ハプティクスの使い方

```typescript
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Platform分岐を必ず入れる（Webではクラッシュする）
if (Platform.OS !== "web") {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
```

### オンボーディングのリダイレクト

リダイレクトロジックは無限ループしないよう注意する。`useEffect` の依存配列を適切に設定し、`router.replace()` を使う。

## 完了条件

実装後、以下を全て満たしていることを確認してください:

- `pnpm check` でTypeScriptエラーがないこと
- `pnpm test` でテストが全てパスすること
- 初回起動時にオンボーディングが表示されること
- 2回目以降の起動ではオンボーディングがスキップされること
- ホーム画面でステータス変更時にアニメーションが動作すること
- 週間計画画面でスワイプ操作が動作すること

## テスト

`tests/onboarding.test.ts` を新規作成し、以下をテストしてください:

- オンボーディング完了後に `"onboarding_completed"` が AsyncStorage に保存されること
- スキップ時も `"onboarding_completed"` が保存されること

## 完了後にサマリーを出力してください

実装完了後、以下の形式でサマリーを出力してください（次のPhaseに引き継ぐために使います）:

---
## Phase 3 完了サマリー

### 変更したファイル
（変更したファイルのパスと変更内容を箇条書きで）

### 追加したAsyncStorageキー
（追加したキーと用途を箇条書きで）

### 追加した型定義
（AppSettingsやAppStoreに追加したフィールドを記載）

### 既知の問題・TODO
（あれば記入）
---
```
