/**
 * App E2E Tests - Uygulama Genel Testler
 *
 * NOT: Health check endpoint main.ts içinde getHttpAdapter() ile tanımlanır.
 * Test modülünde main.ts çalışmadığı için bu endpoint test ortamında mevcut değildir.
 * Bu dosyada sadece uygulama bootstrap testleri yer alır.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomThrottlerGuard } from '../src/common/guards/throttle.guard';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(CustomThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalInterceptors(new TransformInterceptor());

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Uygulama Başlatma', () => {
        it('✅ uygulama başarıyla ayağa kalkar', () => {
            expect(app).toBeDefined();
        });

        it('✅ bilinmeyen endpoint - 404 döner', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/nonexistent-endpoint')
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('✅ public arama endpointi erişilebilir', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/vehicles/search')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('❌ korumalı endpoint token olmadan - 401', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });
    });
});
