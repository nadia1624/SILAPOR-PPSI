const sequelize = require("../../../config/database.config");
const { DataTypes } = require("sequelize");

const defineUserModel = require("../../../models/user");
const defineLaporanModel = require("../../../models/laporan");
const defineClaimModel = require("../../../models/claim");

let User, Laporan, Claim;

beforeAll(async () => {
  User = defineUserModel(sequelize, DataTypes);
  Laporan = defineLaporanModel(sequelize, DataTypes);
  Claim = defineClaimModel(sequelize, DataTypes);

  // daftar semua untuk asosiasi
  const models = { User, Laporan, Claim };
  User.associate(models);
  Laporan.associate(models);
  Claim.associate(models);

  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await Laporan.destroy({ where: {} });
  await User.destroy({ where: {} });
  await Claim.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});


// =======================================================================
// 1) Membuat Laporan valid
// =======================================================================
test("berhasil membuat laporan dengan data valid", async () => {
  await User.create({
    email: "test@example.com",
    nama: "User Test",
    password: "hashed",
    role: "user",
    no_telepon: "0812",
    alamat: "Padang",
  });

  const laporan = await Laporan.create({
    email: "test@example.com",
    jenis_laporan: "Kehilangan",
    nama_barang: "Dompet",
  });

  expect(laporan.jenis_laporan).toBe("Kehilangan");
  expect(laporan.status).toBe("Waiting for upload verification"); // default
  expect(laporan.verifikasi_action).toBe("none"); // default
});

// =======================================================================
// 2) jenis_laporan wajib sesuai ENUM
// =======================================================================
test("menolak jenis_laporan di luar ENUM", async () => {
  await expect(
    Laporan.create({
      email: "user@example.com",
      jenis_laporan: "Hilang Tapi Ketemu", // ❌ tidak valid
      nama_barang: "Kunci",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 3) status wajib sesuai ENUM
// =======================================================================
test("menolak status invalid", async () => {
  await expect(
    Laporan.create({
      email: "user@example.com",
      jenis_laporan: "Penemuan",
      status: "Selesai Sudah", // ❌ tidak valid
      nama_barang: "HP",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 4) verifikasi_action wajib sesuai ENUM
// =======================================================================
test("menolak verifikasi_action invalid", async () => {
  await expect(
    Laporan.create({
      email: "user@example.com",
      jenis_laporan: "Penemuan",
      verifikasi_action: "check manual", // ❌
    })
  ).rejects.toThrow();
});

// =======================================================================
// 5) jenis_laporan tidak boleh null
// =======================================================================
test("menolak jika jenis_laporan null", async () => {
  await expect(
    Laporan.create({
      nama_barang: "KTP",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 6) Update Data Laporan
// =======================================================================
test("berhasil update status laporan", async () => {
  const laporan = await Laporan.create({
    jenis_laporan: "Penemuan",
    nama_barang: "Kartu ATM",
  });

  await laporan.update({ status: "On progress" });

  expect(laporan.status).toBe("On progress");
});

// =======================================================================
// 7) Delete Laporan
// =======================================================================
test("berhasil menghapus laporan", async () => {
  const laporan = await Laporan.create({
    jenis_laporan: "Kehilangan",
    nama_barang: "KTP",
  });

  await laporan.destroy();

  const result = await Laporan.findByPk(laporan.id_laporan);
  expect(result).toBeNull();
});

// =======================================================================
// 8) Relasi: laporan.getUser()
// =======================================================================
test("relasi Laporan -> User berfungsi", async () => {
  const user = await User.create({
    email: "owner@example.com",
    nama: "Pemilik",
    password: "hash",
    role: "user",
    no_telepon: "0812",
    alamat: "Padang",
  });

  const laporan = await Laporan.create({
    email: user.email,
    jenis_laporan: "Penemuan",
    nama_barang: "STNK",
  });

  const result = await laporan.getUser();

  expect(result.email).toBe("owner@example.com");
});
