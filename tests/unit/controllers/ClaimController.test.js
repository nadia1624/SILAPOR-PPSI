const ClaimController = require('../../../controllers/ClaimController');

describe('ClaimController', () => {
  let controller;
  let mockModels;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock models
    mockModels = {
      Claim: {
        findAll: jest.fn(),
        destroy: jest.fn(),
      },
      Laporan: {
        update: jest.fn(),
      },
      User: {
        findOne: jest.fn(),
      },
    };

    // Initialize controller
    controller = new ClaimController(mockModels);

    // Mock request and response objects
    mockReq = {
      user: { email: 'test@example.com' },
      params: {},
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
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
      expect(controller.Claim).toBe(mockModels.Claim);
      expect(controller.Laporan).toBe(mockModels.Laporan);
      expect(controller.User).toBe(mockModels.User);
    });

    test('should bind methods correctly', () => {
      expect(typeof controller.getMyClaims).toBe('function');
      expect(typeof controller.getMyClaimsAdmin).toBe('function');
      expect(typeof controller.cancelClaim).toBe('function');
      expect(typeof controller.cancelClaimAdmin).toBe('function');
    });
  });

  describe('getMyClaims', () => {
    test('should render my-claim page with claims and user data', async () => {
      const mockClaims = [
        {
          id_claim: 1,
          email: 'test@example.com',
          Laporan: {
            toJSON: () => ({
              id_laporan: '1',
              nama_barang: 'Laptop',
              status: 'Claimed',
            }),
          },
          toJSON: () => ({
            id_claim: 1,
            email: 'test@example.com',
          }),
        },
      ];

      const mockUser = {
        email: 'test@example.com',
        nama: 'Test User',
      };

      mockModels.Claim.findAll.mockResolvedValue(mockClaims);
      mockModels.User.findOne.mockResolvedValue(mockUser);

      await controller.getMyClaims(mockReq, mockRes);

      expect(mockModels.Claim.findAll).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [
          {
            model: mockModels.Laporan,
            include: [{ model: mockModels.User }],
          },
        ],
        order: [['id_claim', 'DESC']],
      });

      expect(mockModels.User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      expect(mockRes.render).toHaveBeenCalledWith('my-claim', {
        reports: expect.any(Array),
        user: mockUser,
      });
    });

    test('should handle errors and return 500 status', async () => {
      mockModels.Claim.findAll.mockRejectedValue(new Error('Database error'));

      await controller.getMyClaims(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error getMyClaims:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        'Terjadi kesalahan saat mengambil klaim'
      );
    });

    test('should format claims correctly', async () => {
      const mockClaims = [
        {
          id_claim: 1,
          email: 'test@example.com',
          Laporan: {
            toJSON: () => ({
              id_laporan: '1',
              nama_barang: 'Laptop',
            }),
          },
          toJSON: () => ({
            id_claim: 1,
            email: 'test@example.com',
          }),
        },
      ];

      mockModels.Claim.findAll.mockResolvedValue(mockClaims);
      mockModels.User.findOne.mockResolvedValue({});

      await controller.getMyClaims(mockReq, mockRes);

      const renderedData = mockRes.render.mock.calls[0][1];
      expect(renderedData.reports[0]).toHaveProperty('Claim');
      expect(renderedData.reports[0].Claim).toEqual({
        id_claim: 1,
        email: 'test@example.com',
      });
    });
  });

  describe('getMyClaimsAdmin', () => {
    test('should render admin/my-claim page with claims and user data', async () => {
      const mockClaims = [
        {
          id_claim: 1,
          email: 'test@example.com',
          Laporan: {
            toJSON: () => ({
              id_laporan: '1',
              nama_barang: 'Laptop',
            }),
          },
          toJSON: () => ({
            id_claim: 1,
            email: 'test@example.com',
          }),
        },
      ];

      const mockUser = {
        email: 'test@example.com',
        nama: 'Admin User',
        role: 'admin',
      };

      mockModels.Claim.findAll.mockResolvedValue(mockClaims);
      mockModels.User.findOne.mockResolvedValue(mockUser);

      await controller.getMyClaimsAdmin(mockReq, mockRes);

      expect(mockModels.Claim.findAll).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [
          {
            model: mockModels.Laporan,
            include: [{ model: mockModels.User }],
          },
        ],
        order: [['id_claim', 'DESC']],
      });

      expect(mockRes.render).toHaveBeenCalledWith('admin/my-claim', {
        reports: expect.any(Array),
        user: mockUser,
      });
    });

    test('should handle errors and return 500 status', async () => {
      mockModels.Claim.findAll.mockRejectedValue(new Error('Database error'));

      await controller.getMyClaimsAdmin(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error getMyClaimsAdmin:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        'Terjadi kesalahan saat mengambil klaim Admin'
      );
    });
  });

  describe('cancelClaim', () => {
    test('should cancel claim and redirect to my-claim page', async () => {
      mockReq.params.id_laporan = '123';

      mockModels.Claim.destroy.mockResolvedValue(1);
      mockModels.Laporan.update.mockResolvedValue([1]);

      await controller.cancelClaim(mockReq, mockRes);

      expect(mockModels.Claim.destroy).toHaveBeenCalledWith({
        where: { id_laporan: '123', email: 'test@example.com' },
      });

      expect(mockModels.Laporan.update).toHaveBeenCalledWith(
        { status: 'On progress', pengklaim: null, no_hp_pengklaim: null },
        { where: { id_laporan: '123' } }
      );

      expect(mockRes.redirect).toHaveBeenCalledWith('/mahasiswa/my-claim');
    });

    test('should handle errors and return 500 status', async () => {
      mockReq.params.id_laporan = '123';

      mockModels.Claim.destroy.mockRejectedValue(new Error('Delete failed'));

      await controller.cancelClaim(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error cancelClaim:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Gagal batal klaim');
    });

    test('should process cancellation correctly with valid data', async () => {
      mockReq.params.id_laporan = '456';
      mockReq.user.email = 'user@test.com';

      mockModels.Claim.destroy.mockResolvedValue(1);
      mockModels.Laporan.update.mockResolvedValue([1]);

      await controller.cancelClaim(mockReq, mockRes);

      expect(mockModels.Claim.destroy).toHaveBeenCalledWith({
        where: { id_laporan: '456', email: 'user@test.com' },
      });

      expect(mockModels.Laporan.update).toHaveBeenCalledWith(
        { status: 'On progress', pengklaim: null, no_hp_pengklaim: null },
        { where: { id_laporan: '456' } }
      );
    });
  });

  describe('cancelClaimAdmin', () => {
    test('should cancel claim and redirect to admin my-claim page', async () => {
      mockReq.params.id_laporan = '789';

      mockModels.Claim.destroy.mockResolvedValue(1);
      mockModels.Laporan.update.mockResolvedValue([1]);

      await controller.cancelClaimAdmin(mockReq, mockRes);

      expect(mockModels.Claim.destroy).toHaveBeenCalledWith({
        where: { id_laporan: '789', email: 'test@example.com' },
      });

      expect(mockModels.Laporan.update).toHaveBeenCalledWith(
        { status: 'On progress', pengklaim: null, no_hp_pengklaim: null },
        { where: { id_laporan: '789' } }
      );

      expect(mockRes.redirect).toHaveBeenCalledWith('/admin/my-claim');
    });

    test('should handle errors and return 500 status', async () => {
      mockReq.params.id_laporan = '789';

      mockModels.Claim.destroy.mockRejectedValue(
        new Error('Admin delete failed')
      );

      await controller.cancelClaimAdmin(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error cancelClaimAdmin:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Gagal batal klaim Admin');
    });

    test('should update laporan status correctly after cancellation', async () => {
      mockReq.params.id_laporan = '999';

      mockModels.Claim.destroy.mockResolvedValue(1);
      mockModels.Laporan.update.mockResolvedValue([1]);

      await controller.cancelClaimAdmin(mockReq, mockRes);

      expect(mockModels.Laporan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'On progress',
          pengklaim: null,
          no_hp_pengklaim: null,
        }),
        { where: { id_laporan: '999' } }
      );
    });
  });
});
