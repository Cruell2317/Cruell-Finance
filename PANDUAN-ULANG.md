# Panduan Ulang Cruell Finance — Dari Nol Sampai Jalan

Ikuti **urutan persis** ini. Jangan loncat langkah.

---

## STEP 0 — Prasyarat

- [ ] Node.js 20+ terpasang (`node -v`)
- [ ] Akun [Supabase](https://supabase.com) (gratis)
- [ ] Akun [Google Cloud](https://console.cloud.google.com) (OAuth)
- [ ] Akun [GitHub](https://github.com) + [Vercel](https://vercel.com)
- [ ] 2 email Google (kamu + pasangan)

---

## STEP 1 — Project di laptop

```powershell
cd "F:\Cruell Finance"
npm install
```

---

## STEP 2 — Supabase: buat project

1. [supabase.com](https://supabase.com) → **New project**
2. Region: **Singapore**
3. Catat **Project URL** dan **Reference ID** (contoh: `tcbhfdkojssnppdflesw`)

---

## STEP 3 — Supabase: jalankan SQL (WAJIB berurutan)

**SQL Editor → New query → Run satu per satu:**

| # | File |
|---|------|
| 1 | `supabase/schema.sql` |
| 2 | `supabase/migrations/002_streak_and_settlement_fix.sql` |
| 3 | `supabase/migrations/003_payment_settings.sql` |
| 4 | `supabase/migrations/004_users_insert_self.sql` |

Cek **Table Editor** → harus ada tabel `users`, `couple_spaces`, `savings_periods`.

---

## STEP 4 — Supabase: API Keys (PENTING untuk login)

1. **Settings → API Keys**
2. Salin **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. **Legacy anon key** (`eyJhbG...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   ⚠️ Pakai **Legacy anon JWT**, bukan hanya `sb_publishable_` — login lebih stabil.
4. **Secret key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 5 — Supabase: Google Auth

1. **Authentication → Providers → Google** → Enable
2. Isi Client ID & Secret dari Google Cloud (Step 6)
3. **Authentication → URL Configuration:**

| Field | Nilai production |
|-------|------------------|
| Site URL | `https://cruell-finance.vercel.app` |
| Redirect URLs | `https://cruell-finance.vercel.app/auth/callback` |
| (opsional lokal) | `http://localhost:3000/auth/callback` |

---

## STEP 6 — Google Cloud OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → project **Cruell Finance**
2. **Google Auth Platform → Get started** → **External**
3. **Audience → Test users** → tambah email Google kamu
4. **Clients → Create → Web application**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://cruell-finance.vercel.app
```

**Authorized redirect URIs** (hanya Supabase):
```
https://tcbhfdkojssnppdflesw.supabase.co/auth/v1/callback
```
(Ganti dengan Reference ID project kamu.)

5. Copy **Client ID** + **Client Secret** → paste di Supabase Step 5

---

## STEP 7 — File `.env.local` (laptop)

Buat `F:\Cruell Finance\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tcbhfdkojssnppdflesw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...legacy-anon-key...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

NEXT_PUBLIC_APP_URL=http://localhost:3000

CRON_SECRET=string-acak-panjang-minimal-32-karakter

MIDTRANS_SERVER_KEY=dummy
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=dummy
MIDTRANS_IS_PRODUCTION=false
```

```powershell
npm run dev
```

Buka http://localhost:3000/login → **Sign in with Google**

**Berhasil:** masuk halaman **Pairing** (kode 6 digit), **bukan** splash loop.

---

## STEP 8 — Onboarding (2 akun)

### Akun A
1. Buat ruang → catat kode 6 digit
2. Profil → Time Machine → Target (skip boleh)

### Akun B (Incognito)
1. Gabung dengan kode
2. Lengkapi profil

---

## STEP 9 — Deploy Vercel

```bash
git add .
git commit -m "Update"
git push
```

Vercel → Import repo → paste **semua env** dari `.env.local`  
Ganti: `NEXT_PUBLIC_APP_URL=https://cruell-finance.vercel.app`  
**Redeploy** setelah ubah env.

Update Supabase + Google URLs (Step 5 & 6) untuk production.

---

## STEP 10 — Atur pembayaran

**Profil → QRIS & Virtual Account** → upload QR + nomor VA → Simpan

---

## STEP 11 — Pasang di HP

- Android: Chrome → Install app
- iPhone: Safari → Add to Home Screen

---

## Export Excel

Di halaman **Tagihan** → tombol **Export Excel**

File: `Catatan-Cruell-Finance-YYYY-MM-DD.xlsx` berisi:
- **Ringkasan** — judul Catatan Cruell Finance, saldo, anggota
- **Detail Tagihan** — bulan, minggu, nama, jatuh tempo, lunas/belum, metode bayar, tanggal bayar
- **Yang Nunggak** — siapa masih telat/belum bayar
- **Transaksi** — riwayat pembayaran
- **Top-up Pool** — setoran uang lebih

---

## Troubleshooting login (balik ke splash)

| Gejala | Solusi |
|--------|--------|
| Langsung splash/login loop | Pakai **Legacy anon key** `eyJ...` di Vercel + `.env.local`, redeploy |
| Error di login | Baca pesan merah — biasanya redirect URL salah |
| Ke Google lalu gagal | Cek Redirect URL Supabase = `.../auth/callback` |
| `redirect_uri_mismatch` | Google redirect = `...supabase.co/auth/v1/callback` |
| Access blocked | Email di Google → Test users |
| SQL belum jalan | Jalankan Step 3 lagi |

### Reset tes login
1. Clear cache browser / Incognito
2. Supabase → Authentication → Users → hapus user tes (opsional)
3. Login ulang dari `/login` (bukan splash)

---

## Checklist selesai

```
[ ] SQL 1-4 di Supabase
[ ] Legacy anon key di env
[ ] Google OAuth + Supabase URL config
[ ] Login laptop → Pairing (bukan splash loop)
[ ] 2 akun pairing + Time Machine
[ ] Deploy Vercel + env production
[ ] Login HP production
[ ] Export Excel di Tagihan
```

---

Project ID kamu: `tcbhfdkojssnppdflesw`  
Production URL: `https://cruell-finance.vercel.app`
