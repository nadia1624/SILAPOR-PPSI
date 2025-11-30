const SequelizeMock = require("sequelize-mock");
const DBConnectionMock = new SequelizeMock();

// MOCK CLAIM MODEL
const ClaimMock = DBConnectionMock.define(
  "Claim",
  {
    id_claim: 1,
    id_user: 1,
    id_laporan: 10,
    email: "tes@mail.com",
    tanggal_claim: "2025-01-01",
    alasan: "Kerusakan perangkat",
    deskripsi: "Laptop rusak",
    status: "pending" 
  },
  {
    timestamps: false,
  }
);

// MOCK USER MODEL
const UserMock = DBConnectionMock.define("User", {
  id_user: 1,
  nama: "Budi"
});

// MOCK LAPORAN MODEL
const LaporanMock = DBConnectionMock.define("Laporan", {
  id_laporan: 10,
  judul: "Laptop Rusak"
});

// MOCK RELASI
ClaimMock.belongsTo = jest.fn((model, options) => {
  if (!ClaimMock._belongsTo) ClaimMock._belongsTo = [];
  ClaimMock._belongsTo.push({ model, options });
});

// Set relasi
ClaimMock.belongsTo(UserMock, { foreignKey: "id_user" });
ClaimMock.belongsTo(LaporanMock, { foreignKey: "id_laporan" });

// VALIDASI STATUS ENUM
ClaimMock.$validasiStatus = (value) =>
  ["pending", "approved", "rejected"].includes(value);


// TEST
describe("Model: Claim", () => {

  test("Model Claim harus terdefinisi dengan benar", () => {
    expect(ClaimMock).toBeDefined();
    expect(typeof ClaimMock).toBe("object");
  });

  test("Model Claim harus memiliki atribut yang lengkap", () => {
  const attrs = ClaimMock._defaults;
  expect(attrs.id_claim).toBeDefined();
  expect(attrs.id_laporan).toBeDefined();
  expect(attrs.email).toBeDefined();
  expect(attrs.tanggal_claim).toBeDefined();
  expect(attrs.status).toBeDefined();
  expect(attrs.alasan).toBeDefined();
  });

  test("Status default harus bernilai 'pending'", async () => {
    const claim = await ClaimMock.create({});
    expect(claim.get("status")).toBe("pending");
  });

  test("Model harus menolak status yang tidak valid", () => {
    expect(ClaimMock.$validasiStatus("tidak ada")).toBe(false);
    expect(ClaimMock.$validasiStatus("selesai")).toBe(false);
  });

  test("Model harus menerima status yang valid", () => {
    expect(ClaimMock.$validasiStatus("pending")).toBe(true);
    expect(ClaimMock.$validasiStatus("approved")).toBe(true);
    expect(ClaimMock.$validasiStatus("rejected")).toBe(true);
  });

  test("Model Claim harus memiliki relasi dengan model User", () => {
    const relasiUser = ClaimMock._belongsTo.find(r => r.options.foreignKey === "id_user");
    expect(relasiUser.model).toBe(UserMock);
  });

  test("Model Claim harus memiliki relasi dengan model Laporan", () => {
    const relasiLaporan = ClaimMock._belongsTo.find(r => r.options.foreignKey === "id_laporan");
    expect(relasiLaporan.model).toBe(LaporanMock);
  });

  test("Konfigurasi model harus sesuai (timestamps = false)", () => {
    expect(ClaimMock.options.timestamps).toBe(false);
  });

  test("Model harus dapat membuat data claim dengan benar", async () => {
    const claim = await ClaimMock.create({
      id_user: 2,
      id_laporan: 20,
      email: "uji@mail.com",
      tanggal_claim: "2025-02-01",
      alasan: "Tidak berfungsi",
      deskripsi: "Keyboard error",
      status: "approved",
    });

    expect(claim.get("id_user")).toBe(2);
    expect(claim.get("id_laporan")).toBe(20);
    expect(claim.get("email")).toBe("uji@mail.com");
    expect(claim.get("deskripsi")).toBe("Keyboard error");
    expect(claim.get("status")).toBe("approved");
  });
});
