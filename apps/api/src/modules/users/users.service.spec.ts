import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
    let service: UsersService;
    let repository: jest.Mocked<Partial<UsersRepository>>;
    let prisma: any;

    const mockRole = {
        id: 'role-123',
        name: RoleType.CUSTOMER,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$argon2id$v=19$m=65536,t=3,p=4$hash',
        firstName: 'Test',
        lastName: 'Kullanıcı',
        phone: '+905551234567',
        avatar: null,
        birthDate: null,
        tcNumber: null,
        gender: null,
        isActive: true,
        isVerified: true,
        refreshToken: null,
        deletedAt: null,
        roleId: 'role-123',
        role: mockRole,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        repository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateRefreshToken: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
            toggleActive: jest.fn(),
        };

        prisma = {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            address: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
                delete: jest.fn(),
            },
            notificationPreference: {
                findUnique: jest.fn(),
                create: jest.fn(),
                upsert: jest.fn(),
            },
            driverLicense: {
                findUnique: jest.fn(),
                upsert: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: UsersRepository, useValue: repository },
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // FIND TESTLER
    // ============================================

    describe('findById()', () => {
        it('mevcut kullanıcı - doğru kullanıcı döner', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.findById('user-123');

            expect(result).toEqual(mockUser);
            expect(repository.findById).toHaveBeenCalledWith('user-123');
        });

        it('olmayan kullanıcı - null döner', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            const result = await service.findById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('findByEmail()', () => {
        it('mevcut e-posta - kullanıcı döner', async () => {
            (repository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
        });

        it('olmayan e-posta - null döner', async () => {
            (repository.findByEmail as jest.Mock).mockResolvedValue(null);

            const result = await service.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    // ============================================
    // CREATE TESTLER
    // ============================================

    describe('create()', () => {
        it('yeni kullanıcı oluşturur', async () => {
            (repository.create as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.create({
                email: 'new@example.com',
                password: 'hashedPassword',
                firstName: 'Yeni',
                lastName: 'Kullanıcı',
            });

            expect(result).toEqual(mockUser);
        });

        it('rol belirtilmezse CUSTOMER kullanılır', async () => {
            (repository.create as jest.Mock).mockResolvedValue(mockUser);

            await service.create({
                email: 'new@example.com',
                password: 'hashedPassword',
                firstName: 'Yeni',
                lastName: 'Kullanıcı',
            });

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    roleType: RoleType.CUSTOMER,
                }),
            );
        });
    });

    // ============================================
    // UPDATE TESTLER
    // ============================================

    describe('update()', () => {
        it('profil güncellenir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);
            (repository.update as jest.Mock).mockResolvedValue({
                ...mockUser,
                firstName: 'Güncellendi',
            });

            const result = await service.update('user-123', { firstName: 'Güncellendi' });

            expect(result.firstName).toBe('Güncellendi');
        });

        it('olmayan kullanıcı - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.update('nonexistent', { firstName: 'Test' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('birthDate string olarak gönderilir, Date olarak kaydedilir', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);
            (repository.update as jest.Mock).mockResolvedValue(mockUser);

            await service.update('user-123', { birthDate: '1990-01-01' });

            expect(repository.update).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({
                    birthDate: expect.any(Date),
                }),
            );
        });

        it('sadece gönderilen alanlar güncellenir (partial update)', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);
            (repository.update as jest.Mock).mockResolvedValue(mockUser);

            await service.update('user-123', { phone: '+905559999999' });

            expect(repository.update).toHaveBeenCalledWith(
                'user-123',
                { phone: '+905559999999' },
            );
        });
    });

    // ============================================
    // ADRES İŞLEMLERİ TESTLER
    // ============================================

    describe('getAddresses()', () => {
        it('kullanıcının adreslerini döner', async () => {
            const mockAddresses = [
                { id: 'addr-1', city: 'İstanbul', district: 'Kadıköy', isDefault: true },
                { id: 'addr-2', city: 'Ankara', district: 'Çankaya', isDefault: false },
            ];
            prisma.address.findMany.mockResolvedValue(mockAddresses);

            const result = await service.getAddresses('user-123');

            expect(result).toHaveLength(2);
        });
    });

    describe('addAddress()', () => {
        it('yeni adres ekler', async () => {
            const newAddress = {
                city: 'İstanbul',
                district: 'Beşiktaş',
                isDefault: false,
            };
            prisma.address.create.mockResolvedValue({
                id: 'addr-new',
                ...newAddress,
                userId: 'user-123',
            });

            const result = await service.addAddress('user-123', newAddress);

            expect(result.city).toBe('İstanbul');
        });

        it('varsayılan adres eklenir ise diğerleri varsayılan olmaktan çıkar', async () => {
            prisma.address.updateMany.mockResolvedValue({ count: 1 });
            prisma.address.create.mockResolvedValue({
                id: 'addr-new',
                city: 'İstanbul',
                district: 'Kadıköy',
                isDefault: true,
                userId: 'user-123',
            });

            await service.addAddress('user-123', {
                city: 'İstanbul',
                district: 'Kadıköy',
                isDefault: true,
            });

            expect(prisma.address.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                data: { isDefault: false },
            });
        });
    });

    describe('updateAddress()', () => {
        it('adres günceller', async () => {
            prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-123' });
            prisma.address.update.mockResolvedValue({
                id: 'addr-1',
                city: 'Ankara',
            });

            const result = await service.updateAddress('user-123', 'addr-1', { city: 'Ankara' });

            expect(result.city).toBe('Ankara');
        });

        it('başkasının adresi güncellenemez - NotFoundException', async () => {
            prisma.address.findFirst.mockResolvedValue(null);

            await expect(
                service.updateAddress('user-123', 'addr-other', { city: 'İstanbul' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteAddress()', () => {
        it('adres siler', async () => {
            prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-123' });
            prisma.address.delete.mockResolvedValue(undefined);

            await service.deleteAddress('user-123', 'addr-1');

            expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
        });

        it('başkasının adresi silinemez - NotFoundException', async () => {
            prisma.address.findFirst.mockResolvedValue(null);

            await expect(
                service.deleteAddress('user-123', 'addr-other'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // BİLDİRİM TERCİHLERİ TESTLER
    // ============================================

    describe('getNotificationPreferences()', () => {
        it('mevcut tercihleri döner', async () => {
            const prefs = { userId: 'user-123', emailRentalUpdates: true };
            prisma.notificationPreference.findUnique.mockResolvedValue(prefs);

            const result = await service.getNotificationPreferences('user-123');

            expect(result).toEqual(prefs);
        });

        it('tercih yoksa varsayılan oluşturur', async () => {
            prisma.notificationPreference.findUnique.mockResolvedValue(null);
            prisma.notificationPreference.create.mockResolvedValue({
                userId: 'user-123',
                emailRentalUpdates: true,
            });

            const result = await service.getNotificationPreferences('user-123');

            expect(result).toBeDefined();
            expect(prisma.notificationPreference.create).toHaveBeenCalled();
        });
    });

    describe('updateNotificationPreferences()', () => {
        it('bildirim tercihlerini günceller', async () => {
            prisma.notificationPreference.upsert.mockResolvedValue({
                userId: 'user-123',
                emailPromotions: false,
            });

            const result = await service.updateNotificationPreferences('user-123', {
                emailPromotions: false,
            });

            expect(result.emailPromotions).toBe(false);
        });
    });

    // ============================================
    // EHLİYET BİLGİLERİ TESTLER
    // ============================================

    describe('getDriverLicense()', () => {
        it('ehliyet bilgilerini döner', async () => {
            const license = { userId: 'user-123', licenseNumber: '123456' };
            prisma.driverLicense.findUnique.mockResolvedValue(license);

            const result = await service.getDriverLicense('user-123');

            expect(result).toEqual(license);
        });

        it('ehliyet yoksa null döner', async () => {
            prisma.driverLicense.findUnique.mockResolvedValue(null);

            const result = await service.getDriverLicense('user-123');

            expect(result).toBeNull();
        });
    });

    describe('updateDriverLicense()', () => {
        it('ehliyet günceller', async () => {
            prisma.driverLicense.upsert.mockResolvedValue({
                userId: 'user-123',
                licenseNumber: '654321',
            });

            const result = await service.updateDriverLicense('user-123', {
                licenseNumber: '654321',
            });

            expect(result.licenseNumber).toBe('654321');
        });

        it('fotoğraf yüklenirse durum PENDING yapılır', async () => {
            prisma.driverLicense.upsert.mockResolvedValue({
                userId: 'user-123',
                verificationStatus: 'PENDING',
            });

            await service.updateDriverLicense('user-123', {
                frontImage: 'base64data',
            });

            expect(prisma.driverLicense.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    update: expect.objectContaining({
                        verificationStatus: 'PENDING',
                    }),
                }),
            );
        });
    });

    // ============================================
    // DOĞRULAMA DURUMU TESTLER
    // ============================================

    describe('getVerificationStatus()', () => {
        it('level 0 - hiçbir doğrulama yok', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                isVerified: false,
                phone: null,
                driverLicense: null,
            });

            const result = await service.getVerificationStatus('user-123');

            expect(result.level).toBe(0);
            expect(result.emailVerified).toBe(false);
        });

        it('level 1 - sadece e-posta doğrulanmış', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                isVerified: true,
                phone: null,
                driverLicense: null,
            });

            const result = await service.getVerificationStatus('user-123');

            expect(result.level).toBe(1);
            expect(result.emailVerified).toBe(true);
        });

        it('level 2 - e-posta + telefon doğrulanmış', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                isVerified: true,
                phone: '+905551234567',
                driverLicense: null,
            });

            const result = await service.getVerificationStatus('user-123');

            expect(result.level).toBe(2);
        });

        it('level 3 - tüm doğrulamalar tamam', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                isVerified: true,
                phone: '+905551234567',
                driverLicense: { verificationStatus: 'APPROVED' },
            });

            const result = await service.getVerificationStatus('user-123');

            expect(result.level).toBe(3);
            expect(result.licenseVerified).toBe(true);
        });

        it('kullanıcı bulunamadı - NotFoundException', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.getVerificationStatus('nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // HESAP İŞLEMLERİ TESTLER
    // ============================================

    describe('deactivateAccount()', () => {
        it('hesabı deaktif eder', async () => {
            prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

            await service.deactivateAccount('user-123');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { isActive: false },
            });
        });
    });

    describe('deleteAccount()', () => {
        it('yanlış şifre ile silemez - BadRequestException', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(false);

            await expect(
                service.deleteAccount('user-123', 'wrongPassword'),
            ).rejects.toThrow(BadRequestException);

            jest.restoreAllMocks();
        });

        it('kullanıcı bulunamadı - NotFoundException', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.deleteAccount('nonexistent', 'Test@123456'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================
    // ADMIN İŞLEMLERİ TESTLER
    // ============================================

    describe('findAll()', () => {
        it('tüm kullanıcıları pagination ile listeler', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                users: [mockUser],
                total: 1,
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.users).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('arama parametresi ile filtreler', async () => {
            (repository.findAll as jest.Mock).mockResolvedValue({
                users: [],
                total: 0,
            });

            await service.findAll({ page: 1, limit: 10, search: 'Test' });

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.any(Array),
                    }),
                }),
            );
        });
    });

    describe('toggleUserStatus()', () => {
        it('kullanıcıyı ban yapar', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);
            (repository.toggleActive as jest.Mock).mockResolvedValue({
                ...mockUser,
                isActive: false,
            });

            const result = await service.toggleUserStatus('user-123', false);

            expect(result.isActive).toBe(false);
        });

        it('kullanıcıyı unban yapar', async () => {
            (repository.findById as jest.Mock).mockResolvedValue({
                ...mockUser,
                isActive: false,
            });
            (repository.toggleActive as jest.Mock).mockResolvedValue({
                ...mockUser,
                isActive: true,
            });

            const result = await service.toggleUserStatus('user-123', true);

            expect(result.isActive).toBe(true);
        });

        it('olmayan kullanıcı - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.toggleUserStatus('nonexistent', true),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete()', () => {
        it('kullanıcıyı siler', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(mockUser);
            (repository.delete as jest.Mock).mockResolvedValue(undefined);

            await service.delete('user-123');

            expect(repository.delete).toHaveBeenCalledWith('user-123');
        });

        it('olmayan kullanıcı - NotFoundException', async () => {
            (repository.findById as jest.Mock).mockResolvedValue(null);

            await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });
});

