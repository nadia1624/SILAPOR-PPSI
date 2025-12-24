const jwt = require("jsonwebtoken");
const validTokenMiddleware = require("../../../middleware/ValidTokenMiddleware");

jest.mock("jsonwebtoken");

describe("ValidTokenMiddleware", () => {
    let req, res, next;

    beforeEach(() => {
        // Mock console.error to suppress error messages during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });

        req = {
            cookies: {},
        };

        res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };

        next = jest.fn();

        jest.clearAllMocks();
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test("should redirect to '/' when token is missing", () => {
        req.cookies.token = undefined;

        validTokenMiddleware(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith("/");
        expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 and clear cookie when token is invalid", () => {
        req.cookies.token = "token_tidak_valid";

        jwt.verify.mockImplementation((token, secret, cb) => {
            cb(new Error("Invalid token"), null);
        });

        validTokenMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalledWith("token");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            auth: false,
            message: "Gagal untuk melakukan verifikasi token. Silakan login ulang."
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("should call next() and set req.user when token is valid", () => {
        req.cookies.token = "token_valid";

        const mockDecoded = { id: 1, email: "user@test.com" };

        jwt.verify.mockImplementation((token, secret, cb) => {
            cb(null, mockDecoded);
        });

        validTokenMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalled();
        expect(req.user).toEqual(mockDecoded);
        expect(next).toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
