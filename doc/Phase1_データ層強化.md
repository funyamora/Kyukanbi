# Phase 1 — データ層強化・設定画面

> **進め方:** まず「設計プロンプト」をClaude Codeに渡して設計書を出力させ、内容をレビュー・承認してから「実装プロンプト」を渡してください。

---

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| 設定画面 | 週の目標休肝日数・通知設定・データリセットを管理 |
| AppSettings型 | 設定データの型定義とAsyncStorage永続化 |
| タブ追加 | 設定タブ（5タブ目）の追加 |

---

## ステップ 1：設計プロンプト

> Claude Codeへの指示：**コードは一切書かず、設計書（Markdown）のみ出力してください。**

---

```
あなたはExpo + React Nativeの設計者です。
以下のプロジェクトに「設定画面」を追加するための設計書をMarkdownで作成してください。
コードは書かないでください。設計書のみ出力してください。

## プロジェクト: 休肝日つくーる

### 技術スタック
- Expo SDK 54, React Native 0.81, TypeScript
- NativeWind v4 (Tailwind CSS)
- Expo Router v6（ファイルベースルーティング）
- 状態管理: React Context + AsyncStorage

### 現在のファイル構成（関連部分）

**lib/store.ts**
```typescript
export type DayStatus = "kyukan" | "ok" | "undecided";

export interface DailyRecord {
  date: string;           // "YYYY-MM-DD"
  status: DayStatus;
  declaredLimit: number | null;
  drinkingReason: string | null;
  actualDrinks: number | null;
  satisfaction: "great" | "okay" | "regret" | "toomuch" | null;
  memo: string;
  alternativeAction: string | null;
}

export interface AppStore {
  records: Record<string, DailyRecord>;
}
```

**lib/app-context.tsx**
```typescript
interface AppContextValue {
  store: AppStore;
  today: string;
  getRecord: (date: string) => DailyRecord;
  patchRecord: (date: string, patch: Partial<DailyRecord>) => Promise<void>;
  refreshStore: () => Promise<void>;
}
```

**app/(tabs)/_layout.tsx**
現在4タブ: ホーム / 週間計画 / 記録 / 振り返り

**components/ui/icon-symbol.tsx**
"gearshape.fill" → "settings" のマッピングが既にあります。

### 追加してほしい機能の要件

**設定画面（app/(tabs)/settings.tsx）に含める設定項目:**

1. 目標設定セクション
   - 週の目標休肝日数（1〜5日、デフォルト2）
   - 2連続休肝日を目指すかのトグル（デフォルトON）

2. 通知設定セクション（Phase 2で実装予定、UIのみ今回作成）
   - 夜間リマインダーのON/OFF（デフォルトON）
   - リマインダー時刻（デフォルト20:00）
   - 達成通知のON/OFF（デフォルトON）

3. データ管理セクション
   - 全データリセット（確認ダイアログ付き）

### 設計書に含めてほしい内容

1. **変更・追加するファイル一覧**（パスと変更理由）
2. **AppSettings型の定義**（TypeScript）
3. **AsyncStorageのキー設計**（既存の "kyukoubi_store_v1" との共存方法）
4. **Context拡張の設計**（app-context.tsxに何を追加するか）
5. **設定画面のコンポーネント構成**（どのコンポーネントをどう配置するか）
6. **タブ追加時の注意点**（アイコン・順序）
7. **考慮すべきエッジケース**（初回起動時のデフォルト値など）
```

---

## ステップ 2：設計レビューチェックリスト

Claude Codeが出力した設計書を確認する際のポイントです。

- [ ] `AppSettings` 型に必要な全フィールドが含まれているか
- [ ] AsyncStorageのキーが既存の `kyukoubi_store_v1` と衝突していないか
- [ ] `app-context.tsx` の拡張が既存の `patchRecord` などと整合しているか
- [ ] 設定画面のUI構成がiOSのSettings.appに近い自然なデザインか
- [ ] データリセット時に `records` も `settings` も両方クリアされる設計か

---

## ステップ 3：実装プロンプト

> 設計書のレビューが完了したら、以下のプロンプトに**承認した設計書の内容をそのまま貼り付けて**Claude Codeに渡してください。

---

```
以下の設計書に従って、「休肝日つくーる」アプリに設定画面を実装してください。

## プロジェクト情報
- パス: （プロジェクトのルートパスを記入）
- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4, Expo Router v6

## 実装時の制約・注意事項

### NativeWindの使い方
- Pressable には className を使わず、必ず style prop を使うこと
  （className を使うと onPress が発火しないバグがある）
- カラートークンは以下を使用:
  - bg-background (#F5F5F7 / #1C1C1E)
  - bg-surface (#FFFFFF / #2C2C2E)
  - text-foreground (#1C1C1E / #F5F5F7)
  - text-muted (#8E8E93 / #AEAEB2)
  - bg-primary (#4A90D9 / #5BA3E8)
  - text-error (#EF4444 / #F87171)

### ScreenContainer
全画面は必ず ScreenContainer でラップすること:
```typescript
import { ScreenContainer } from "@/components/screen-container";
export default function SettingsScreen() {
  return (
    <ScreenContainer className="...">
      {/* 内容 */}
    </ScreenContainer>
  );
}
```

### テスト
実装後、以下を tests/settings.test.ts として追加すること:
- AppSettings のデフォルト値が正しく設定されること
- 設定の保存・読み込みが正しく動作すること

## 承認済み設計書

（ここに Claude Code が出力した設計書を貼り付ける）

## 完了条件
- [ ] pnpm check（TypeScriptエラーなし）
- [ ] pnpm test（テスト全パス）
- [ ] 設定画面がタブバーから遷移できる
- [ ] 設定値がアプリ再起動後も保持される
```

---

## ステップ 4：Phase完了後の引き継ぎサマリー

実装完了後、以下のテンプレートに記入して次Phaseの冒頭に添付してください。

```markdown
## Phase 1 完了サマリー

### 変更したファイル
- lib/store.ts: AppSettings型を追加、loadSettings/saveSettings関数を追加
- lib/app-context.tsx: settings, updateSettings をContextに追加
- app/(tabs)/settings.tsx: 新規作成（設定画面）
- app/(tabs)/_layout.tsx: 設定タブを追加

### 追加した型定義
```typescript
export interface AppSettings {
  weeklyGoal: number;          // 週の目標休肝日数（デフォルト2）
  consecutiveGoal: boolean;    // 2連続休肝日を目指すか（デフォルトtrue）
  reminderEnabled: boolean;    // 夜間リマインダー（デフォルトtrue）
  reminderTime: string;        // リマインダー時刻 "HH:MM"（デフォルト"20:00"）
  achievementNotification: boolean; // 達成通知（デフォルトtrue）
}
```

### AsyncStorageキー
- "kyukoubi_store_v1": DailyRecordの記録（既存）
- "kyukoubi_settings_v1": AppSettings（新規追加）

### 既知の問題・TODO
- （あれば記入）
```
