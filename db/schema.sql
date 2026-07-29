-- 校园二手交易平台 — 数据库建表脚本（Postgres / Neon）
-- 在 Neon SQL Editor 中手动执行本文件即可

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 商品状态枚举
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('on_sale', 'reserved', 'sold', 'removed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 用户
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 分类
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL
);

-- 商品
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  status item_status NOT NULL DEFAULT 'on_sale',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items (seller_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items (category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);

-- 留言
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages (item_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);

-- 收藏
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites (item_id);

-- 举报
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_item_id ON reports (item_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports (reporter_id);

-- 分类初始数据
INSERT INTO categories (name)
SELECT v.name
FROM (
  VALUES
    ('教材'),
    ('数码'),
    ('生活用品'),
    ('服饰'),
    ('其他')
) AS v (name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name
);
