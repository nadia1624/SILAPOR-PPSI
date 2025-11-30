const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const fs = require('fs'); 
const path = require('path'); 

const EmailService = require('../services/EmailService'); 

class AuthController {
    /**
     * @param {Object} models 
     */
    constructor(models) {
        this.User = models.User;
        this.emailService = new EmailService();

        this.register = this.register.bind(this);
        this.verifyEmail = this.verifyEmail.bind(this);
        this.login = this.login.bind(this);
        this.forgetPassword = this.forgetPassword.bind(this);
        this.showResetPasswordForm = this.showResetPasswordForm.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.showChangePasswordForm = this.showChangePasswordForm.bind(this);
        this.showChangePasswordAdminForm = this.showChangePasswordAdminForm.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.changePasswordAdmin = this.changePasswordAdmin.bind(this);
        this.logout = this.logout.bind(this);
        this.showProfile = this.showProfile.bind(this);
        this.showEditProfile = this.showEditProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
    }

    async #hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    #generateVerificationToken(email) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const token = jwt.sign(
            { email, rawToken },
            process.env.JWT_SECRET_TOKEN,
            { expiresIn: "15m" }
        );
        return { rawToken, token };
    }

    #checkStrongPassword(password) {
        // Harus minimal 8 karakter, ada huruf besar, huruf kecil, angka, simbol
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return strongPassword.test(password);
    }

    async #processPasswordChange(req, res, viewName, isAdmin) {
        const { old_password, password, confirm_password } = req.body;
        const userEmail = req.user.email; // Asumsi req.user sudah ada dari middleware otentikasi

        try {
            const user = await this.User.findOne({ where: { email: userEmail } });
            if (!user) return res.status(404).send("User tidak ditemukan");

            const isValidOld = await bcrypt.compare(old_password, user.password);
            if (!isValidOld) return res.render(viewName, { error: "Password lama salah." });

            if (!this.#checkStrongPassword(password)) {
                return res.render(viewName, { error: "Password harus minimal 8 karakter dan kombinasi huruf, angka, simbol." });
            }

            if (password !== confirm_password) return res.render(viewName, { error: "Konfirmasi password tidak cocok." });

            user.password = await this.#hashPassword(password);
            await user.save();

            const userProfil = isAdmin ? await this.User.findOne({ where: { email: userEmail } }) : null;

            return res.render(viewName, { success: "Password berhasil diganti.", user: userProfil });
        } catch (err) {
            console.error("Change Password Error:", err);
            return res.status(500).send("Server Error");
        }
    }


    async register(req, res) {
        const { nama, email, no_telepon, alamat, password } = req.body;
        try {
            const existingUser = await this.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(401).render("register", { error: "Email sudah terdaftar." });
            }

            const hashedPassword = await this.#hashPassword(password);
            const { rawToken, token } = this.#generateVerificationToken(email);

            const newUser = await this.User.create({
                nama, email, no_telepon, alamat, role: "user", password: hashedPassword,
                isVerified: false, emailVerifyToken: rawToken, emailVerifyTokenUsed: false,
            });

            try {
                await this.emailService.sendVerificationEmail(newUser, token);
            } catch (emailError) {
                console.error("Failed to send verification email:", emailError.message);
                // Continue even if email fails - for testing purposes
            }
            
            return res.render("checkEmail", { msg: "Registrasi berhasil, silakan cek email untuk verifikasi." });
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }

    async verifyEmail(req, res) {
        const { token } = req.query;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
            const user = await this.User.findOne({ where: { email: decoded.email } });
            
            if (!user) return res.status(404).send("User tidak ditemukan");
            if (user.isVerified) return res.render("login", { msg: "Akun sudah diverifikasi, silakan login." });
            
            if (user.emailVerifyTokenUsed || user.emailVerifyToken !== decoded.rawToken) {
                return res.status(400).send("Token sudah dipakai atau tidak valid.");
            }
            
            user.isVerified = true;
            user.emailVerifyTokenUsed = true;
            user.emailVerifyToken = null;
            await user.save();
            
            return res.render("registerDone", { msg: "Email berhasil diverifikasi, silakan login." });
        } catch (err) {
            console.error("Verify Email Error:", err);
            return res.status(400).send("Token tidak valid atau sudah kadaluarsa");
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await this.User.findOne({ where: { email } });
            
            if (!user) return res.status(404).render("login",{ error: "Email atau Password salah!" });
            if (!user.isVerified) return res.status(401).render("login",{ error: "Email belum diverifikasi. Silakan cek email Anda." });
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) return res.status(401).render("login", { error: "Email atau Password salah!" });

            const token = jwt.sign(
                { email: user.email, role: user.role },
                process.env.JWT_SECRET_TOKEN,
                { expiresIn: 86400 }
            );

            res.cookie("token", token, { httpOnly: true });

            if (user.role === "user") return res.redirect("/mahasiswa/home");
            if (user.role === "admin") return res.redirect("/admin/dashboard");

            res.status(200).send({ auth: true, token: token });
        } catch (err) {
            console.error("Error during login: ", err);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async forgetPassword(req, res) {
        const { email } = req.body;
        try {
            const user = await this.User.findOne({ where: { email } });
            if (!user) return res.render("forgetPassword", { error: "Email tidak terdaftar." });

            const { rawToken, token } = this.#generateVerificationToken(email);

            user.resetPasswordToken = rawToken;
            user.resetPasswordTokenUsed = false;
            await user.save();

            try {
                await this.emailService.sendResetPasswordEmail(user, token);
            } catch (emailError) {
                console.error("Failed to send reset password email:", emailError.message);
                // Continue even if email fails - for testing purposes
            }
            
            return res.render("forgetPassword", { success: "Link reset password sudah dikirim ke email Anda." });
        } catch (err) {
            console.error("Forget Password Error:", err);
            res.status(500).send("Server Error");
        }
    }

    async showResetPasswordForm(req, res) {
        const { token } = req.query;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
            const user = await this.User.findOne({ where: { email: decoded.email } });
            
            if (!user) return res.status(404).send("User tidak ditemukan");
            
            if (user.resetPasswordTokenUsed || user.resetPasswordToken !== decoded.rawToken) {
                return res.status(400).send("Token sudah dipakai atau tidak valid.");
            }
            
            return res.render("resetPassword", { token });
        } catch (err) {
            console.error("Reset Password Token Error:", err);
            return res.status(400).send("Token tidak valid atau sudah kadaluarsa");
        }
    }

    async resetPassword(req, res) {
        const { token, password } = req.body;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
            const user = await this.User.findOne({ where: { email: decoded.email } });
            
            if (!user) return res.status(404).send("User tidak ditemukan");
            if (user.resetPasswordTokenUsed || user.resetPasswordToken !== decoded.rawToken) {
                return res.status(400).send("Token sudah dipakai atau tidak valid.");
            }
            
            if (!this.#checkStrongPassword(password)) {
                return res.render("resetPassword", { token, error: "Password harus minimal 8 karakter dan kombinasi huruf, angka, simbol." });
            }
            
            user.password = await this.#hashPassword(password);
            user.resetPasswordTokenUsed = true;
            user.resetPasswordToken = null;
            await user.save();
            
            return res.render("resetPasswordDone", { msg: "Password berhasil direset. Silakan login." });
        } catch (err) {
            console.error("Reset Password Error:", err);
            return res.status(400).send("Token tidak valid atau sudah kadaluarsa");
        }
    }

    async showChangePasswordForm(req, res) {
        res.render("changePassword");
    }

    async showChangePasswordAdminForm(req, res) {
        const user = await this.User.findOne({ where: { email: req.user.email } });
        res.render("admin/changePasswordadmin", {user} );
    }

    // Menggunakan metode privat #processPasswordChange
    async changePassword(req, res) {
        return this.#processPasswordChange(req, res, "changePassword", false);
    }

    async changePasswordAdmin(req, res) {
        return this.#processPasswordChange(req, res, "admin/changePasswordadmin", true);
    }

    async logout(req, res) {
        try {
            res.clearCookie("token");
            return res.redirect("/"); 
        } catch (err) {
            console.error("Error during logout: ", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async showProfile(req, res) {
        try {
            const userEmail = req.user.email; 
            const user = await this.User.findOne({ where: { email: userEmail } });

            if (!user) return res.status(404).send("User tidak ditemukan");

            res.render("profile", { user });
        } catch (err) {
            console.error("Error showProfile:", err);
            res.status(500).send("Gagal mengambil data profil");
        }
    }

    async showEditProfile(req, res) {
        try {
            const userEmail = req.user.email;
            const user = await this.User.findOne({ where: { email: userEmail } });

            if (!user) return res.status(404).send("User tidak ditemukan");

            res.render("editProfile", { user });
        } catch (err) {
            console.error("Error showEditProfile:", err);
            res.status(500).send("Gagal memuat form edit");
        }
    }

    async updateProfile(req, res) {
        try {
            const userEmail = req.user.email;
            const { nama, alamat, no_telepon } = req.body;

            const user = await this.User.findOne({ where: { email: userEmail } });
            if (!user) return res.status(404).send("User tidak ditemukan");

            // --- Logika file upload (tetap membutuhkan package 'fs') ---
            if (req.file) {
                if (user.foto && user.foto !== "default.jpg") {
                    const oldPath = path.join("public", "upload", user.foto);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                user.foto = req.file.filename;
            }

            // Update field
            user.nama = nama || user.nama;
            user.alamat = alamat || user.alamat;
            user.no_telepon = no_telepon || user.no_telepon; 
            
            await user.save();
            
            return res.redirect("/profile");
        } catch (error) {
            console.error("Error update profile:", error);
            return res.status(500).send("Terjadi kesalahan saat update profile");
        }
    }
}

module.exports = AuthController;