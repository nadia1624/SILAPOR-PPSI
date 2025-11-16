const LandingController = require('../../../controllers/LandingController');

describe('LandingController', () => {
  let controller;
  let mockModels;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock models
    mockModels = {
      Laporan: {
        findAll: jest.fn(),
        count: jest.fn(),
      },
      User: {
        findOne: jest.fn(),
        count: jest.fn(),
      },
    };

    // Initialize controller
    controller = new LandingController(mockModels);

    // Mock request and response objects
    mockReq = {
      user: null, // Landing page might not have authenticated user
    };

    mockRes = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize models correctly', () => {
      expect(controller.Laporan).toBe(mockModels.Laporan);
      expect(controller.User).toBe(mockModels.User);
    });

    test('should bind getLandingPage method correctly', () => {
      expect(typeof controller.getLandingPage).toBe('function');
    });
  });

  describe('getLandingPage', () => {
    test('should render landing page with all required data for guest user', async () => {
      const mockLaporanPenemuan = [
        {
          id_laporan: '1',
          jenis_laporan: 'Penemuan',
          nama_barang: 'Dompet',
          User: { nama: 'John Doe' },
        },
        {
          id_laporan: '2',
          jenis_laporan: 'Penemuan',
          nama_barang: 'Kunci',
          User: { nama: 'Jane Smith' },
        },
      ];

      const mockLaporanKehilangan = [
        {
          id_laporan: '3',
          jenis_laporan: 'Kehilangan',
          nama_barang: 'Laptop',
          User: { nama: 'Alice Brown' },
        },
      ];

      mockModels.Laporan.findAll
        .mockResolvedValueOnce(mockLaporanPenemuan)
        .mockResolvedValueOnce(mockLaporanKehilangan);

      mockModels.Laporan.count.mockResolvedValue(100);
      mockModels.User.count.mockResolvedValue(50);

      await controller.getLandingPage(mockReq, mockRes);

      // Verify findAll called for Penemuan
      expect(mockModels.Laporan.findAll).toHaveBeenNthCalledWith(1, {
        where: { jenis_laporan: 'Penemuan' },
        include: [{ model: mockModels.User, attributes: ['nama'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      // Verify findAll called for Kehilangan
      expect(mockModels.Laporan.findAll).toHaveBeenNthCalledWith(2, {
        where: { jenis_laporan: 'Kehilangan' },
        include: [{ model: mockModels.User, attributes: ['nama'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      // Verify count for statistics
      expect(mockModels.Laporan.count).toHaveBeenCalledWith({
        where: { status: 'Done' },
      });

      expect(mockModels.User.count).toHaveBeenCalledWith({
        where: { role: 'mahasiswa' },
      });

      // Verify render called with correct data
      expect(mockRes.render).toHaveBeenCalledWith('landing', {
        title: 'Beranda | Sistem Laporan Barang',
        laporanPenemuan: mockLaporanPenemuan,
        laporanKehilangan: mockLaporanKehilangan,
        user: null,
        jumlahLaporanSelesai: 100,
        jumlahMahasiswa: 50,
        jumlahUnitTerhubung: 25,
      });
    });

    test('should render landing page with user data for authenticated user', async () => {
      const mockUser = {
        email: 'user@test.com',
        nama: 'Test User',
        role: 'mahasiswa',
      };

      mockReq.user = { email: 'user@test.com' };

      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(50);
      mockModels.User.count.mockResolvedValue(30);
      mockModels.User.findOne.mockResolvedValue(mockUser);

      await controller.getLandingPage(mockReq, mockRes);

      expect(mockModels.User.findOne).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      });

      expect(mockRes.render).toHaveBeenCalledWith(
        'landing',
        expect.objectContaining({
          user: mockUser,
        })
      );
    });

    test('should handle empty report lists', async () => {
      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(0);
      mockModels.User.count.mockResolvedValue(0);

      await controller.getLandingPage(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('landing', {
        title: 'Beranda | Sistem Laporan Barang',
        laporanPenemuan: [],
        laporanKehilangan: [],
        user: null,
        jumlahLaporanSelesai: 0,
        jumlahMahasiswa: 0,
        jumlahUnitTerhubung: 25,
      });
    });

    test('should limit reports to 5 items', async () => {
      const mockReports = Array.from({ length: 10 }, (_, i) => ({
        id_laporan: `${i + 1}`,
        jenis_laporan: 'Penemuan',
        nama_barang: `Item ${i + 1}`,
        User: { nama: `User ${i + 1}` },
      }));

      mockModels.Laporan.findAll
        .mockResolvedValueOnce(mockReports.slice(0, 5))
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(10);
      mockModels.User.count.mockResolvedValue(5);

      await controller.getLandingPage(mockReq, mockRes);

      const renderedData = mockRes.render.mock.calls[0][1];
      expect(renderedData.laporanPenemuan).toHaveLength(5);
    });

    test('should order reports by createdAt DESC', async () => {
      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(0);
      mockModels.User.count.mockResolvedValue(0);

      await controller.getLandingPage(mockReq, mockRes);

      expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
        })
      );
    });

    test('should include correct statistics', async () => {
      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(75);
      mockModels.User.count.mockResolvedValue(120);

      await controller.getLandingPage(mockReq, mockRes);

      const renderedData = mockRes.render.mock.calls[0][1];
      expect(renderedData.jumlahLaporanSelesai).toBe(75);
      expect(renderedData.jumlahMahasiswa).toBe(120);
      expect(renderedData.jumlahUnitTerhubung).toBe(25);
    });

    test('should handle database errors gracefully', async () => {
      mockModels.Laporan.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.getLandingPage(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error saat memuat landing page:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Terjadi kesalahan pada server');
    });

    test('should handle error when fetching user data fails', async () => {
      mockReq.user = { email: 'user@test.com' };

      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(10);
      mockModels.User.count.mockResolvedValue(5);
      mockModels.User.findOne.mockRejectedValue(new Error('User not found'));

      await controller.getLandingPage(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error saat memuat landing page:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should include User model with nama attribute in report queries', async () => {
      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockResolvedValue(0);
      mockModels.User.count.mockResolvedValue(0);

      await controller.getLandingPage(mockReq, mockRes);

      expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [{ model: mockModels.User, attributes: ['nama'] }],
        })
      );
    });

    test('should handle statistics count errors', async () => {
      mockModels.Laporan.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockModels.Laporan.count.mockRejectedValue(new Error('Count failed'));

      await controller.getLandingPage(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error saat memuat landing page:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
