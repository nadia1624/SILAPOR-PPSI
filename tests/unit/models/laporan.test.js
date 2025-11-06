"use strict";
const { Sequelize, DataTypes } = require("sequelize");
const LaporanModel = require("../../../models/laporan");

describe("Laporan Model", () => {
  let sequelize;
  let Laporan;

  beforeAll(async () => {
    sequelize = new Sequelize("sqlite::memory:", { logging: false });
    Laporan = LaporanModel(sequelize, DataTypes);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should create a new laporan successfully", async () => {
    const validData = {
      judul: "Test Laporan",
      deskripsi: "Ini adalah laporan test",
      lokasi: "Padang",
      status: "pending",
      tanggal: new Date(),
      email: "nadia@example.com", // jika ada relasi foreignKey ke User
      jenis_laporan: "infrastruktur", // ✅ tambahkan ini
    };

    const laporan = await Laporan.create(validData);

    expect(laporan.judul).toBe(validData.judul);
    expect(laporan.jenis_laporan).toBe(validData.jenis_laporan);
    expect(laporan.status).toBe("pending");
  });

  it("should fail to create laporan without required fields", async () => {
    await expect(Laporan.create({})).rejects.toThrow();
  });

  it("should successfully update laporan status", async () => {
    const laporan = await Laporan.create({
      judul: "Test Laporan",
      deskripsi: "Ini laporan test",
      lokasi: "Padang",
      status: "pending",
      tanggal: new Date(),
      email: "nadia@example.com",
      jenis_laporan: "fasilitas", // ✅ tambahkan juga di sini
    });

    laporan.status = "processed";
    const updated = await laporan.save();

    expect(updated.status).toBe("processed");
  });
});
