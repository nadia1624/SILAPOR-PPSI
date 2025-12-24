const UserController = require("../../../controllers/UserController");
const fs = require("fs");
const path = require("path");

jest.mock("fs");

describe("UserController Unit Test Lengkap", () => {
  let mockUserModel;
  let controller;
  let req, res;

  beforeEach(() => {
    // Mock console.error to suppress error messages during tests
    jest.spyOn(console, 'error').mockImplementation(() => { });

    mockUserModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    };

    controller = new UserController({ User: mockUserModel });

    req = {
      params: {},
      body: {},
      user: { email: "admin@test.com" },
      file: null
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // LIST USERS
  test("listUsers() success", async () => {
    mockUserModel.findAll.mockResolvedValue([{ email: "x@test.com" }]);
    mockUserModel.findOne.mockResolvedValue({ email: "admin@test.com" });

    await controller.listUsers(req, res);

    expect(mockUserModel.findAll).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalled();
  });

  test("listUsers() error", async () => {
    mockUserModel.findAll.mockRejectedValue(new Error("DB ERROR"));

    await controller.listUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat daftar user"
    });
  });

  // DELETE USER
  test("deleteUser() success", async () => {
    req.params.email = "hapus@test.com";
    mockUserModel.destroy.mockResolvedValue(1);

    await controller.deleteUser(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
  });

  test("deleteUser() error", async () => {
    req.params.email = "err@test.com";
    mockUserModel.destroy.mockRejectedValue(new Error("ERR"));

    await controller.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat menghapus user"
    });
  });

  // SHOW EDIT FORM
  test("showEditForm() success", async () => {
    req.params.email = "user@test.com";

    mockUserModel.findOne
      .mockResolvedValueOnce({ email: "user@test.com" }) // target user
      .mockResolvedValueOnce({ email: "admin@test.com" }); // admin user

    await controller.showEditForm(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test("showEditForm() user not found", async () => {
    req.params.email = "xx@test.com";
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.showEditForm(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "User tidak ditemukan",
    });
  });

  test("showEditForm() error", async () => {
    mockUserModel.findOne.mockRejectedValue(new Error("ERR"));

    await controller.showEditForm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat data user"
    });
  });


  // UPDATE USER
  test("updateUser() success", async () => {
    req.params.email = "user@test.com";
    req.body = { nama: "A" };

    mockUserModel.update.mockResolvedValue([1]);

    await controller.updateUser(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
  });

  test("updateUser() error", async () => {
    mockUserModel.update.mockRejectedValue(new Error("ERR"));

    await controller.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memperbarui data user"
    });
  });


  // CREATE USER
  test("createUser() email exists", async () => {
    req.body = { email: "ada@test.com", password: "123" };
    mockUserModel.findOne.mockResolvedValue({});

    mockUserModel.findAll.mockResolvedValue([]);

    await controller.createUser(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test("createUser() success", async () => {
    req.body = {
      nama: "A",
      email: "baru@test.com",
      password: "123",
      role: "admin"
    };

    mockUserModel.findOne.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue({});

    await controller.createUser(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
  });

  test("createUser() error", async () => {
    mockUserModel.findOne.mockRejectedValue(new Error("ERR"));

    await controller.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat membuat user baru"
    });
  });


  // ADMIN PROFILE
  test("showAdminProfile() success", async () => {
    mockUserModel.findOne.mockResolvedValue({ email: "admin@test.com" });

    await controller.showAdminProfile(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test("showAdminProfile() user not found", async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.showAdminProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("User tidak ditemukan");
  });

  test("showAdminProfile() error", async () => {
    mockUserModel.findOne.mockRejectedValue(new Error("ERR"));

    await controller.showAdminProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Gagal mengambil data profil");
  });


  // SHOW ADMIN EDIT PROFILE
  test("showAdminEditProfile() success", async () => {
    mockUserModel.findOne.mockResolvedValue({ email: "admin@test.com" });

    await controller.showAdminEditProfile(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test("showAdminEditProfile() not found", async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.showAdminEditProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("User tidak ditemukan");
  });

  test("showAdminEditProfile() error", async () => {
    mockUserModel.findOne.mockRejectedValue(new Error("ERR"));

    await controller.showAdminEditProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Gagal memuat form edit");
  });


  // UPDATE ADMIN PROFILE
  test("updateAdminProfile() success tanpa foto", async () => {
    const mockUser = {
      nama: "Admin",
      alamat: "X",
      no_telepon: "11",
      foto: null,
      save: jest.fn().mockResolvedValue(true),
    };

    req.body = { nama: "Baru" };

    mockUserModel.findOne.mockResolvedValue(mockUser);

    await controller.updateAdminProfile(req, res);

    expect(mockUser.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/admin/profile");
  });

  test("updateAdminProfile() success dengan foto baru + hapus foto lama", async () => {
    req.file = { filename: "baru.jpg" };
    req.body = {};

    const mockUser = {
      nama: "A",
      alamat: "B",
      no_telepon: "123",
      foto: "lama.jpg",
      save: jest.fn().mockResolvedValue(true),
    };

    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockReturnValue();

    mockUserModel.findOne.mockResolvedValue(mockUser);

    await controller.updateAdminProfile(req, res);

    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
  });

  test("updateAdminProfile() not found", async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.updateAdminProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("User tidak ditemukan");
  });

  test("updateAdminProfile() error", async () => {
    mockUserModel.findOne.mockRejectedValue(new Error("ERR"));

    await controller.updateAdminProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan saat update profile");
  });
});
