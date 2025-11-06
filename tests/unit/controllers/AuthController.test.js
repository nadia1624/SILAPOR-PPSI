const AuthController = require('../../../controllers/AuthController');

describe('AuthController', () => {
	test('exports a class and exposes expected public methods', () => {
		expect(typeof AuthController).toBe('function');
		// public methods (prototype) — should exist as functions
		expect(typeof AuthController.prototype.register).toBe('function');
		expect(typeof AuthController.prototype.login).toBe('function');
		expect(typeof AuthController.prototype.resetPassword).toBe('function');
		expect(typeof AuthController.prototype.showProfile).toBe('function');
	});
});