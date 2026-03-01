/**
 * Rentals E2E Tests - Kiralama Yönetimi Uçtan Uca Testler
 *
 * Test Senaryoları:
 * - Kiralama oluşturma (müşteri, tarih kontrolleri, çakışma)
 * - Kiralama listeleme (müşteri, owner, admin)
 * - Kiralama onay/red (owner, admin)
 * - Kiralama başlatma, tamamlama, iptal
 * - Durum geçiş kontrolleri
 * - Yetkilendirme kontrolleri
 * - Admin istatistikler
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
} from './helpers/test.helper';

describe('Rentals Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Kullanıcı tokenları
    let ownerTokens: { accessToken: string; refreshToken: string };
    let ownerId: string;
    let customerTokens: { accessToken: string; refreshToken: string };
    let customerId: string;
    let adminTokens: { accessToken: string; refreshToken: string };
    let adminId: string;

    // Test verileri
    let vehicleId: string;
    let rentalId: string;

    // Gelecekte tarihler
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 7);
    const futureEnd = new Date();
    futureEnd.setDate(futureEnd.getDate() + 10);

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
            firstName: 'Kiralama',
            lastName: 'Sahibi',
            phone: '+905552220001',
            roleType: 'VEHICLE_OWNER',
        });
        ownerTokens = ownerResult!.tokens;
        ownerId = ownerResult!.userId;

        // Customer kayıt & giriş
        const customerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Kiralama',
            lastName: 'Müşterisi',
            phone: '+905552220002',
            roleType: 'CUSTOMER',
        });
        customerTokens = customerResult!.tokens;
        customerId = customerResult!.userId;

        // Admin giriş
        const adminResult = await loginUser(
            app,
            TEST_USERS.admin.email,
            TEST_USERS.admin.password,
        );
        adminTokens = adminResult!.tokens;
        adminId = adminResult!.userId;

        // Araç oluştur ve onayla
        const vehicle = await createTestVehicle(app, ownerTokens.accessToken);
        vehicleId = vehicle!.id;
        await approveVehicle(app, adminTokens.accessToken, vehicleId);
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // 1. KİRALAMA OLUŞTURMA TESTLERİ
    // ============================================

    describe('POST /api/rentals', () => {
        it('✅ CUSTOMER kiralama oluşturabilir', async () => {
            const rentalData = {
                vehicleId,
                startDate: futureStart.toISOString(),
                endDate: futureEnd.toISOString(),
                pickupLocation: 'İstanbul, Kadıköy',
                returnLocation: 'İstanbul, Beşiktaş',
                notes: 'E2E test kiralaması',
            };

            const response = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send(rentalData)
                .expect(201);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.vehicleId).toBe(vehicleId);
            expect(response.body.data.customerId).toBe(customerId);
            expect(response.body.data.status).toBe('PENDING');
            expect(response.body.data).toHaveProperty('totalAmount');
            expect(response.body.data).toHaveProperty('totalDays');
            expect(Number(response.body.data.totalDays)).toBe(3);

            rentalId = response.body.data.id;
        });

        it('❌ çakışan tarihlerle kiralama - 400', async () => {
            // Yeni bir araç oluştur ve onayla
            const vehicle2 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle2!.id);

            const start = new Date();
            start.setDate(start.getDate() + 15);
            const end = new Date();
            end.setDate(end.getDate() + 18);

            // İlk kiralama
            await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle2.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(201);

            // Çakışan kiralama
            const overlapStart = new Date(start);
            overlapStart.setDate(overlapStart.getDate() + 1);
            const overlapEnd = new Date(end);
            overlapEnd.setDate(overlapEnd.getDate() + 1);

            const response = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle2.id,
                    startDate: overlapStart.toISOString(),
                    endDate: overlapEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ VEHICLE_OWNER kiralama oluşturamaz - 403', async () => {
            await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({
                    vehicleId,
                    startDate: futureStart.toISOString(),
                    endDate: futureEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(403);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/rentals')
                .send({
                    vehicleId,
                    startDate: futureStart.toISOString(),
                    endDate: futureEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(401);
        });

        it('❌ eksik vehicleId - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    startDate: futureStart.toISOString(),
                    endDate: futureEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(400);
        });

        it('❌ geçersiz tarih formatı - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId,
                    startDate: 'not-a-date',
                    endDate: futureEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(400);
        });

        it('❌ eksik pickupLocation - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId,
                    startDate: futureStart.toISOString(),
                    endDate: futureEnd.toISOString(),
                })
                .expect(400);
        });

        it('❌ olmayan araç ID - 404', async () => {
            const fakeVehicleId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: fakeVehicleId,
                    startDate: futureStart.toISOString(),
                    endDate: futureEnd.toISOString(),
                    pickupLocation: 'İstanbul',
                })
                .expect(404);

            expectErrorResponse(response.body);
        });
    });

    // ============================================
    // 2. KİRALAMA LİSTELEME TESTLERİ
    // ============================================

    describe('GET /api/rentals/my-rentals', () => {
        it('✅ CUSTOMER kendi kiralamalarını görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/rentals/my-rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('❌ VEHICLE_OWNER erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/rentals/my-rentals')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/rentals/my-rentals')
                .expect(401);
        });
    });

    describe('GET /api/rentals/owner', () => {
        it('✅ VEHICLE_OWNER araçlarının kiralamalarını görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/rentals/owner')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('❌ CUSTOMER erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/rentals/owner')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });
    });

    describe('GET /api/rentals/:id', () => {
        it('✅ kiralama detayı getirir', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/rentals/${rentalId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.id).toBe(rentalId);
        });

        it('❌ olmayan kiralama - 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            await request(app.getHttpServer())
                .get(`/api/rentals/${fakeId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(404);
        });
    });

    // ============================================
    // 3. KİRALAMA ONAY/RED TESTLERİ
    // ============================================

    describe('PATCH /api/rentals/:id/approve', () => {
        it('✅ VEHICLE_OWNER kiralama onaylayabilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${rentalId}/approve`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('APPROVED');
        });

        it('❌ zaten onaylanmış kiralama tekrar onaylanamaz - 400', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${rentalId}/approve`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ CUSTOMER kiralama onaylayamaz - 403', async () => {
            // Yeni bir kiralama oluştur onay test edebilmek için
            const vehicle3 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle3!.id);

            const start = new Date();
            start.setDate(start.getDate() + 30);
            const end = new Date();
            end.setDate(end.getDate() + 33);

            const createRes = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle3.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'Ankara',
                })
                .expect(201);

            await request(app.getHttpServer())
                .patch(`/api/rentals/${createRes.body.data.id}/approve`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });
    });

    describe('PATCH /api/rentals/:id/reject', () => {
        let rejectableRentalId: string;

        beforeAll(async () => {
            // Reddilebilir bir kiralama oluştur
            const vehicle4 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle4!.id);

            const start = new Date();
            start.setDate(start.getDate() + 40);
            const end = new Date();
            end.setDate(end.getDate() + 43);

            const res = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle4.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'İzmir',
                })
                .expect(201);

            rejectableRentalId = res.body.data.id;
        });

        it('✅ VEHICLE_OWNER kiralama reddedebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${rejectableRentalId}/reject`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('REJECTED');
        });

        it('❌ reddedilmiş kiralama tekrar reddedilemez - 400', async () => {
            await request(app.getHttpServer())
                .patch(`/api/rentals/${rejectableRentalId}/reject`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(400);
        });
    });

    // ============================================
    // 4. KİRALAMA DURUM GEÇİŞLERİ
    // ============================================

    describe('Kiralama durum geçişleri (start → complete)', () => {
        let flowRentalId: string;

        beforeAll(async () => {
            // Tam akış testi için yeni araç ve kiralama
            const vehicle5 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle5!.id);

            const start = new Date();
            start.setDate(start.getDate() + 50);
            const end = new Date();
            end.setDate(end.getDate() + 53);

            const res = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle5.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'Bursa',
                })
                .expect(201);

            flowRentalId = res.body.data.id;
        });

        it('❌ PENDING kiralama tamamlanamaz - 400', async () => {
            await request(app.getHttpServer())
                .patch(`/api/rentals/${flowRentalId}/complete`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(400);
        });

        it('✅ PENDING → start (ACTIVE)', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${flowRentalId}/start`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('ACTIVE');
        });

        it('❌ zaten ACTIVE olan kiralama tekrar başlatılamaz - 400', async () => {
            await request(app.getHttpServer())
                .patch(`/api/rentals/${flowRentalId}/start`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(400);
        });

        it('✅ ACTIVE → complete (COMPLETED)', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${flowRentalId}/complete`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('COMPLETED');
        });

        it('❌ COMPLETED kiralama iptal edilemez - 400', async () => {
            await request(app.getHttpServer())
                .patch(`/api/rentals/${flowRentalId}/cancel`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(400);
        });
    });

    // ============================================
    // 5. KİRALAMA İPTAL TESTLERİ
    // ============================================

    describe('PATCH /api/rentals/:id/cancel', () => {
        let cancelRentalId: string;

        beforeAll(async () => {
            const vehicle6 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle6!.id);

            const start = new Date();
            start.setDate(start.getDate() + 60);
            const end = new Date();
            end.setDate(end.getDate() + 63);

            const res = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle6.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'Antalya',
                })
                .expect(201);

            cancelRentalId = res.body.data.id;
        });

        it('✅ CUSTOMER kendi kiralamasını iptal edebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${cancelRentalId}/cancel`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.status).toBe('CANCELLED');
        });

        it('❌ zaten iptal edilmiş kiralama - başarılı ama durum aynı kalır', async () => {
            // İkinci cancel denemesi: CANCELLED durumunda cancel yapılabilir mi?
            // cancelRental sadece COMPLETED olanları engeller
            const response = await request(app.getHttpServer())
                .patch(`/api/rentals/${cancelRentalId}/cancel`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.data.status).toBe('CANCELLED');
        });
    });

    // ============================================
    // 6. YETKİLENDİRME TESTLERİ
    // ============================================

    describe('Yetkilendirme kontrolleri', () => {
        it('❌ CUSTOMER start yapamaz - 403', async () => {
            // Yeni kiralama oluştur
            const vehicle7 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle7!.id);

            const start = new Date();
            start.setDate(start.getDate() + 70);
            const end = new Date();
            end.setDate(end.getDate() + 73);

            const res = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle7.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'Trabzon',
                })
                .expect(201);

            await request(app.getHttpServer())
                .patch(`/api/rentals/${res.body.data.id}/start`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ CUSTOMER complete yapamaz - 403', async () => {
            // Yeni kiralama oluştur, owner start etsin
            const vehicle8 = await createTestVehicle(app, ownerTokens.accessToken);
            await approveVehicle(app, adminTokens.accessToken, vehicle8!.id);

            const start = new Date();
            start.setDate(start.getDate() + 80);
            const end = new Date();
            end.setDate(end.getDate() + 83);

            const createRes = await request(app.getHttpServer())
                .post('/api/rentals')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    vehicleId: vehicle8.id,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    pickupLocation: 'Konya',
                })
                .expect(201);

            // Owner start eder
            await request(app.getHttpServer())
                .patch(`/api/rentals/${createRes.body.data.id}/start`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            // Customer complete edemez
            await request(app.getHttpServer())
                .patch(`/api/rentals/${createRes.body.data.id}/complete`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });
    });

    // ============================================
    // 7. ADMİN TESTLERİ
    // ============================================

    describe('Admin kiralama işlemleri', () => {
        it('✅ SUPER_ADMIN tüm kiralamaları görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/rentals/admin/all')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('rentals');
            expect(response.body.data).toHaveProperty('total');
            expect(response.body.data).toHaveProperty('page');
            expect(response.body.data).toHaveProperty('limit');
        });

        it('✅ SUPER_ADMIN istatistikleri görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/rentals/admin/statistics')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ CUSTOMER admin all endpoint erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/rentals/admin/all')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ VEHICLE_OWNER admin statistics erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/rentals/admin/statistics')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('✅ SUPER_ADMIN sayfalandırma ile tüm kiralamaları getirebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/rentals/admin/all?page=1&limit=5')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.page).toBe(1);
            expect(response.body.data.limit).toBe(5);
            expect(response.body.data.rentals.length).toBeLessThanOrEqual(5);
        });
    });

    // ============================================
    // 8. ARAÇ KİRALAMALARI TESTLERİ
    // ============================================

    describe('GET /api/rentals/vehicle/:vehicleId', () => {
        it('✅ VEHICLE_OWNER kendi aracının kiralamalarını görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/rentals/vehicle/${vehicleId}`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('❌ başka owner, başkasının aracının kiralamalarını göremez - 403', async () => {
            const otherOwner = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Başka',
                lastName: 'Sahip',
                phone: '+905552220099',
                roleType: 'VEHICLE_OWNER',
            });

            await request(app.getHttpServer())
                .get(`/api/rentals/vehicle/${vehicleId}`)
                .set('Authorization', `Bearer ${otherOwner!.tokens.accessToken}`)
                .expect(403);
        });

        it('✅ SUPER_ADMIN herhangi aracın kiralamalarını görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/rentals/vehicle/${vehicleId}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });
    });
});

