import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RentalStatus, VehicleStatus, RoleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RentalsService } from './rentals.service';
import { RentalsRepository } from './rentals.repository';
import { VehiclesService } from '../vehicles/vehicles.service';

describe('RentalsService', () => {
    let service: RentalsService;
    let repository: jest.Mocked<Partial<RentalsRepository>>;
    let vehiclesService: jest.Mocked<Partial<VehiclesService>>;
    let configService: jest.Mocked<Partial<ConfigService>>;

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
        dailyRate: new Decimal(500),
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
        owner: {
            id: 'owner-123',
            firstName: 'Araç',
            lastName: 'Sahibi',
            email: 'owner@test.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

    const mockRental = {
        id: 'rental-123',
        startDate: tomorrow,
        endDate: dayAfterTomorrow,
        actualEndDate: null,
        dailyRate: new Decimal(500),
        totalDays: 3,
        subtotal: new Decimal(1500),
        serviceFee: new Decimal(225),
        totalAmount: new Decimal(1725),
        currency: 'TRY',
        pickupLocation: 'İstanbul Havalimanı',
        returnLocation: 'Taksim',
        status: RentalStatus.PENDING,
        notes: null,
        vehicleId: 'vehicle-123',
        customerId: 'customer-123',
        vehicle: {
            id: 'vehicle-123',
            make: 'Toyota',
            model: 'Corolla',
            licensePlate: '34 AB 1234',
            images: [],
        },
        customer: {
            id: 'customer-123',
            firstName: 'Test',
            lastName: 'Müşteri',
            email: 'customer@test.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        repository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByCustomerId: jest.fn(),
            findByVehicleId: jest.fn(),
            findByOwnerId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            hasOverlappingRentals: jest.fn(),
            getStatistics: jest.fn(),
        };

        vehiclesService = {
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };

        configService = {
            get: jest.fn().mockReturnValue(0.15),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RentalsService,
                { provide: RentalsRepository, useValue: repository },
                { provide: VehiclesService, useValue: vehiclesService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<RentalsService>(RentalsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // CREATE RENTAL TESTLER
    // ============================================

    describe('create()', () => {
        const createDto = {
            vehicleId: 'vehicle-123',
            startDate: tomorrow.toISOString(),
            endDate: dayAfterTomorrow.toISOString(),
            pickupLocation: 'İstanbul Havalimanı',
            returnLocation: 'Taksim',
        };

        it('başarılı kiralama oluşturma', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.hasOverlappingRentals as jest.Mock).mockResolvedValue(false);
            (repository.create as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.create('customer-123', createDto);

            expect(result).toEqual(mockRental);
            expect(vehiclesService.updateStatus).toHaveBeenCalledWith(
                'vehicle-123',
                VehicleStatus.BOOKED,
            );
        });

        it('araç müsait değil - BadRequestException', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                status: VehicleStatus.BOOKED,
            });

            await expect(
                service.create('customer-123', createDto),
            ).rejects.toThrow(BadRequestException);
        });

        it('araç onaylanmamış - BadRequestException', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue({
                ...mockVehicle,
                isApproved: false,
            });

            await expect(
                service.create('customer-123', createDto),
            ).rejects.toThrow(BadRequestException);
        });

        it('çakışan tarihler - BadRequestException', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.hasOverlappingRentals as jest.Mock).mockResolvedValue(true);

            await expect(
                service.create('customer-123', createDto),
            ).rejects.toThrow(BadRequestException);
        });

        it('1 günden az kiralama - BadRequestException', async () => {
            const sameDay = new Date();
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.hasOverlappingRentals as jest.Mock).mockResolvedValue(false);

            await expect(
                service.create('customer-123', {
                    ...createDto,
                    startDate: sameDay.toISOString(),
                    endDate: sameDay.toISOString(),
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('araç bulunamadı - NotFoundException', async () => {
            (vehiclesService.findById as jest.Mock).mockRejectedValue(
                new NotFoundException('Vehicle not found'),
            );

            await expect(
                service.create('customer-123', createDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('fiyatlandırma doğru hesaplanır (komisyon dahil)', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.hasOverlappingRentals as jest.Mock).mockResolvedValue(false);
            (repository.create as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            await service.create('customer-123', createDto);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    pickupLocation: 'İstanbul Havalimanı',
                    returnLocation: 'Taksim',
                    vehicle: { connect: { id: 'vehicle-123' } },
                    customer: { connect: { id: 'customer-123' } },
                }),
            );
        });
    });

    // ============================================
    // FIND BY ID TESTLER
    // ============================================

    describe('findById()', () => {
        it('mevcut kiralama - doğru kiralama döner', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);

            const result = await service.findById('rental-123');

            expect(result).toEqual(mockRental);
        });

        it('olmayan kiralama - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // START RENTAL TESTLER
    // ============================================

    describe('startRental()', () => {
        it('araç sahibi kiralamayı başlatabilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.ACTIVE,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.startRental(
                'rental-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result.status).toBe(RentalStatus.ACTIVE);
            expect(vehiclesService.updateStatus).toHaveBeenCalledWith(
                'vehicle-123',
                VehicleStatus.ACTIVE,
            );
        });

        it('SUPER_ADMIN kiralamayı başlatabilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.ACTIVE,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.startRental(
                'rental-123',
                'admin-123',
                RoleType.SUPER_ADMIN,
            );

            expect(result.status).toBe(RentalStatus.ACTIVE);
        });

        it('müşteri başlatamaz - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.startRental('rental-123', 'customer-123', RoleType.CUSTOMER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('PENDING olmayan kiralama başlatılamaz', async () => {
            (repository.findById as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.ACTIVE,
            });
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.startRental('rental-123', 'owner-123', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================
    // COMPLETE RENTAL TESTLER
    // ============================================

    describe('completeRental()', () => {
        it('aktif kiralama tamamlanabilir', async () => {
            const activeRental = { ...mockRental, status: RentalStatus.ACTIVE };
            (repository.findById as jest.Mock).mockResolvedValue(activeRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.update as jest.Mock).mockResolvedValue({
                ...activeRental,
                status: RentalStatus.COMPLETED,
                actualEndDate: new Date(),
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.completeRental(
                'rental-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result.status).toBe(RentalStatus.COMPLETED);
            expect(vehiclesService.updateStatus).toHaveBeenCalledWith(
                'vehicle-123',
                VehicleStatus.AVAILABLE,
            );
        });

        it('aktif olmayan kiralama tamamlanamaz', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental); // PENDING
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.completeRental('rental-123', 'owner-123', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(BadRequestException);
        });

        it('başka sahip tamamlayamaz - ForbiddenException', async () => {
            const activeRental = { ...mockRental, status: RentalStatus.ACTIVE };
            (repository.findById as jest.Mock).mockResolvedValue(activeRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.completeRental('rental-123', 'other-owner', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ============================================
    // CANCEL RENTAL TESTLER
    // ============================================

    describe('cancelRental()', () => {
        it('müşteri kendi kiralamasını iptal edebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.CANCELLED,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            const result = await service.cancelRental(
                'rental-123',
                'customer-123',
                RoleType.CUSTOMER,
            );

            expect(result.status).toBe(RentalStatus.CANCELLED);
        });

        it('araç sahibi kiralamayı iptal edebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.CANCELLED,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.cancelRental(
                'rental-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result.status).toBe(RentalStatus.CANCELLED);
        });

        it('tamamlanmış kiralama iptal edilemez', async () => {
            (repository.findById as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.COMPLETED,
            });

            await expect(
                service.cancelRental('rental-123', 'customer-123', RoleType.CUSTOMER),
            ).rejects.toThrow(BadRequestException);
        });

        it('yetkisiz kullanıcı iptal edemez - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.cancelRental('rental-123', 'random-user', RoleType.CUSTOMER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('iptal sonrası araç AVAILABLE yapılır', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.CANCELLED,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await service.cancelRental('rental-123', 'customer-123', RoleType.CUSTOMER);

            expect(vehiclesService.updateStatus).toHaveBeenCalledWith(
                'vehicle-123',
                VehicleStatus.AVAILABLE,
            );
        });
    });

    // ============================================
    // APPROVE / REJECT RENTAL TESTLER
    // ============================================

    describe('approveRental()', () => {
        it('araç sahibi talebi onaylayabilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.APPROVED,
            });

            const result = await service.approveRental(
                'rental-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result.status).toBe(RentalStatus.APPROVED);
        });

        it('PENDING olmayan talep onaylanamaz', async () => {
            (repository.findById as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.ACTIVE,
            });
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.approveRental('rental-123', 'owner-123', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(BadRequestException);
        });

        it('başka sahip onaylayamaz - ForbiddenException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.approveRental('rental-123', 'other-owner', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('rejectRental()', () => {
        it('araç sahibi talebi reddedebilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.REJECTED,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            const result = await service.rejectRental(
                'rental-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result.status).toBe(RentalStatus.REJECTED);
        });

        it('red sonrası araç AVAILABLE yapılır', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockRental);
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.updateStatus as jest.Mock).mockResolvedValue({
                ...mockRental,
                status: RentalStatus.REJECTED,
            });
            (vehiclesService.updateStatus as jest.Mock).mockResolvedValue(undefined);

            await service.rejectRental('rental-123', 'owner-123', RoleType.VEHICLE_OWNER);

            expect(vehiclesService.updateStatus).toHaveBeenCalledWith(
                'vehicle-123',
                VehicleStatus.AVAILABLE,
            );
        });
    });

    // ============================================
    // GET VEHICLE RENTALS TESTLER
    // ============================================

    describe('getVehicleRentals()', () => {
        it('araç sahibi kendi aracının kiralamalarını görebilir', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.findByVehicleId as jest.Mock).mockResolvedValue([mockRental]);

            const result = await service.getVehicleRentals(
                'vehicle-123',
                'owner-123',
                RoleType.VEHICLE_OWNER,
            );

            expect(result).toHaveLength(1);
        });

        it('başka sahibin aracı - ForbiddenException', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(
                service.getVehicleRentals('vehicle-123', 'other-owner', RoleType.VEHICLE_OWNER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('SUPER_ADMIN herhangi bir aracın kiralamalarını görebilir', async () => {
            (vehiclesService.findById as jest.Mock).mockResolvedValue(mockVehicle);
            (repository.findByVehicleId as jest.Mock).mockResolvedValue([mockRental]);

            const result = await service.getVehicleRentals(
                'vehicle-123',
                'admin-123',
                RoleType.SUPER_ADMIN,
            );

            expect(result).toHaveLength(1);
        });
    });

    // ============================================
    // STATISTICS TESTLER
    // ============================================

    describe('getStatistics()', () => {
        it('istatistikleri döner', async () => {
            const stats = {
                totalRentals: 100,
                activeRentals: 20,
                completedRentals: 70,
                pendingRentals: 10,
            };
            (repository.getStatistics as jest.Mock).mockResolvedValue(stats);

            const result = await service.getStatistics();

            expect(result).toEqual(stats);
        });
    });

    // ============================================
    // FIND ALL (ADMIN) TESTLER
    // ============================================

    describe('findAll()', () => {
        it('tüm kiralamaları pagination ile listeler', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                rentals: [mockRental],
                total: 1,
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.rentals).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });
    });
});
