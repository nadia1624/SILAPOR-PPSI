// controllers/ReportController.js

const { where } = require("sequelize");
const path = require("path");
const fs = require("fs");
const ReportService = require("../services/ReportService");

class ReportController {
    /**
     * @param {Object} models - Objek yang berisi model Laporan, User, dan Claim
     */
    constructor(models) {
        this.Laporan = models.Laporan;
        this.User = models.User;
        this.Claim = models.Claim;
        this.reportService = new ReportService();

        // Binding semua method
        this.showReportForm = this.showReportForm.bind(this); //done
        this.showAdminReportForm = this.showAdminReportForm.bind(this); //done
        this.getAdminReports = this.getAdminReports.bind(this); //done
        this.createReport = this.createReport.bind(this); //done
        this.createReportAdmin = this.createReportAdmin.bind(this); //done
        this.getUserReports = this.getUserReports.bind(this); //private
        this.getDashboard = this.getDashboard.bind(this); //done
        this.getAllReportsUser = this.getAllReportsUser.bind(this); //done
        this.getAllReportsAdmin = this.getAllReportsAdmin.bind(this); //done
        this.claimReport = this.claimReport.bind(this); //done
        this.updateReport = this.updateReport.bind(this); //done
        this.updateReportAdmin = this.updateReportAdmin.bind(this); //done
        this.deleteReport = this.deleteReport.bind(this); //done
        this.deleteReportAdmin = this.deleteReportAdmin.bind(this); //done
        this.acceptClaim = this.acceptClaim.bind(this); //done
        this.acceptClaimAdmin = this.acceptClaimAdmin.bind(this); //done
        this.reapplyReport = this.reapplyReport.bind(this); //done
        this.reapplyReportAdmin = this.reapplyReportAdmin.bind(this); //done
        this.rejectClaim = this.rejectClaim.bind(this); //done
    }

    // --- METODE UTILITY (Private/Helper) ---

