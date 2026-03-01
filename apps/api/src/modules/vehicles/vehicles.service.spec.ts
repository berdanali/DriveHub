import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { VehicleStatus, RoleType } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';
import { RedisService } from '../../redis/redis.service';

describe('VehiclesService', () => {
    let service: VehiclesService;
    let repository: jest.Mocked<Partial<VehiclesRepository>>;
    let redisService: jest.Mocked<Partial<RedisService>>;

    const mockOwner = {
        id: 'owner-123',
        firstName: 'Araç',
        lastName: 'Sahibi',
        email: 'owner@test.com',
    };

    const mockVehicle = {
        id: 'vehicle-123',
        make: 'Toyota',
        model: 'Corolla',
        year: 2024,
        licensePlate: '34 AB 1234',
        color: 'Beyaz',
        seats: 5,
        fuelType: 'Hybrid',
        transmission: 'Otomatik',
        dailyRate: { toNumber: () => 500 } as any,
        description: 'Test aracı',
        images: [],
        features: ['GPS'],
        latitude: 41.0082,
        longitude: 28.9784,
        address: 'İstanbul',
        city: 'İstanbul',
        status: VehicleStatus.AVAILABLE,
        isApproved: true,
        deletedAt: null,
        ownerId: 'owner-123',
        owner: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        repository = {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            findByOwnerId: jest.fn(),
            updateStatus: jest.fn(),
            approve: jest.fn(),
            getActiveVehiclesWithLocations: jest.fn(),
        };

        redisService = {
            getCachedVehicleSearch: jest.fn().mockResolvedValue(null),
            cacheVehicleSearch: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VehiclesService,
                { provide: VehiclesRepository, useValue: repository },
                { provide: RedisService, useValue: redisService },
            ],
        }).compile();

        service = module.get<VehiclesService>(VehiclesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // CREATE TESTLER
    // ============================================

    describe('create()', () => {
        const createDto = {
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            licensePlate: '34 AB 1234',
            color: 'Beyaz',
            fuelType: 'Hybrid',
            transmission: 'Otomatik',
            dailyRate: 500,
        };

        it('araç başarıyla oluşturulur', async () => {
            (repository.create as jest.Mock).mockResolvedValue(mockVehicle);

            const result = await service.create('owner-123', createDto);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    owner: { connect: { id: 'owner-123' } },
                }),
            );
            expect(result).toEqual(mockVehicle);
        });

        it('oluşturulan araç owner bilgisi içerir', async () => {
            (repository.create as jest.Mock).mockResolvedValue(mockVehicle);

            const result = await service.create('owner-123', createDto);

            expect(result.owner).toBeDefined();
            expect(result.owner.id).toBe('owner-123');
        });
    });

    // ============================================
    // FIND BY ID TESTLER
    // ============================================

    describe('findById()', () => {
        it('mevcut araç - doğru araç döner', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);

            const result = await service.findById('vehicle-123');

            expect(result).toEqual(mockVehicle);
            expect(repository.findById).toHaveBeenCalledWith('vehicle-123');
        });

        it('olmayan araç - NotFoundException fırlatır', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(service.findById('nonexistent-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ============================================
    // UPDATE TESTLER
    // ============================================

    describe('update()', () => {
        const updateDto = { description: 'Güncellenmiş açıklama' };

        it('araç sahibi kendi aracını güncelleyebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.update as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                description: updateDto.description,
            });

            const result = await service.update(
                'vehicle-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
                updateDto,
            );

            expect(result.description).toBe(updateDto.description);
        });

        it('SUPER_ADMIN başka birinin aracını güncelleyebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.update as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                ...updateDto,
            });

            const result = await service.update(
                'vehicle-123',
                'admin-123', // Farklı kullanıcı
                RoleType.SUPER_ADMIN,
                updateDto,
            );

            expect(result).toBeDefined();
        });

        it('başka sahibin aracı - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.update('vehicle-123', 'other-user', RoleType.VEHICLE_OWNER, updateDto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('müşteri aracı güncelleyemez - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.update('vehicle-123', 'customer-123', RoleType.CUSTOMER, updateDto),
            ).rejects.toThrow(ForbiddenException);
        });

        it('olmayan araç - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.update('nonexistent', 'owner-123', RoleType.VEHICLE_OWNER, updateDto),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // DELETE TESTLER
    // ============================================

    describe('delete()', () => {
        it('araç sahibi kendi aracını silebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            await service.delete('vehicle-123', 'owner-123', RoleType.VEHICLE_OWNER);

            expect(repository.delete).toHaveBeenCalledWith('vehicle-123');
        });

        it('SUPER_ADMIN herhangi bir aracı silebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            await service.delete('vehicle-123', 'admin-123', RoleType.SUPER_ADMIN);

            expect(repository.delete).toHaveBeenCalledWith('vehicle-123');
        });

        it('başka sahibin aracını silemez - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.delete('vehicle-123', 'other-user', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('müşteri araç silemez - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.delete('vehicle-123', 'customer-123', RoleType.CUSTOMER),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ============================================
    // SEARCH TESTLER
    // ============================================

    describe('search()', () => {
        const searchQuery = { page: 1, limit: 10 };

        it('başarılı arama - araç listesi ve pagination döner', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [mockVehicle],
                total: 1,
            });

            const result = await service.search(searchQuery);

            expect(result.vehicles).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });

        it('cache hit - veritabanına sorgu yapmaz', async () => {
            (redisService.getCachedVehicleSearch as jest.Mock).mockResolvedValue({
                vehicles: [mockVehicle],
                total: 1,
            });

            const result = await service.search(searchQuery);

            expect(repository.findAll).not.toHaveBeenCalled();
            expect(result.vehicles).toHaveLength(1);
        });

        it('cache miss - veritabanından çeker ve cache eder', async () => {
            (redisService.getCachedVehicleSearch as jest.Mock).mockResolvedValue(null);
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [mockVehicle],
                total: 1,
            });

            await service.search(searchQuery);

            expect(repository.findAll).toHaveBeenCalled();
            expect(redisService.cacheVehicleSearch).toHaveBeenCalled();
        });

        it('arama parametresi ile filtreler', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [],
                total: 0,
            });

            await service.search({ ...searchQuery, search: 'Toyota' });

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isApproved: true,
                        OR: expect.arrayContaining([
                            expect.objectContaining({
                                make: { contains: 'Toyota', mode: 'insensitive' },
                            }),
                        ]),
                    }),
                }),
            );
        });

        it('fiyat filtresi çalışır', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [],
                total: 0,
            });

            await service.search({ ...searchQuery, minPrice: 100, maxPrice: 500 });

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        dailyRate: { gte: 100, lte: 500 },
                    }),
                }),
            );
        });

        it('boş sonuç - boş dizi ve 0 total döner', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [],
                total: 0,
            });

            const result = await service.search(searchQuery);

            expect(result.vehicles).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(0);
        });

        it('sadece onaylı araçlar listelenir', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [],
                total: 0,
            });

            await service.search(searchQuery);

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isApproved: true,
                    }),
                }),
            );
        });
    });

    // ============================================
    // OWNER VEHICLES TESTLER
    // ============================================

    describe('getOwnerVehicles()', () => {
        it('sahip araçlarını döner', async () => {
            (repository.findByOwnerId as jest.Mock).mockResolvedValue([mockVehicle]);

            const result = await service.getOwnerVehicles('owner-123');

            expect(result).toHaveLength(1);
            expect(repository.findByOwnerId).toHaveBeenCalledWith('owner-123');
        });

        it('araç yoksa boş dizi döner', async () => {
            (repository.findByOwnerId as jest.Mock).mockResolvedValue([]);

            const result = await service.getOwnerVehicles('owner-no-vehicles');

            expect(result).toHaveLength(0);
        });
    });

    // ============================================
    // STATUS UPDATE TESTLER
    // ============================================

    describe('updateStatus()', () => {
        it('araç durumunu günceller', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                status: VehicleStatus.MAINTENANCE,
            });

            const result = await service.updateStatus('vehicle-123', VehicleStatus.MAINTENANCE);

            expect(result.status).toBe(VehicleStatus.MAINTENANCE);
        });

        it('olmayan araç - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.updateStatus('nonexistent', VehicleStatus.AVAILABLE),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // APPROVE VEHICLE TESTLER
    // ============================================

    describe('approveVehicle()', () => {
        it('araç onaylanır', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.approve as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                isApproved: true,
            });

            const result = await service.approveVehicle('vehicle-123', true);

            expect(result.isApproved).toBe(true);
        });

        it('araç reddedilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.approve as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                isApproved: false,
            });

            const result = await service.approveVehicle('vehicle-123', false);

            expect(result.isApproved).toBe(false);
        });

        it('olmayan araç - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.approveVehicle('nonexistent', true),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // FIND ALL (ADMIN) TESTLER
    // ============================================

    describe('findAll()', () => {
        it('tüm araçları pagination ile listeler', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [mockVehicle],
                total: 1,
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.vehicles).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
        });

        it('arama parametresi plaka ile de çalışır', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                vehicles: [],
                total: 0,
            });

            await service.findAll({ page: 1, limit: 10, search: '34 AB' });

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({
                                licensePlate: { contains: '34 AB', mode: 'insensitive' },
                            }),
                        ]),
                    }),
                }),
            );
        });
    });
});
