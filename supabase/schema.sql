-- ============================================================
-- がくしゅうクエスト Supabase スキーマ定義（v3 - 最終版）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1. users テーブル（ユーザー管理）
--    role: 'admin' | 'parent' | 'child'
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid UNIQUE,           -- Supabase Auth ユーザーID（admin/parentのみ）
  email text,                      -- Google OAuth メールアドレス
  name text NOT NULL,
  role text NOT NULL DEFAULT 'child' CHECK (role IN ('admin','parent','child')),
  pin_hash text,                   -- 子供用4桁PINのSHA-256ハッシュ
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- 3. 保護者-子供 N:N 関係テーブル
CREATE TABLE parent_child_relationships (
  parent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (parent_id, child_id)
);

-- 4. updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 各テーブルにトリガーを設定
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. RLS（Row Level Security）有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- 7. RLSポリシー
--    認証ユーザー（authenticated）は全操作を許可
CREATE POLICY "Allow authenticated all access on users"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated all access on user_profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated all access on parent_child_relationships"
ON parent_child_relationships
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 匿名ユーザーは読み取りのみ許可（子供ログイン用）
CREATE POLICY "Allow anon read users"
ON users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon read user_profiles"
ON user_profiles
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon read parent_child_relationships"
ON parent_child_relationships
FOR SELECT
TO anon
USING (true);

-- ============================================================
-- v2 → v3 マイグレーション用SQL（必要に応じて個別実行）
-- ============================================================
-- CREATE TABLE IF NOT EXISTS parent_child_relationships (
--   parent_id uuid REFERENCES users(id) ON DELETE CASCADE,
--   child_id uuid REFERENCES users(id) ON DELETE CASCADE,
--   created_at timestamptz DEFAULT now(),
--   PRIMARY KEY (parent_id, child_id)
-- );
-- ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated all access on parent_child_relationships"
--   ON parent_child_relationships FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow anon read parent_child_relationships"
--   ON parent_child_relationships FOR SELECT TO anon USING (true);
-- DROP POLICY IF EXISTS "Allow anon insert users" ON users;
-- DROP POLICY IF EXISTS "Allow anon insert user_profiles" ON user_profiles;