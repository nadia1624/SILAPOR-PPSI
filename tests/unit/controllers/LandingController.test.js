const LandingController = require('../../../controllers/LandingController');

describe('LandingController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof LandingController).toBe('function');
    expect(typeof LandingController.prototype.getLandingPage).toBe('function');
  });
});