    /**
     * Helper untuk mengambil data laporan dengan eager loading model Claim dan User.
     * @param {Object} whereClause - Kondisi WHERE Sequelize.
     */
    #getReportsWithIncludes(whereClause) {
        return this.Laporan.findAll({
            where: whereClause,
            include: [
                { model: this.User, attributes: ["nama", "email"] },
                {
                    model: this.Claim,
                    attributes: ["email", "tanggal_claim"],
                    include: [{ model: this.User, attributes: ["nama", "email", "no_telepon", "alamat"] }],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    // Helper untuk membuat laporan baru (Digunakan oleh User dan Admin)
    async #processCreateReport(req, res, isAdmin = false) {
        const { jenis_laporan, nama_barang, lokasi_kejadian, tanggal_kejadian, deskripsi } = req.body;
        const userEmail = req.user.email;

        // Validasi
        if (!jenis_laporan || !nama_barang || !lokasi_kejadian || !tanggal_kejadian || !deskripsi) {
            this.reportService.cleanupUploadedFile(req);
            return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        }

        const statusLaporan = isAdmin ? "On Progress" : "Waiting for upload verification";

        const reportData = {
            email: userEmail,
            jenis_laporan,
            nama_barang,
            lokasi: lokasi_kejadian,
            deskripsi,
            foto_barang: req.file ? req.file.filename : null,
            status: statusLaporan,
            tanggal_kejadian: new Date(tanggal_kejadian),
            tanggal_laporan: new Date(),
        };

        try {
            const create = await this.Laporan.create(reportData);

            // Notifikasi hanya untuk User biasa
            if (!isAdmin) {
                this.reportService.sendRealtimeNotification(req, create);
                this.reportService.sendNewReportEmail({ ...reportData, userEmail });
                return res.redirect("/mahasiswa/my-reports");
            } else {
                return res.redirect("/admin/my-reports");
            }
        } catch (error) {
            console.error("Error creating report:", error);
            this.reportService.cleanupUploadedFile(req);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan saat menyimpan laporan" });
        }
    }

    // Helper untuk update laporan
    async #processUpdateReport(req, res, isSelfUpdate = true) {
        const { id } = req.params;
        const { nama_barang, lokasi_kejadian, deskripsi } = req.body;
        const userEmail = req.user.email;
        const redirectPath = isSelfUpdate ? "/mahasiswa/my-reports" : "/admin/my-reports";

        try {
            const whereCondition = { id_laporan: id };
            if (isSelfUpdate) whereCondition.email = userEmail; // User hanya bisa update laporan sendiri

            const laporan = await this.Laporan.findOne({ where: whereCondition });

            if (!laporan) return res.status(404).json({ message: "Laporan tidak ditemukan" });
            
            // Validasi: Pastikan admin hanya bisa update laporannya sendiri (sesuai kode sebelumnya)
            if (!isSelfUpdate && laporan.email !== userEmail) {
                 return res.status(403).json({ success: false, message: "Anda tidak berhak mengedit laporan ini." });
            }

            laporan.nama_barang = nama_barang || laporan.nama_barang;
            laporan.lokasi = lokasi_kejadian || laporan.lokasi;
            laporan.deskripsi = deskripsi || laporan.deskripsi;

            if (req.file) {
                if (laporan.foto_barang) this.reportService.deleteOldFile(laporan.foto_barang);
                laporan.foto_barang = req.file.filename;
            }

            await laporan.save();
            return res.redirect(redirectPath);
        } catch (error) {
            console.error("Error update report:", error);
            this.reportService.cleanupUploadedFile(req);
            return res.status(500).json({ message: error.message });
        }
    }

    // Helper untuk delete laporan
    async #processDeleteReport(req, res, isSelfDelete = true) {
        const { id } = req.params;
        const userEmail = req.user.email;
        
        try {
            const whereCondition = { id_laporan: id };
            if (isSelfDelete) whereCondition.email = userEmail; 

            const laporan = await this.Laporan.findOne({ where: whereCondition });

            if (!laporan) return res.json({ success: false, message: "Laporan tidak ditemukan" });
            
            if (laporan.foto_barang) this.reportService.deleteOldFile(laporan.foto_barang);

            await laporan.destroy();
            res.json({ success: true, message: "Laporan berhasil dihapus" });
        } catch (error) {
            console.error("Error delete report:", error);
            res.json({ success: false, message: "Terjadi kesalahan saat menghapus laporan" });
        }
    }

    // Helper untuk accept claim
    async #processAcceptClaim(req, res, isAdmin = false) {
        const { id_laporan } = isAdmin ? req.params : req.params; // Perlu konsisten di route
        const { lokasi_penyerahan, tanggal_penyerahan, nama_pengklaim, no_telepon_pengklaim } = req.body;

        if (!lokasi_penyerahan || !nama_pengklaim || !no_telepon_pengklaim || !tanggal_penyerahan || !req.file) {
            return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        }

        try {
            const claimRecord = await this.Claim.findOne({ where: { id_laporan: id_laporan, status: "Waiting for approval" } });

            if (!claimRecord) return res.status(404).json({ success: false, message: "Claim tidak ditemukan atau sudah diproses" });

            claimRecord.status = "Done";
            await claimRecord.save();
            
            const laporan = await this.Laporan.findByPk(id_laporan);
            if (!laporan) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
            
            // Validasi kepemilikan
            if (laporan.email !== req.user.email) {
                return res.status(403).json({ success: false, message: "Kamu tidak berhak menerima claim untuk laporan ini" });
            }

            // Update Laporan
            laporan.status = "Done";
            laporan.lokasi_penyerahan = lokasi_penyerahan;
            laporan.tanggal_penyerahan = new Date(tanggal_penyerahan);
            laporan.pengklaim = nama_pengklaim;
            laporan.no_hp_pengklaim = no_telepon_pengklaim;
            laporan.foto_bukti = req.file ? req.file.filename : null;
            await laporan.save();
            
            // Redirect sesuai role
            const redirectPath = isAdmin ? "/admin/history" : "/mahasiswa/history";
            return res.redirect(redirectPath);
        } catch (error) {
            console.error("Error accepting claim:", error);
            this.reportService.cleanupUploadedFile(req);
            res.status(500).json({ success: false, message: "Terjadi kesalahan saat menerima claim" });
        }
    }

