const CheckRoleMiddleware = require("../../../middleware/CheckRoleMiddleware");

describe("CheckRoleMiddleware - checkRole", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 403 if user is not logged in (no req.user)", () => {
    const middleware = CheckRoleMiddleware.checkRole("admin");
    req.user = undefined;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Akses ditolak: Tidak ada peran pengguna.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 403 if user has no role field", () => {
    const middleware = CheckRoleMiddleware.checkRole("admin");
    req.user = { email: "user@example.com" };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Akses ditolak: Tidak ada peran pengguna.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next() if user role matches required role", () => {
    const middleware = CheckRoleMiddleware.checkRole("admin");
    req.user = { role: "admin" };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
    
  test("should return 403 if user role does not match required role", () => {
    const middleware = CheckRoleMiddleware.checkRole("admin");
    req.user = { role: "user" };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Akses ditolak: Anda tidak memiliki izin.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
