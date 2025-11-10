const sequelize = require("../../../config/database.test");
const defineUserModel = require("../../../models/user");
const { DataTypes } = require("sequelize");

let User;

beforeAll(async () => {
  User = defineUserModel(sequelize, DataTypes);
  await sequelize.sync({ force: true }); // buat tabel baru untuk test
});

afterEach(async () => {
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

// =======================================================================
// 1) Test membuat user dengan data valid
// =======================================================================
test("berhasil membuat user dengan data valid", async () => {
  const user = await User.create({
    email: "test@example.com",
    nama: "User Test",
    password: "hashedpassword",
    role: "user",
    no_telepon: "081234567890",
    alamat: "Padang",
  });

  // pastikan data tersimpan benar
  expect(user.email).toBe("test@example.com");
  expect(user.role).toBe("user");
  expect(user.foto).toBe("default.jpg"); // default value
  expect(user.isVerified).toBe(false); // default value
});

// =======================================================================
// 2) email harus unik
// =======================================================================
test("tidak boleh membuat user dengan email yang sama (unique constraint)", async () => {
  await User.create({
    email: "same@example.com",
    nama: "User 1",
    password: "pass1",
    role: "user",
    no_telepon: "0811",
    alamat: "A",
  });

  await expect(
    User.create({
      email: "same@example.com",
      nama: "User 2",
      password: "pass2",
      role: "admin",
      no_telepon: "0822",
      alamat: "B",
    })
  ).rejects.toThrow(); // unik dilanggar
});

// =======================================================================
// 3) role hanya boleh "admin" atau "user"
// =======================================================================
test("menolak role yang tidak sesuai ENUM", async () => {
  await expect(
    User.create({
      email: "wrongrole@example.com",
      nama: "Role Test",
      password: "hash",
      role: "superadmin", // tidak valid
      no_telepon: "0800",
      alamat: "Test",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 4) Field wajib tidak boleh null
// =======================================================================
test("menolak jika nama atau password null", async () => {
  await expect(
    User.create({
      email: "null@example.com",
      nama: null,
      password: "pass",
      role: "user",
      no_telepon: "0812",
      alamat: "Padang",
    })
  ).rejects.toThrow();

  await expect(
    User.create({
      email: "null2@example.com",
      nama: "User",
      password: null,
      role: "user",
      no_telepon: "0812",
      alamat: "Padang",
    })
  ).rejects.toThrow();
});

// =======================================================================
// 5) Default Value Dicek
// =======================================================================
test("default value harus terisi jika tidak diberikan", async () => {
  const user = await User.create({
    email: "default@example.com",
    nama: "User Default",
    password: "hash",
    role: "admin",
    no_telepon: "0812",
    alamat: "Padang",
  });

  expect(user.foto).toBe("default.jpg");
  expect(user.isVerified).toBe(false);
  expect(user.emailVerifyTokenUsed).toBe(false);
  expect(user.resetPasswordTokenUsed).toBe(false);
});

// =======================================================================
// 6) tipe data harus sesuai
// =======================================================================
test("tipe data email dan nama harus string", async () => {
  const user = await User.create({
    email: "typedata@example.com",
    nama: "User Tipe",
    password: "hash",
    role: "user",
    no_telepon: "081234",
    alamat: "Padang",
  });

  expect(typeof user.email).toBe("string");
  expect(typeof user.nama).toBe("string");
});


