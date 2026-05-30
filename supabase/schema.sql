-- Cruell Finance — Production Schema + RLS
-- Run entire script in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE period_status AS ENUM ('UNPAID', 'PAID', 'LATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Couple space (multi-tenant root)
CREATE TABLE IF NOT EXISTS couple_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_code CHAR(6) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_month INT CHECK (start_month BETWEEN 1 AND 12),
  start_year INT,
  pool_balance BIGINT NOT NULL DEFAULT 0,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couple_spaces_code ON couple_spaces(pairing_code);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  couple_space_id UUID REFERENCES couple_spaces(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  profile_setup_done BOOLEAN NOT NULL DEFAULT false,
  is_space_creator BOOLEAN NOT NULL DEFAULT false,
  saving_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_couple_space ON users(couple_space_id);

CREATE TABLE IF NOT EXISTS savings_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  base_amount INT NOT NULL DEFAULT 10000,
  penalty_amount INT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  status period_status NOT NULL DEFAULT 'UNPAID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (couple_space_id, user_id, month_year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_periods_space_month ON savings_periods(couple_space_id, month_year);
CREATE INDEX IF NOT EXISTS idx_periods_status ON savings_periods(status);

CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  target_name TEXT NOT NULL,
  target_amount BIGINT NOT NULL DEFAULT 0,
  current_amount BIGINT NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  period_id UUID REFERENCES savings_periods(id) ON DELETE SET NULL,
  target_id UUID REFERENCES targets(id) ON DELETE SET NULL,
  paid_by UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  midtrans_order_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_id IS NOT NULL OR target_id IS NOT NULL OR amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_space ON transactions(couple_space_id, created_at DESC);

CREATE TABLE IF NOT EXISTS target_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  allocated_by UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pool_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  deposited_by UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_space_id UUID NOT NULL REFERENCES couple_spaces(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES savings_periods(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: current user's couple_space_id
CREATE OR REPLACE FUNCTION auth_couple_space_id()
RETURNS UUID AS $$
  SELECT couple_space_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- New Google user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create couple space + link creator
CREATE OR REPLACE FUNCTION create_couple_space()
RETURNS TABLE (space_id UUID, pairing_code CHAR(6)) AS $$
DECLARE
  v_code CHAR(6);
  v_space_id UUID;
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF (SELECT couple_space_id FROM users WHERE id = auth.uid()) IS NOT NULL THEN
    RAISE EXCEPTION 'Sudah terhubung ke ruang pasangan';
  END IF;

  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    v_code := translate(v_code, '01IOUL', '234589');
    SELECT EXISTS(SELECT 1 FROM couple_spaces WHERE couple_spaces.pairing_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO couple_spaces (pairing_code, created_by)
  VALUES (v_code, auth.uid())
  RETURNING id INTO v_space_id;

  UPDATE users
  SET couple_space_id = v_space_id, is_space_creator = true, updated_at = now()
  WHERE id = auth.uid();

  RETURN QUERY SELECT v_space_id, v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join via 6-digit code
CREATE OR REPLACE FUNCTION join_couple_space(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_space_id UUID;
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO v_space_id FROM couple_spaces
  WHERE pairing_code = upper(trim(p_code));

  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Kode pairing tidak valid'; END IF;

  SELECT count(*) INTO v_count FROM users WHERE couple_space_id = v_space_id;
  IF v_count >= 2 THEN RAISE EXCEPTION 'Ruang pasangan sudah penuh'; END IF;

  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND couple_space_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Anda sudah terhubung';
  END IF;

  UPDATE users SET couple_space_id = v_space_id, updated_at = now() WHERE id = auth.uid();
  RETURN v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retroactive periods Jan..now
CREATE OR REPLACE FUNCTION activate_time_machine(p_start_month INT, p_start_year INT)
RETURNS INT AS $$
DECLARE
  v_space_id UUID;
  v_member RECORD;
  v_cur DATE;
  v_end DATE;
  v_month INT;
  v_year INT;
  v_week INT;
  v_month_names TEXT[] := ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  v_month_year TEXT;
  v_due TIMESTAMPTZ;
  v_inserted INT := 0;
BEGIN
  v_space_id := auth_couple_space_id();
  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_space_creator = true) THEN
    RAISE EXCEPTION 'Hanya pembuat ruang yang mengaktifkan Time Machine';
  END IF;

  UPDATE couple_spaces SET start_month = p_start_month, start_year = p_start_year, updated_at = now()
  WHERE id = v_space_id;

  v_cur := make_date(p_start_year, p_start_month, 1);
  v_end := date_trunc('month', CURRENT_DATE)::date;

  WHILE v_cur <= v_end LOOP
    v_month := extract(month from v_cur)::int;
    v_year := extract(year from v_cur)::int;
    v_month_year := v_month_names[v_month] || ' ' || v_year;

    FOR v_member IN SELECT id FROM users WHERE couple_space_id = v_space_id LOOP
      FOR v_week IN 1..4 LOOP
        v_due := (make_date(v_year, v_month, LEAST(v_week * 7, 28)) + time '23:59:59') AT TIME ZONE 'UTC';
        INSERT INTO savings_periods (couple_space_id, user_id, month_year, week_number, due_date)
        VALUES (v_space_id, v_member.id, v_month_year, v_week, v_due)
        ON CONFLICT (couple_space_id, user_id, month_year, week_number) DO NOTHING;
        v_inserted := v_inserted + 1;
      END LOOP;
    END LOOP;

    v_cur := (v_cur + INTERVAL '1 month')::date;
  END LOOP;

  RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allocate pool -> target
CREATE OR REPLACE FUNCTION allocate_to_target(p_target_id UUID, p_amount INT)
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
  v_target RECORD;
BEGIN
  v_space_id := auth_couple_space_id();
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Jumlah tidak valid'; END IF;

  SELECT * INTO v_target FROM targets WHERE id = p_target_id AND couple_space_id = v_space_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Target tidak ditemukan'; END IF;

  IF (SELECT pool_balance FROM couple_spaces WHERE id = v_space_id) < p_amount THEN
    RAISE EXCEPTION 'Saldo tabungan tidak cukup';
  END IF;

  UPDATE couple_spaces SET pool_balance = pool_balance - p_amount, updated_at = now() WHERE id = v_space_id;
  UPDATE targets SET current_amount = current_amount + p_amount, updated_at = now() WHERE id = p_target_id;

  INSERT INTO target_allocations (target_id, couple_space_id, allocated_by, amount)
  VALUES (p_target_id, v_space_id, auth.uid(), p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Extra pool deposit
CREATE OR REPLACE FUNCTION add_pool_deposit(p_amount INT, p_note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_space_id UUID;
  v_id UUID;
BEGIN
  v_space_id := auth_couple_space_id();
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Jumlah tidak valid'; END IF;

  UPDATE couple_spaces SET pool_balance = pool_balance + p_amount, updated_at = now() WHERE id = v_space_id;

  INSERT INTO pool_deposits (couple_space_id, deposited_by, amount, note)
  VALUES (v_space_id, auth.uid(), p_amount, p_note)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Streak: minggu lunas berurutan dari terbaru
CREATE OR REPLACE FUNCTION refresh_saving_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT status FROM savings_periods
    WHERE user_id = p_user_id
    ORDER BY due_date DESC
  LOOP
    IF r.status = 'PAID' THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  UPDATE users SET saving_streak = v_streak, updated_at = now() WHERE id = p_user_id;
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION settle_period_payment(
  p_period_id UUID,
  p_paid_by UUID,
  p_amount INT,
  p_method TEXT,
  p_order_id TEXT
)
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
  v_already_paid BOOLEAN;
BEGIN
  SELECT couple_space_id, (status = 'PAID')
  INTO v_space_id, v_already_paid
  FROM savings_periods WHERE id = p_period_id FOR UPDATE;

  IF v_already_paid THEN
    UPDATE transactions SET status = 'settlement', payment_method = p_method
    WHERE midtrans_order_id = p_order_id AND period_id = p_period_id;
    RETURN;
  END IF;

  UPDATE savings_periods SET status = 'PAID', penalty_amount = 0 WHERE id = p_period_id;
  UPDATE couple_spaces SET pool_balance = pool_balance + p_amount, updated_at = now() WHERE id = v_space_id;
  UPDATE transactions SET status = 'settlement', payment_method = p_method, amount = p_amount
  WHERE midtrans_order_id = p_order_id AND period_id = p_period_id;

  PERFORM refresh_saving_streak(p_paid_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE couple_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_couple" ON users;
CREATE POLICY "users_select_couple" ON users FOR SELECT TO authenticated
  USING (couple_space_id IS NOT NULL AND couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "spaces_select_member" ON couple_spaces;
CREATE POLICY "spaces_select_member" ON couple_spaces FOR SELECT TO authenticated
  USING (id = auth_couple_space_id());

DROP POLICY IF EXISTS "spaces_update_creator" ON couple_spaces;
CREATE POLICY "spaces_update_creator" ON couple_spaces FOR UPDATE TO authenticated
  USING (id = auth_couple_space_id());

DROP POLICY IF EXISTS "periods_select" ON savings_periods;
CREATE POLICY "periods_select" ON savings_periods FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "targets_all" ON targets;
CREATE POLICY "targets_all" ON targets FOR ALL TO authenticated
  USING (couple_space_id = auth_couple_space_id())
  WITH CHECK (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "allocations_select" ON target_allocations;
CREATE POLICY "allocations_select" ON target_allocations FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "deposits_select" ON pool_deposits;
CREATE POLICY "deposits_select" ON pool_deposits FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "nudges_select" ON nudges;
CREATE POLICY "nudges_select" ON nudges FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "nudges_insert" ON nudges;
CREATE POLICY "nudges_insert" ON nudges FOR INSERT TO authenticated
  WITH CHECK (couple_space_id = auth_couple_space_id() AND from_user_id = auth.uid());

-- Storage buckets (run if not exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('target_images', 'target_images', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "target_images_upload" ON storage.objects;
CREATE POLICY "target_images_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'target_images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "target_images_read" ON storage.objects;
CREATE POLICY "target_images_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'target_images');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE savings_periods;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE targets;
ALTER PUBLICATION supabase_realtime ADD TABLE target_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE pool_deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE couple_spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE nudges;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Payment settings (manual QR / VA) — see migrations/003_payment_settings.sql
CREATE TABLE IF NOT EXISTS payment_settings (
  couple_space_id UUID PRIMARY KEY REFERENCES couple_spaces(id) ON DELETE CASCADE,
  qris_image_url TEXT,
  account_holder_name TEXT DEFAULT 'Cruell Finance',
  va_bca TEXT,
  va_bni TEXT,
  va_bri TEXT,
  va_permata TEXT,
  va_mandiri TEXT,
  va_cimb TEXT,
  use_midtrans BOOLEAN NOT NULL DEFAULT false,
  payment_instructions TEXT DEFAULT 'Transfer sesuai nominal exact. Konfirmasi setelah bayar.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_settings_couple" ON payment_settings;
CREATE POLICY "payment_settings_couple" ON payment_settings FOR ALL TO authenticated
  USING (couple_space_id = auth_couple_space_id())
  WITH CHECK (couple_space_id = auth_couple_space_id());

INSERT INTO storage.buckets (id, name, public) VALUES ('payment_assets', 'payment_assets', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "payment_assets_upload" ON storage.objects;
CREATE POLICY "payment_assets_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment_assets');

DROP POLICY IF EXISTS "payment_assets_read" ON storage.objects;
CREATE POLICY "payment_assets_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'payment_assets');

ALTER PUBLICATION supabase_realtime ADD TABLE payment_settings;
