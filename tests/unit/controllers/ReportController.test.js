const ReportController = require('../../../controllers/ReportController');

describe('ReportController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof ReportController).toBe('function');
    expect(typeof ReportController.prototype.showReportForm).toBe('function');
    expect(typeof ReportController.prototype.createReport).toBe('function');
    expect(typeof ReportController.prototype.getUserReports).toBe('function');
    expect(typeof ReportController.prototype.claimReport).toBe('function');
    expect(typeof ReportController.prototype.acceptClaim).toBe('function');
    expect(typeof ReportController.prototype.rejectClaim).toBe('function');
  });
});
