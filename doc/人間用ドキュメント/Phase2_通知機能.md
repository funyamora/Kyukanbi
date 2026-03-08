# Phase 2 — プッシュ通知機能

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| 夜間リマインダー | 毎晩設定した時刻に今日の記録を促す通知 |
| 達成通知 | 2連続休肝日を達成したときの祝福通知 |
| 通知タップ遷移 | 通知をタップすると対応画面に遷移 |
| 権限リクエスト | 初回起動時に通知権限をリクエスト |

---

## プロンプト（ここからClaude Codeに渡す）

```
「休肝日つくーる」アプリにローカル通知機能を実装してください。

## プロジェクト情報

- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4, Expo Router v6
- データ管理: React Context + AsyncStorage（バックエンドなし）
- expo-notifications はすでに package.json に含まれています

## 実装する機能

### 通知1: 夜間リマインダー

- トリガー: 毎日、AppSettings.reminderTime に設定した時刻（デフォルト20:00）
- 条件: AppSettings.reminderEnabled === true のとき
- タイトルと本文は今日の DailyRecord.status によって変える:
  - status === "kyukan": タイトル「今日は休肝日です🍵」/ 本文「よく眠れますよ。記録をつけておきましょう」
  - status === "ok": タイトル「今日の飲酒量を記録しましょう🍺」/ 本文「宣言した上限は守れましたか？」
  - status === "undecided": タイトル「今日はどうしますか？」/ 本文「まだ決めていません。今日の予定を入力しましょう」
- タップ時の遷移先: /(tabs)/record（記録画面）

### 通知2: 達成通知

- トリガー: patchRecord 呼び出し後、今週の2連続休肝日達成を検知したとき
- 条件: AppSettings.achievementNotification === true のとき
- タイトル: 「🎉 2連続休肝日達成！」
- 本文: 「今週の目標を達成しました。この調子で続けましょう！」
- タップ時の遷移先: /(tabs)/review（振り返り画面）

## 実装方針・制約

### ファイル構成

以下のファイルを新規作成・変更してください:

- `lib/notifications.ts`（新規）: 通知スケジューリング・権限管理の関数をまとめる
- `app/_layout.tsx`（変更）: 権限リクエスト・通知受信ハンドラーを追加
- `lib/app-context.tsx`（変更）: patchRecord 内に達成判定と通知トリガーを追加
- `app/(tabs)/settings.tsx`（変更）: 設定変更時に通知を再スケジューリング

### expo-notifications の使い方

- Android では必ず `setNotificationChannelAsync` でチャンネルを作成すること（チャンネルID: "kyukoubi_reminder"）
- 通知のスケジューリングは `scheduleNotificationAsync` を使用
- 既存の通知をキャンセルしてから再スケジューリングすること（`cancelScheduledNotificationAsync`）
- 通知IDは AsyncStorage のキー `"kyukoubi_notification_ids_v1"` に保存して管理する
- リマインダー通知のIDは固定値 `"reminder_daily"` を使う

### 権限リクエスト

- `app/_layout.tsx` の useEffect で初回起動時のみリクエストする
- AsyncStorage に `"notification_permission_requested"` フラグを保存して重複リクエストを防ぐ
- 権限が拒否された場合は設定画面に「通知が無効です。設定アプリから許可してください」と表示する

### Webプラットフォーム対応

- 通知関連の処理は全て `Platform.OS !== 'web'` で分岐すること
- Web ではサイレントにスキップする（エラーを出さない）

### 通知タップ時の遷移

- `addNotificationResponseReceivedListener` で通知タップを検知する
- 通知の `data` フィールドに遷移先パスを入れる（例: `{ screen: "/(tabs)/record" }`）
- `router.push()` で遷移する

## 完了条件

実装後、以下を全て満たしていることを確認してください:

- `pnpm check` でTypeScriptエラーがないこと
- `pnpm test` でテストが全てパスすること
- iOSシミュレーターで通知権限ダイアログが表示されること
- 設定画面で通知ON/OFFを切り替えると通知スケジュールが更新されること
- 2連続休肝日を達成したときに達成通知が送信されること

## テスト

`tests/notifications.test.ts` を新規作成し、以下をテストしてください:

- 達成判定ロジックのユニットテスト（通知送信はモック）
- 設定変更時に再スケジューリング関数が呼ばれること

## 完了後にサマリーを出力してください

実装完了後、以下の形式でサマリーを出力してください（次のPhaseに引き継ぐために使います）:

---
## Phase 2 完了サマリー

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
