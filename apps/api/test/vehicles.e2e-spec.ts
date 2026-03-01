/**
 * Vehicles E2E Tests - Araç Yönetimi Uçtan Uca Testler
 *
 * Test Senaryoları:
 * - Araç oluşturma (owner, admin, customer yetkisiz)
 * - Araç arama (public, filtreli, sayfalandırmalı)
 * - Araç detay (var olan, olmayan)
 * - Araç güncelleme (sahibi, admin, başkası)
 * - Araç silme (sahibi, admin, başkası)
 * - Araç onaylama (admin, owner yetkisiz)
 * - Araç durum güncelleme
 * - Admin tüm araçlar listesi
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomThrottlerGuard } from '../src/common/guards/throttle.guard';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import {
    TEST_USERS,
    TEST_VEHICLE,
    expectSuccessResponse,
    expectErrorResponse,
    registerAndLogin,
    loginUser,
    createTestVehicle,
    approveVehicle,
    randomEmail,
    randomLicensePlate,
} from './helpers/test.helper';

describe('Vehicles Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Tokens
    let ownerTokens: { accessToken: string; refreshToken: string };
    let ownerId: string;
    let customerTokens: { accessToken: string; refreshToken: string };
    let customerId: string;
    let adminTokens: { accessToken: string; refreshToken: string };
    let adminId: string;

    // Created vehicle IDs
    let createdVehicleId: string;
    let secondVehicleId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(CustomThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get<PrismaService>(PrismaService);

        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalInterceptors(new TransformInterceptor());

        await app.init();

        // Owner kayıt & giriş
        const ownerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Araç',
            lastName: 'Sahibi',
            phone: '+905551110001',
            roleType: 'VEHICLE_OWNER',
        });
        ownerTokens = ownerResult!.tokens;
        ownerId = ownerResult!.userId;

        // Customer kayıt & giriş
        const customerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Müşteri',
            lastName: 'Test',
            phone: '+905551110002',
            roleType: 'CUSTOMER',
        });
        customerTokens = customerResult!.tokens;
        customerId = customerResult!.userId;

        // Admin giriş (seed ile var)
        const adminResult = await loginUser(
            app,
            TEST_USERS.admin.email,
            TEST_USERS.admin.password,
        );
        adminTokens = adminResult!.tokens;
        adminId = adminResult!.userId;
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // 1. ARAÇ OLUŞTURMA TESTLERİ
    // ============================================

    describe('POST /api/vehicles', () => {
        it('✅ VEHICLE_OWNER araç oluşturabilir', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(201);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.make).toBe(vehicleData.make);
            expect(response.body.data.model).toBe(vehicleData.model);
            expect(response.body.data.ownerId).toBe(ownerId);

            createdVehicleId = response.body.data.id;
        });

        it('✅ SUPER_ADMIN araç oluşturabilir', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                make: 'Honda',
                model: 'Civic',
            };

            const response = await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send(vehicleData)
                .expect(201);

            expectSuccessResponse(response.body);
            secondVehicleId = response.body.data.id;
        });

        it('❌ CUSTOMER araç oluşturamaz - 403 Forbidden', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send(vehicleData)
                .expect(403);
        });

        it('❌ token olmadan araç oluşturma - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/vehicles')
                .send(TEST_VEHICLE)
                .expect(401);
        });

        it('❌ eksik zorunlu alanlar - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ make: 'Toyota' })
                .expect(400);
        });

        it('❌ geçersiz yıl (çok eski) - 400 Bad Request', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                year: 1900,
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(400);
        });

        it('❌ negatif günlük ücret - 400 Bad Request', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                dailyRate: -100,
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(400);
        });

        it('❌ 0 günlük ücret - 400 Bad Request', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                dailyRate: 0,
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(400);
        });

        it('❌ boş marka - 400 Bad Request', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                make: '',
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(400);
        });

        it('❌ koltuk sayısı sınır dışı (16) - 400', async () => {
            const vehicleData = {
                ...TEST_VEHICLE,
                licensePlate: randomLicensePlate(),
                seats: 16,
            };

            await request(app.getHttpServer())
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send(vehicleData)
                .expect(400);
        });
    });

    // ============================================
    // 2. ARAÇ ARAMA TESTLERİ (Public)
    // ============================================

    describe('GET /api/vehicles/search', () => {
        beforeAll(async () => {
            // Aracı onayla ki aramada çıksın
            await approveVehicle(app, adminTokens.accessToken, createdVehicleId);
        });

        it('✅ herkes arama yapabilir (token gerekmez)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search')
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('vehicles');
            expect(response.body.data).toHaveProperty('total');
            expect(response.body.data).toHaveProperty('page');
            expect(response.body.data).toHaveProperty('limit');
            expect(response.body.data).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data.vehicles)).toBe(true);
        });

        it('✅ marka ile arama', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search?search=Toyota')
                .expect(200);

            expectSuccessResponse(response.body);
            if (response.body.data.vehicles.length > 0) {
                const hasMatch = response.body.data.vehicles.some(
                    (v: any) =>
                        v.make.toLowerCase().includes('toyota') ||
                        v.model.toLowerCase().includes('toyota') ||
                        (v.description && v.description.toLowerCase().includes('toyota')),
                );
                expect(hasMatch).toBe(true);
            }
        });

        it('✅ fiyat aralığı ile arama', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search?minPrice=100&maxPrice=1000')
                .expect(200);

            expectSuccessResponse(response.body);
            response.body.data.vehicles.forEach((v: any) => {
                expect(Number(v.dailyRate)).toBeGreaterThanOrEqual(100);
                expect(Number(v.dailyRate)).toBeLessThanOrEqual(1000);
            });
        });

        it('✅ sayfalandırma çalışıyor', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search?page=1&limit=5')
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.page).toBe(1);
            expect(response.body.data.limit).toBe(5);
            expect(response.body.data.vehicles.length).toBeLessThanOrEqual(5);
        });

        it('✅ sıralama çalışıyor (dailyRate asc)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search?sortBy=dailyRate&sortOrder=asc')
                .expect(200);

            expectSuccessResponse(response.body);
            const prices = response.body.data.vehicles.map((v: any) => Number(v.dailyRate));
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
            }
        });

        it('✅ olmayan araç araması - boş sonuç', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search?search=BuAracMarkasiOlmamaliXYZ123')
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.vehicles.length).toBe(0);
            expect(response.body.data.total).toBe(0);
        });
    });

    // ============================================
    // 3. ARAÇ DETAY TESTLERİ (Public)
    // ============================================

    describe('GET /api/vehicles/:id', () => {
        it('✅ var olan araç detayı getirir (token gerekmez)', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/vehicles/${createdVehicleId}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.id).toBe(createdVehicleId);
            expect(response.body.data.make).toBe(TEST_VEHICLE.make);
        });

        it('❌ olmayan araç ID - 404 Not Found', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app.getHttpServer())
                .get(`/api/vehicles/${fakeId}`)
                .expect(404);

            expectErrorResponse(response.body, 'NOT_FOUND');
        });

        it('❌ geçersiz UUID formatı - 404 veya 400', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/not-a-valid-uuid');

            expect([400, 404, 500]).toContain(response.status);
        });
    });

    // ============================================
    // 4. SAHİBİN ARAÇLARI TESTLERİ
    // ============================================

    describe('GET /api/vehicles/my', () => {
        it('✅ VEHICLE_OWNER kendi araçlarını görür', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/my')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('❌ CUSTOMER kendi araçlarına erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/vehicles/my')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/vehicles/my')
                .expect(401);
        });
    });

    // ============================================
    // 5. ARAÇ GÜNCELLEME TESTLERİ
    // ============================================

    describe('PATCH /api/vehicles/:id', () => {
        it('✅ araç sahibi aracını güncelleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ color: 'Kırmızı', dailyRate: 600 })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.color).toBe('Kırmızı');
            expect(Number(response.body.data.dailyRate)).toBe(600);
        });

        it('✅ SUPER_ADMIN başka birinin aracını güncelleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send({ color: 'Mavi' })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.color).toBe('Mavi');
        });

        it('❌ başka owner aracı güncelleyemez - 403 Forbidden', async () => {
            // Yeni bir owner oluştur
            const otherOwner = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Diğer',
                lastName: 'Sahip',
                phone: '+905551110099',
                roleType: 'VEHICLE_OWNER',
            });

            await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}`)
                .set('Authorization', `Bearer ${otherOwner!.tokens.accessToken}`)
                .send({ color: 'Yeşil' })
                .expect(403);
        });

        it('❌ CUSTOMER araç güncelleyemez - 403 Forbidden', async () => {
            await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ color: 'Sarı' })
                .expect(403);
        });

        it('❌ olmayan araç - 404 Not Found', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            await request(app.getHttpServer())
                .patch(`/api/vehicles/${fakeId}`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ color: 'Sarı' })
                .expect(404);
        });
    });

    // ============================================
    // 6. ARAÇ ONAYLAMA TESTLERİ (Admin)
    // ============================================

    describe('PATCH /api/vehicles/:id/approve', () => {
        it('✅ SUPER_ADMIN aracı onaylayabilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${secondVehicleId}/approve`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send({ isApproved: true })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.isApproved).toBe(true);
        });

        it('✅ SUPER_ADMIN onayı geri alabilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${secondVehicleId}/approve`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send({ isApproved: false })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.isApproved).toBe(false);
        });

        it('❌ VEHICLE_OWNER araç onaylayamaz - 403 Forbidden', async () => {
            await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}/approve`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ isApproved: true })
                .expect(403);
        });

        it('❌ CUSTOMER araç onaylayamaz - 403 Forbidden', async () => {
            await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}/approve`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ isApproved: true })
                .expect(403);
        });
    });

    // ============================================
    // 7. ARAÇ DURUM GÜNCELLEME TESTLERİ
    // ============================================

    describe('PATCH /api/vehicles/:id/status', () => {
        it('✅ VEHICLE_OWNER araç durumunu güncelleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}/status`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ status: 'MAINTENANCE' })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('MAINTENANCE');
        });

        it('✅ durumu AVAILABLE olarak geri al', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}/status`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ status: 'AVAILABLE' })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('AVAILABLE');
        });

        it('❌ CUSTOMER araç durumu değiştiremez - 403', async () => {
            await request(app.getHttpServer())
                .patch(`/api/vehicles/${createdVehicleId}/status`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ status: 'AVAILABLE' })
                .expect(403);
        });
    });

    // ============================================
    // 8. ADMİN TÜM ARAÇLAR LİSTESİ
    // ============================================

    describe('GET /api/vehicles/admin/all', () => {
        it('✅ SUPER_ADMIN tüm araçları görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/admin/all')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('vehicles');
            expect(response.body.data).toHaveProperty('total');
        });

        it('❌ VEHICLE_OWNER admin listesine erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/vehicles/admin/all')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ CUSTOMER admin listesine erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/vehicles/admin/all')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });
    });

    // ============================================
    // 9. AKTİF KONUMLAR (Admin)
    // ============================================

    describe('GET /api/vehicles/admin/active-locations', () => {
        it('✅ SUPER_ADMIN aktif konumları görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/admin/active-locations')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ VEHICLE_OWNER erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/vehicles/admin/active-locations')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });
    });

    // ============================================
    // 10. ARAÇ SİLME TESTLERİ
    // ============================================

    describe('DELETE /api/vehicles/:id', () => {
        let vehicleToDeleteId: string;

        beforeAll(async () => {
            // Silinecek yeni bir araç oluştur
            const vehicle = await createTestVehicle(app, ownerTokens.accessToken);
            vehicleToDeleteId = vehicle!.id;
        });

        it('❌ CUSTOMER araç silemez - 403 Forbidden', async () => {
            await request(app.getHttpServer())
                .delete(`/api/vehicles/${vehicleToDeleteId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ başka owner aracı silemez - 403 Forbidden', async () => {
            const otherOwner = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Farklı',
                lastName: 'Sahip',
                phone: '+905551110088',
                roleType: 'VEHICLE_OWNER',
            });

            await request(app.getHttpServer())
                .delete(`/api/vehicles/${vehicleToDeleteId}`)
                .set('Authorization', `Bearer ${otherOwner!.tokens.accessToken}`)
                .expect(403);
        });

        it('✅ araç sahibi aracını silebilir', async () => {
            await request(app.getHttpServer())
                .delete(`/api/vehicles/${vehicleToDeleteId}`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(204);
        });

        it('✅ SUPER_ADMIN başkasının aracını silebilir', async () => {
            // Yeni araç oluştur
            const newVehicle = await createTestVehicle(app, ownerTokens.accessToken);

            await request(app.getHttpServer())
                .delete(`/api/vehicles/${newVehicle!.id}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(204);
        });

        it('❌ olmayan araç silme - 404 Not Found', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            await request(app.getHttpServer())
                .delete(`/api/vehicles/${fakeId}`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(404);
        });
    });
});
