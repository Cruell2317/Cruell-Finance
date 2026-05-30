-- Roles CREATOR/JOINER, unpair, payment creator-only, users self-read

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CREATOR', 'JOINER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role;

UPDATE users SET role = 'CREATOR' WHERE is_space_creator = true AND role IS NULL;
UPDATE users SET role = 'JOINER' WHERE is_space_creator = false AND couple_space_id IS NOT NULL AND role IS NULL;

DROP POLICY IF EXISTS "users_select_self" ON users;
CREATE POLICY "users_select_self" ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "payment_settings_couple" ON payment_settings;
CREATE POLICY "payment_settings_select" ON payment_settings FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

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
  SET couple_space_id = v_space_id,
      is_space_creator = true,
      role = 'CREATOR',
      updated_at = now()
  WHERE id = auth.uid();

  RETURN QUERY SELECT v_space_id, v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  UPDATE users
  SET couple_space_id = v_space_id,
      is_space_creator = false,
      role = 'JOINER',
      updated_at = now()
  WHERE id = auth.uid();

  RETURN v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION disconnect_couple_space()
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
BEGIN
  v_space_id := auth_couple_space_id();
  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Tidak ada ruang pasangan aktif'; END IF;

  UPDATE users
  SET couple_space_id = NULL,
      is_space_creator = false,
      role = NULL,
      profile_setup_done = false,
      updated_at = now()
  WHERE couple_space_id = v_space_id;

  DELETE FROM couple_spaces WHERE id = v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_payment_settings(
  p_qris_image_url TEXT,
  p_account_holder_name TEXT,
  p_va_bca TEXT,
  p_va_bni TEXT,
  p_va_bri TEXT,
  p_va_permata TEXT,
  p_va_mandiri TEXT,
  p_va_cimb TEXT,
  p_use_midtrans BOOLEAN,
  p_payment_instructions TEXT
)
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
BEGIN
  v_space_id := auth_couple_space_id();
  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'CREATOR'
  ) THEN
    RAISE EXCEPTION 'Hanya Space Administrator yang dapat mengubah pembayaran';
  END IF;

  INSERT INTO payment_settings (
    couple_space_id, qris_image_url, account_holder_name,
    va_bca, va_bni, va_bri, va_permata, va_mandiri, va_cimb,
    use_midtrans, payment_instructions, updated_at
  ) VALUES (
    v_space_id, p_qris_image_url, p_account_holder_name,
    p_va_bca, p_va_bni, p_va_bri, p_va_permata, p_va_mandiri, p_va_cimb,
    p_use_midtrans, p_payment_instructions, now()
  )
  ON CONFLICT (couple_space_id) DO UPDATE SET
    qris_image_url = EXCLUDED.qris_image_url,
    account_holder_name = EXCLUDED.account_holder_name,
    va_bca = EXCLUDED.va_bca,
    va_bni = EXCLUDED.va_bni,
    va_bri = EXCLUDED.va_bri,
    va_permata = EXCLUDED.va_permata,
    va_mandiri = EXCLUDED.va_mandiri,
    va_cimb = EXCLUDED.va_cimb,
    use_midtrans = EXCLUDED.use_midtrans,
    payment_instructions = EXCLUDED.payment_instructions,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "payment_settings_select" ON payment_settings;
CREATE POLICY "payment_settings_select" ON payment_settings FOR SELECT TO authenticated
  USING (couple_space_id = auth_couple_space_id());

DROP POLICY IF EXISTS "payment_settings_insert" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_update" ON payment_settings;
