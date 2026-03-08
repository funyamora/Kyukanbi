# Phase 5 — App Storeリリース準備

> **前提:** Phase 1〜4が完了し、アプリの主要機能が動作していること。
> Phase 4の「完了サマリー」を手元に用意してから進めてください。

---

## このPhaseで実現すること

| 機能 | 概要 |
| :--- | :--- |
| アクセシビリティ対応 | VoiceOver・Dynamic Type・最小タップ領域の確保 |
| プライバシーポリシー画面 | App Store申請に必要なプライバシーポリシーの表示 |
| App Store メタデータ整備 | app.config.ts・スクリーンショット・説明文の準備 |
| 最終品質チェック | TypeScript・テスト・パフォーマンスの最終確認 |

---

## ステップ 1：設計プロンプト

> Claude Codeへの指示：**コードは一切書かず、設計書（Markdown）のみ出力してください。**

---

```
あなたはExpo + React Nativeの設計者です。
以下のプロジェクトをApp Storeにリリースするための準備作業の設計書をMarkdownで作成してください。
コードは書かないでください。設計書のみ出力してください。

## プロジェクト: 休肝日つくーる

### 技術スタック
- Expo SDK 54, React Native 0.81, TypeScript
- NativeWind v4 (Tailwind CSS)
- Expo Router v6

### Phase 1〜4完了後の状態
（ここにPhase 4の完了サマリーを貼り付ける）

### 対応してほしい項目

**項目1: アクセシビリティ対応**

iOS VoiceOver対応:
- 全てのインタラクティブ要素（ボタン・タップ可能なセル）に accessibilityLabel を追加
- 装飾的な絵文字・アイコンには accessibilityElementsHidden={true}
- 状態を持つ要素（トグル・選択状態）には accessibilityState を設定

Dynamic Type対応:
- Text コンポーネントに allowFontScaling={false} を設定している箇所を確認し、
  重要なテキストは allowFontScaling={true} に変更（ただしレイアウト崩れに注意）

最小タップ領域:
- 全てのタップ可能要素が最低44×44ptを確保しているか確認・修正

**項目2: プライバシーポリシー画面**

- app/privacy.tsx として実装
- 設定画面（app/(tabs)/settings.tsx）からリンク
- 内容: このアプリが収集するデータ（ローカルのみ）・第三者への提供なし・データ削除方法

**項目3: app.config.ts の整備**

確認・更新が必要な項目:
- name: "休肝日つくーる"
- version: "1.0.0"
- ios.bundleIdentifier: 適切な逆ドメイン形式
- android.package: 同上
- ios.infoPlist: NSUserNotificationsUsageDescription の追加
- privacy manifests（iOS 17+対応）

**項目4: 最終品質チェックリスト**

以下の観点でコード全体をレビューして問題点を洗い出してください:
- 全ての onPress ハンドラーが実装されているか（空の関数がないか）
- console.log が残っていないか
- TODO コメントが残っていないか
- ハードコードされた文字列（日本語テキスト）が定数化されているか
- メモリリークの可能性（useEffect のクリーンアップ漏れ）

### 設計書に含めてほしい内容

1. **変更・追加するファイル一覧**（パスと変更理由）
2. **アクセシビリティ対応の優先順位**（全画面のうち対応が必要な箇所の一覧）
3. **プライバシーポリシーの文面案**（日本語）
4. **app.config.ts の最終形**（全フィールドの推奨値）
5. **App Store申請に必要なスクリーンショットサイズ一覧**（iOS・Android）
6. **App Store説明文の案**（日本語、400字程度）
7. **最終品質チェックで発見された問題点と修正方針**
```

---

## ステップ 2：設計レビューチェックリスト

- [ ] アクセシビリティ対応の優先順位が現実的か（全対応は過剰でないか）
- [ ] プライバシーポリシーの文面がApp Storeのガイドラインを満たしているか
- [ ] app.config.tsのbundleIdentifierが正しい形式か
- [ ] iOS 17+のPrivacy Manifestsへの対応が含まれているか
- [ ] App Store説明文が400字以内で魅力的に書かれているか
- [ ] 品質チェックで発見された問題が全て修正方針を持っているか

---

## ステップ 3：実装プロンプト

---

```
以下の設計書に従って、「休肝日つくーる」アプリのApp Storeリリース準備を実施してください。

## プロジェクト情報
- パス: （プロジェクトのルートパスを記入）
- 技術スタック: Expo SDK 54, React Native 0.81, TypeScript, NativeWind v4

## Phase 1〜4完了後の状態
（ここにPhase 4の完了サマリーを貼り付ける）

## 実装時の制約・注意事項

### アクセシビリティ実装のガイドライン
- accessibilityLabel は「動詞 + 名詞」の形式で記述（例: 「休肝日に設定する」）
- accessibilityHint は操作の結果を説明（例: 「今日のステータスが休肝日に変わります」）
- accessibilityRole は適切なものを選択（button, togglebutton, text など）

### Dynamic Typeの扱い
- 数値・グラフのラベルは allowFontScaling={false}（レイアウト崩れ防止）
- 本文・説明テキストは allowFontScaling={true}（アクセシビリティ優先）

### テスト
実装後、以下を確認すること:
- pnpm check（TypeScriptエラーなし）
- pnpm test（テスト全パス）
- iOSシミュレーターでVoiceOverを有効にして主要フローを確認
- Expo Go でiOS実機テスト（通知・ハプティクスの動作確認）

## 承認済み設計書

（ここに Claude Code が出力した設計書を貼り付ける）

## 完了条件
- [ ] pnpm check（TypeScriptエラーなし）
- [ ] pnpm test（テスト全パス）
- [ ] 設定画面からプライバシーポリシーに遷移できる
- [ ] app.config.tsが申請用に整備されている
- [ ] console.log・TODOコメントが全て除去されている
```

---

## ステップ 4：リリース前最終チェックリスト

全Phaseの実装が完了したら、以下を確認してからEAS Buildでビルドしてください。

```markdown
## リリース前最終チェックリスト

### 機能確認
- [ ] ホーム画面: 今日のステータス変更が正しく動作する
- [ ] 週間計画: 全曜日のステータス変更が正しく動作する
- [ ] 飲酒前宣言: 宣言内容がホーム画面に反映される
- [ ] 代替行動: タイマーが正しく動作する
- [ ] 記録: 実績入力がデータに保存される
- [ ] 振り返り: 週次・月次データが正しく集計される
- [ ] 設定: 設定変更がアプリ再起動後も保持される
- [ ] 通知: リマインダーが設定時刻に届く
- [ ] オンボーディング: 初回のみ表示される

### 品質確認
- [ ] pnpm check（TypeScriptエラーなし）
- [ ] pnpm test（テスト全パス）
- [ ] console.logが残っていない
- [ ] TODOコメントが残っていない
- [ ] 空のonPressハンドラーがない

### App Store申請準備
- [ ] app.config.tsのversion・bundleIdentifier確認
- [ ] スクリーンショット作成（iPhone 6.9インチ・6.5インチ）
- [ ] App Store説明文・キーワードの準備
- [ ] プライバシーポリシーURLの準備
- [ ] EAS Build設定（eas.json）の確認
```
