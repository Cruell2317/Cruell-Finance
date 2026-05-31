-- Satu RPC: join + finalize dalam satu transaksi, return JSON

CREATE OR REPLACE FUNCTION join_couple_space_instant(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_space_id UUID;
  v_count INT;
  v_code_norm TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_code_norm := upper(trim(p_code));

  SELECT id INTO v_space_id FROM couple_spaces
  WHERE pairing_code = v_code_norm;

  IF v_space_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kode pairing tidak valid');
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND couple_space_id IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Anda sudah terhubung ke ruang lain');
  END IF;

  SELECT count(*)::int INTO v_count FROM users WHERE couple_space_id = v_space_id;
  IF v_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ruang pasangan sudah penuh');
  END IF;

  UPDATE users
  SET couple_space_id = v_space_id,
      is_space_creator = false,
      role = 'JOINER',
      updated_at = now()
  WHERE id = auth.uid();

  SELECT count(*)::int INTO v_count FROM users WHERE couple_space_id = v_space_id;
  IF v_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Partner belum lengkap');
  END IF;

  UPDATE users
  SET profile_setup_done = true, updated_at = now()
  WHERE couple_space_id = v_space_id;

  IF NOT EXISTS (
    SELECT 1 FROM savings_periods WHERE couple_space_id = v_space_id LIMIT 1
  ) THEN
    PERFORM activate_time_machine(1, 2026);
  END IF;

  UPDATE couple_spaces
  SET onboarding_complete = true, updated_at = now()
  WHERE id = v_space_id;

  RETURN jsonb_build_object('success', true, 'space_id', v_space_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
