const { Op } = require("sequelize");
const DocumentService = require("../services/DocumentService"); 

class HistoryController {
    /**
     * @param {Object} models - Objek yang berisi model Laporan dan User
     */
    constructor(models) {
        this.Laporan = models.Laporan;
        this.User = models.User;
        this.documentService = new DocumentService(); 

        this.getDoneReports = this.getDoneReports.bind(this);
        this.getDoneReportsAdmin = this.getDoneReportsAdmin.bind(this);
        this.getReportHistoryById = this.getReportHistoryById.bind(this);
        this.getReportHistoryByIdAdmin = this.getReportHistoryByIdAdmin.bind(this);
        this.downloadReportPdf = this.downloadReportPdf.bind(this);
        this.downloadReportPdfAdmin = this.downloadReportPdfAdmin.bind(this);
    }


    async #getFilteredReports(query) {
        const { filterJenis, searchNama } = query;
        const whereClause = { status: "Done" };
        
        if (filterJenis) whereClause.jenis_laporan = filterJenis;
        if (searchNama) whereClause.nama_barang = { [Op.like]: `%${searchNama}%` };

        const reports = await this.Laporan.findAll({
            where: whereClause,
            include: [{ model: this.User }],
        });
        return reports;
    }

    async #getReportById(id, email = null) {
        const whereClause = { id_laporan: id, status: "Done" };
        if (email) whereClause.email = email;

        const report = await this.Laporan.findOne({
            where: whereClause,
            include: [
                {
                    model: this.User,
                    attributes: ["nama", "email", "no_telepon", "alamat"],
                },
            ],
        });
        return report;
    }

    async getDoneReports(req, res) {
    try {
        
        const user = await this.User.findOne({ where: { email: req.user.email } });
        if (!user) return res.status(404).send("User tidak ditemukan");

        const reports = await this.Laporan.findAll({
            where: {
                email: user.email, 
                status: "Done",    
                ...(req.query.filterJenis && { jenis_laporan: req.query.filterJenis }),
                ...(req.query.searchNama && { nama_barang: { [Op.like]: `%${req.query.searchNama}%` } })
            },
            include: [{ model: this.User }],
            order: [['createdAt', 'DESC']]
        });

        res.render("user/history", {
            reports,
            user,
            filterJenis: req.query.filterJenis,
            searchNama: req.query.searchNama
        });

    } catch (err) {
        console.error("Error getDoneReports:", err);
        res.status(500).send("Terjadi kesalahan saat mengambil laporan");
    }
}


    async getDoneReportsAdmin(req, res) {
        try {
            const reports = await this.#getFilteredReports(req.query);
            const user = await this.User.findOne({ where: { email: req.user.email } });

            res.render("admin/history", { 
                reports, 
                user,
                filterJenis: req.query.filterJenis, 
                searchNama: req.query.searchNama 
            });
        } catch (err) {
            console.error("Error getDoneReportsAdmin:", err);
            res.status(500).send("Terjadi kesalahan saat mengambil laporan Admin");
        }
    }

    async getReportHistoryById(req, res) {
        try {
            const report = await this.#getReportById(req.params.id, req.user.email);
            const user = await this.User.findOne({ where: { email: req.user.email } });

            if (!report) return res.status(404).json({ success: false, message: "Riwayat laporan tidak ditemukan" });

            res.render("user/historyDetail", { 
                title: "Riwayat Laporan Detail",
                user,
                report,
            });
        } catch (error) {
            console.error("Error getting report history:", error);
            res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil riwayat laporan" });
        }
    }

    async getReportHistoryByIdAdmin(req, res) {
        try {
            const report = await this.#getReportById(req.params.id); 
            const user = await this.User.findOne({ where: { email: req.user.email } });

            if (!report) return res.status(404).json({ success: false, message: "Riwayat laporan tidak ditemukan" });

            res.render("admin/historyDetail", { 
                title: "Riwayat Laporan Detail Admin",
                user,
                report,
            });
        } catch (error) {
            console.error("Error getting report history:", error);
            res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil riwayat laporan Admin" });
        }
    }

    async downloadReportPdf(req, res) {
        try {
            const id = req.params.id;
            const laporan = await this.#getReportById(id, req.user.email); 

            if (!laporan) return res.status(404).send("Data laporan tidak ditemukan atau bukan milik Anda.");

            const { outputPdf, outputDocx } = await this.documentService.generatePdf(laporan);

            res.download(outputPdf, `laporan_${id}.pdf`, (downloadErr) => {
                if (downloadErr) console.error("⚠️ Gagal kirim file:", downloadErr);
                this.documentService.cleanup(outputDocx, outputPdf); 
            });
        } catch (error) {
            console.error("❌ Terjadi kesalahan saat download PDF:", error);
            res.status(500).send(error.message || "Terjadi kesalahan internal server.");
        }
    }

    async downloadReportPdfAdmin(req, res) {
        try {
            const id = req.params.id;
            // Admin bisa mendownload semua laporan
            const laporan = await this.#getReportById(id); 

            if (!laporan) return res.status(404).send("Data laporan tidak ditemukan.");

            const { outputPdf, outputDocx } = await this.documentService.generatePdf(laporan);

            res.download(outputPdf, `laporan_${id}.pdf`, (downloadErr) => {
                if (downloadErr) console.error("⚠️ Gagal kirim file:", downloadErr);
                this.documentService.cleanup(outputDocx, outputPdf); 
            });
        } catch (error) {
            console.error("❌ Terjadi kesalahan saat download PDF Admin:", error);
            res.status(500).send(error.message || "Terjadi kesalahan internal server.");
        }
    }
}

module.exports = HistoryController;