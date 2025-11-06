const HistoryController = require('../../../controllers/HistoryController');

describe('HistoryController', () => {
  test('exports a class and exposes expected public methods', () => {
    expect(typeof HistoryController).toBe('function');
    expect(typeof HistoryController.prototype.getDoneReports).toBe('function');
    expect(typeof HistoryController.prototype.getDoneReportsAdmin).toBe('function');
    expect(typeof HistoryController.prototype.getReportHistoryById).toBe('function');
    expect(typeof HistoryController.prototype.downloadReportPdf).toBe('function');
  });
});
