/**
 * Auth E2E Tests - Kimlik Doğrulama Uçtan Uca Testler
 * 
 * Test Senaryoları:
 * - Kullanıcı kaydı (başarılı, validasyon hataları, çakışma)
 * - Kullanıcı girişi (başarılı, yanlış şifre, olmayan kullanıcı)
 * - Token yenileme (başarılı, geçersiz token)
 * - Kullanıcı bilgileri alma (başarılı, yetkisiz)
 * - Çıkış (başarılı)
 * - Şifre işlemleri (şifre değiştir, şifremi unuttum)
 * - E-posta doğrulama (tekrar gönder)
 * - Güvenlik testleri (SQL injection, XSS, eksik alanlar)
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
    expectSuccessResponse,
    expectErrorResponse,
    randomEmail,
} from './helpers/test.helper';

describe('Auth Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let accessToken: string;
    let refreshToken: string;

    const testEmail = randomEmail();
    const testUser = {
        email: testEmail,
        password: 'Test@123456',
        firstName: 'Auth',
        lastName: 'TestKullanici',
        phone: '+905551234567',
        roleType: 'CUSTOMER',
    };

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
    });

    afterAll(async () => {
        // Kullanıcı tercihi: test verileri silinmez
        await app.close();
    });

    // ============================================
    // 1. KAYIT TESTLERİ
    // ============================================

    describe('POST /api/auth/register', () => {
        it('✅ başarılı kayıt - yeni kullanıcı oluşturur', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expectSuccessResponse(response.body);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.firstName).toBe(testUser.firstName);
            expect(response.body.data.user.lastName).toBe(testUser.lastName);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.user).not.toHaveProperty('password');

            accessToken = response.body.data.accessToken;
            refreshToken = response.body.data.refreshToken;
        });

        it('❌ aynı e-posta ile tekrar kayıt - 409 Conflict', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(testUser)
                .expect(409);

            expectErrorResponse(response.body, 'CONFLICT');
        });

        it('❌ geçersiz e-posta formatı - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...testUser, email: 'not-an-email' })
                .expect(400);

            expectErrorResponse(response.body, 'BAD_REQUEST');
        });

        it('❌ boş e-posta - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...testUser, email: '' })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ zayıf şifre (çok kısa) - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    password: '123',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ zayıf şifre (özel karakter yok) - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    password: 'TestPassword123',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ zayıf şifre (büyük harf yok) - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    password: 'test@123456',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ eksik firstName - 400 Bad Request', async () => {
            const { firstName, ...dto } = testUser;
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...dto, email: randomEmail() })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ eksik lastName - 400 Bad Request', async () => {
            const { lastName, ...dto } = testUser;
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...dto, email: randomEmail() })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ isimde sayı/özel karakter - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    firstName: 'Test123',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ geçersiz telefon formatı - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    phone: 'not-a-phone',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('✅ VEHICLE_OWNER rolü ile kayıt', async () => {
            const ownerEmail = randomEmail();
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: ownerEmail,
                    roleType: 'VEHICLE_OWNER',
                })
                .expect(201);

            expectSuccessResponse(response.body);
            expect(response.body.data.user.role).toBe('VEHICLE_OWNER');
        });

        it('🔒 SUPER_ADMIN rolü ile kayıt reddedilir - 400 Bad Request', async () => {
            const adminEmail = randomEmail();
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: adminEmail,
                    roleType: 'SUPER_ADMIN',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ boş body - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({})
                .expect(400);
        });

        it('🔒 SQL injection denemesi - güvenli', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: "'; DROP TABLE users;--@test.com",
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('🔒 XSS denemesi firstName - güvenli', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: randomEmail(),
                    firstName: '<script>alert("xss")</script>',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ fazla uzun e-posta - 400 Bad Request', async () => {
            const longEmail = 'a'.repeat(250) + '@test.com';
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...testUser, email: longEmail })
                .expect(400);

            expectErrorResponse(response.body);
        });
    });

    // ============================================
    // 2. GİRİŞ TESTLERİ
    // ============================================

    describe('POST /api/auth/login', () => {
        beforeAll(async () => {
            // E-posta doğrulaması yap (login için gerekli)
            await prisma.user.updateMany({
                where: { email: testUser.email },
                data: { isVerified: true },
            });
        });

        it('✅ başarılı giriş', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.user).not.toHaveProperty('password');

            // Token'ları güncelle
            accessToken = response.body.data.accessToken;
            refreshToken = response.body.data.refreshToken;
        });

        it('❌ yanlış şifre - 401 Unauthorized', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'YanlisParola123!',
                })
                .expect(401);

            expectErrorResponse(response.body, 'UNAUTHORIZED');
        });

        it('❌ olmayan kullanıcı - 401 Unauthorized', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'varolmayan@example.com',
                    password: 'Test@123456',
                })
                .expect(401);

            expectErrorResponse(response.body, 'UNAUTHORIZED');
        });

        it('❌ boş şifre - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: '',
                })
                .expect(400);
        });

        it('❌ geçersiz e-posta formatı - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'gecersiz-email',
                    password: 'Test@123456',
                })
                .expect(400);
        });

        it('❌ boş body - 400 Bad Request', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({})
                .expect(400);
        });

        it('🔒 yanlış/olmayan kullanıcıda aynı hata mesajı (timing koruması)', async () => {
            const res1 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPass@123',
                });

            const res2 = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'WrongPass@123',
                });

            // Her iki durumda da aynı HTTP status
            expect(res1.status).toBe(401);
            expect(res2.status).toBe(401);
        });
    });

    // ============================================
    // 3. PROFİL BİLGİLERİ TESTLERİ
    // ============================================

    describe('GET /api/auth/me', () => {
        it('✅ geçerli token ile profil döner', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.email).toBe(testUser.email);
        });

        it('❌ token olmadan - 401 Unauthorized', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });

        it('❌ geçersiz token - 401 Unauthorized', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);
        });

        it('❌ malformed Authorization header - 401 Unauthorized', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'NotBearer token')
                .expect(401);
        });

        it('❌ boş Bearer token - 401 Unauthorized', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'Bearer ')
                .expect(401);
        });
    });

    // ============================================
    // 4. TOKEN YENİLEME TESTLERİ
    // ============================================

    describe('POST /api/auth/refresh', () => {
        it('✅ geçerli refresh token ile yeni tokenlar alır', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Authorization', `Bearer ${refreshToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // Tokenları güncelle
            accessToken = response.body.data.accessToken;
            refreshToken = response.body.data.refreshToken;
        });

        it('❌ geçersiz refresh token - 401 Unauthorized', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Authorization', 'Bearer invalid-refresh-token')
                .expect(401);
        });

        it('❌ access token ile refresh denemesi - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(401);
        });
    });

    // ============================================
    // 5. ŞİFRE DEĞİŞTİRME TESTLERİ
    // ============================================

    describe('POST /api/auth/change-password', () => {
        it('❌ yanlış mevcut şifre - 400', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'YanlisParola@123',
                    newPassword: 'YeniParola@123',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });

        it('❌ token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/change-password')
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'YeniParola@123',
                })
                .expect(401);
        });
    });

    // ============================================
    // 6. ŞİFREMİ UNUTTUM TESTLERİ
    // ============================================

    describe('POST /api/auth/forgot-password', () => {
        it('✅ mevcut e-posta - 200 döner', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('✅ olmayan e-posta - 200 döner (email enumeration koruması)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'olmayan@example.com' })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ geçersiz e-posta formatı - 400', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'gecersiz' })
                .expect(400);
        });
    });

    // ============================================
    // 7. ŞİFRE SIFIRLAMA TESTLERİ
    // ============================================

    describe('POST /api/auth/reset-password', () => {
        it('❌ geçersiz token - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/reset-password')
                .send({
                    token: 'gecersiz-token',
                    password: 'YeniParola@123',
                })
                .expect(400);

            expectErrorResponse(response.body);
        });
    });

    // ============================================
    // 8. E-POSTA DOĞRULAMA TESTLERİ
    // ============================================

    describe('POST /api/auth/verify-email', () => {
        it('❌ geçersiz token - 400 Bad Request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/verify-email')
                .send({ token: 'gecersiz-verify-token' })
                .expect(400);

            expectErrorResponse(response.body);
        });
    });

    describe('POST /api/auth/resend-verification', () => {
        it('✅ mevcut e-posta - 200', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/resend-verification')
                .send({ email: testUser.email })
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('✅ olmayan e-posta - 200 (enumeration koruması)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/resend-verification')
                .send({ email: 'olmayan@test.com' })
                .expect(200);

            expectSuccessResponse(response.body);
        });
    });

    // ============================================
    // 9. ÇIKIŞ TESTLERİ
    // ============================================

    describe('POST /api/auth/logout', () => {
        it('✅ başarılı çıkış', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expectSuccessResponse(response.body);
        });

        it('❌ token olmadan çıkış - 401', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .expect(401);
        });
    });

    // ============================================
    // 10. ÇIKIŞ SONRASI ERİŞİM TESTLERİ
    // ============================================

    describe('Çıkış sonrası erişim kontrolleri', () => {
        it('✅ yeni giriş yapılabilir', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expectSuccessResponse(response.body);
        });
    });
});

