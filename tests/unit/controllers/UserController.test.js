const UserController = require('../../../controllers/UserController');

describe('UserController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof UserController).toBe('function');
    expect(typeof UserController.prototype.listUsers).toBe('function');
    expect(typeof UserController.prototype.createUser).toBe('function');
    expect(typeof UserController.prototype.deleteUser).toBe('function');
    expect(typeof UserController.prototype.updateUser).toBe('function');
    expect(typeof UserController.prototype.showAdminProfile).toBe('function');
  });
});
