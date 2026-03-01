import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { GpsModule } from './modules/gps/gps.module';
import { ContactModule } from './modules/contact/contact.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CustomThrottlerGuard } from './common/guards/throttle.guard';
import configuration from './config/configuration';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),

        // Rate Limiting - Global
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                throttlers: [
                    {
                        name: 'short',
                        ttl: 1000, // 1 second
                        limit: 10, // 10 requests per second
                    },
                    {
                        name: 'medium',
                        ttl: 10000, // 10 seconds
                        limit: 50, // 50 requests per 10 seconds
                    },
                    {
                        name: 'long',
                        ttl: 60000, // 1 minute
                        limit: 100, // 100 requests per minute
                    },
                ],
            }),
        }),

        // Database & Cache
        PrismaModule,
        RedisModule,

        // Mail
        MailModule,

        // Feature Modules
        AuthModule,
        UsersModule,
        VehiclesModule,
        RentalsModule,
        GpsModule,
        ContactModule,
        FavoritesModule,
    ],
    providers: [
        // Global throttler guard
        {
            provide: APP_GUARD,
            useClass: CustomThrottlerGuard,
        },
    ],
})
export class AppModule {}
