const VerificationController = require('../../../controllers/VerificationController');

describe('VerificationController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof VerificationController).toBe('function');
    expect(typeof VerificationController.prototype.getPendingReports).toBe('function');
    expect(typeof VerificationController.prototype.verifyReport).toBe('function');
  });
});
