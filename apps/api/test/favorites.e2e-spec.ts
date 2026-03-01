/**
 * Favorites E2E Tests - Favori Araçlar Uçtan Uca Testler
 *
 * Test Senaryoları:
 * - Favorilere araç ekleme
 * - Favorilerden araç çıkarma
 * - Favori listesi getirme
 * - Favori ID'leri getirme
 * - Favori toggle (ekle/çıkar)
 * - Yetkilendirme kontrolleri (token zorunlu)
 * - Duplikat ekleme kontrolü
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
    expectSuccessResponse,
    expectErrorResponse,
    registerAndLogin,
    loginUser,
    createTestVehicle,
    approveVehicle,
    randomEmail,
} from './helpers/test.helper';

describe('Favorites Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Kullanıcı tokenları
    let customerTokens: { accessToken: string; refreshToken: string };
    let customerId: string;
    let ownerTokens: { accessToken: string; refreshToken: string };
    let ownerId: string;
    let adminTokens: { accessToken: string; refreshToken: string };

    // Test araçları
    let vehicleId1: string;
    let vehicleId2: string;
    let vehicleId3: string;

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

        // Customer kayıt & giriş
        const customerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Favori',
            lastName: 'Testi',
            phone: '+905554440001',
            roleType: 'CUSTOMER',
        });
        customerTokens = customerResult!.tokens;
        customerId = customerResult!.userId;

        // Owner kayıt & giriş
        const ownerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Favori',
            lastName: 'Sahip',
            phone: '+905554440002',
            roleType: 'VEHICLE_OWNER',
        });
        ownerTokens = ownerResult!.tokens;
        ownerId = ownerResult!.userId;

        // Admin giriş
        const adminResult = await loginUser(
            app,
            TEST_USERS.admin.email,
            TEST_USERS.admin.password,
        );
        adminTokens = adminResult!.tokens;

        // Test araçları oluştur ve onayla
        const v1 = await createTestVehicle(app, ownerTokens.accessToken, { make: 'BMW', model: 'X5' });
        vehicleId1 = v1!.id;
        await approveVehicle(app, adminTokens.accessToken, vehicleId1);

        const v2 = await createTestVehicle(app, ownerTokens.accessToken, { make: 'Audi', model: 'A4' });
        vehicleId2 = v2!.id;
        await approveVehicle(app, adminTokens.accessToken, vehicleId2);

        const v3 = await createTestVehicle(app, ownerTokens.accessToken, { make: 'Mercedes', model: 'C180' });
        vehicleId3 = v3!.id;
        await approveVehicle(app, adminTokens.accessToken, vehicleId3);
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // 1. FAVORİYE ARAÇ EKLEME TESTLERİ
    // ============================================

    describe('POST /api/favorites/:vehicleId', () => {
        it('✅ favoriye araç ekle', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId1}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('vehicleId', vehicleId1);
        });

        it('✅ ikinci araç da favorilere eklenebilir', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId2}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('❌ aynı araç tekrar eklenince - 409 Conflict', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId1}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(409);

            expectErrorResponse(response.body);
        });

        it('❌ token olmadan favori ekleme - 401', async () => {
            await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId3}`)
                .expect(401);
        });
    });

    // ============================================
    // 2. FAVORİ LİSTESİ TESTLERİ
    // ============================================

    describe('GET /api/favorites', () => {
        it('✅ favori listesini getir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/favorites')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('✅ farklı kullanıcının favori listesi boş', async () => {
            const newCustomer = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Yeni',
                lastName: 'Müşteri',
                phone: '+905554440010',
                roleType: 'CUSTOMER',
            });

            const response = await request(app.getHttpServer())
                .get('/api/favorites')
                .set('Authorization', `Bearer ${newCustomer!.tokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(0);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/favorites')
                .expect(401);
        });
    });

    // ============================================
    // 3. FAVORİ ID'LERİ TESTLERİ
    // ============================================

    describe('GET /api/favorites/ids', () => {
        it('✅ favori araç ID listesi', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/favorites/ids')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toContain(vehicleId1);
            expect(response.body.data).toContain(vehicleId2);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/favorites/ids')
                .expect(401);
        });
    });

    // ============================================
    // 4. FAVORİDEN ARAÇ ÇIKARMA TESTLERİ
    // ============================================

    describe('DELETE /api/favorites/:vehicleId', () => {
        it('✅ favoriden araç çıkar', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/favorites/${vehicleId2}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('message');
            expect(response.body.data.message).toContain('çıkarıldı');
        });

        it('✅ çıkarma sonrası favori listesi güncellendi', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/favorites')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.data.length).toBe(1);
        });

        it('❌ favoride olmayan araç çıkarma - 404', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/favorites/${vehicleId2}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(404);

            expectErrorResponse(response.body);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .delete(`/api/favorites/${vehicleId1}`)
                .expect(401);
        });
    });

    // ============================================
    // 5. FAVORİ TOGGLE TESTLERİ
    // ============================================

    describe('POST /api/favorites/:vehicleId/toggle', () => {
        it('✅ toggle: favoride değilse ekler', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId3}/toggle`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isFavorite).toBe(true);
        });

        it('✅ toggle: favorideyse çıkarır', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId3}/toggle`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isFavorite).toBe(false);
        });

        it('✅ toggle tekrar: ekler', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId3}/toggle`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(201);

            expect(response.body.data.isFavorite).toBe(true);
        });

        it('❌ token olmadan toggle - 401', async () => {
            await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId3}/toggle`)
                .expect(401);
        });
    });

    // ============================================
    // 6. KESİŞEN KULLANICINLAR TESTİ
    // ============================================

    describe('Farklı kullanıcı favorileri izole', () => {
        let user2Tokens: { accessToken: string; refreshToken: string };

        beforeAll(async () => {
            const user2 = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'İkinci',
                lastName: 'Kullanıcı',
                phone: '+905554440020',
                roleType: 'CUSTOMER',
            });
            user2Tokens = user2!.tokens;
        });

        it('✅ kullanıcı 2 favori ekler, kullanıcı 1 etkilenmez', async () => {
            // User2 favori ekler
            await request(app.getHttpServer())
                .post(`/api/favorites/${vehicleId2}`)
                .set('Authorization', `Bearer ${user2Tokens.accessToken}`)
                .expect(201);

            // User1'in favorileri değişmemiş olmalı
            const user1Response = await request(app.getHttpServer())
                .get('/api/favorites/ids')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(user1Response.body.data).not.toContain(vehicleId2);

            // User2'nin favorileri
            const user2Response = await request(app.getHttpServer())
                .get('/api/favorites/ids')
                .set('Authorization', `Bearer ${user2Tokens.accessToken}`)
                .expect(200);

            expect(user2Response.body.data).toContain(vehicleId2);
        });
    });
});
