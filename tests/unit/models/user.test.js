// tests/unit/models/user.test.js
"use strict";
const { Sequelize, DataTypes } = require("sequelize");
const UserModel = require("../../../models/user");

describe("User Model", () => {
  let sequelize;
  let User;

  beforeAll(async () => {
    sequelize = new Sequelize("sqlite::memory:", { logging: false });
    User = UserModel(sequelize, DataTypes);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Model name should be 'User'", () => {
    expect(User.name).toBe("User");
  });

  test("Should create a valid user", async () => {
    const user = await User.create({
      email: "nadia@example.com",
      nama: "Nadia Deari",
      password: "password123",
      role: "user",
      no_telepon: "08123456789",
      alamat: "Padang",
    });

    expect(user.email).toBe("nadia@example.com");
    expect(user.foto).toBe("default.jpg");
    expect(user.isVerified).toBe(false);
  });

  test("Should enforce unique email", async () => {
    await User.create({
      email: "unique@example.com",
      nama: "User 1",
      password: "pass",
      role: "user",
      no_telepon: "08123",
      alamat: "Padang",
    });

    await expect(
      User.create({
        email: "unique@example.com",
        nama: "User 2",
        password: "pass",
        role: "user",
        no_telepon: "08123",
        alamat: "Padang",
      })
    ).rejects.toThrow();
  });

  test("Should not allow null email", async () => {
    await expect(
      User.create({
        nama: "Tanpa Email",
        password: "abc123",
        role: "user",
        no_telepon: "08123",
        alamat: "Padang",
      })
    ).rejects.toThrow();
  });
});
