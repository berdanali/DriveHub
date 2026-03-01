import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async throwThrottlingException(): Promise<void> {
        throw new ThrottlerException(
            'Çok fazla istek gönderdiniz, lütfen biraz bekleyin',
        );
    }

    protected async getTracker(req: Record<string, unknown>): Promise<string> {
        // Use IP + User ID (if available) for tracking
        const ip = (req.ip as string) || 'unknown';
        const user = req.user as { sub?: string } | undefined;
        const userId = user?.sub || 'anonymous';
        return `${ip}-${userId}`;
    }

    // Skip throttling for health checks
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (request.url === '/api/health') {
            return true;
        }
        return super.canActivate(context);
    }
}

