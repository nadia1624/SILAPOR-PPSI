class ClaimController {
    /**
     * @param {Object} models 
     */
    constructor(models) {
        this.Claim = models.Claim;
        this.Laporan = models.Laporan;
        this.User = models.User;

        this.getMyClaims = this.getMyClaims.bind(this);
        this.getMyClaimsAdmin = this.getMyClaimsAdmin.bind(this);
        this.cancelClaim = this.cancelClaim.bind(this);
        this.cancelClaimAdmin = this.cancelClaimAdmin.bind(this);
    }

    // --- METODE UTILITY (Private/Helper) ---

    /**
     * Metode pembantu untuk mengambil klaim dan memformat laporan.
     * @param {string} emailUser - Email pengguna yang sedang login.
     * @returns {Array} Daftar laporan yang diklaim.
     */
    async #fetchAndFormatClaims(emailUser) {
        // Menggunakan Sequelize FindAll dengan eager loading (include)
        const claims = await this.Claim.findAll({
            where: { email: emailUser },
            include: [
                {
                    model: this.Laporan,
                    // Menggunakan model yang sudah diinisialisasi
                    include: [{ model: this.User }], 
                },
            ],
            order: [['id_claim', 'DESC']],
        });

        // Memformat data agar laporan berisi data Claim di dalamnya
        const reports = claims.map((claim) => {
            const laporan = claim.Laporan.toJSON();
            laporan.Claim = claim.toJSON(); 
            return laporan;
        });

        return reports;
    }

    /**
     * Metode pembantu untuk membatalkan klaim dan mengupdate status laporan.
     * @param {string} idLaporan - ID Laporan yang dibatalkan.
     * @param {string} emailUser - Email pengguna yang membatalkan.
     */
    async #processCancelClaim(idLaporan, emailUser) {
        // Hapus entri dari tabel Claim
        await this.Claim.destroy({
            where: { id_laporan: idLaporan, email: emailUser },
        });

        // Update status Laporan
        await this.Laporan.update(
            { status: "On progress", pengklaim: null, no_hp_pengklaim: null },
            { where: { id_laporan: idLaporan } }
        );
    }


    // --- CONTROLLER METHODS (Public) ---

    async getMyClaims(req, res) {
        try {
            const emailUser = req.user.email;
            const reports = await this.#fetchAndFormatClaims(emailUser);
            const user = await this.User.findOne({ where: { email: emailUser } });

            res.render("my-claim", { reports, user: user });
        } catch (err) {
            console.error("Error getMyClaims:", err);
            res.status(500).send("Terjadi kesalahan saat mengambil klaim");
        }
    }

    async getMyClaimsAdmin(req, res) {
        try {
            // Logika sama persis dengan getMyClaims, hanya beda view
            const emailUser = req.user.email;
            const reports = await this.#fetchAndFormatClaims(emailUser);
            const pengguna = await this.User.findOne({ where: { email: emailUser } });

            res.render("admin/my-claim", { reports, user: pengguna });
        } catch (err) {
            console.error("Error getMyClaimsAdmin:", err);
            res.status(500).send("Terjadi kesalahan saat mengambil klaim Admin");
        }
    }

    async cancelClaim(req, res) {
        try {
            const idLaporan = req.params.id_laporan;
            const emailUser = req.user.email;

            await this.#processCancelClaim(idLaporan, emailUser);

            res.redirect("/mahasiswa/my-claim");
        } catch (err) {
            console.error("Error cancelClaim:", err);
            res.status(500).send("Gagal batal klaim");
        }
    }

    async cancelClaimAdmin(req, res) {
        try {
            const idLaporan = req.params.id_laporan;
            const emailUser = req.user.email;

            await this.#processCancelClaim(idLaporan, emailUser);

            res.redirect("/admin/my-claim");
        } catch (err) {
            console.error("Error cancelClaimAdmin:", err);
            res.status(500).send("Gagal batal klaim Admin");
        }
    }
}

module.exports = ClaimController;