-- Batalkan ruang yang belum ada partner (hapus token & unlink creator)

CREATE OR REPLACE FUNCTION cancel_couple_space()
RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT couple_space_id INTO v_space_id FROM users WHERE id = auth.uid();
  IF v_space_id IS NULL THEN RETURN; END IF;

  SELECT count(*)::int INTO v_count FROM users WHERE couple_space_id = v_space_id;
  IF v_count > 1 THEN
    RAISE EXCEPTION 'Tidak bisa dibatalkan — partner sudah terhubung';
  END IF;

  UPDATE users
  SET couple_space_id = NULL,
      is_space_creator = false,
      role = NULL,
      updated_at = now()
  WHERE id = auth.uid();

  DELETE FROM couple_spaces WHERE id = v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
