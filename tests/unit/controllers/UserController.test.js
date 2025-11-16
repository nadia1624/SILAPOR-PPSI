const UserController = require("../../../controllers/UserController");

describe("UserController Unit Test", () => {

  let mockUserModel;
  let controller;
  let req, res;

  beforeEach(() => {
    // Mock model User
    mockUserModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    };

    controller = new UserController({ User: mockUserModel });

    // Mock req & res
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


  // LIST USERS
  test("listUsers() harus render halaman user dengan data", async () => {
    mockUserModel.findAll.mockResolvedValue([{ email: "a@test.com" }]);
    mockUserModel.findOne.mockResolvedValue({ email: "admin@test.com" });

    await controller.listUsers(req, res);

    expect(mockUserModel.findAll).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      "admin/user",
      expect.objectContaining({
        title: "Manajemen User",
        users: [{ email: "a@test.com" }],
        user: { email: "admin@test.com" }
      })
    );
  });


  // DELETE USER
  test("deleteUser() harus memanggil destroy dan redirect", async () => {
    req.params.email = "hapus@test.com";
    mockUserModel.destroy.mockResolvedValue(true);

    await controller.deleteUser(req, res);

    expect(mockUserModel.destroy).toHaveBeenCalledWith({
      where: { email: "hapus@test.com" }
    });
    expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
  });


  // SHOW EDIT USER
  test("showEditForm() harus render edit user jika data ditemukan", async () => {
    req.params.email = "user@test.com";

    mockUserModel.findOne
      .mockResolvedValueOnce({ email: "user@test.com" }) // target user
      .mockResolvedValueOnce({ email: "admin@test.com" }); // admin

    await controller.showEditForm(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "admin/editUser",
      expect.objectContaining({
        title: "Edit User",
        targetUser: { email: "user@test.com" },
        user: { email: "admin@test.com" }
      })
    );
  });

  test("showEditForm() return 404 jika user tidak ditemukan", async () => {
    req.params.email = "tidakada@test.com";
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.showEditForm(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "User tidak ditemukan"
    });
  });


  // UPDATE USER
  test("updateUser() harus memanggil update dan redirect", async () => {
    req.params.email = "user@test.com";
    req.body = {
      nama: "A",
      email: "B",
      no_telepon: "123",
      alamat: "Jl A",
      role: "staff"
    };

    mockUserModel.update.mockResolvedValue([1]);

    await controller.updateUser(req, res);

    expect(mockUserModel.update).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
  });


  // CREATE USER
  test("createUser() harus menolak email yang sudah terdaftar", async () => {
    req.body = {
      nama: "A",
      email: "ada@test.com",
      password: "123",
      no_telepon: "123",
      alamat: "alamat",
      role: "staff"
    };

    mockUserModel.findOne.mockResolvedValueOnce({ email: "ada@test.com" });
    mockUserModel.findAll.mockResolvedValue([]);

    await controller.createUser(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "admin/user",
      expect.objectContaining({
        error: "Email sudah terdaftar."
      })
    );
  });

  it("createUser() harus membuat user baru jika email belum ada", async () => {
  const req = {
    body: {
      nama: "Test",
      email: "baru@example.com",
      password: "12345",
      role: "admin",
    },
  };

  mockUserModel.findOne.mockResolvedValue(null); 
  mockUserModel.create.mockResolvedValue({ id: 1 });

  await controller.createUser(req, res);

  expect(mockUserModel.create).toHaveBeenCalled();
  expect(res.redirect).toHaveBeenCalledWith("/admin/userList");
});


  // SHOW ADMIN PROFILE
  test("showAdminProfile() menampilkan profil admin jika ditemukan", async () => {
    mockUserModel.findOne.mockResolvedValue({ email: "admin@test.com" });

    await controller.showAdminProfile(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "admin/profile",
      expect.objectContaining({
        user: { email: "admin@test.com" }
      })
    );
  });

  test("showAdminProfile() return 404 jika user tidak ada", async () => {
    mockUserModel.findOne.mockResolvedValue(null);

    await controller.showAdminProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("User tidak ditemukan");
  });


  // UPDATE ADMIN PROFILE
  test("updateAdminProfile() harus update data admin", async () => {
    req.body = { nama: "Baru" };

    const mockAdmin = {
      nama: "Admin",
      alamat: "Alamat",
      no_telepon: "222",
      save: jest.fn().mockResolvedValue(true),
      foto: null
    };

    mockUserModel.findOne.mockResolvedValue(mockAdmin);

    await controller.updateAdminProfile(req, res);

    expect(mockAdmin.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/admin/profile");
  });

});
