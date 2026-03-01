/**
 * Test Helper Utilities
 * Tüm testlerde kullanılan ortak yardımcı fonksiyonlar
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CustomThrottlerGuard } from '../../src/common/guards/throttle.guard';

// ============================================
// TEST KULLANICI VERİLERİ
// ============================================

const timestamp = Date.now();

export const TEST_USERS = {
    admin: {
        email: 'admin@carrental.com',
        password: 'Admin123!',
    },
    owner: {
        email: 'owner@carrental.com',
        password: 'Owner123!',
    },
    customer: {
        email: `test-customer-${timestamp}@test.com`,
        password: 'Test@123456',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+905551234567',
        roleType: 'CUSTOMER' as const,
    },
    ownerNew: {
        email: `test-owner-${timestamp}@test.com`,
        password: 'Test@123456',
        firstName: 'Test',
        lastName: 'Owner',
        phone: '+905559876543',
        roleType: 'VEHICLE_OWNER' as const,
    },
};

export const TEST_VEHICLE = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    licensePlate: `TEST-${timestamp}`,
    color: 'Beyaz',
    seats: 5,
    fuelType: 'Hybrid',
    transmission: 'Otomatik',
    dailyRate: 500,
    description: 'Test aracı - E2E testleri için',
    images: [],
    features: ['GPS', 'Geri Görüş Kamerası'],
    address: 'Test Mahallesi, Test Sokak No:1, İstanbul',
};

export const TEST_CONTACT = {
    name: 'Test Kullanıcı',
    email: 'test@contact.com',
    phone: '+905551112233',
    subject: 'Test Konusu - E2E',
    message: 'Bu bir E2E test mesajıdır. Lütfen dikkate almayınız.',
};

// ============================================
// UYGULAMA OLUŞTURMA
// ============================================

export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(CustomThrottlerGuard)
        .useValue({ canActivate: () => true })
        .compile();

    const app = moduleFixture.createNestApplication();
    const prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    return app;
}

// ============================================
// AUTH HELPER FONKSİYONLARI
// ============================================

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Kullanıcı kaydı yapıp token döner
 */
export async function registerUser(
    app: INestApplication,
    userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        roleType?: string;
    },
): Promise<{ tokens: AuthTokens; userId: string } | null> {
    const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userData);

    if (res.body.success && res.body.data) {
        return {
            tokens: {
                accessToken: res.body.data.accessToken,
                refreshToken: res.body.data.refreshToken,
            },
            userId: res.body.data.user.id,
        };
    }
    return null;
}

/**
 * Kullanıcı girişi yapıp token döner
 */
export async function loginUser(
    app: INestApplication,
    email: string,
    password: string,
): Promise<{ tokens: AuthTokens; userId: string } | null> {
    const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password });

    if (res.body.success && res.body.data) {
        return {
            tokens: {
                accessToken: res.body.data.accessToken,
                refreshToken: res.body.data.refreshToken,
            },
            userId: res.body.data.user.id,
        };
    }
    return null;
}

/**
 * Kullanıcıyı e-posta doğrulanmış olarak işaretle (test ortamı için)
 */
export async function verifyUserEmail(
    app: INestApplication,
    email: string,
): Promise<void> {
    const moduleRef = app.get(PrismaService);
    await moduleRef.user.updateMany({
        where: { email },
        data: { isVerified: true },
    });
}

/**
 * Test kullanıcısını kaydet, doğrula ve giriş yap
 */
export async function registerAndLogin(
    app: INestApplication,
    userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        roleType?: string;
    },
): Promise<{ tokens: AuthTokens; userId: string } | null> {
    // Kayıt
    const registerResult = await registerUser(app, userData);
    if (!registerResult) return null;

    // E-posta doğrula
    await verifyUserEmail(app, userData.email);

    // Giriş
    const loginResult = await loginUser(app, userData.email, userData.password);
    return loginResult;
}

// ============================================
// ARAÇ HELPER FONKSİYONLARI
// ============================================

/**
 * Test aracı oluştur
 */
export async function createTestVehicle(
    app: INestApplication,
    token: string,
    vehicleData?: Partial<typeof TEST_VEHICLE>,
): Promise<any | null> {
    const data = {
        ...TEST_VEHICLE,
        licensePlate: randomLicensePlate(),
        ...vehicleData,
    };

    const res = await request(app.getHttpServer())
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send(data);

    if (res.body.success && res.body.data) {
        return res.body.data;
    }
    return null;
}

/**
 * Aracı admin olarak onayla
 */
export async function approveVehicle(
    app: INestApplication,
    adminToken: string,
    vehicleId: string,
): Promise<void> {
    await request(app.getHttpServer())
        .patch(`/api/vehicles/${vehicleId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isApproved: true });
}

// ============================================
// RESPONSE DOĞRULAMA FONKSİYONLARI
// ============================================

/**
 * Başarılı API yanıtını doğrula
 */
export function expectSuccessResponse(body: any): void {
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('timestamp');
}

/**
 * Hata API yanıtını doğrula
 */
export function expectErrorResponse(body: any, code?: string): void {
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    if (code) {
        expect(body.error.code).toBe(code);
    }
}

/**
 * Pagination yanıtını doğrula
 */
export function expectPaginatedResponse(data: any): void {
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('totalPages');
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(typeof data.totalPages).toBe('number');
}

// ============================================
// RANDOM VERİ ÜRETİCİLER
// ============================================

export function randomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;
}

export function randomLicensePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
    return `${Math.floor(Math.random() * 81 + 1)} ${randomLetter()}${randomLetter()} ${Math.floor(Math.random() * 9000 + 1000)}`;
}

