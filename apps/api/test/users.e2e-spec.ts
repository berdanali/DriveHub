/**
 * Users E2E Tests - Kullanıcı Yönetimi Uçtan Uca Testler
 *
 * Test Senaryoları:
 * - Profil bilgileri alma ve güncelleme
 * - Adres CRUD işlemleri
 * - Bildirim tercihleri
 * - Ehliyet bilgileri
 * - Doğrulama durumu
 * - Hesap devre dışı bırakma
 * - Admin kullanıcı yönetimi (listeleme, ban, silme)
 * - Yetkilendirme kontrolleri
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
    randomEmail,
} from './helpers/test.helper';

describe('Users Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Kullanıcı tokenları
    let customerTokens: { accessToken: string; refreshToken: string };
    let customerId: string;
    let adminTokens: { accessToken: string; refreshToken: string };
    let adminId: string;
    let ownerTokens: { accessToken: string; refreshToken: string };
    let ownerId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(CustomThrottlerGuard)
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
            firstName: 'Profil',
            lastName: 'Testi',
            phone: '+905553330001',
            roleType: 'CUSTOMER',
        });
        customerTokens = customerResult!.tokens;
        customerId = customerResult!.userId;

        // Owner kayıt & giriş
        const ownerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'Sahip',
            lastName: 'Profil',
            phone: '+905553330002',
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
        adminId = adminResult!.userId;
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // 1. PROFİL TESTLERİ
    // ============================================

    describe('GET /api/users/profile', () => {
        it('✅ kullanıcı kendi profilini görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).toHaveProperty('firstName');
            expect(response.body.data).toHaveProperty('lastName');
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('❌ token olmadan profil - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/users/profile')
                .expect(401);
        });
    });

    describe('PATCH /api/users/profile', () => {
        it('✅ profil güncelleme - firstName', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ firstName: 'GüncellenenAd' })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.firstName).toBe('GüncellenenAd');
        });

        it('✅ profil güncelleme - lastName', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ lastName: 'GüncellenenSoyad' })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.lastName).toBe('GüncellenenSoyad');
        });

        it('✅ profil güncelleme - telefon', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ phone: '+905559999999' })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ token olmadan güncelleme - 401', async () => {
            await request(app.getHttpServer())
                .patch('/api/users/profile')
                .send({ firstName: 'Test' })
                .expect(401);
        });
    });

    // ============================================
    // 2. ADRES İŞLEMLERİ TESTLERİ
    // ============================================

    describe('Adres CRUD işlemleri', () => {
        let addressId: string;

        it('✅ adres ekle', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/addresses')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    title: 'Ev Adresim',
                    city: 'İstanbul',
                    district: 'Kadıköy',
                    neighborhood: 'Caferağa',
                    street: 'Test Sokak',
                    buildingNo: '10',
                    apartmentNo: '3',
                    postalCode: '34710',
                    isDefault: true,
                    type: 'BILLING',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.city).toBe('İstanbul');

            addressId = response.body.data.id;
        });

        it('✅ adres listele', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/addresses')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('✅ adres güncelle', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/users/addresses/${addressId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    city: 'Ankara',
                    district: 'Çankaya',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.city).toBe('Ankara');
        });

        it('✅ adres sil', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/users/addresses/${addressId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('❌ token olmadan adres ekle - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/users/addresses')
                .send({
                    city: 'İstanbul',
                    district: 'Beşiktaş',
                })
                .expect(401);
        });
    });

    // ============================================
    // 3. BİLDİRİM TERCİHLERİ TESTLERİ
    // ============================================

    describe('Bildirim tercihleri', () => {
        it('✅ bildirim tercihlerini getir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/notifications/preferences')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('✅ bildirim tercihlerini güncelle', async () => {
            const response = await request(app.getHttpServer())
                .put('/api/users/notifications/preferences')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    emailRentalUpdates: true,
                    emailPriceChanges: false,
                    emailPromotions: false,
                    emailNewsletter: true,
                    smsRentalReminders: true,
                    smsSecurityAlerts: true,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('❌ token olmadan bildirim tercihleri - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/users/notifications/preferences')
                .expect(401);
        });
    });

    // ============================================
    // 4. EHLİYET BİLGİLERİ TESTLERİ
    // ============================================

    describe('Ehliyet bilgileri', () => {
        it('✅ ehliyet bilgilerini getir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/driver-license')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('✅ ehliyet bilgilerini güncelle', async () => {
            const response = await request(app.getHttpServer())
                .put('/api/users/driver-license')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({
                    licenseNumber: 'TR123456789',
                    licenseClass: 'B',
                    issueDate: '2020-01-15',
                    expiryDate: '2030-01-15',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('❌ token olmadan ehliyet - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/users/driver-license')
                .expect(401);
        });
    });

    // ============================================
    // 5. DOĞRULAMA DURUMU TESTLERİ
    // ============================================

    describe('GET /api/users/verification-status', () => {
        it('✅ doğrulama durumunu getir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/verification-status')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('emailVerified');
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/users/verification-status')
                .expect(401);
        });
    });

    // ============================================
    // 6. HESAP İŞLEMLERİ TESTLERİ
    // ============================================

    describe('Hesap devre dışı bırakma ve silme', () => {
        let deactivateUser: { tokens: { accessToken: string }; userId: string } | null;
        let deleteUser: { tokens: { accessToken: string }; userId: string } | null;

        beforeAll(async () => {
            deactivateUser = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Deaktif',
                lastName: 'Kullanıcı',
                phone: '+905553330010',
                roleType: 'CUSTOMER',
            });

            deleteUser = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Silinen',
                lastName: 'Kullanıcı',
                phone: '+905553330011',
                roleType: 'CUSTOMER',
            });
        });

        it('✅ hesabı devre dışı bırak', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/deactivate')
                .set('Authorization', `Bearer ${deactivateUser!.tokens.accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('✅ hesabı sil (soft delete)', async () => {
            const response = await request(app.getHttpServer())
                .delete('/api/users/account')
                .set('Authorization', `Bearer ${deleteUser!.tokens.accessToken}`)
                .send({ password: 'Test@123456' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('❌ yanlış şifre ile hesap silme - 400', async () => {
            const tempUser = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Geçici',
                lastName: 'Kullanıcı',
                phone: '+905553330012',
                roleType: 'CUSTOMER',
            });

            await request(app.getHttpServer())
                .delete('/api/users/account')
                .set('Authorization', `Bearer ${tempUser!.tokens.accessToken}`)
                .send({ password: 'YanlısSifre@123' })
                .expect(400);
        });
    });

    // ============================================
    // 7. ADMİN KULLANICI YÖNETİMİ TESTLERİ
    // ============================================

    describe('Admin kullanıcı yönetimi', () => {
        it('✅ SUPER_ADMIN tüm kullanıcıları listeleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('✅ SUPER_ADMIN sayfalandırma ile kullanıcı listesi', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=1&limit=5')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ CUSTOMER kullanıcı listesine erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ VEHICLE_OWNER kullanıcı listesine erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('✅ SUPER_ADMIN kullanıcı detayını görebilir', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${customerId}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.id).toBe(customerId);
        });

        it('❌ CUSTOMER başka kullanıcının detayına erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/${ownerId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ olmayan kullanıcı detayı - null döner', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app.getHttpServer())
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            // findById null döner, interceptor { success: true, data: null } olarak sarar
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeNull();
        });
    });

    // ============================================
    // 8. KULLANICI DURUM YÖNETİMİ (Admin)
    // ============================================

    describe('Admin kullanıcı durumu yönetimi', () => {
        let banTestUser: { tokens: { accessToken: string }; userId: string } | null;

        beforeAll(async () => {
            banTestUser = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Ban',
                lastName: 'Testi',
                phone: '+905553330020',
                roleType: 'CUSTOMER',
            });
        });

        it('✅ SUPER_ADMIN kullanıcıyı ban yapabilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/users/${banTestUser!.userId}/status`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send({ isActive: false })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('✅ SUPER_ADMIN kullanıcı banını kaldırabilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/users/${banTestUser!.userId}/status`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .send({ isActive: true })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ CUSTOMER ban yapamaz - 403', async () => {
            await request(app.getHttpServer())
                .patch(`/api/users/${ownerId}/status`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .send({ isActive: false })
                .expect(403);
        });

        it('❌ VEHICLE_OWNER ban yapamaz - 403', async () => {
            await request(app.getHttpServer())
                .patch(`/api/users/${customerId}/status`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .send({ isActive: false })
                .expect(403);
        });
    });

    // ============================================
    // 9. ADMİN KULLANICI SİLME TESTLERİ
    // ============================================

    describe('Admin kullanıcı silme', () => {
        let deleteTargetId: string;

        beforeAll(async () => {
            const deleteTarget = await registerAndLogin(app, {
                email: randomEmail(),
                password: 'Test@123456',
                firstName: 'Silinecek',
                lastName: 'Kullanıcı',
                phone: '+905553330030',
                roleType: 'CUSTOMER',
            });
            deleteTargetId = deleteTarget!.userId;
        });

        it('❌ CUSTOMER admin silme işlemi yapamaz - 403', async () => {
            await request(app.getHttpServer())
                .delete(`/api/users/${deleteTargetId}`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('✅ SUPER_ADMIN kullanıcı silebilir', async () => {
            await request(app.getHttpServer())
                .delete(`/api/users/${deleteTargetId}`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(204);
        });
    });
});

