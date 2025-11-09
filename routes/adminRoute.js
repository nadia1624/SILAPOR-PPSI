const express = require("express");
const router = express.Router();
const path = require("path");

const { Laporan, User, Claim } = require("../models"); 

const UploadMiddleware = require("../middleware/UploadMiddleware"); // Import kelas
const upload = new UploadMiddleware().getUploader(); 
const verifyToken = require("../middleware/ValidTokenMiddleware"); 
const role = require("../middleware/CheckRoleMiddleware"); 

const AuthController = require("../controllers/AuthController");
const ClaimController = require("../controllers/ClaimController");
const HistoryController = require("../controllers/HistoryController");
const ReportController = require("../controllers/ReportController");
const UserController = require("../controllers/UserController");
const VerificationController = require("../controllers/VerificationController");


const authControllerInstance = new AuthController({ User });
const claimControllerInstance = new ClaimController({ Claim, Laporan, User });
const historyControllerInstance = new HistoryController({ Laporan, User });
const reportControllerInstance = new ReportController({ Laporan, User, Claim });
const userControllerInstance = new UserController({ User });
const verificationControllerInstance = new VerificationController({ Laporan, User });


// DASHBOARD
router.get("/dashboard", verifyToken, role.checkRole("admin"), reportControllerInstance.getDashboard);
router.get("/pengajuan", verifyToken, role.checkRole("admin"), reportControllerInstance.getAllReportsAdmin); // Laporan Status On Progress

// Laporan Admin yang Dibuat Sendiri (My Reports)
router.get("/my-reports", verifyToken, role.checkRole("admin"), reportControllerInstance.getAdminReports);
router.get("/reports", verifyToken, role.checkRole("admin"), reportControllerInstance.showAdminReportForm);

// CREATE & UPDATE LAPORAN (ADMIN)
router.post(
  "/reports",
  verifyToken,
  role.checkRole("admin"),
  upload.single("foto_barang"),
  reportControllerInstance.createReportAdmin
);
router.post(
  "/reports/update/:id",
  verifyToken,
  role.checkRole("admin"),
  upload.single("foto_barang"),
  reportControllerInstance.updateReportAdmin
);
router.delete(
  "/reports/delete/:id",
  verifyToken,
  role.checkRole("admin"),
  reportControllerInstance.deleteReportAdmin
);
router.post(
  "/my-reports/reapply-report/:id_laporan",
  verifyToken,
  role.checkRole("admin"),
  reportControllerInstance.reapplyReportAdmin
);


router.get("/verifikasi", verifyToken, role.checkRole("admin"), verificationControllerInstance.getPendingReports);
router.post("/verifikasi/:id", verifyToken, role.checkRole("admin"), verificationControllerInstance.verifyReport);


router.post("/claim", verifyToken, role.checkRole("admin"), reportControllerInstance.claimReport);


router.get("/my-claim", verifyToken, role.checkRole("admin"), claimControllerInstance.getMyClaimsAdmin);
router.post("/my-claim/cancel/:id_laporan", verifyToken, role.checkRole("admin"), claimControllerInstance.cancelClaimAdmin);

router.post(
  "/my-reports/reject-claim/:id_laporan",
  verifyToken,
  role.checkRole("admin"),
  reportControllerInstance.rejectClaim
);
router.post(
  "/my-reports/accept-claim/:id_laporan", 
  verifyToken,
  role.checkRole("admin"),
  upload.single("bukti"),
  reportControllerInstance.acceptClaimAdmin
);

router.get("/userList", verifyToken, role.checkRole("admin"), userControllerInstance.listUsers);
router.post("/userList/delete/:email", verifyToken, role.checkRole("admin"), userControllerInstance.deleteUser);
router.post("/userList/create", verifyToken, role.checkRole("admin"), userControllerInstance.createUser);
router.post("/userList/update/:email", verifyToken, role.checkRole("admin"), userControllerInstance.updateUser);

// PROFIL
router.get("/profile", verifyToken, role.checkRole("admin"), userControllerInstance.showAdminProfile);
router.get("/edit-profile", verifyToken, role.checkRole("admin"), userControllerInstance.showAdminEditProfile);
router.post(
  "/update-profile",
  verifyToken,
  role.checkRole("admin"),
  upload.single("foto"),
  userControllerInstance.updateAdminProfile
);

// GANTI PASSWORD
router.get("/changePassword", verifyToken, role.checkRole("admin"), authControllerInstance.showChangePasswordAdminForm);
router.post("/changePassword", verifyToken, role.checkRole("admin"), authControllerInstance.changePasswordAdmin);


router.get("/history", verifyToken, role.checkRole("admin"), historyControllerInstance.getDoneReportsAdmin);
router.get("/history/:id", verifyToken, role.checkRole("admin"), historyControllerInstance.getReportHistoryByIdAdmin);
router.get("/history/download/:id", verifyToken, role.checkRole("admin"), historyControllerInstance.downloadReportPdfAdmin);


module.exports = router;