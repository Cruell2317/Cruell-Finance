-- Jalankan setelah schema.sql utama

-- Hitung streak: minggu berurutan terbayar dari terbaru
CREATE OR REPLACE FUNCTION refresh_saving_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT status
    FROM savings_periods
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

-- Perbaikan: update transaksi pending, hindari duplikat insert
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
  FROM savings_periods
  WHERE id = p_period_id
  FOR UPDATE;

  IF v_already_paid THEN
    UPDATE transactions
    SET status = 'settlement', payment_method = p_method
    WHERE midtrans_order_id = p_order_id AND period_id = p_period_id;
    RETURN;
  END IF;

  UPDATE savings_periods
  SET status = 'PAID', penalty_amount = 0
  WHERE id = p_period_id;

  UPDATE couple_spaces
  SET pool_balance = pool_balance + p_amount, updated_at = now()
  WHERE id = v_space_id;

  UPDATE transactions
  SET status = 'settlement', payment_method = p_method, amount = p_amount
  WHERE midtrans_order_id = p_order_id AND period_id = p_period_id;

  PERFORM refresh_saving_streak(p_paid_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER PUBLICATION supabase_realtime ADD TABLE users;
