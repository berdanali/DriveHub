import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorites.repository';

describe('FavoritesService', () => {
    let service: FavoritesService;
    let repository: jest.Mocked<Partial<FavoritesRepository>>;

    const mockFavorite = {
        id: 'fav-123',
        userId: 'user-123',
        vehicleId: 'vehicle-123',
        createdAt: new Date(),
        vehicle: {
            id: 'vehicle-123',
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            dailyRate: 500,
            images: [],
            owner: {
                id: 'owner-123',
                firstName: 'Araç',
                lastName: 'Sahibi',
            },
        },
    };

    beforeEach(async () => {
        repository = {
            findByUserId: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            getUserFavoriteVehicleIds: jest.fn(),
            count: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FavoritesService,
                { provide: FavoritesRepository, useValue: repository },
            ],
        }).compile();

        service = module.get<FavoritesService>(FavoritesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // GET USER FAVORITES TESTLER
    // ============================================

    describe('getUserFavorites()', () => {
        it('kullanıcının favorilerini döner', async () => {
            (repository.findByUserId as jest.Mock).mockResolvedValue([mockFavorite]);

            const result = await service.getUserFavorites('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].vehicleId).toBe('vehicle-123');
            expect(result[0].vehicle).toBeDefined();
        });

        it('favori yoksa boş dizi döner', async () => {
            (repository.findByUserId as jest.Mock).mockResolvedValue([]);

            const result = await service.getUserFavorites('user-123');

            expect(result).toHaveLength(0);
        });

        it('response formatı doğru', async () => {
            (repository.findByUserId as jest.Mock).mockResolvedValue([mockFavorite]);

            const result = await service.getUserFavorites('user-123');

            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('vehicleId');
            expect(result[0]).toHaveProperty('createdAt');
            expect(result[0]).toHaveProperty('vehicle');
        });
    });

    // ============================================
    // ADD FAVORITE TESTLER
    // ============================================

    describe('addFavorite()', () => {
        it('başarılı ekleme', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);
            (repository.create as jest.Mock).mockResolvedValue(mockFavorite);

            const result = await service.addFavorite('user-123', 'vehicle-123');

            expect(result).toEqual(mockFavorite);
            expect(repository.create).toHaveBeenCalledWith('user-123', 'vehicle-123');
        });

        it('zaten favorilerde - ConflictException', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(mockFavorite);

            await expect(
                service.addFavorite('user-123', 'vehicle-123'),
            ).rejects.toThrow(ConflictException);

            expect(repository.create).not.toHaveBeenCalled();
        });
    });

    // ============================================
    // REMOVE FAVORITE TESTLER
    // ============================================

    describe('removeFavorite()', () => {
        it('başarılı çıkarma', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(mockFavorite);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            await service.removeFavorite('user-123', 'vehicle-123');

            expect(repository.delete).toHaveBeenCalledWith('user-123', 'vehicle-123');
        });

        it('favorilerde değil - NotFoundException', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.removeFavorite('user-123', 'vehicle-123'),
            ).rejects.toThrow(NotFoundException);

            expect(repository.delete).not.toHaveBeenCalled();
        });
    });

    // ============================================
    // IS FAVORITE TESTLER
    // ============================================

    describe('isFavorite()', () => {
        it('favorideyse true döner', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(mockFavorite);

            const result = await service.isFavorite('user-123', 'vehicle-123');

            expect(result).toBe(true);
        });

        it('favoride değilse false döner', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);

            const result = await service.isFavorite('user-123', 'vehicle-123');

            expect(result).toBe(false);
        });
    });

    // ============================================
    // GET FAVORITE IDS TESTLER
    // ============================================

    describe('getUserFavoriteIds()', () => {
        it('favori araç ID lerini döner', async () => {
            (repository.getUserFavoriteVehicleIds as jest.Mock).mockResolvedValue([
                'vehicle-1',
                'vehicle-2',
            ]);

            const result = await service.getUserFavoriteIds('user-123');

            expect(result).toEqual(['vehicle-1', 'vehicle-2']);
        });

        it('favori yoksa boş dizi döner', async () => {
            (repository.getUserFavoriteVehicleIds as jest.Mock).mockResolvedValue([]);

            const result = await service.getUserFavoriteIds('user-123');

            expect(result).toEqual([]);
        });
    });

    // ============================================
    // TOGGLE FAVORITE TESTLER
    // ============================================

    describe('toggleFavorite()', () => {
        it('favoride yoksa ekler ve isFavorite=true döner', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);
            (repository.create as jest.Mock).mockResolvedValue(mockFavorite);

            const result = await service.toggleFavorite('user-123', 'vehicle-123');

            expect(result.isFavorite).toBe(true);
            expect(repository.create).toHaveBeenCalled();
        });

        it('favorideyse çıkarır ve isFavorite=false döner', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(mockFavorite);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            const result = await service.toggleFavorite('user-123', 'vehicle-123');

            expect(result.isFavorite).toBe(false);
            expect(repository.delete).toHaveBeenCalled();
        });

        it('toggle 2 kez çağrılınca orijinal duruma döner', async () => {
            // İlk çağrı: Favori yok, ekle
            (repository.findOne as jest.Mock).mockResolvedValueOnce(null);
            (repository.create as jest.Mock).mockResolvedValue(mockFavorite);

            const result1 = await service.toggleFavorite('user-123', 'vehicle-123');
            expect(result1.isFavorite).toBe(true);

            // İkinci çağrı: Favori var, çıkar
            (repository.findOne as jest.Mock).mockResolvedValueOnce(mockFavorite);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            const result2 = await service.toggleFavorite('user-123', 'vehicle-123');
            expect(result2.isFavorite).toBe(false);
        });
    });
});

