const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const ImageModule = require("docxtemplater-image-module-free");

class DocumentService {
    constructor() {
        this.templateDir = path.join(process.cwd(), "src", "templates");
        this.tempDir = path.join(process.cwd(), "temp");

        if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
    }

    // Metode untuk memformat data laporan agar sesuai dengan template DOCX
    #formatLaporanData(laporan) {
        return {
            id_laporan: laporan.id_laporan || "-",
            jenis_laporan: laporan.jenis_laporan || "-",
            nama_barang: laporan.nama_barang || "-",
            status: laporan.status || "-",
            tanggal_kejadian: this.#formatDate(laporan.tanggal_kejadian),
            lokasi: laporan.lokasi || "-",
            tanggal_laporan: this.#formatDate(laporan.tanggal_laporan),
            deskripsi: laporan.deskripsi || "-",
            tanggal_penyerahan: this.#formatDate(laporan.tanggal_penyerahan),
            lokasi_penyerahan: laporan.lokasi_penyerahan || "-",
            pengklaim: laporan.pengklaim || "-",
            no_hp_pengklaim: laporan.no_hp_pengklaim || "-",
            user_nama: laporan.User?.nama || "-",
            user_email: laporan.User?.email || "-",
            user_alamat: laporan.User?.alamat || "-",
            user_telp: laporan.User?.no_telepon || "-",
            // Tambahkan path foto untuk Docxtemplater
            foto_bukti: laporan.foto_bukti
                ? path.join(process.cwd(), "uploads", laporan.foto_bukti)
                : null,
        };
    }

    // Metode helper untuk format tanggal
    #formatDate(date) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID");
    }

    // Metode untuk menginisialisasi Docxtemplater
    #createDoc(templatePath, data) {
        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);

        const imageModule = new ImageModule({
            centered: true,
            getImage: (tagValue) => {
                // Logika pengambilan gambar dari tagValue (sesuai kode lama)
                try {
                    if (!tagValue || !fs.existsSync(tagValue)) {
                        return fs.readFileSync(path.join(this.templateDir, "noimage.png"));
                    }
                    return fs.readFileSync(tagValue);
                } catch (err) {
                    console.error("⚠️ Gagal ambil gambar:", err);
                    return fs.readFileSync(path.join(this.templateDir, "noimage.png"));
                }
            },
            getSize: () => [150, 150], // Ukuran gambar tetap 150x150
        });

        const doc = new Docxtemplater(zip, {
            modules: [imageModule],
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "{{", end: "}}" },
            nullGetter: () => "-",
        });
        doc.render(data);

        return doc.getZip().generate({ type: "nodebuffer" });
    }

    // Metode untuk menunggu file PDF muncul setelah konversi
    #waitForFile(filePath, retries = 10, delay = 500) {
        return new Promise((resolve) => {
            const check = (i) => {
                if (fs.existsSync(filePath)) return resolve(true);
                if (i >= retries) return resolve(false);
                setTimeout(() => check(i + 1), delay);
            };
            check(0);
        });
    }
    
    // Metode utama untuk membuat dan mengonversi DOCX ke PDF
    async generatePdf(laporan) {
        const templatePath = path.join(this.templateDir, "LaporanKehilangan.docx");
        if (!fs.existsSync(templatePath)) {
            throw new Error("Template file tidak ditemukan.");
        }

        const data = this.#formatLaporanData(laporan);
        const docxBuffer = this.#createDoc(templatePath, data);

        const outputDocx = path.join(this.tempDir, `laporan_${laporan.id_laporan}.docx`);
        const outputPdf = path.join(this.tempDir, `laporan_${laporan.id_laporan}.pdf`);

        fs.writeFileSync(outputDocx, docxBuffer);

        const command = `soffice --headless --convert-to pdf --outdir "${this.tempDir}" "${outputDocx}"`;
        
        return new Promise((resolve, reject) => {
            exec(command, async (err) => {
                if (err) {
                    console.error("❌ Gagal konversi PDF:", err);
                    return reject(new Error("Gagal mengonversi file ke PDF (LibreOffice error)."));
                }

                const ready = await this.#waitForFile(outputPdf);
                if (!ready) {
                    return reject(new Error("File PDF gagal dibuat atau belum muncul."));
                }

                resolve({ outputPdf, outputDocx });
            });
        });
    }

    // Metode untuk membersihkan file sementara
    cleanup(filePathDocx, filePathPdf) {
        try {
            if (fs.existsSync(filePathDocx)) fs.unlinkSync(filePathDocx);
            if (fs.existsSync(filePathPdf)) fs.unlinkSync(filePathPdf);
            console.log("🧹 File sementara dihapus.");
        } catch (cleanupErr) {
            console.warn("⚠️ Tidak bisa hapus file temp:", cleanupErr.message);
        }
    }
}

module.exports = DocumentService;