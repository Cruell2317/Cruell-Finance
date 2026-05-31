-- Streamlined pairing: auto dashboard, open banking fields, target due date

ALTER TABLE couple_spaces ADD COLUMN IF NOT EXISTS bank_provider TEXT DEFAULT 'brick_snap_sim';
ALTER TABLE couple_spaces ADD COLUMN IF NOT EXISTS bank_account_ref TEXT;
ALTER TABLE couple_spaces ADD COLUMN IF NOT EXISTS bank_sync_balance BIGINT;
ALTER TABLE couple_spaces ADD COLUMN IF NOT EXISTS bank_last_synced_at TIMESTAMPTZ;

ALTER TABLE targets ADD COLUMN IF NOT EXISTS target_due_date DATE;

-- Time Machine: semua anggota ruang (bukan hanya creator)
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

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND couple_space_id = v_space_id) THEN
    RAISE EXCEPTION 'Bukan anggota ruang';
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

-- Setelah 2 anggota: profil dari registrasi, tagihan Jan 2026, onboarding selesai
CREATE OR REPLACE FUNCTION finalize_couple_pairing()
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
  v_count INT;
  v_has_periods BOOLEAN;
BEGIN
  v_space_id := auth_couple_space_id();
  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

  SELECT count(*) INTO v_count FROM users WHERE couple_space_id = v_space_id;
  IF v_count < 2 THEN RAISE EXCEPTION 'Menunggu partner'; END IF;

  UPDATE users
  SET profile_setup_done = true, updated_at = now()
  WHERE couple_space_id = v_space_id;

  SELECT EXISTS (
    SELECT 1 FROM savings_periods WHERE couple_space_id = v_space_id LIMIT 1
  ) INTO v_has_periods;

  IF NOT v_has_periods THEN
    PERFORM activate_time_machine(1, 2026);
  END IF;

  UPDATE couple_spaces
  SET onboarding_complete = true, updated_at = now()
  WHERE id = v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sync_open_banking_balance(p_balance BIGINT DEFAULT NULL)
RETURNS BIGINT AS $$
DECLARE
  v_space_id UUID;
  v_balance BIGINT;
BEGIN
  v_space_id := auth_couple_space_id();
  IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

  v_balance := COALESCE(p_balance, (SELECT pool_balance FROM couple_spaces WHERE id = v_space_id));

  UPDATE couple_spaces
  SET bank_sync_balance = v_balance,
      bank_last_synced_at = now(),
      updated_at = now()
  WHERE id = v_space_id;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
