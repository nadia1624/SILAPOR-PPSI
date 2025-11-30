====================================================================
          USE CASE TESTING - REGISTER FEATURE
====================================================================

FILE YANG DIBUAT:
-----------------
1. jest.e2e.config.js                    - Konfigurasi Jest untuk E2E testing
2. tests/e2e/setup.test.js               - Test verifikasi Selenium setup
3. tests/e2e/register.usecase.test.js    - Test use case register (16 test cases)

DEPENDENCIES YANG DIPERLUKAN:
------------------------------
✅ selenium-webdriver v4.38.0  (sudah ada)
✅ chromedriver v139           (sudah ada)
✅ jest v29.7.0                (sudah ada)
✅ @types/jest v30.0.0         (sudah ada)

CARA MENJALANKAN:
-----------------

1. Pastikan server aplikasi berjalan di terminal terpisah:
   Terminal 1 (bash):
   $ npm start

2. Jalankan test di terminal lain:
   Terminal 2 (powershell):
   
   a. Test setup (verifikasi Selenium):
      > npm run test:e2e:debug
      atau
      > npx jest tests/e2e/setup.test.js --config=jest.e2e.config.js

   b. Test register saja:
      > npx jest tests/e2e/register.usecase.test.js --config=jest.e2e.config.js

   c. Semua E2E tests:
      > npm run test:e2e

TEST CASES YANG DICOVER:
------------------------

A. MAIN SUCCESS SCENARIO (1 test):
   ✓ UC-REG-001: User berhasil mendaftar dengan data valid

B. ALTERNATIVE FLOWS (2 tests):
   ✓ UC-REG-002: Password minimal 8 karakter
   ✓ UC-REG-003: Nama dengan panjang maksimal

C. EXCEPTION FLOWS (8 tests):
   ✓ UC-REG-004: Email duplikat (sudah terdaftar)
   ✓ UC-REG-005: Field kosong (nama kosong)
   ✓ UC-REG-006: Password lemah (<8 karakter)
   ✓ UC-REG-007: Password tanpa huruf besar
   ✓ UC-REG-008: Password tanpa angka
   ✓ UC-REG-009: Password tanpa simbol
   ✓ UC-REG-010: Konfirmasi password tidak cocok
   ✓ UC-REG-011: Format email tidak valid

D. UI/UX TESTING (3 tests):
   ✓ UC-REG-012: Semua field input tersedia
   ✓ UC-REG-013: Link navigasi ke login
   ✓ UC-REG-014: Toggle password visibility

E. BOUNDARY VALUE TESTING (2 tests):
   ✓ UC-REG-015: Password tepat 8 karakter (minimum)
   ✓ UC-REG-016: Email format edge case (subdomain)

TOTAL: 16 test cases

TEKNOLOGI YANG DIGUNAKAN:
--------------------------
- Selenium WebDriver: Automasi browser Chrome
- Jest: Test runner dan assertion
- ChromeDriver: Driver untuk Chrome browser
- Headless Chrome: Testing tanpa tampilan GUI

CATATAN PENTING:
----------------
1. Tests menggunakan form.submit() untuk bypass client-side validation
   karena kita ingin test server-side validation dan response
   
2. Pastikan Chrome browser versi 139 atau kompatibel dengan ChromeDriver 139

3. Jika test gagal dengan timeout:
   - Periksa apakah server running (npm start di terminal lain)
   - Periksa port 3000 tidak digunakan aplikasi lain
   - Coba tingkatkan timeout di jest.e2e.config.js

4. Test UC-REG-004 memerlukan waktu lebih lama karena registrasi 2x
   (untuk test duplikat email)

5. Validation tests (UC-REG-005 s/d UC-REG-011) menguji client-side
   validation HTML5 dan JavaScript

TROUBLESHOOTING:
----------------
ERROR: ChromeDriver version mismatch
FIX: npm install --save-dev chromedriver@139

ERROR: Chrome binary not found  
FIX: Sesuaikan path di setChromeBinaryPath() di file test

ERROR: Connection refused / ECONNREFUSED
FIX: Pastikan server running dengan 'npm start'

ERROR: Timeout after 60000ms
FIX: Tingkatkan testTimeout di jest.e2e.config.js

STRUKTUR ALUR REGISTER:
-----------------------
1. User buka /register
2. Isi form (nama, email, telepon, alamat, password, confirm_password)
3. Submit form → POST /register
4. AuthController.register():
   - Cek email duplikat
   - Hash password
   - Create user dengan isVerified=false
   - Generate token verifikasi
   - Kirim email verifikasi
   - Render checkEmail.ejs
5. User klik link di email → GET /verify-email?token=xxx
6. AuthController.verifyEmail():
   - Verify JWT token
   - Set isVerified=true
   - Render registerDone.ejs

EXPECTED RESULTS:
-----------------
✅ Setup test: PASS (1/1)
⏳ Register tests: Tunggu hasil setelah server running

Hasil lengkap akan menunjukkan:
- Test Suites: X passed, Y total
- Tests: X passed, Y total
- Snapshots: 0 total
- Time: ~XX s
