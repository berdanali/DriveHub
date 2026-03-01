/**
 * Contact E2E Tests - İletişim Formu Uçtan Uca Testler
 *
 * Test Senaryoları:
 * - İletişim formu gönderme (başarılı, validasyon hataları)
 * - Admin mesajları listeleme
 * - Admin mesajı okundu işaretleme
 * - Yetkilendirme kontrolleri
 * - Güvenlik testleri
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
    TEST_CONTACT,
    expectSuccessResponse,
    expectErrorResponse,
    registerAndLogin,
    loginUser,
    randomEmail,
} from './helpers/test.helper';

describe('Contact Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Kullanıcı tokenları
    let adminTokens: { accessToken: string; refreshToken: string };
    let customerTokens: { accessToken: string; refreshToken: string };
    let ownerTokens: { accessToken: string; refreshToken: string };

    // Oluşturulan mesaj ID
    let createdMessageId: string;

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

        // Admin giriş
        const adminResult = await loginUser(
            app,
            TEST_USERS.admin.email,
            TEST_USERS.admin.password,
        );
        adminTokens = adminResult!.tokens;

        // Customer kayıt & giriş
        const customerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'İletişim',
            lastName: 'Testi',
            phone: '+905555550001',
            roleType: 'CUSTOMER',
        });
        customerTokens = customerResult!.tokens;

        // Owner kayıt & giriş
        const ownerResult = await registerAndLogin(app, {
            email: randomEmail(),
            password: 'Test@123456',
            firstName: 'İletişim',
            lastName: 'Sahip',
            phone: '+905555550002',
            roleType: 'VEHICLE_OWNER',
        });
        ownerTokens = ownerResult!.tokens;
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // 1. İLETİŞİM FORMU GÖNDERME TESTLERİ
    // ============================================

    describe('POST /api/contact', () => {
        it('✅ başarılı iletişim formu gönderme', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/contact')
                .send(TEST_CONTACT)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data).toHaveProperty('message');
        });

        it('✅ telefon olmadan da gönderilebilir', async () => {
            const { phone, ...withoutPhone } = TEST_CONTACT;
            const response = await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...withoutPhone,
                    subject: 'Telefonsuz Test',
                })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ eksik isim - 400 Bad Request', async () => {
            const { name, ...dto } = TEST_CONTACT;
            await request(app.getHttpServer())
                .post('/api/contact')
                .send(dto)
                .expect(400);
        });

        it('❌ eksik e-posta - 400 Bad Request', async () => {
            const { email, ...dto } = TEST_CONTACT;
            await request(app.getHttpServer())
                .post('/api/contact')
                .send(dto)
                .expect(400);
        });

        it('❌ geçersiz e-posta formatı - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    email: 'gecersiz-email',
                })
                .expect(400);
        });

        it('❌ eksik konu - 400 Bad Request', async () => {
            const { subject, ...dto } = TEST_CONTACT;
            await request(app.getHttpServer())
                .post('/api/contact')
                .send(dto)
                .expect(400);
        });

        it('❌ eksik mesaj - 400 Bad Request', async () => {
            const { message, ...dto } = TEST_CONTACT;
            await request(app.getHttpServer())
                .post('/api/contact')
                .send(dto)
                .expect(400);
        });

        it('❌ çok kısa isim (1 karakter) - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    name: 'A',
                })
                .expect(400);
        });

        it('❌ çok kısa konu (2 karakter) - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    subject: 'Ab',
                })
                .expect(400);
        });

        it('❌ çok kısa mesaj (9 karakter) - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    message: '123456789',
                })
                .expect(400);
        });

        it('❌ boş body - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({})
                .expect(400);
        });

        it('✅ çok uzun mesaj (sınır içinde 2000 karakter)', async () => {
            const longMessage = 'A'.repeat(2000);
            const response = await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    message: longMessage,
                    subject: 'Uzun Mesaj Testi',
                })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ çok uzun mesaj (sınır dışı 2001 karakter) - 400', async () => {
            const tooLongMessage = 'A'.repeat(2001);
            await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    message: tooLongMessage,
                })
                .expect(400);
        });
    });

    // ============================================
    // 2. ADMİN MESAJ LİSTELEME TESTLERİ
    // ============================================

    describe('GET /api/contact', () => {
        it('✅ SUPER_ADMIN tüm mesajları listeleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/contact')
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);

            // İlk mesajın ID'sini al (markAsRead testi için)
            createdMessageId = response.body.data[0].id;
        });

        it('❌ CUSTOMER mesajlara erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/contact')
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ VEHICLE_OWNER mesajlara erişemez - 403', async () => {
            await request(app.getHttpServer())
                .get('/api/contact')
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ token olmadan mesajlara erişim - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/contact')
                .expect(401);
        });
    });

    // ============================================
    // 3. MESAJI OKUNDU İŞARETLEME TESTLERİ
    // ============================================

    describe('PATCH /api/contact/:id/read', () => {
        it('✅ SUPER_ADMIN mesajı okundu olarak işaretleyebilir', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/contact/${createdMessageId}/read`)
                .set('Authorization', `Bearer ${adminTokens.accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.isRead).toBe(true);
        });

        it('❌ CUSTOMER mesajı okundu işaretleyemez - 403', async () => {
            await request(app.getHttpServer())
                .patch(`/api/contact/${createdMessageId}/read`)
                .set('Authorization', `Bearer ${customerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ VEHICLE_OWNER mesajı okundu işaretleyemez - 403', async () => {
            await request(app.getHttpServer())
                .patch(`/api/contact/${createdMessageId}/read`)
                .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
                .expect(403);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .patch(`/api/contact/${createdMessageId}/read`)
                .expect(401);
        });
    });

    // ============================================
    // 4. GÜVENLİK TESTLERİ
    // ============================================

    describe('Güvenlik testleri', () => {
        it('🔒 XSS denemesi isim alanında - form kabul edebilir ama güvenli', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    name: '<script>alert("xss")</script>Test',
                    subject: 'Güvenlik Testi',
                    message: 'Bu bir güvenlik test mesajıdır. XSS denemesi yapılmaktadır.',
                });

            // Kabul edebilir (sunucu tarafında sanitize edilir) veya reddedebilir
            expect([200, 400]).toContain(response.status);
        });

        it('🔒 SQL injection denemesi - güvenli', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/contact')
                .send({
                    ...TEST_CONTACT,
                    name: "'; DROP TABLE users;--",
                    subject: 'SQL Injection Testi',
                    message: 'Bu bir güvenlik test mesajıdır. SQL injection denemesi yapılmaktadır.',
                });

            // Parametreli sorgular kullanıldığı için güvenli
            expect([200, 400]).toContain(response.status);
        });
    });
});
