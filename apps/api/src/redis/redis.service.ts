import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;

    constructor(private readonly configService: ConfigService) {
        this.initializeClient();
    }

    private initializeClient(): void {
        try {
            this.client = new Redis({
                host: this.configService.get<string>('redis.host') || 'localhost',
                port: this.configService.get<number>('redis.port') || 6379,
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn('Redis not available, running without caching');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 100, 1000);
                },
                lazyConnect: true, // Don't connect immediately
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                this.logger.log('Redis connection established');
            });

            this.client.on('error', () => {
                this.isConnected = false;
                // Suppress error logs after initial warning
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });

            // Try to connect but don't fail if Redis is unavailable
            this.client.connect().catch(() => {
                this.logger.warn('Redis not available, application will run without caching');
                this.isConnected = false;
            });
        } catch {
            this.logger.warn('Failed to initialize Redis client');
            this.isConnected = false;
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.logger.log('Redis connection closed');
        }
    }

    getClient(): Redis | null {
        return this.isConnected ? this.client : null;
    }

    isAvailable(): boolean {
        return this.isConnected;
    }

    /**
     * Set a value with optional TTL (in seconds)
     */
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            } else {
                await this.client.set(key, value);
            }
        } catch {
            // Silently fail - caching is optional
        }
    }

    /**
     * Get a value by key
     */
    async get(key: string): Promise<string | null> {
        if (!this.isConnected || !this.client) return null;
        try {
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    /**
     * Delete a key
     */
    async del(key: string): Promise<number> {
        if (!this.isConnected || !this.client) return 0;
        try {
            return await this.client.del(key);
        } catch {
            return 0;
        }
    }

    /**
     * Set a JSON value
     */
    async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }

    /**
     * Get a JSON value
     */
    async getJson<T>(key: string): Promise<T | null> {
        const value = await this.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }

    /**
     * Cache vehicle search results
     */
    async cacheVehicleSearch(
        searchKey: string,
        results: unknown,
        ttlSeconds = 300, // 5 minutes default
    ): Promise<void> {
        const key = `vehicle:search:${searchKey}`;
        await this.setJson(key, results, ttlSeconds);
    }

    /**
     * Get cached vehicle search results
     */
    async getCachedVehicleSearch<T>(searchKey: string): Promise<T | null> {
        const key = `vehicle:search:${searchKey}`;
        return this.getJson<T>(key);
    }

    /**
     * Store user session
     */
    async setUserSession(
        userId: string,
        sessionData: object,
        ttlSeconds = 86400, // 24 hours default
    ): Promise<void> {
        const key = `session:${userId}`;
        await this.setJson(key, sessionData, ttlSeconds);
    }

    /**
     * Get user session
     */
    async getUserSession<T>(userId: string): Promise<T | null> {
        const key = `session:${userId}`;
        return this.getJson<T>(key);
    }

    /**
     * Invalidate user session
     */
    async invalidateUserSession(userId: string): Promise<void> {
        const key = `session:${userId}`;
        await this.del(key);
    }

    /**
     * Store real-time GPS data
     */
    async setVehicleLocation(
        vehicleId: string,
        location: { latitude: number; longitude: number; timestamp: Date },
    ): Promise<void> {
        const key = `gps:vehicle:${vehicleId}`;
        await this.setJson(key, location, 60); // 1 minute TTL
    }

    /**
     * Get real-time vehicle location
     */
    async getVehicleLocation(
        vehicleId: string,
    ): Promise<{ latitude: number; longitude: number; timestamp: Date } | null> {
        const key = `gps:vehicle:${vehicleId}`;
        return this.getJson(key);
    }

    /**
     * Get all active vehicle locations
     */
    async getAllVehicleLocations(): Promise<
        Map<string, { latitude: number; longitude: number; timestamp: Date }>
    > {
        const locations = new Map();
        if (!this.isConnected || !this.client) return locations;

        try {
            const keys = await this.client.keys('gps:vehicle:*');

            for (const key of keys) {
                const vehicleId = key.replace('gps:vehicle:', '');
                const location = await this.getJson(key);
                if (location) {
                    locations.set(vehicleId, location);
                }
            }
        } catch {
            // Return empty map if Redis unavailable
        }

        return locations;
    }
}
