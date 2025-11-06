const ClaimController = require('../../../controllers/ClaimController');

describe('ClaimController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof ClaimController).toBe('function');
    expect(typeof ClaimController.prototype.getMyClaims).toBe('function');
    expect(typeof ClaimController.prototype.getMyClaimsAdmin).toBe('function');
    expect(typeof ClaimController.prototype.cancelClaim).toBe('function');
    expect(typeof ClaimController.prototype.cancelClaimAdmin).toBe('function');
  });
});
