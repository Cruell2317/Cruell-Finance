# Tutorial Lengkap: Cruell Finance (Dari Nol Sampai Jalan di HP)

Panduan ini mengasumsikan kamu **belum punya apa-apa** — hanya folder project di komputer. Ikuti urutan langkahnya.

---

## Daftar isi

1. [Apa itu app ini?](#1-apa-itu-app-ini)
2. [Yang perlu disiapkan](#2-yang-perlu-disiapkan)
3. [Jalankan di komputer (lokal)](#3-jalankan-di-komputer-lokal)
4. [Buat project Supabase (database + auth)](#4-buat-project-supabase-database--auth)
5. [Jalankan SQL database](#5-jalankan-sql-database)
6. [Login Google (OAuth)](#6-login-google-oauth)
7. [File environment (.env.local)](#7-file-environment-envlocal)
8. [Tes pertama di browser](#8-tes-pertama-di-browser)
9. [Onboarding: dua akun pasangan](#9-onboarding-dua-akun-pasangan)
10. [Atur pembayaran QRIS & VA](#10-atur-pembayaran-qris--va)
11. [Alur bayar & konfirmasi](#11-alur-bayar--konfirmasi)
12. [Deploy ke internet (Vercel)](#12-deploy-ke-internet-vercel)
13. [Cron: tagihan otomatis & denda](#13-cron-tagihan-otomatis--denda)
14. [Pasang di HP (PWA)](#14-pasang-di-hp-pwa)
15. [Midtrans opsional](#15-midtrans-opsional)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Apa itu app ini?

**Cruell Finance** = PWA tabungan pasangan:

- Dua orang **pairing** dengan kode 6 digit
- Tagihan mingguan Rp 10.000/orang (bisa ada denda)
- Uang masuk ke **pool bersama**, bisa dialokasikan ke **target/wishlist**
- Pembayaran: **QRIS/VA manual** (upload sendiri) atau **Midtrans** (opsional)
- Streak menabung, colekan tagihan partner, realtime

**Stack:** Next.js 16, Supabase (Auth + DB + Storage), deploy Vercel.

---

## 2. Yang perlu disiapkan

| Alat / akun | Untuk apa |
|-------------|-----------|
| **Node.js 20+** | `node -v` di terminal |
| **npm** | Ikut Node |
| **Akun Google** | Login app + Google Cloud OAuth |
| **Akun Supabase** (gratis) | Database, auth, file upload |
| **Akun Vercel** (gratis) | Hosting production |
| **(Opsional) Midtrans** | Pembayaran otomatis |
| **2 email Google** | Tes pairing (kamu + pasangan) |

---

## 3. Jalankan di komputer (lokal)

Buka terminal di folder project:

```powershell
cd "f:\Cruell Finance"
npm install
```

Belum perlu `npm run dev` — env Supabase belum ada, app akan tampil "Konfigurasi Diperlukan".

---

## 4. Buat project Supabase (database + auth)

1. Buka https://supabase.com → **Sign in** → **New project**
2. Isi:
   - **Name:** `cruell-finance` (bebas)
   - **Database password:** simpan di password manager
   - **Region:** Singapore (dekat Indonesia)
3. Tunggu project status **Active** (~2 menit)

Catat dari **Project Settings → API**:

| Nama di dashboard | Masuk ke `.env.local` nanti |
|-------------------|-----------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key (rahasia!) | `SUPABASE_SERVICE_ROLE_KEY` |

> Jangan pernah commit `service_role` ke GitHub atau kirim ke orang lain.

---

## 5. Jalankan SQL database

Di Supabase: **SQL Editor → New query**

### Langkah 5.1 — Schema utama

1. Buka file `supabase/schema.sql` di VS Code / Cursor
2. **Select all** → copy → paste di SQL Editor
3. Klik **Run**
4. Harus sukses (hijau). Kalau ada error "already exists" pada tabel, biasanya aman jika di-run ulang (script pakai `IF NOT EXISTS`)

Script ini membuat:

- Tabel: `couple_spaces`, `users`, `savings_periods`, `targets`, `transactions`, dll.
- Fungsi: pairing, time machine, allocate target, pool deposit, settlement
- RLS (keamanan per pasangan)
- Bucket storage: `avatars`, `target_images`, `payment_assets`
- Trigger: profil otomatis saat user Google pertama kali login

### Langkah 5.2 — Migration streak & settlement

1. Copy isi `supabase/migrations/002_streak_and_settlement_fix.sql`
2. SQL Editor → New query → paste → **Run**

### Langkah 5.3 — Pembayaran manual (QR/VA)

1. Copy isi `supabase/migrations/003_payment_settings.sql`
2. Run

Tanpa langkah 5.3, menu **Pengaturan Pembayaran** akan error.

### Langkah 5.4 — Cek Realtime (opsional tapi disarankan)

**Database → Replication** — pastikan tabel ini ada di publication `supabase_realtime`:

- `savings_periods`, `transactions`, `targets`, `couple_spaces`, `users`, `payment_settings`

Kalau belum, migration/schema biasanya sudah menambahkan; kalau error "already in publication", abaikan.

---

## 6. Login Google (OAuth)

### 6.1 Google Cloud Console

1. https://console.cloud.google.com
2. Buat **project** baru (mis. `Cruell Finance`)
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name, email support — isi minimal
   - Test users: tambahkan **kedua email Google** yang akan dipakai tes
4. **Credentials → Create Credentials → OAuth client ID**
   - Type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://YOUR-PROJECT.supabase.co` (ganti YOUR-PROJECT)
   - **Authorized redirect URIs:** (penting!)
     - `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Salin **Client ID** dan **Client Secret**

### 6.2 Supabase Auth

1. Supabase → **Authentication → Providers → Google**
2. **Enable**
3. Paste Client ID & Client Secret
4. Save

### 6.3 URL redirect aplikasi

**Authentication → URL Configuration**

| Field | Nilai (lokal) | Nilai (production nanti) |
|-------|---------------|---------------------------|
| Site URL | `http://localhost:3000` | `https://domain-kamu.vercel.app` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://domain-kamu.vercel.app/auth/callback` |

Tambahkan **keduanya** kalau mau tes lokal dan production.

---

## 7. File environment (.env.local)

Di root project, buat file **`.env.local`** (copy dari `.env.example`):

```env
# === WAJIB (Supabase) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# URL app (lokal dulu)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === WAJIB untuk API cron di server ===
CRON_SECRET=buat-string-panjang-random-minimal-32-karakter

# === Midtrans (isi dummy dulu kalau belum pakai) ===
MIDTRANS_SERVER_KEY=SB-Mid-server-dummy-untuk-dev
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-dummy
MIDTRANS_IS_PRODUCTION=false
```

**Cara buat CRON_SECRET:** di PowerShell:

```powershell
[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
```

> App **bisa jalan tanpa Midtrans asli** selama kamu pakai pembayaran **manual** (QR/VA upload). Midtrans hanya dipakai kalau centang "Aktifkan Midtrans" di pengaturan.

---

## 8. Tes pertama di browser

```powershell
cd "f:\Cruell Finance"
npm run dev
```

Buka http://localhost:3000

Alur layar:

1. **Splash** → tap mulai
2. **Login** → **Masuk dengan Google**
3. Setelah login, masuk **onboarding** (belum bisa dashboard)

Kalau stuck "Konfigurasi Diperlukan" → cek `.env.local` dan restart `npm run dev`.

---

## 9. Onboarding: dua akun pasangan

Kamu perlu **2 browser/profile** (Chrome normal + Incognito, atau HP + laptop).

### User A (pembuat ruang)

1. Login Google **akun A**
2. **Pairing** → **Buat ruang baru** → catat **kode 6 digit**
3. **Profil** → nama tampilan + foto (opsional)
4. **Time Machine** (hanya creator): pilih bulan/tahun mulai tabungan → generate tagihan mundur
5. **Target** (opsional) → skip atau buat wishlist
6. Selesai onboarding — tapi dashboard **belum lengkap** sampai User B join

### User B (pasangan)

1. Login Google **akun B** (browser lain)
2. **Pairing** → masukkan **kode 6 digit** dari User A
3. Lengkapi profil
4. Selesai onboarding

### Setelah keduanya selesai

- **Beranda:** pool balance, aktivitas bulan ini, target
- **Tagihan:** riwayat per bulan, bayar tagihan sendiri
- **Profil:** statistik, pengaturan

---

## 10. Atur pembayaran QRIS & VA

Login sebagai salah satu user (biasanya yang pegang rekening):

1. **Profil** → **QRIS & Virtual Account** (`/settings/pembayaran`)
2. **Upload gambar QRIS** (screenshot dari bank / GoPay / OVO)
3. Isi **atas nama rekening**
4. Isi **nomor VA/rekening** per bank yang dipakai (kosongkan yang tidak dipakai)
5. Edit **instruksi** untuk pasangan
6. **Simpan**

Pasangan langsung melihat QR/VA yang sama di halaman checkout.

---

## 11. Alur bayar & konfirmasi

### Yang membayar

1. **Tagihan** → pilih minggu yang belum lunas → **Bayar**
2. Checkout → pilih **QRIS** atau **VA**
3. Transfer sesuai nominal
4. Tap **Saya sudah transfer** (boleh lampirkan bukti foto)

### Yang mengonfirmasi (pasangan)

1. Buka **Tagihan**
2. Banner kuning **Menunggu konfirmasi** → **Konfirmasi pembayaran**
3. Pool balance naik, tagihan jadi **PAID**, streak ter-update

### Fitur lain

| Fitur | Cara |
|-------|------|
| Colek partner | Tagihan → tagihan partner → Colek |
| Top-up pool | Beranda → Uang Lebih |
| Alokasi target | Buka target → alokasi dari pool |
| Edit target | Detail target → edit |

---

## 12. Deploy ke internet (Vercel)

### 12.1 Push ke GitHub

```powershell
cd "f:\Cruell Finance"
git init
git add .
git commit -m "Initial Cruell Finance"
```

Buat repo di GitHub, lalu:

```powershell
git remote add origin https://github.com/USERNAME/cruell-finance.git
git branch -M main
git push -u origin main
```

Pastikan `.env.local` **tidak** ikut commit (harus ada di `.gitignore`).

### 12.2 Import di Vercel

1. https://vercel.com → **Add New Project** → import repo GitHub
2. Framework: **Next.js** (auto)
3. **Environment Variables** — copy semua dari `.env.local`, tapi ganti:

```env
NEXT_PUBLIC_APP_URL=https://nama-project-kamu.vercel.app
```

4. Deploy → tunggu **Ready**

### 12.3 Update Supabase & Google setelah deploy

**Supabase → Authentication → URL Configuration:**

- Site URL: `https://nama-project-kamu.vercel.app`
- Redirect: `https://nama-project-kamu.vercel.app/auth/callback`

**Google Cloud → OAuth client:**

- Tambah origin: `https://nama-project-kamu.vercel.app`
- Redirect Supabase callback tetap `https://xxxxx.supabase.co/auth/v1/callback`

Redeploy tidak perlu untuk perubahan env di Vercel — cukup **Save** env lalu **Redeploy** jika perlu.

---

## 13. Cron: tagihan otomatis & denda

File `vercel.json` sudah mengatur:

| Endpoint | Jadwal | Fungsi |
|----------|--------|--------|
| `/api/cron/generate-periods` | Tanggal 1, 00:00 UTC | Buat tagihan mingguan bulan baru |
| `/api/cron/apply-penalties` | Setiap hari 02:00 UTC | Denda keterlambatan |

**Syarat:** `CRON_SECRET` harus sama di Vercel env.

Vercel Cron otomatis mengirim header auth ke route tersebut di plan yang mendukung cron.

**Tes manual** (PowerShell):

```powershell
$secret = "CRON_SECRET_KAMU"
Invoke-WebRequest -Uri "https://domain-kamu.vercel.app/api/cron/generate-periods" -Method POST -Headers @{ Authorization = "Bearer $secret" }
```

---

## 14. Pasang di HP (PWA)

### Android (Samsung, Xiaomi, dll.)

1. Buka URL production di **Chrome**
2. Login
3. Menu **⋮** → **Install app** / **Tambahkan ke Layar utama**
4. Atau tap banner **Pasang di HP** di app

### iPhone

1. Buka di **Safari** (bukan Chrome)
2. **Share** → **Add to Home Screen**
3. Buka dari ikon di home screen

Panduan singkat juga ada di app: **Profil → Panduan** (`/panduan`).

---

## 15. Midtrans opsional

Hanya kalau mau pembayaran **otomatis** (tanpa konfirmasi manual partner):

1. Daftar https://midtrans.com → sandbox
2. Ambil **Server Key** & **Client Key**
3. Isi di Vercel / `.env.local`
4. **Profil → Pengaturan Pembayaran** → centang **Aktifkan Midtrans**
5. Dashboard Midtrans → **Settings → Configuration → Notification URL:**

   `https://domain-kamu.vercel.app/api/payments/webhook`

Webhook memanggil `settle_period_payment` otomatis.

---

## 16. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Layar "Konfigurasi Diperlukan" | Isi `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY`, restart dev server |
| Google login redirect error | Cek redirect URI di Google Cloud & Supabase URL config |
| `Belum pairing` | Selesaikan onboarding, pastikan 2 user sudah join |
| Upload QR gagal | Jalankan migration `003`, cek bucket `payment_assets` di Storage |
| Konfirmasi pembayaran gagal | Pastikan partner yang konfirmasi (bukan yang bayar) |
| Tagihan kosong | Creator harus jalankan **Time Machine** di onboarding |
| Build error di Vercel | Pastikan semua env wajib terisi termasuk `CRON_SECRET` |
| Realtime tidak update | Cek Replication di Supabase, refresh halaman |
| Midtrans error | Pakai manual payment dulu; atau isi key sandbox yang valid |

### Perintah berguna

```powershell
npm run dev      # development
npm run build    # cek error sebelum deploy
npm run start    # production lokal setelah build
```

---

## Checklist selesai

- [ ] `npm install` & `npm run dev` jalan
- [ ] `schema.sql` + migration `002` + `003` di Supabase
- [ ] Google OAuth aktif + redirect benar
- [ ] `.env.local` lengkap
- [ ] 2 user pairing sukses
- [ ] Time Machine dijalankan
- [ ] QR/VA diupload di pengaturan
- [ ] Tes bayar + konfirmasi partner
- [ ] Deploy Vercel + update URL Supabase/Google
- [ ] Pasang PWA di HP

---

**Butuh bantuan langkah tertentu?** Sebutkan di mana stuck (screenshot error SQL / browser) supaya bisa dilacak spesifik.
