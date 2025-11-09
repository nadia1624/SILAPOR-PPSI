const express = require("express");
const router = express.Router();

// --- 1. IMPOR MODEL ---
// Asumsi model User, Laporan diperlukan oleh controller yang bersangkutan
const { User, Laporan } = require("../models"); 

// --- 2. IMPOR MIDDLEWARE ---
const upload = require('../middleware/UploadMiddleware'); // Middleware Multer
const verifyToken = require ('../middleware/ValidTokenMiddleware'); // Middleware Otentikasi
const role = require("../middleware/CheckRoleMiddleware"); // Middleware Otorisasi

// --- 3. IMPOR KELAS CONTROLLER ---
const AuthController = require("../controllers/AuthController");
const LandingController = require("../controllers/LandingController"); 

// --- 4. INISIALISASI INSTANCE CONTROLLER (DEPENDENCY INJECTION) ---
const authControllerInstance = new AuthController({ User });
const landingControllerInstance = new LandingController({ Laporan, User });

// =================================================================
// ==================== ROUTE LANDING & PUBLIK =====================
// =================================================================

// Landing Page (Menggunakan Controller untuk Statistik Dinamis)
router.get("/", landingControllerInstance.getLandingPage);

// Halaman View Statis (Form)
router.get("/register", (req, res) => {
    res.render("register", { title: "SILAPOR - Register" });
});
router.get("/login", (req, res) => {
    res.render("login", { title: "SILAPOR - Login" });
});

// =================================================================
// ================= ROUTE OTENTIKASI (AUTH) =======================
// =================================================================

// REGISTER & LOGIN
router.post("/register", authControllerInstance.register);
router.post("/login", authControllerInstance.login);
router.post("/logout", authControllerInstance.logout);
router.get("/verify-email", authControllerInstance.verifyEmail);

// FORGET & RESET PASSWORD
router.get("/forget-password", (req, res) => {
    res.render("forgetPassword"); // Tetap menggunakan render view statis
});
router.post("/forget-password", authControllerInstance.forgetPassword);
router.get("/reset-password", authControllerInstance.showResetPasswordForm);
router.post("/reset-password", authControllerInstance.resetPassword);

// GANTI PASSWORD (Harus Login)
router.get("/changePassword", verifyToken, role.checkRole("user"), authControllerInstance.showChangePasswordForm);
router.post("/changePassword", verifyToken, role.checkRole("user"), authControllerInstance.changePassword);


// =================================================================
// ====================== ROUTE PROFIL USER ========================
// =================================================================

// PROFIL (Harus Login)
router.get("/profile", verifyToken, role.checkRole("user"), authControllerInstance.showProfile);
router.get("/update-profile", verifyToken, role.checkRole("user"), authControllerInstance.showEditProfile);
router.post(
    "/update-profile", 
    verifyToken, 
    role.checkRole("user"), 
    upload.single("foto"), 
    authControllerInstance.updateProfile
);


module.exports = router;