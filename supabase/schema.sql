-- ============================================================
-- がくしゅうクエスト Supabase スキーマ定義
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1. users テーブル（ユーザー管理）
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  passcode text NOT NULL,
  is_parent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. user_profiles テーブル（ユーザーに紐づくデータ）
CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admission_date date,
  level int DEFAULT 1,
  score int DEFAULT 0,
  current_difficulty text DEFAULT 'easy',
  theme text DEFAULT 'pokemon',
  stats_math int DEFAULT 0,
  stats_japanese int DEFAULT 0,
  stats_english int DEFAULT 0,
  stats_life int DEFAULT 0,
  stats_science int DEFAULT 0,
  stats_social int DEFAULT 0,
  stats_moral int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 3. updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. user_profiles にトリガーを設定
CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS（Row Level Security）有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシー：匿名アクセス（anon）で全操作を許可
--    ※ 認証はアプリ側（名前＋パスコード）で行うため、Supabase側は全開放
CREATE POLICY "Allow anon all access on users"
ON users
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon all access on user_profiles"
ON user_profiles
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================
-- 既存テーブルがある場合のマイグレーション用SQL（以下を個別実行）
-- ============================================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_parent boolean DEFAULT false;
-- ALTER TABLE user_profiles ALTER COLUMN admission_date DROP NOT NULL;