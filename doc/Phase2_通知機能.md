# Phase 2 — プッシュ通知機能

> **前提:** Phase 1が完了し、`AppSettings`型と設定画面が実装済みであること。
> Phase 1の「完了サマリー」を手元に用意してから進めてください。

---

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| 夜間リマインダー | 毎晩設定した時刻に今日の記録を促す通知 |
| 達成通知 | 2連続休肝日を達成したときの祝福通知 |
| 通知タップ遷移 | 通知をタップすると対応画面に遷移 |
| 権限リクエスト | 初回起動時に通知権限をリクエスト |

---

## ステップ 1：設計プロンプト

> Claude Codeへの指示：**コードは一切書かず、設計書（Markdown）のみ出力してください。**

---

```
あなたはExpo + React Nativeの設計者です。
以下のプロジェクトにローカル通知機能を追加するための設計書をMarkdownで作成してください。
コードは書かないでください。設計書のみ出力してください。

## プロジェクト: 休肝日つくーる

### 技術スタック
- Expo SDK 54, React Native 0.81, TypeScript
- expo-notifications（package.jsonに含まれています）
- Expo Router v6
- 状態管理: React Context + AsyncStorage

### Phase 1完了後の状態
（ここにPhase 1の完了サマリーを貼り付ける）

### 通知の仕様

**通知1: 夜間リマインダー**
- トリガー: 毎日、AppSettings.reminderTime に設定した時刻（デフォルト20:00）
- 条件: AppSettings.reminderEnabled === true のとき
- タイトルと本文は今日のDailyRecord.statusによって変える:
  - status === "kyukan": タイトル「今日は休肝日です🍵」/ 本文「よく眠れますよ。記録をつけておきましょう」
  - status === "ok": タイトル「今日の飲酒量を記録しましょう🍺」/ 本文「宣言した上限は守れましたか？」
  - status === "undecided": タイトル「今日はどうしますか？」/ 本文「まだ決めていません。今日の予定を入力しましょう」
- タップ時の遷移先: /(tabs)/record（記録画面）

**通知2: 達成通知**
- トリガー: patchRecord呼び出し後、今週の2連続休肝日達成を検知したとき
- 条件: AppSettings.achievementNotification === true のとき
- タイトル: 「🎉 2連続休肝日達成！」
- 本文: 「今週の目標を達成しました。この調子で続けましょう！」
- タップ時の遷移先: /(tabs)/review（振り返り画面）

### 設計書に含めてほしい内容

1. **変更・追加するファイル一覧**（パスと変更理由）
2. **lib/notifications.ts の関数設計**
   - 権限リクエスト関数
   - リマインダー通知のスケジューリング関数（既存スケジュールのキャンセル→再登録）
   - 達成通知の即時送信関数
   - 通知IDの管理方法
3. **app/_layout.tsx への組み込み設計**
   - 権限リクエストのタイミング（初回起動時のみ）
   - 通知受信ハンドラーの設定
   - 通知タップ時のディープリンク処理
4. **lib/app-context.tsx への組み込み設計**
   - patchRecord内での達成判定と通知トリガーのタイミング
5. **設定変更時の通知再スケジューリング設計**
   - settings.tsxで設定を変更したときにリマインダーを再スケジューリングする方法
6. **Webプラットフォーム対応**
   - Platform.OS !== 'web' の分岐をどこに入れるか
7. **Androidのチャンネル設定**
   - NotificationChannelの設定内容
8. **考慮すべきエッジケース**
   - 通知権限が拒否された場合のUI
   - アプリがフォアグラウンドのときに通知を受信した場合
```

---

## ステップ 2：設計レビューチェックリスト

- [ ] 通知IDの管理方法が明確か（重複スケジューリングを防げるか）
- [ ] 設定変更時に古い通知が確実にキャンセルされる設計か
- [ ] 権限拒否時にアプリがクラッシュしない設計か
- [ ] Webプラットフォームでの分岐が適切か
- [ ] Androidチャンネルの設定が含まれているか
- [ ] 通知タップ時のディープリンク処理が Expo Router と整合しているか

---

## ステップ 3：実装プロンプト

---

```
以下の設計書に従って、「休肝日つくーる」アプリに通知機能を実装してください。

## プロジェクト情報
- パス: （プロジェクトのルートパスを記入）
- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4, Expo Router v6

## Phase 1完了後の状態
（ここにPhase 1の完了サマリーを貼り付ける）

## 実装時の制約・注意事項

### expo-notificationsの使い方
- Android では必ず setNotificationChannelAsync でチャンネルを作成すること
- 通知のスケジューリングは scheduleNotificationAsync を使用
- 既存の通知をキャンセルしてから再スケジューリングすること（cancelScheduledNotificationAsync）
- 通知IDはAsyncStorageに保存して管理すること

### Webプラットフォーム対応
- 通知関連の処理は全て Platform.OS !== 'web' で分岐すること
- Webでは通知機能をサイレントにスキップ（エラーを出さない）

### 権限リクエスト
- app/_layout.tsx の useEffect で初回起動時のみリクエスト
- AsyncStorage に "notification_permission_requested" フラグを保存して重複リクエストを防ぐ
- 権限が拒否された場合は設定画面に「通知が無効です」と表示

### テスト
実装後、以下を tests/notifications.test.ts として追加すること:
- 達成判定ロジックのユニットテスト（通知送信はモック）
- 設定変更時に再スケジューリング関数が呼ばれることの確認

## 承認済み設計書

（ここに Claude Code が出力した設計書を貼り付ける）

## 完了条件
- [ ] pnpm check（TypeScriptエラーなし）
- [ ] pnpm test（テスト全パス）
- [ ] iOSシミュレーターで通知権限ダイアログが表示される
- [ ] 設定画面で通知ON/OFFを切り替えると通知スケジュールが更新される
```

---

## ステップ 4：Phase完了後の引き継ぎサマリー

```markdown
## Phase 2 完了サマリー

### 変更したファイル
- lib/notifications.ts: 新規作成（通知スケジューリング・権限管理）
- app/_layout.tsx: 権限リクエスト・通知ハンドラーを追加
- lib/app-context.tsx: patchRecord内に達成判定・通知トリガーを追加
- app/(tabs)/settings.tsx: 通知設定変更時の再スケジューリングを追加

### 通知ID管理
- AsyncStorageキー "kyukoubi_notification_ids_v1" に保存
- リマインダー通知ID: "reminder_daily"
- 達成通知は即時送信のためIDなし

### 既知の問題・TODO
- （あれば記入）
```
