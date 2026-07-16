# DB設計書（Supabase / PostgreSQL）

## 概要
がくしゅうクエストアプリのデータを Supabase（PostgreSQL）で管理するためのDB設計書。
複数ユーザー対応、ブラウザ/端末をまたいだデータ共有を実現する。

## テーブル一覧

### 1. `users` テーブル（ユーザー管理）
ユーザー（児童・保護者）の基本情報を管理するテーブル。
`is_parent` フラグで子供アカウントと保護者アカウントを区別する。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | ユーザーID（自動生成） |
| name | text | NOT NULL | ユーザー名 |
| passcode | text | NOT NULL | 保護者用パスコード（数字4桁） |
| is_parent | boolean | DEFAULT false | 保護者アカウントフラグ（true=保護者, false=子供） |
| created_at | timestamptz | DEFAULT now() | 作成日時 |

### 2. `user_profiles` テーブル（ユーザーに紐づくデータ）
ユーザーの学習進捗・設定データを管理するテーブル。
`users` テーブルと1対1で紐づく。
保護者アカウントの場合は `admission_date` が NULL になる。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| user_id | uuid | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE | ユーザーID（FK） |
| admission_date | date | （NULL可） | 入学年月日（保護者はNULL） |
| level | int | DEFAULT 1 | レベル |
| score | int | DEFAULT 0 | スコア |
| current_difficulty | text | DEFAULT 'easy' | 現在の難易度（easy/normal/hard） |
| theme | text | DEFAULT 'pokemon' | テーマ（pokemon/bluelock） |
| stats_math | int | DEFAULT 0 | 算数 正解数 |
| stats_japanese | int | DEFAULT 0 | 国語 正解数 |
| stats_english | int | DEFAULT 0 | 英語 正解数 |
| stats_life | int | DEFAULT 0 | 生活 正解数 |
| stats_science | int | DEFAULT 0 | 理科 正解数 |
| stats_social | int | DEFAULT 0 | 社会 正解数 |
| stats_moral | int | DEFAULT 0 | 道徳 正解数 |
| updated_at | timestamptz | DEFAULT now() | 更新日時（自動更新） |

## ER図

```
┌─────────────────────────┐        ┌──────────────────────────┐
│        users            │        │     user_profiles        │
├─────────────────────────┤        ├──────────────────────────┤
│ id (PK)                 │──1:1──→│ user_id (PK, FK)         │
│ name                    │        │ admission_date (NULL可)  │
│ passcode                │        │ level                    │
│ is_parent (boolean)     │        │ score                    │
│ created_at              │        │ current_difficulty       │
└─────────────────────────┘        │ theme                    │
                                   │ stats_math               │
                                   │ stats_japanese           │
                                   │ stats_english            │
                                   │ stats_life               │
                                   │ stats_science            │
                                   │ stats_social             │
                                   │ stats_moral              │
                                   │ updated_at               │
                                   └──────────────────────────┘
```

## 認証方式
- **方式A（簡易認証）**：Supabase Authは使用せず、アプリ側で名前＋保護者パスコードによる認証を行う
- パスコードは `users` テーブルに平文保存（現在のアプリの流れを維持）
- Supabase側は匿名アクセス（anon）で全テーブル読み書き許可

## アクセス制御
- **保護者認証**：パスコード一致 + `is_parent=true` の両方を満たすユーザーのみ保護者画面にアクセス可能
- **子供ユーザーの一覧**：ユーザー選択画面では `is_parent=false` のユーザーのみ表示
- **保護者一覧画面**：全ユーザー（子供・保護者両方）を表示、編集・削除可能
- **Supabase RLSポリシー**：匿名アクセス許可（anonキーで全操作可能）

## データフロー
1. アプリ起動 → Supabaseから子供ユーザー一覧を取得 → ユーザー選択画面を表示
2. ユーザー選択 → 該当ユーザーの `user_profiles` を取得 → ゲーム開始
3. 学習中（正解/不正解） → 都度 `user_profiles` を更新（score, level, stats_*）
4. テーマ変更 → `user_profiles.theme` を更新
5. 難易度変更 → `user_profiles.current_difficulty` を更新
6. 保護者モード → パスコード一致 + is_parent=true で認証後、全ユーザー一覧・編集画面を表示
7. 新規ユーザー作成（子供） → `users`（is_parent=false）+ `user_profiles`（admission_dateあり）にレコードを挿入
8. 新規ユーザー作成（保護者） → `users`（is_parent=true）+ `user_profiles`（admission_date=null）にレコードを挿入