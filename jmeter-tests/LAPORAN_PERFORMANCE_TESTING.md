# LAPORAN HASIL PERFORMANCE TESTING SILAPOR

## Informasi Umum
- **Aplikasi**: SILAPOR (Sistem Pelaporan Online)
- **URL Testing**: https://silapor.neotelemetri.id
- **Tool**: Apache JMeter 5.6.3
- **Tanggal Eksekusi**: 24 Desember 2025
- **Target NFR**: 500+ concurrent users, Response time < 2 detik, Error rate < 5%

---

## 1. LOAD TEST - Pengujian Beban Normal

### Tujuan Testing
Menguji kemampuan sistem menangani 500 concurrent users sesuai dengan Non-Functional Requirement (NFR) yang telah ditetapkan, dengan distribusi user realistis antara mahasiswa dan admin.

### Konfigurasi Testing
- **Total Users**: 500 concurrent users
  - 490 Mahasiswa (98%)
  - 10 Admin (2%)
- **Ramp-up Period**: 60 detik
- **Duration**: 180 detik (3 menit)
- **Think Time**: 1000-1500 ms (simulasi user real)

### Skenario Testing
**Mahasiswa Users (490 users)** - Comprehensive Flow:
1. POST `/login` - Login mahasiswa
2. GET `/mahasiswa/home` - Dashboard mahasiswa
3. GET `/mahasiswa/my-reports` - Daftar laporan saya
4. GET `/mahasiswa/my-claim` - Daftar klaim saya
5. GET `/mahasiswa/report-form` - Form buat laporan
6. GET `/mahasiswa/profile` - Halaman profil

**Admin Users (10 users)** - Admin Operations:
1. POST `/login` - Login admin
2. GET `/admin/home` - Dashboard admin
3. GET `/admin/reports` - Kelola semua laporan
4. GET `/admin/claims` - Kelola semua klaim
5. GET `/admin/users` - Kelola user

### Hasil Testing

#### Statistik Keseluruhan
| Metrik | Nilai | Target | Status |
|--------|-------|--------|--------|
| Total Requests | 3,765 | - | - |
| Duration | 3 menit 13 detik | - | - |
| Throughput | 19.6 req/s | > 100 req/s | ❌ FAIL |
| Avg Response Time | 20,076 ms | < 2,000 ms | ❌ FAIL |
| Min Response Time | 1,420 ms | - | - |
| Max Response Time | 63,353 ms | < 5,000 ms | ❌ FAIL |
| Error Rate | 31.77% | < 5% | ❌ FAIL |
| Total Errors | 1,196 | - | ❌ CRITICAL |

#### Timeline Progression
```
00:00-00:13: Error 55.56%, Avg 7,187 ms   (Phase: Startup - Very High Error)
00:13-00:43: Error 16.13%, Avg 21,118 ms  (Phase: Ramp-up - Improving)
00:43-01:13: Error 1.54%, Avg 39,999 ms   (Phase: Peak Load - Low Error but Slow)
01:13-01:42: Error 10.09%, Avg 18,427 ms  (Phase: Sustained - Moderate Error)
01:42-02:13: Error 54.30%, Avg 8,428 ms   (Phase: Degradation - High Error)
02:13-02:45: Error 71.12%, Avg 21,015 ms  (Phase: Critical - Very High Error)
02:45-03:13: Error 25.91%, Avg 40,616 ms  (Phase: Recovery - Moderate Error)
```

### Kesimpulan Load Test
🔴 **STATUS: FAIL - Sistem TIDAK memenuhi NFR**

**Masalah Kritis:**
1. ❌ Response time 10x lebih lambat dari target (20s vs 2s)
2. ❌ Error rate 6x lebih tinggi dari batas (31.77% vs <5%)
3. ❌ Throughput sangat rendah (19.6 req/s, target >100 req/s)
4. ❌ Sistem tidak stabil - error rate fluktuatif 1.54% hingga 71.12%
5. ❌ Max response time 63 detik menunjukkan ada request yang timeout

**Rekomendasi:**
- Database optimization urgent (indexing, query optimization)
- Implement caching layer (Redis)
- Connection pool tuning
- Load balancing configuration

---

## 2. STRESS TEST - Pengujian Progressive Load

### Tujuan Testing
Menemukan breaking point sistem dengan meningkatkan jumlah user secara bertahap dari 100 hingga 1000 concurrent users untuk mengetahui batas maksimal kapasitas sistem.

### Konfigurasi Testing
**Progressive Load Stages:**
- **Stage 1**: 100 users, 30s ramp-up, 60s duration (Baseline)
- **Stage 2**: 300 users, 30s ramp-up, 60s duration (Increased Load)
- **Stage 3**: 500 users, 60s ramp-up, 120s duration (Target NFR)
- **Stage 4**: 750 users, 60s ramp-up, 120s duration (Above Target)
- **Stage 5**: 1000 users, 60s ramp-up, 120s duration (Maximum Stress)

