# VS Code Test File Generator Extension

## プロジェクト概要
TypeScript/TSXファイルから自動でテストファイルを生成するVS Code拡張機能を開発する。

## 機能要件

### 基本機能
1. **右クリックメニューの追加**
   - Explorer内でTypeScript（.ts）またはTSXファイル（.tsx）を右クリック
   - コンテキストメニューに「Generate Test File」オプションを追加

2. **テストファイル自動生成**
   - 選択したファイルに対応するテストファイルを自動生成
   - ファイル名規則：`[元ファイル名].test.ts` または `[元ファイル名].test.tsx`
   - 生成場所：元ファイルと同じディレクトリ内

3. **テストファイル内容**
   - 基本的なテストファイル構造を自動生成
   - import文の自動挿入
   - 基本的なdescribe/testブロックの生成
   - 元ファイルの関数/クラス/コンポーネントを解析してテストスケルトンを生成

## 技術要件

### 開発環境
- TypeScript
- VS Code Extension API
- Node.js

### 主要な実装要素
1. **package.json設定**
   - contributes.menus.explorer/contextでコンテキストメニュー設定
   - activationEventsの設定

2. **コマンド実装**
   - ファイル解析機能
   - テストファイル生成ロジック
   - ファイルシステム操作

3. **ファイル解析**
   - TypeScript AST解析
   - export文の抽出
   - 関数/クラス/コンポーネントの識別

## 追加検討事項
- 既存のテストファイルがある場合の処理
- 設定可能なテンプレート
- カスタムファイル命名規則の設定

## テストフレームワーク
- **Vitest専用**：Vitestのテスト構文とAPIに特化
- Vitestのimport文（`import { describe, it, expect } from 'vitest'`）を自動生成
- Vitestのモックやユーティリティ関数に対応

## 期待される成果物
- VS Code拡張機能パッケージ（.vsix）
- インストール可能な拡張機能
- 基本的なドキュメント（README.md）

---

**開発指示：**
上記仕様に基づいて、VS Code拡張機能を開発してください。まず基本的な右クリックメニューの追加とシンプルなテストファイル生成から始めて、段階的に機能を拡張していってください。