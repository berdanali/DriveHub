import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
    ttl: number; // Time window in seconds
    limit: number; // Max requests in the time window
    keyPrefix?: string; // Custom key prefix
}

export const RateLimit = (options: RateLimitOptions) => {
    return (
        target: object,
        propertyKey?: string,
        descriptor?: PropertyDescriptor,
    ) => {
        if (descriptor) {
            Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
        }
        return descriptor;
    };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
    // In-memory fallback when Redis is not available
    private memoryStore = new Map<string, { count: number; expiry: number }>();

    constructor(
        private readonly reflector: Reflector,
        private readonly redisService: RedisService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const options = this.reflector.get<RateLimitOptions>(
            RATE_LIMIT_KEY,
            context.getHandler(),
        );

        if (!options) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const ip = request.ip || 'unknown';
        const userId = request.user?.sub || 'anonymous';
        const keyPrefix = options.keyPrefix || 'ratelimit';
        const key = `${keyPrefix}:${ip}:${userId}`;

        // Check if Redis is available
        if (this.redisService.isAvailable()) {
            return this.checkWithRedis(key, options);
        }

        // Fallback to in-memory rate limiting
        return this.checkWithMemory(key, options);
    }

    private async checkWithRedis(
        key: string,
        options: RateLimitOptions,
    ): Promise<boolean> {
        const current = await this.redisService.get(key);

        if (current && parseInt(current, 10) >= options.limit) {
            this.throwRateLimitError();
        }

        const client = this.redisService.getClient();
        if (client) {
            try {
                const multi = client.multi();
                multi.incr(key);
                if (!current) {
                    multi.expire(key, options.ttl);
                }
                await multi.exec();
            } catch {
                // Silently fail, allow request through
            }
        }

        return true;
    }

    private checkWithMemory(
        key: string,
        options: RateLimitOptions,
    ): boolean {
        const now = Date.now();
        const entry = this.memoryStore.get(key);

        // Clean up expired entries periodically
        if (Math.random() < 0.1) {
            this.cleanupMemoryStore();
        }

        if (entry) {
            if (entry.expiry < now) {
                // Expired, reset
                this.memoryStore.set(key, {
                    count: 1,
                    expiry: now + options.ttl * 1000,
                });
                return true;
            }

            if (entry.count >= options.limit) {
                this.throwRateLimitError();
            }

            entry.count++;
            return true;
        }

        // New entry
        this.memoryStore.set(key, {
            count: 1,
            expiry: now + options.ttl * 1000,
        });

        return true;
    }

    private cleanupMemoryStore(): void {
        const now = Date.now();
        for (const [key, entry] of this.memoryStore.entries()) {
            if (entry.expiry < now) {
                this.memoryStore.delete(key);
            }
        }
    }

    private throwRateLimitError(): never {
        throw new HttpException(
            {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message:
                        'Çok fazla istek gönderdiniz, lütfen biraz bekleyin',
                },
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