    // Helper untuk reapply report
    async #processReapplyReport(req, res, isAdmin = false) {
        const { id_laporan } = req.params;
        const redirectPath = isAdmin ? "/admin/my-reports" : "/mahasiswa/my-reports";

        try {
        const laporan = await this.Laporan.findByPk(id_laporan);
        if (!laporan) return res.status(404).send("Laporan tidak ditemukan");

        // Ambil data body dari form
        const { nama_barang, lokasi, deskripsi } = req.body;

        // Update data laporan
        laporan.nama_barang = nama_barang || laporan.nama_barang;
        laporan.lokasi = lokasi || laporan.lokasi;
        laporan.deskripsi = deskripsi || laporan.deskripsi;

        // Jika ada upload file baru
        if (req.file) {
            laporan.foto_barang = req.file.filename;
        }

        // Reset status dan alasan
        laporan.status = "Waiting for upload verification";
        laporan.alasan = null;

        await laporan.save();

        res.redirect(redirectPath);
    } catch (error) {
        console.error("Error mengajukan ulang laporan:", error);
        res.status(500).send("Terjadi kesalahan pada server");
    }
}


    // --- CONTROLLER METHODS (Public) ---

    // 1. SHOW FORM
    showReportForm(req, res) {
        try {
            res.render("report-form", { title: "Form Laporan", role: req.user.role });
        } catch (error) {
            res.status(500).render("error", { message: "Terjadi kesalahan saat memuat halaman form laporan" });
        }
    }

    showAdminReportForm(req, res) {
        try {
            res.render("admin/report-form", { title: "Form Laporan Admin", role: req.user.role });
        } catch (error) {
            res.status(500).render("error", { message: "Terjadi kesalahan saat memuat halaman form laporan" });
        }
    }

    // 2. CREATE
    createReport(req, res) {
        return this.#processCreateReport(req, res, false);
    }

    createReportAdmin(req, res) {
        return this.#processCreateReport(req, res, true);
    }
    
    // 3. READ (GET)
    async getUserReports(req, res) {
        try {
            const userEmail = req.user.email;
            const statusList = [
                "Waiting for upload verification", "Upload verification rejected", "On progress",
                "Claimed", "Waiting for end verification", "End verification rejected"
            ];
            const reports = await this.#getReportsWithIncludes({ email: userEmail, status: statusList });
            const user = await this.User.findOne({ where: { email: userEmail } });

            res.render("my-reports", { title: "Laporan Saya", reports, user });
        } catch (error) {
            console.error("Error getting reports:", error);
            res.status(500).render("error", { message: "Terjadi kesalahan saat memuat data laporan" });
        }
    }

        async getAdminReports(req, res) {
            try {
                const adminEmail = req.user.email;
                
                // Filter hanya laporan yang dibuat oleh admin ini
                const reports = await this.#getReportsWithIncludes({ email: adminEmail });
                const user = await this.User.findOne({ where: { email: adminEmail } });

                res.render("admin/my-reports", { title: "Laporan Saya - Admin", reports, user, success: req.query.success });
            } catch (error) {
                console.error("Error getting admin reports:", error);
                res.status(500).render("error", { message: "Terjadi kesalahan saat memuat data laporan" });
            }
        }

    async getAllReportsUser(req, res) {
        try {
            // Tampilkan laporan untuk user umum/non-admin (Status On Progress)
            const reports = await this.#getReportsWithIncludes({ status: "On Progress" });
            const user = req.user && req.user.email ? await this.User.findOne({ where: { email: req.user.email } }) : null;

            res.render("home", { reports, user });
        } catch (error) {
            console.error("Error getting all reports (user home):", error);
            res.status(500).send("Terjadi kesalahan pada server");
        }
    }

    async getAllReportsAdmin(req, res) {
        try {
            // Tampilkan laporan untuk admin (Status On Progress)
            const reports = await this.#getReportsWithIncludes({ status: "On Progress" });
            const user = await this.User.findOne({ where: { email: req.user.email } });

            res.render("admin/report", { reports, user });
        } catch (error) {
            console.error("Error getting all reports (admin):", error);
            res.status(500).send("Terjadi kesalahan pada server");
        }
    }
    
    async getDashboard(req, res) {
        try {
            // Laporan untuk dashboard admin (Semua laporan & laporan Pending)
            const allReports = await this.Laporan.findAll();
            const pendingReports = await this.Laporan.findAll({
                where: { status: "Waiting for upload verification" },
                include: [{ model: this.User }],
                order: [["createdAt", "DESC"]],
            });
            const user = await this.User.findOne({ where: { email: req.user.email } });

            res.render("admin/dashboard", { report: allReports, reports: pendingReports, user: user });
        } catch (error) {
            console.error("Error getting dashboard:", error);
            res.status(500).send("Terjadi kesalahan pada server");
        }
    }


    // 4. UPDATE
    updateReport(req, res) {
        return this.#processUpdateReport(req, res, true);
    }
    
    updateReportAdmin(req, res) {
        return this.#processUpdateReport(req, res, false);
    }

    // 5. DELETE
    deleteReport(req, res) {
        return this.#processDeleteReport(req, res, true);
    }
    
    deleteReportAdmin(req, res) {
        return this.#processDeleteReport(req, res, false);
    }

    // 6. CLAIM & ACCEPT
    async claimReport(req, res) {
        const { id_laporan } = req.body;
        const emailUser = req.user.email;

        try {
            const laporan = await this.Laporan.findByPk(id_laporan);
            if (!laporan) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
            
            if (laporan.email === emailUser) return res.status(400).json({ success: false, message: "Kamu tidak bisa klaim laporan milikmu sendiri" });

            await this.Claim.create({ id_laporan, email: emailUser, tanggal_claim: new Date() });

            laporan.status = "Claimed";
            await laporan.save();

            const pelapor = await this.User.findOne({ where: { email: laporan.email }, attributes: ["nama", "email", "no_telepon", "alamat"] });

            return res.json({ success: true, message: "Laporan berhasil diklaim", kontakPelapor: pelapor });
        } catch (error) {
            console.error("Error claim report:", error);
            res.status(500).json({ success: false, message: "Terjadi kesalahan saat klaim laporan" });
        }
    }

    acceptClaim(req, res) {
        // Perlu dipastikan di router, id_laporan ada di req.params
        return this.#processAcceptClaim(req, res, false); 
    }
    
    acceptClaimAdmin(req, res) {
        // Perlu dipastikan di router, id_laporan ada di req.params
        return this.#processAcceptClaim(req, res, true); 
    }

    async rejectClaim(req, res) {
        const { id_laporan } = req.params;
        const { alasan } = req.body;

        try {
            const claimRecord = await this.Claim.findOne({ where: { id_laporan: id_laporan, status: "Waiting for approval" } });

            if (!claimRecord) return res.status(404).json({ success: false, message: "Claim tidak ditemukan atau sudah diproses" });

            claimRecord.status = "Rejected";
            claimRecord.alasan = alasan;
            await claimRecord.save();

            const laporan = await this.Laporan.findByPk(id_laporan);
            if (laporan) {
                laporan.status = "On progress";
                await laporan.save();
            }

            return res.json({ success: true, message: "Claim berhasil ditolak" });
        } catch (error) {
            console.error("Error rejecting claim:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan saat menolak klaim" });
        }
    }

    // 7. REAPPLY
    reapplyReport(req, res) {
        return this.#processReapplyReport(req, res, false);
    }

    reapplyReportAdmin(req, res) {
        return this.#processReapplyReport(req, res, true);
    }
}

module.exports = ReportController;