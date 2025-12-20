# SILAPOR BrowserStack Cross-Browser Compatibility Testing

## Overview

Script untuk melakukan cross-browser compatibility testing pada aplikasi SILAPOR menggunakan BrowserStack.

## Browser/OS yang Di-test

| Platform | Browser | Status |
|----------|---------|--------|
| Windows 11 | Chrome (Latest) | ✅ Supported |
| Windows 11 | Edge (Latest) | ✅ Supported |
| macOS Sonoma | Chrome (Latest) | ✅ Supported |
| macOS Sonoma | Safari (Latest) | ✅ Supported |
| Android 13 | Chrome | ✅ Supported |
| iOS 17 | Safari | ✅ Supported |

## Test Cases

1. **Landing Page Load** - Memastikan halaman landing terbuka dengan benar
2. **Login Page Navigation** - Memastikan halaman login dapat diakses
3. **Register Page Navigation** - Memastikan halaman register dapat diakses
4. **Login Flow** - Memastikan proses login berfungsi
5. **Responsive Design** - Mengecek tampilan responsif

## Setup

### 1. Install Dependencies

```bash
cd browserstack-tests
npm install
```

### 2. Konfigurasi Credentials

Buat file `.env` berdasarkan `.env.example`:

```env
BROWSERSTACK_USERNAME=storaapp_hSu6ED
BROWSERSTACK_ACCESS_KEY=xpPrqCx7xJb2FNbeVqey
BASE_URL=https://silapor.neotelemetri.id
TEST_EMAIL=nadyadearihanifah@gmail.com
TEST_PASSWORD=Nadia123_
```

## Cara Menjalankan

### Test Semua Browser

```bash
npm test
# atau
node browserstack-test.js all
```

### Test Browser Spesifik

```bash
# Windows Chrome
node browserstack-test.js windows-chrome

# Windows Edge
node browserstack-test.js windows-edge

# macOS Chrome
node browserstack-test.js macos-chrome

# macOS Safari
node browserstack-test.js macos-safari

# Android Chrome
node browserstack-test.js android-chrome

# iOS Safari
node browserstack-test.js ios-safari
```

## Hasil Test

Hasil test dapat dilihat di:
- **Console output** - Summary langsung di terminal
- **BrowserStack Dashboard** - https://automate.browserstack.com/dashboard

## Non-Functional Requirements

Sesuai NFR SILAPOR:
- ✅ Sistem dapat digunakan pada semua perangkat desktop dan mobile
- ✅ Sistem kompatibel dengan berbagai browser modern
- ✅ Komunikasi menggunakan HTTPS

---

**Dibuat untuk:** SILAPOR PPSI - Universitas Andalas  
**Target URL:** https://silapor.neotelemetri.id/  
**Terakhir diupdate:** Desember 2024
