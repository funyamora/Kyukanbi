# Phase 3 — UX改善（オンボーディング・アニメーション）

> **前提:** Phase 1・2が完了していること。
> Phase 2の「完了サマリー」を手元に用意してから進めてください。

---

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| オンボーディング | 初回起動時の3ステップ目標設定フロー |
| ホーム画面アニメーション | 今日のステータスカードの状態変化アニメーション |
| 達成フィードバック | 2連続休肝日達成時のハプティクス＋アニメーション |
| スワイプ操作 | 週間計画画面でスワイプして状態変更 |

---

## ステップ 1：設計プロンプト

> Claude Codeへの指示：**コードは一切書かず、設計書（Markdown）のみ出力してください。**

---

```
あなたはExpo + React Nativeの設計者です。
以下のプロジェクトにオンボーディング画面とUX改善を追加するための設計書をMarkdownで作成してください。
コードは書かないでください。設計書のみ出力してください。

## プロジェクト: 休肝日つくーる

### 技術スタック
- Expo SDK 54, React Native 0.81, TypeScript
- NativeWind v4 (Tailwind CSS)
- Expo Router v6
- react-native-reanimated 4.x（package.jsonに含まれています）
- react-native-gesture-handler（package.jsonに含まれています）
- expo-haptics（package.jsonに含まれています）

### Phase 1・2完了後の状態
（ここにPhase 2の完了サマリーを貼り付ける）

### 追加してほしい機能の仕様

**機能1: オンボーディング画面**

表示条件: AsyncStorageに "onboarding_completed" キーがない場合のみ

3ステップ構成:
- Step 1: アプリ紹介
  - 絵文字イラスト: 🍵
  - タイトル: 「休肝日を、無理なく続けよう」
  - 説明: 「週2日の連続休肝日を目標に、飲酒習慣を少しずつ改善しましょう」
- Step 2: 目標設定
  - タイトル: 「今週の目標を決めましょう」
  - 週の目標休肝日数を選択（1〜5日、デフォルト2日）
  - 2連続休肝日を目指すかのトグル
- Step 3: 通知設定
  - タイトル: 「リマインダーを設定しましょう」
  - 夜間リマインダーのON/OFF
  - 通知時刻の選択（デフォルト20:00）
  - 「通知を許可する」ボタン（expo-notificationsの権限リクエスト）

ナビゲーション:
- app/onboarding.tsx として実装
- app/_layout.tsx でonboarding_completedをチェックし未完了なら/onboardingへリダイレクト
- 完了後は/(tabs)へリダイレクト
- 「スキップ」リンクで完了扱いにして/(tabs)へ

**機能2: ホーム画面アニメーション**
- 今日のステータスが変わったとき（未定→休肝日 など）にカードが軽くスケールアップ
- 休肝日を選択したときに軽いハプティクス（ImpactFeedbackStyle.Light）
- 2連続休肝日達成時に大きなハプティクス（NotificationFeedbackType.Success）＋カードが緑に変化するアニメーション

**機能3: 週間計画画面のスワイプ操作**
- 各曜日セルを左スワイプ → 「飲酒OK」に変更
- 各曜日セルを右スワイプ → 「休肝日」に変更
- スワイプ中に背景色がプレビュー表示される

### 設計書に含めてほしい内容

1. **変更・追加するファイル一覧**（パスと変更理由）
2. **オンボーディングのナビゲーション設計**
   - app/_layout.tsx でのリダイレクトロジック
   - オンボーディング完了後のAppSettings保存タイミング
3. **アニメーション設計**
   - react-native-reanimated を使ったアニメーションの設計方針
   - withTiming vs withSpring の使い分け
   - アニメーション時間・スケール値の推奨値
4. **スワイプ操作の設計**
   - react-native-gesture-handler の Gesture API を使った実装方針
   - スワイプ閾値（何px以上でトリガーするか）
5. **パフォーマンス上の注意点**
   - アニメーションをUI スレッドで実行するための worklet 設計
6. **考慮すべきエッジケース**
   - オンボーディング中に通知権限が拒否された場合
   - スワイプと縦スクロールの競合
```

---

## ステップ 2：設計レビューチェックリスト

- [ ] オンボーディングのリダイレクトロジックが無限ループしない設計か
- [ ] オンボーディングで設定した値がAppSettingsに正しく保存される設計か
- [ ] アニメーションのdurationが80〜300msの範囲内か（過剰なアニメーションでないか）
- [ ] スワイプとScrollViewの競合が解決されているか
- [ ] workletの設計が正しく、JS スレッドのブロッキングがないか
- [ ] 通知権限拒否時にオンボーディングが完了できる設計か

---

## ステップ 3：実装プロンプト

---

```
以下の設計書に従って、「休肝日つくーる」アプリにオンボーディング画面とUX改善を実装してください。

## プロジェクト情報
- パス: （プロジェクトのルートパスを記入）
- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4, Expo Router v6

## Phase 1・2完了後の状態
（ここにPhase 2の完了サマリーを貼り付ける）

## 実装時の制約・注意事項

### アニメーションのガイドライン
- Duration: インタラクション80〜150ms、遷移200〜300ms
- スケール変化: 0.95〜0.98の範囲（0.9以下は使わない）
- withTimingを優先し、withSpringは使わない（バウンシーになりすぎる）
- Animated.createAnimatedComponent(Svg) は使わない（Webでクラッシュする）
  代わりに Animated.View で Svg をラップする

### ジェスチャーハンドラーの注意点
- GestureHandlerRootView は app/_layout.tsx ですでにラップされていることを確認
- ジェスチャーコールバック内でJSの関数を呼ぶときは runOnJS() でラップする
- スワイプと縦スクロールの競合は simultaneousWithExternalGesture で解決

### ハプティクスの使い方
- 休肝日選択: Haptics.impactAsync(ImpactFeedbackStyle.Light)
- 達成通知: Haptics.notificationAsync(NotificationFeedbackType.Success)
- Platform.OS !== 'web' で分岐すること

### テスト
実装後、以下を tests/onboarding.test.ts として追加すること:
- オンボーディング完了後に "onboarding_completed" が保存されること
- スキップ時も "onboarding_completed" が保存されること

## 承認済み設計書

（ここに Claude Code が出力した設計書を貼り付ける）

## 完了条件
- [ ] pnpm check（TypeScriptエラーなし）
- [ ] pnpm test（テスト全パス）
- [ ] 初回起動時にオンボーディングが表示される
- [ ] 2回目以降の起動ではオンボーディングがスキップされる
- [ ] ホーム画面でステータス変更時にアニメーションが動作する
```

---

## ステップ 4：Phase完了後の引き継ぎサマリー

```markdown
## Phase 3 完了サマリー

### 変更したファイル
- app/onboarding.tsx: 新規作成（3ステップオンボーディング）
- app/_layout.tsx: オンボーディングリダイレクトロジックを追加
- app/(tabs)/index.tsx: ステータス変化アニメーション・ハプティクスを追加
- app/(tabs)/weekly.tsx: スワイプ操作を追加

### AsyncStorageキー追加
- "onboarding_completed": オンボーディング完了フラグ（"true"）

### 既知の問題・TODO
- （あれば記入）
```
