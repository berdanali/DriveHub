import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api');

    // Security Headers with Helmet
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    scriptSrc: ["'self'"],
                },
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }),
    );

    // Enable CORS with secure configuration
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    app.enableCors({
        origin: corsOrigin.split(','), // Support multiple origins
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-CSRF-Token',
            'X-Requested-With',
        ],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        maxAge: 600, // Preflight cache for 10 minutes
    });

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip unknown properties
            forbidNonWhitelisted: true, // Throw error for unknown properties
            transform: true, // Auto-transform to DTO types
            transformOptions: {
                enableImplicitConversion: true,
            },
            disableErrorMessages: process.env.NODE_ENV === 'production',
        }),
    );

    // Global Exception Filter (Turkish error messages)
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global Interceptors
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
    );

    // Swagger Documentation
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Araç Kiralama API')
            .setDescription(
                'Profesyonel Araç Kiralama Platformu API Dokümantasyonu',
            )
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'JWT token girin',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('auth', 'Kimlik doğrulama işlemleri')
            .addTag('users', 'Kullanıcı yönetimi')
            .addTag('vehicles', 'Araç yönetimi')
            .addTag('rentals', 'Kiralama işlemleri')
            .addTag('gps', 'GPS takip sistemi')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
    }

    // Health check endpoint
    app.getHttpAdapter().get('/api/health', (req, res) => {
        res.json({
            success: true,
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
            },
        });
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Uygulama çalışıyor: http://localhost:${port}/api`);
    if (process.env.NODE_ENV !== 'production') {
        logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
    }
}

bootstrap();
