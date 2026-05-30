  -- Konfigurasi pembayaran manual (upload QR & nomor VA)

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

  -- Konfirmasi pembayaran manual oleh partner
  CREATE OR REPLACE FUNCTION submit_manual_payment_claim(
    p_period_ids UUID[],
    p_method TEXT,
    p_proof_url TEXT DEFAULT NULL
  )
  RETURNS TEXT AS $$
  DECLARE
    v_space_id UUID;
    v_order_id TEXT;
    v_period_id UUID;
    v_amount INT;
    p RECORD;
  BEGIN
    v_space_id := auth_couple_space_id();
    IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

    v_order_id := 'MAN-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

    FOREACH v_period_id IN ARRAY p_period_ids LOOP
      SELECT base_amount + penalty_amount INTO v_amount
      FROM savings_periods
      WHERE id = v_period_id AND user_id = auth.uid() AND couple_space_id = v_space_id;

      IF NOT FOUND THEN RAISE EXCEPTION 'Tagihan tidak valid'; END IF;

      IF EXISTS (
        SELECT 1 FROM transactions
        WHERE period_id = v_period_id AND status IN ('awaiting_confirmation', 'settlement')
      ) THEN
        RAISE EXCEPTION 'Tagihan sudah dibayar atau menunggu konfirmasi';
      END IF;

      INSERT INTO transactions (
        couple_space_id, period_id, paid_by, amount, payment_method, status, midtrans_order_id
      ) VALUES (
        v_space_id, v_period_id, auth.uid(), v_amount, p_method, 'awaiting_confirmation', v_order_id
      );
    END LOOP;

    RETURN v_order_id;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION confirm_manual_payment(p_order_id TEXT)
  RETURNS INT AS $$
  DECLARE
    v_space_id UUID;
    v_tx RECORD;
    v_count INT := 0;
  BEGIN
    v_space_id := auth_couple_space_id();
    IF v_space_id IS NULL THEN RAISE EXCEPTION 'Belum pairing'; END IF;

    FOR v_tx IN
      SELECT * FROM transactions
      WHERE midtrans_order_id = p_order_id
        AND couple_space_id = v_space_id
        AND status = 'awaiting_confirmation'
    LOOP
      PERFORM settle_period_payment(
        v_tx.period_id, v_tx.paid_by, v_tx.amount, v_tx.payment_method, p_order_id
      );
      v_count := v_count + 1;
    END LOOP;

    IF v_count = 0 THEN RAISE EXCEPTION 'Tidak ada pembayaran menunggu konfirmasi'; END IF;
    RETURN v_count;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  INSERT INTO storage.buckets (id, name, public) VALUES ('payment_assets', 'payment_assets', true) ON CONFLICT DO NOTHING;

  DROP POLICY IF EXISTS "payment_assets_upload" ON storage.objects;
  CREATE POLICY "payment_assets_upload" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'payment_assets');

  DROP POLICY IF EXISTS "payment_assets_read" ON storage.objects;
  CREATE POLICY "payment_assets_read" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'payment_assets');

  ALTER PUBLICATION supabase_realtime ADD TABLE payment_settings;
