const SequelizeMock = require("sequelize-mock");
const DBMock = new SequelizeMock();

// MOCK LAPORAN MODEL
const LaporanMock = DBMock.define(
  "Laporan",
  {
    id_laporan: 10,
    email: "user@mail.com",
    jenis_laporan: "Kehilangan",
    nama_barang: "Laptop",
    tanggal_kejadian: "2025-01-01",
    lokasi: "Kampus",
    tanggal_laporan: "2025-01-02",
    deskripsi: "Hilang di perpustakaan",
    foto_barang: "laptop.jpg",
    status: "Waiting for upload verification",
    tanggal_penyerahan: null,
    lokasi_penyerahan: null,
    foto_bukti: null,
    verifikasi_action: "none",
    pengklaim: null,
    no_hp_pengklaim: null,
    alasan: null,
  },
  {
    timestamps: true,
  }
);

// MOCK USER MODEL
const UserMock = DBMock.define("User", {
  email: "user@mail.com",
  nama: "Andi",
});

// MOCK CLAIM MODEL
const ClaimMock = DBMock.define("Claim", {
  id_claim: 1,
  id_laporan: 10,
});

// RELASI MOCK SESUAI MODEL ASLI
LaporanMock.belongsTo = jest.fn((model, options) => {
  LaporanMock._belongsTo = { model, options };
});
LaporanMock.hasMany = jest.fn((model, options) => {
  LaporanMock._hasMany = { model, options };
});

// lakukan relasi
LaporanMock.belongsTo(UserMock, { foreignKey: "email", targetKey: "email" });
LaporanMock.hasMany(ClaimMock, { foreignKey: "id_laporan" });

// ENUM VALIDASI MANUAL
LaporanMock.$validasiStatus = (val) =>
  [
    "Waiting for upload verification",
    "Upload verification rejected",
    "On progress",
    "Claimed",
    "Waiting for end verification",
    "End verification rejected",
    "Done",
  ].includes(val);

LaporanMock.$validasiVerifikasi = (val) =>
  ["none", "approve", "denied"].includes(val);


// TEST SUITE
describe("Model: Laporan", () => {
  test("Model Laporan harus terdefinisi dengan benar", () => {
    expect(LaporanMock).toBeDefined();
  });

  test("Model Laporan harus memiliki atribut lengkap", () => {
    const attrs = LaporanMock._defaults;
    expect(attrs.id_laporan).toBeDefined();
    expect(attrs.email).toBeDefined();
    expect(attrs.jenis_laporan).toBeDefined();
    expect(attrs.nama_barang).toBeDefined();
    expect(attrs.tanggal_kejadian).toBeDefined();
    expect(attrs.lokasi).toBeDefined();
    expect(attrs.tanggal_laporan).toBeDefined();
    expect(attrs.deskripsi).toBeDefined();
    expect(attrs.foto_barang).toBeDefined();
    expect(attrs.status).toBeDefined();
    expect(attrs.verifikasi_action).toBeDefined();
  });

  test("Status default harus bernilai 'Waiting for upload verification'", async () => {
    const laporan = await LaporanMock.create({});
    expect(laporan.get("status")).toBe("Waiting for upload verification");
  });

  test("Model harus menolak status yang tidak valid", () => {
    expect(LaporanMock.$validasiStatus("Selesai")).toBe(false);
    expect(LaporanMock.$validasiStatus("Unknown")).toBe(false);
  });

  test("Model harus menerima status yang valid", () => {
    expect(LaporanMock.$validasiStatus("Claimed")).toBe(true);
    expect(LaporanMock.$validasiStatus("Done")).toBe(true);
  });

  test("Validasi verifikasi_action harus benar", () => {
    expect(LaporanMock.$validasiVerifikasi("none")).toBe(true);
    expect(LaporanMock.$validasiVerifikasi("approve")).toBe(true);
    expect(LaporanMock.$validasiVerifikasi("invalid")).toBe(false);
  });

  test("Model Laporan harus memiliki relasi belongsTo User", () => {
    expect(LaporanMock._belongsTo.model).toBe(UserMock);
    expect(LaporanMock._belongsTo.options.foreignKey).toBe("email");
  });

  test("Model Laporan harus memiliki relasi hasMany Claim", () => {
    expect(LaporanMock._hasMany.model).toBe(ClaimMock);
    expect(LaporanMock._hasMany.options.foreignKey).toBe("id_laporan");
  });

  test("Konfigurasi timestamps harus aktif", () => {
    expect(LaporanMock.options.timestamps).toBe(true);
  });

  test("Model harus bisa membuat data laporan baru", async () => {
    const laporan = await LaporanMock.create({
      jenis_laporan: "Penemuan",
      nama_barang: "KTP",
    });
    expect(laporan.get("jenis_laporan")).toBe("Penemuan");
    expect(laporan.get("nama_barang")).toBe("KTP");
  });
});
