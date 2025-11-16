class VerificationController {
    /**
     * @param {Object} models 
     */
    constructor(models) {
        this.Laporan = models.Laporan;
        this.User = models.User;

        this.getPendingReports = this.getPendingReports.bind(this);
        this.verifyReport = this.verifyReport.bind(this);
    }
    /**
     * Helper untuk memproses persetujuan atau penolakan verifikasi laporan.
     * @param {Object} laporan 
     * @param {string} action 
     * @param {string} [alasan=null] 
     */
    #setVerificationStatus(laporan, action, alasan = null) {
        if (action === "approve") {
            laporan.status = "On progress";
            laporan.verifikasi_action = "approve";
            laporan.alasan = null; 
        } else {
            laporan.status = "Upload verification rejected";
            laporan.verifikasi_action = "denied";
            laporan.alasan = alasan;
        }
    }

    async getPendingReports(req, res) {
        try {
            const reports = await this.Laporan.findAll({
                where: { status: "Waiting for upload verification" },
                include: [{ model: this.User }],
                order: [["createdAt", "DESC"]],
            });
            
            const user = await this.User.findOne({ where: { email: req.user.email } });

            res.render("admin/verifikasi", { reports, user });
        } catch (err) {
            console.error("Error getPendingReports:", err);
            res.status(500).send("Terjadi kesalahan server saat mengambil data");
        }
    }

    async verifyReport(req, res) {
        try {
            const { id } = req.params;
            const { action, alasan } = req.body; 

            const laporan = await this.Laporan.findByPk(id);
            if (!laporan) {
                return res.status(404).send("Laporan tidak ditemukan");
            }
            
            this.#setVerificationStatus(laporan, action, alasan);

            await laporan.save();

            res.redirect("/admin/verifikasi");
        } catch (err) {
            console.error("Error verifyReport:", err);
            res.status(500).send("Terjadi kesalahan server saat verifikasi");
        }
    }
}

module.exports = VerificationController;