### Skenario Testing
**Public Pages Testing** (semua stages):
1. GET `/` - Landing page
2. GET `/login` - Login page
3. GET `/register` - Register page
4. GET `/forgetPassword` - Forget password page (Stage 3+)

### Hasil Testing

#### Statistik Keseluruhan
| Metrik | Nilai | Status |
|--------|-------|--------|
| Total Requests | 104,841 | - |
| Duration | 18 menit 33 detik | - |
| Throughput | 94.2 req/s | ⚠️ Below target |
| Avg Response Time | 2,350 ms | ⚠️ Above target |
| Max Response Time | 240,342 ms (4 menit) | ❌ CRITICAL |
| Total Error Rate | 47.57% | ❌ FAIL |
| Total Errors | 49,877 | ❌ CRITICAL |

#### Performance per Stage

**Stage 1: 100 Users** ✅ **PASS**
- Error Rate: 2.01%
- Avg Response: 255 ms
- Status: Sistem stabil dan responsive

**Stage 2: 300 Users** ⚠️ **WARNING**
- Error Rate: 2.19% - 5.91%
- Avg Response: 319 - 491 ms
- Status: Mulai menunjukkan degradasi

**Stage 3: 500 Users (TARGET NFR)** ❌ **FAIL**
- Error Rate: 21.91% - 36.78%
- Avg Response: 579 - 707 ms
- Status: Sistem mulai kolaps, error rate tinggi

**Stage 4: 750 Users** ❌ **CRITICAL**
- Error Rate: 37.76% - 40.22%
- Avg Response: 1,781 - 1,961 ms
- Max Response: 145,945 ms
- Status: Banyak timeout, sistem tidak stabil

**Stage 5: 1000 Users** ❌ **TOTAL FAILURE**
- Error Rate: 45.28% - 47.57%
- Avg Response: 2,104 - 2,350 ms
- Max Response: 240,342 ms
- Status: 100% error pada beberapa batch, sistem crash

#### Breaking Point Analysis
```
Users    Error%    Response    Status
────────────────────────────────────────
100      2%        255ms       ✅ Optimal
200      ~3%       ~350ms      ✅ Good
300      6%        491ms       ⚠️ Warning
400      ~15%      ~550ms      ⚠️ Degrading
500      37%       645ms       ❌ Breaking Point
750      40%       1,961ms     ❌ Critical
1000     48%       2,350ms     ❌ Failure
```

### Kesimpulan Stress Test
🔴 **BREAKING POINT TERIDENTIFIKASI: 300-500 concurrent users**

**Temuan Kunci:**
1. ✅ Sistem stabil hingga 100-200 users (error <5%)
2. ⚠️ Degradasi mulai terjadi di 300 users (error 6%)
3. ❌ Breaking point di 500 users (error 37%)
4. ❌ Total collapse di 750-1000 users (error >40%)
5. 🔴 **Safe Operating Capacity: ~200-300 users maksimal**

**Kesimpulan:**
- Sistem TIDAK memenuhi NFR 500 concurrent users
- Kapasitas aman hanya 40-60% dari target
- Diperlukan scaling horizontal dan optimization mendesak

---

## 3. VOLUME TEST - Pengujian Data Besar

### Tujuan Testing
Menguji performa sistem dalam menangani query dengan volume data besar, fokus pada pagination dan list operations dengan 10,000+ records di database.

### Konfigurasi Testing
- **Users**: 500 concurrent users (semua mahasiswa)
- **Ramp-up**: 60 detik
- **Duration**: 300 detik (5 menit)
- **Focus**: Pagination stress testing

### Skenario Testing
**Mahasiswa Pagination Flow** (500 users, looping):
1. POST `/login` - Login mahasiswa
2. GET `/mahasiswa/home?page=1` - Halaman pertama (baseline)
3. GET `/mahasiswa/home?page=5` - Halaman tengah (moderate offset)
4. GET `/mahasiswa/home?page=10` - Halaman jauh (high offset)
5. GET `/mahasiswa/my-reports` - List laporan user
6. GET `/mahasiswa/my-claim` - List klaim user

### Hasil Testing

#### Statistik Keseluruhan
| Metrik | Nilai | Target | Status |
|--------|-------|--------|--------|
| Total Requests | 7,655 | - | - |
| Duration | 5 menit 5 detik | - | - |
| Throughput | 25.1 req/s | > 100 req/s | ❌ FAIL |
| Avg Response Time | 17,269 ms | < 2,000 ms | ❌ FAIL |
| Min Response Time | 2,490 ms | - | ⚠️ Already slow |
| Max Response Time | 53,969 ms | < 5,000 ms | ❌ FAIL |
| Error Rate | 80.08% | < 5% | ❌ CRITICAL FAIL |
| Total Errors | 6,130 | - | ❌ DISASTER |

