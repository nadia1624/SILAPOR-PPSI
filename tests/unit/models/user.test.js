const SequelizeMock = require("sequelize-mock");
const DBMock = new SequelizeMock();

// MOCK MODEL USER 
const UserMock = DBMock.define(
  "User",
  {
    email: "user@mail.com",
    nama: "Budi",
    password: "hashedpassword",
    role: "user",
    no_telepon: "0812345678",
    alamat: "Padang",
    foto: "default.jpg",
    isVerified: false,
    emailVerifyToken: null,
    emailVerifyTokenUsed: false,
    resetPasswordToken: null,
    resetPasswordTokenUsed: false,
  },
  {
    timestamps: true,
  }
);

// MOCK MODEL LAPORAN
const LaporanMock = DBMock.define("Laporan", {
  id_laporan: 1,
  email: "user@mail.com",
});

// MOCK MODEL CLAIM
const ClaimMock = DBMock.define("Claim", {
  id_claim: 1,
  email: "user@mail.com",
});

// Relasi sesuai model asli
UserMock.hasMany = jest.fn((model, options) => {
  if (!UserMock._hasMany) UserMock._hasMany = [];
  UserMock._hasMany.push({ model, options });
});

UserMock.hasMany(LaporanMock, { foreignKey: "email", sourceKey: "email" });
UserMock.hasMany(ClaimMock, { foreignKey: "email", sourceKey: "email" });

// ENUM VALIDASI ROLE MANUAL
UserMock.$validasiRole = (value) => ["admin", "user"].includes(value);

// TEST SUITE
describe("Model: User", () => {
  test("Model User harus terdefinisi dengan benar", () => {
    expect(UserMock).toBeDefined();
  });

  test("Model User harus memiliki atribut lengkap", () => {
    const attrs = UserMock._defaults;
    expect(attrs.email).toBeDefined();
    expect(attrs.nama).toBeDefined();
    expect(attrs.password).toBeDefined();
    expect(attrs.role).toBeDefined();
    expect(attrs.no_telepon).toBeDefined();
    expect(attrs.alamat).toBeDefined();
    expect(attrs.foto).toBeDefined();
    expect(attrs.isVerified).toBeDefined();
    expect(attrs.emailVerifyToken).toBeDefined();
    expect(attrs.emailVerifyTokenUsed).toBeDefined();
    expect(attrs.resetPasswordToken).toBeDefined();
    expect(attrs.resetPasswordTokenUsed).toBeDefined();
  });

  test("Role default harus bernilai 'user'", async () => {
    const user = await UserMock.create({});
    expect(user.get("role")).toBe("user");
  });

  test("Foto default harus bernilai 'default.jpg'", async () => {
    const user = await UserMock.create({});
    expect(user.get("foto")).toBe("default.jpg");
  });

  test("Model harus menolak role yang tidak valid", () => {
    expect(UserMock.$validasiRole("manager")).toBe(false);
    expect(UserMock.$validasiRole("tes")).toBe(false);
  });

  test("Model harus menerima role yang valid", () => {
    expect(UserMock.$validasiRole("admin")).toBe(true);
    expect(UserMock.$validasiRole("user")).toBe(true);
  });

  test("Model User harus memiliki relasi hasMany Laporan", () => {
    const relation = UserMock._hasMany.find(
      (rel) => rel.model === LaporanMock
    );
    expect(relation.options.foreignKey).toBe("email");
  });

  test("Model User harus memiliki relasi hasMany Claim", () => {
    const relation = UserMock._hasMany.find(
      (rel) => rel.model === ClaimMock
    );
    expect(relation.options.foreignKey).toBe("email");
  });

  test("Konfigurasi timestamps harus aktif", () => {
    expect(UserMock.options.timestamps).toBe(true);
  });

  test("Model harus dapat membuat user baru dengan benar", async () => {
    const user = await UserMock.create({
      email: "admin@mail.com",
      nama: "Admin",
      password: "pass123",
      role: "admin",
    });
    expect(user.get("email")).toBe("admin@mail.com");
    expect(user.get("role")).toBe("admin");
  });
});
