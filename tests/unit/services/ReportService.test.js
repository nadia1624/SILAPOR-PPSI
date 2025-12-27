const ReportService = require('../../../services/ReportService');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

jest.mock('nodemailer');

jest.mock('fs');

describe('ReportService', () => {
  let service;
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'testpassword';

    mockTransporter = {
      sendMail: jest.fn(),
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);

    service = new ReportService();

    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
    console.warn.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize nodemailer transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@example.com',
          pass: 'testpassword',
        },
      });
    });

    test('should set correct sender email', () => {
      expect(service.senderEmail).toBe('"SILAPOR Notification" <test@example.com>');
    });

    test('should initialize transporter property', () => {
      expect(service.transporter).toBe(mockTransporter);
    });
  });

  describe('sendRealtimeNotification', () => {
    test('should emit report event through socket.io when io is available', () => {
      const mockIo = {
        emit: jest.fn(),
      };

      const mockReport = {
        id_laporan: '123',
        nama_barang: 'Laptop',
        jenis_laporan: 'Kehilangan',
      };

      const mockReq = {
        app: {
          get: jest.fn().mockReturnValue(mockIo),
        },
      };

      service.sendRealtimeNotification(mockReq, mockReport);

      expect(mockReq.app.get).toHaveBeenCalledWith('io');
      expect(mockIo.emit).toHaveBeenCalledWith('report', {
        message: 'Laporan baru telah dibuat',
        report: mockReport,
      });
    });

    test('should log warning when socket.io instance is not found', () => {
      const mockReq = {
        app: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      const mockReport = {
        id_laporan: '123',
        nama_barang: 'Laptop',
      };

      service.sendRealtimeNotification(mockReq, mockReport);

      expect(console.warn).toHaveBeenCalledWith(
        'Socket.IO instance tidak ditemukan di req.app.'
      );
    });

    test('should handle undefined io gracefully', () => {
      const mockReq = {
        app: {
          get: jest.fn().mockReturnValue(undefined),
        },
      };

      const mockReport = { id_laporan: '123' };

      expect(() => {
        service.sendRealtimeNotification(mockReq, mockReport);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('sendNewReportEmail', () => {
    test('should send email with correct data', () => {
      const reportData = {
        jenis_laporan: 'Kehilangan',
        nama_barang: 'Laptop Dell',
        lokasi: 'Gedung A Lantai 3',
        tanggal_kejadian: '2024-01-15',
        deskripsi: 'Laptop hilang di ruang kelas',
        userEmail: 'user@test.com',
      };

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { response: 'Email sent successfully' });
      });

      service.sendNewReportEmail(reportData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"SILAPOR Notification" <test@example.com>',
          to: 'sisteminformasiunand23@gmail.com',
          subject: '📢 Laporan Baru Diterima',
        }),
        expect.any(Function)
      );

      const emailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailOptions.html).toContain('Kehilangan');
      expect(emailOptions.html).toContain('Laptop Dell');
      expect(emailOptions.html).toContain('Gedung A Lantai 3');
      expect(emailOptions.html).toContain('2024-01-15');
      expect(emailOptions.html).toContain('Laptop hilang di ruang kelas');
      expect(emailOptions.html).toContain('user@test.com');
    });

    test('should log success message when email is sent successfully', () => {
      const reportData = {
        jenis_laporan: 'Penemuan',
        nama_barang: 'Dompet',
        lokasi: 'Kantin',
        tanggal_kejadian: '2024-01-16',
        deskripsi: 'Dompet ditemukan',
        userEmail: 'finder@test.com',
      };

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { response: '250 OK' });
      });

      service.sendNewReportEmail(reportData);

      expect(console.log).toHaveBeenCalledWith('Email terkirim:', '250 OK');
    });

    test('should log error when email sending fails', () => {
      const reportData = {
        jenis_laporan: 'Kehilangan',
        nama_barang: 'Kunci',
        lokasi: 'Parkiran',
        tanggal_kejadian: '2024-01-17',
        deskripsi: 'Kunci motor hilang',
        userEmail: 'loser@test.com',
      };

      const mockError = new Error('SMTP connection failed');

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      service.sendNewReportEmail(reportData);

      expect(console.error).toHaveBeenCalledWith('Gagal kirim email:', mockError);
    });

    test('should include all required HTML elements in email', () => {
      const reportData = {
        jenis_laporan: 'Penemuan',
        nama_barang: 'Tas',
        lokasi: 'Perpustakaan',
        tanggal_kejadian: '2024-01-18',
        deskripsi: 'Tas merah ditemukan',
        userEmail: 'reporter@test.com',
      };

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { response: 'OK' });
      });

      service.sendNewReportEmail(reportData);

      const emailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailOptions.html).toContain('<h3>Laporan Baru</h3>');
      expect(emailOptions.html).toContain('Jenis Laporan:');
      expect(emailOptions.html).toContain('Nama Barang:');
      expect(emailOptions.html).toContain('Lokasi:');
      expect(emailOptions.html).toContain('Tanggal Kejadian:');
      expect(emailOptions.html).toContain('Deskripsi:');
      expect(emailOptions.html).toContain('Pelapor:');
      expect(emailOptions.html).toContain('dashboard admin');
    });
  });

  describe('cleanupUploadedFile', () => {
    test('should delete file when req.file exists and file path exists', () => {
      const mockReq = {
        file: {
          filename: 'test-image.jpg',
          destination: 'uploads',
        },
      };

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.cleanupUploadedFile(mockReq);

      const expectedPath = path.join('uploads', 'test-image.jpg');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);
    });

    test('should not delete file when file does not exist', () => {
      const mockReq = {
        file: {
          filename: 'non-existent.jpg',
          destination: 'uploads',
        },
      };

      fs.existsSync.mockReturnValue(false);

      service.cleanupUploadedFile(mockReq);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should handle req without file property', () => {
      const mockReq = {};

      expect(() => {
        service.cleanupUploadedFile(mockReq);
      }).not.toThrow();

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should use default uploads directory when destination is not provided', () => {
      const mockReq = {
        file: {
          filename: 'image.png',
          destination: undefined,
        },
      };

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.cleanupUploadedFile(mockReq);

      const expectedPath = path.join('uploads', 'image.png');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);
    });

    test('should handle file deletion error gracefully', () => {
      const mockReq = {
        file: {
          filename: 'locked-file.jpg',
          destination: 'uploads',
        },
      };

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        service.cleanupUploadedFile(mockReq);
      }).toThrow('Permission denied');
    });
  });

  describe('deleteOldFile', () => {
    test('should delete file when it exists', () => {
      const filename = 'old-photo.jpg';

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.deleteOldFile(filename);

      const expectedPath = path.join('uploads', filename);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);
    });

    test('should not delete file when it does not exist', () => {
      const filename = 'non-existent.jpg';

      fs.existsSync.mockReturnValue(false);

      service.deleteOldFile(filename);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should construct correct file path in uploads directory', () => {
      const filename = 'photo-123.png';

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.deleteOldFile(filename);

      const expectedPath = path.join('uploads', filename);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    });

    test('should handle file deletion errors', () => {
      const filename = 'locked.jpg';

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('File is locked');
      });

      expect(() => {
        service.deleteOldFile(filename);
      }).toThrow('File is locked');
    });

    test('should handle empty filename', () => {
      const filename = '';

      fs.existsSync.mockReturnValue(false);

      service.deleteOldFile(filename);

      expect(fs.existsSync).toHaveBeenCalledWith(path.join('uploads', ''));
    });

    test('should handle filename with subdirectories', () => {
      const filename = 'subfolder/image.jpg';

      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.deleteOldFile(filename);

      const expectedPath = path.join('uploads', 'subfolder/image.jpg');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle multiple file operations in sequence', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => { });

      service.deleteOldFile('old1.jpg');
      service.deleteOldFile('old2.jpg');

      const mockReq = {
        file: {
          filename: 'new.jpg',
          destination: 'uploads',
        },
      };
      service.cleanupUploadedFile(mockReq);

      expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
    });

    test('should handle email and notification together', () => {
      const mockIo = { emit: jest.fn() };
      const mockReq = {
        app: {
          get: jest.fn().mockReturnValue(mockIo),
        },
      };

      const reportData = {
        jenis_laporan: 'Kehilangan',
        nama_barang: 'Laptop',
        lokasi: 'Lab Komputer',
        tanggal_kejadian: '2024-01-20',
        deskripsi: 'Laptop tertinggal',
        userEmail: 'student@test.com',
      };

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { response: 'OK' });
      });

      service.sendRealtimeNotification(mockReq, reportData);
      service.sendNewReportEmail(reportData);

      expect(mockIo.emit).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
