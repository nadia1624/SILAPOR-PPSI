const express = require("express");
const router = express.Router();

// --- 1. IMPOR MODEL ---
// Asumsi model Laporan, User, Claim diperlukan
const { Laporan, User, Claim } = require("../models"); 

// --- 2. IMPOR MIDDLEWARE ---
const UploadMiddleware = require("../middleware/UploadMiddleware"); // Import kelas
const upload = new UploadMiddleware().getUploader(); 
const verifyToken = require("../middleware/ValidTokenMiddleware");
const role = require("../middleware/CheckRoleMiddleware");

// --- 3. IMPOR KELAS CONTROLLER ---
const ClaimController = require("../controllers/ClaimController");
const HistoryController = require("../controllers/HistoryController");
const ReportController = require("../controllers/ReportController");

// --- 4. INISIALISASI INSTANCE CONTROLLER (DEPENDENCY INJECTION) ---
const claimControllerInstance = new ClaimController({ Claim, Laporan, User });
const historyControllerInstance = new HistoryController({ Laporan, User });
const reportControllerInstance = new ReportController({ Laporan, User, Claim });


// =================================================================
// ==================== ROUTE LAPORAN (CRUD) =======================
// =================================================================

// READ: Halaman Utama (Daftar laporan On Progress)
router.get("/home", verifyToken, role.checkRole("user"), reportControllerInstance.getAllReportsUser);

// CREATE: Tampilkan Form
router.get("/reports", verifyToken, role.checkRole("user"), reportControllerInstance.showReportForm);

// CREATE: Submit Laporan
router.post(
  "/reports",
  verifyToken,
  role.checkRole("user"),
  upload.single("foto_barang"),
  reportControllerInstance.createReport
);

// READ: Laporan Saya
router.get("/my-reports", verifyToken, role.checkRole("user"), reportControllerInstance.getUserReports);

// UPDATE: Edit Laporan
router.post(
  "/reports/update/:id",
  verifyToken,
  role.checkRole("user"),
  upload.single("foto_barang"),
  reportControllerInstance.updateReport
);

// DELETE: Hapus Laporan
router.delete("/reports/delete/:id", verifyToken, role.checkRole("user"), reportControllerInstance.deleteReport);

// REAPPLY: Ajukan Ulang Laporan yang Ditolak
router.post(
  "/my-reports/reapply-report/:id_laporan",
  verifyToken,
  role.checkRole("user"),
  upload.single("foto_barang"),
  reportControllerInstance.reapplyReport
);


// =================================================================
// ==================== ROUTE KLAIM BARANG =========================
// =================================================================

// CREATE: Klaim Laporan (Dari halaman Home)
router.post("/claim", verifyToken, role.checkRole("user"), reportControllerInstance.claimReport);

// READ: Klaim Saya
router.get("/my-claim", verifyToken, role.checkRole("user"), claimControllerInstance.getMyClaims);

// CANCEL: Batalkan Klaim
router.post("/my-claim/cancel/:id_laporan", verifyToken, role.checkRole("user"), claimControllerInstance.cancelClaim);

// ACCEPT CLAIM: Terima Klaim dari Pengklaim (Dilakukan oleh Pelapor/Mahasiswa)
router.post(
  "/my-reports/accept-claim/:id_laporan",
  verifyToken,
  role.checkRole("user"),
  upload.single("bukti"),
  reportControllerInstance.acceptClaim
);

// REJECT CLAIM: Tolak Klaim dari Pengklaim (Dilakukan oleh Pelapor/Mahasiswa)
router.post(
  "/my-reports/reject-claim/:id_laporan",
  verifyToken,
  role.checkRole("user"),
  reportControllerInstance.rejectClaim
);


// =================================================================
// =================== ROUTE RIWAYAT (HISTORY) =====================
// =================================================================

// READ: Daftar Riwayat Laporan (Status Done)
router.get("/history", verifyToken, role.checkRole("user"), historyControllerInstance.getDoneReports);

// READ: Detail Riwayat Laporan
router.get("/history/:id", verifyToken, role.checkRole("user"), historyControllerInstance.getReportHistoryById);

// DOWNLOAD: Laporan PDF
router.get("/history/download/:id", verifyToken, role.checkRole("user"), historyControllerInstance.downloadReportPdf);


module.exports = router;