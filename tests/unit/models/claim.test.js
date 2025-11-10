const sequelize = require("../../../config/database.test");
const { DataTypes } = require("sequelize");

const defineUserModel = require("../../../models/user");
const defineLaporanModel = require("../../../models/laporan");
const defineClaimModel = require("../../../models/claim");

let User, Laporan, Claim;

beforeAll(async () => {
  // Load semua model
  User = defineUserModel(sequelize, DataTypes);
  Laporan = defineLaporanModel(sequelize, DataTypes);
  Claim = defineClaimModel(sequelize, DataTypes);

  // Jalankan associate setelah semua model siap
  const models = { User, Laporan, Claim };
  if (User.associate) User.associate(models);
  if (Laporan.associate) Laporan.associate(models);
  if (Claim.associate) Claim.associate(models);

  await sequelize.sync({ force: true });
});

async function createTestUser(email = "user@example.com") {
  return await User.create({
    email,
    nama: "Test User",
    password: "hashpass",
    role: "user",
    no_telepon: "0812345",
    alamat: "Padang",
  });
}

afterEach(async () => {
  await Claim.destroy({ where: {} });
  await Laporan.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

// =======================================================================
// 1) Claim dapat dibuat dengan data valid
// =======================================================================
test("berhasil membuat claim dengan data valid", async () => {
  const user = await User.create({
    email: "claim@test.com",
    nama: "Tester",
    password: "hash",
    role: "user",
    no_telepon: "0812",
    alamat: "Padang",
  });

  const laporan = await Laporan.create({
    email: "claim@test.com",
    jenis_laporan: "Penemuan",
  });

  const claim = await Claim.create({
    id_laporan: laporan.id_laporan,
    email: user.email,
    alasan: "Saya adalah pemilik barang.",
  });

  expect(claim.status).toBe("Waiting for approval");
  expect(claim.email).toBe("claim@test.com");
  expect(claim.id_laporan).toBe(laporan.id_laporan);
});

// =======================================================================
// 2) Menolak status diluar ENUM
// =======================================================================
test("menolak status yang tidak sesuai ENUM", async () => {
  await expect(
    Claim.create({
      id_laporan: 1,
      email: "x@mail.com",
      status: "InvalidStatus",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 3) Default value status harus terisi
// =======================================================================
test("status default harus 'Waiting for approval'", async () => {
  await createTestUser("default@test.com");

  const claim = await Claim.create({
    email: "default@test.com",
  });

  expect(claim.status).toBe("Waiting for approval");
});


// =======================================================================
// 4) Claim harus memiliki relasi ke User
// =======================================================================
test("claim dapat mengambil data user melalui relasi belongsTo", async () => {
  const user = await User.create({
    email: "relasiuser@test.com",
    nama: "User Relasi",
    password: "hash",
    role: "user",
    no_telepon: "0812",
    alamat: "Padang",
  });

  const claim = await Claim.create({
    email: user.email,
  });

  const result = await Claim.findOne({
    where: { email: user.email },
    include: User,
  });

  expect(result.User.email).toBe("relasiuser@test.com");
});

// =======================================================================
// 5) Claim harus terhubung dengan laporan melalui belongsTo
// =======================================================================
test("claim terhubung ke laporan (belongsTo)", async () => {
  const user = await createTestUser("someone@test.com");

  const laporan = await Laporan.create({
    email: user.email,
    jenis_laporan: "Penemuan",
  });

  const claim = await Claim.create({
    id_laporan: laporan.id_laporan,
    email: user.email,
  });

  const result = await claim.getLaporan();
  expect(result.id_laporan).toBe(laporan.id_laporan);
});


// =======================================================================
// 6)   Alasan boleh null
// =======================================================================
test("mengizinkan alasan null", async () => {
  await createTestUser("test2@test.com");

  const claim = await Claim.create({
    id_laporan: null,
    email: "test2@test.com",
    alasan: null,
  });

  expect(claim.alasan).toBeNull();
});

// =======================================================================
// 7) Update Status dari waiting for approval ke done
// =======================================================================
test("berhasil update status dari 'Waiting for approval' ke 'Done'", async () => {
  await createTestUser("updatestatus@test.com");

  const claim = await Claim.create({
    email: "updatestatus@test.com",
  });

  await claim.update({ status: "Done" });

  expect(claim.status).toBe("Done");
});

// =======================================================================
// 8) Hapus Klaim
// =======================================================================
test("berhasil menghapus claim tanpa menghapus user maupun laporan", async () => {
  const user = await createTestUser("delete@test.com");

  const laporan = await Laporan.create({
    email: user.email,
    jenis_laporan: "Penemuan",
  });

  const claim = await Claim.create({
    id_laporan: laporan.id_laporan,
    email: user.email,
  });

  await claim.destroy();

  expect(await User.findOne({ where: { email: user.email } })).not.toBeNull();
  expect(await Laporan.findByPk(laporan.id_laporan)).not.toBeNull();
});