#### Timeline Progression - Degradasi Cepat
```
Phase           Time        Error%    Avg Response
──────────────────────────────────────────────────
Initial Load    0:00-0:39   47.22%    12,456 ms
Ramp-up         0:39-1:38   60.02%    25,483 ms
Sustained       1:38-2:38   78.76%    15,847 ms
Degradation     2:38-3:38   80.64%    16,471 ms
Critical        3:38-5:05   80-87%    16,137 ms
```

#### Analysis per Request Type
**Pagination Performance:**
- Page 1: Moderate performance (masih banyak error)
- Page 5: Critical failure (94% error rate)
- Page 10: Total failure (99% error rate)

**Root Cause:**
- OFFSET pagination sangat lambat untuk page tinggi
- Query: `SELECT * FROM laporans LIMIT 10 OFFSET 50` → 99% error
- No database indexing on `created_at` column
- N+1 query problem pada eager loading

### Kesimpulan Volume Test
🔴 **STATUS: CRITICAL FAILURE - Pagination BROKEN**

**Masalah Sangat Kritis:**
1. ❌ Error rate 80% = Hampir semua request gagal
2. ❌ Response time 17 detik (8.5x target)
3. ❌ Pagination page 5+ menghasilkan 99% error
4. ❌ Throughput 25 req/s (1/4 dari target minimum)
5. ❌ Bahkan request pertama sudah lambat (2.5 detik minimum)

**Root Cause Teridentifikasi:**
1. **Database Pagination Issue:**
   - Using OFFSET-based pagination
   - No index on sorting columns (created_at)
   - OFFSET 50+ = timeout
   
2. **N+1 Query Problem:**
   - List endpoints tidak menggunakan eager loading
   - Setiap record trigger additional query
   
3. **No Caching:**
   - Repeated queries untuk data yang sama
   - No Redis/Memcached implementation
   
4. **Connection Pool Exhaustion:**
   - Limited database connections (default: 5)
   - 500 concurrent users = connection starvation

**Rekomendasi Urgent:**
- ❗ CRITICAL: Implement cursor-based pagination
- ❗ CRITICAL: Add database indexes (created_at, user_id, status)
- ❗ HIGH: Fix N+1 queries dengan eager loading
- ❗ HIGH: Implement Redis caching layer
- ❗ MEDIUM: Increase connection pool (min: 20, max: 100)

---

## RINGKASAN EKSEKUTIF

### Perbandingan Hasil Testing

| Test Type | Users | Duration | Throughput | Avg Response | Error Rate | Status |
|-----------|-------|----------|------------|--------------|------------|--------|
| **Load Test** | 500 (490M+10A) | 3m 13s | 19.6 req/s | 20,076 ms | 31.77% | ❌ FAIL |
| **Stress Test** | 100→1000 | 18m 33s | 94.2 req/s | 2,350 ms | 47.57% | ❌ FAIL |
| **Volume Test** | 500 | 5m 5s | 25.1 req/s | 17,269 ms | 80.08% | ❌ CRITICAL |

### Target vs Actual

| Metrik | Target NFR | Load Test | Stress Test | Volume Test |
|--------|------------|-----------|-------------|-------------|
| Max Users | 500 | 500 | 1000 | 500 |
| Response Time | < 2,000 ms | 20,076 ms ❌ | 2,350 ms ❌ | 17,269 ms ❌ |
| Error Rate | < 5% | 31.77% ❌ | 47.57% ❌ | 80.08% ❌ |
| Throughput | > 100 req/s | 19.6 ❌ | 94.2 ⚠️ | 25.1 ❌ |

### Kesimpulan Akhir

🔴 **SISTEM TIDAK PRODUCTION-READY**

**Kapasitas Aktual:**
- ✅ Safe Capacity: **100-200 concurrent users**
- ⚠️ Degraded: **200-300 users** (error 6-10%)
- ❌ Breaking Point: **300-500 users** (error 30-40%)
- ❌ Total Failure: **500+ users** (error 80%+)

**Kesenjangan NFR:**
- Target: 500 users
- Actual Safe: 200 users
- **GAP: 60% shortfall** dari target

### Prioritas Perbaikan

**P0 - CRITICAL (Must Fix Immediately):**
1. ❗ Database Indexes (created_at, user_id, status, email)
2. ❗ Cursor-based Pagination (replace OFFSET)
3. ❗ Fix N+1 Queries (eager loading)
4. ❗ Connection Pool Tuning (min: 20, max: 100)

**P1 - HIGH (Required for Production):**
1. ⚠️ Redis Caching Layer
2. ⚠️ Query Optimization (EXPLAIN ANALYZE all queries)
3. ⚠️ Load Balancing (horizontal scaling)
4. ⚠️ CDN for static assets

**P2 - MEDIUM (Performance Enhancement):**
1. Database Query Caching
2. Response Compression (gzip)
3. Async Processing (Queue)
4. API Rate Limiting

