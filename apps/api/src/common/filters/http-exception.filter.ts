import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    timestamp: string;
    path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Bir hata oluştu, lütfen daha sonra tekrar deneyin';
        let code = 'INTERNAL_ERROR';
        let details: unknown = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = this.translateMessage(exceptionResponse);
            } else if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as Record<string, unknown>;
                message = this.translateMessage(
                    (res.message as string) || exception.message,
                );
                code = (res.error as string) || this.getErrorCode(status);

                // Handle validation errors
                if (Array.isArray(res.message)) {
                    message = this.translateMessage(res.message[0]);
                    details = res.message.map((m: string) =>
                        this.translateMessage(m),
                    );
                }
            }
        } else if (exception instanceof Error) {
            message = this.translateMessage(exception.message);
        }

        // Log error for internal tracking
        this.logger.error(
            `[${request.method}] ${request.url} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                code: this.getErrorCode(status) || code,
                message,
                ...(details && process.env.NODE_ENV !== 'production'
                    ? { details }
                    : {}),
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }

    private getErrorCode(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        };
        return codes[status] || 'UNKNOWN_ERROR';
    }

    private translateMessage(message: string): string {
        const translations: Record<string, string> = {
            // Auth
            'Invalid credentials': 'Geçersiz e-posta veya şifre',
            'User with this email already exists':
                'Bu e-posta adresi zaten kullanılıyor',
            'Access denied': 'Erişim reddedildi',
            'Account is deactivated': 'Hesabınız devre dışı bırakılmış',
            Unauthorized: 'Oturum açmanız gerekiyor',

            // Validation
            'email must be an email': 'Geçerli bir e-posta adresi girin',
            'password must be longer than or equal to 6 characters':
                'Şifre en az 6 karakter olmalı',
            'firstName should not be empty': 'Ad alanı zorunludur',
            'lastName should not be empty': 'Soyad alanı zorunludur',

            // Vehicles
            'Vehicle not found': 'Araç bulunamadı',
            'Vehicle is not available for rental':
                'Araç kiralama için müsait değil',
            'Vehicle listing is not approved':
                'Araç ilanı henüz onaylanmamış',
            'You can only update your own vehicles':
                'Sadece kendi araçlarınızı güncelleyebilirsiniz',
            'You can only delete your own vehicles':
                'Sadece kendi araçlarınızı silebilirsiniz',

            // Rentals
            'Rental not found': 'Kiralama bulunamadı',
            'Vehicle is already booked for the selected dates':
                'Araç seçilen tarihlerde zaten rezerve edilmiş',
            'Rental must be at least 1 day':
                'Kiralama süresi en az 1 gün olmalıdır',
            'Rental is not in pending status':
                'Kiralama bekleyen durumda değil',
            'Rental is not active': 'Kiralama aktif değil',
            'Cannot cancel completed rental':
                'Tamamlanmış kiralama iptal edilemez',
            'You cannot cancel this rental': 'Bu kiralamayı iptal edemezsiniz',
            'Only vehicle owner can start the rental':
                'Sadece araç sahibi kiralamayı başlatabilir',
            'Only vehicle owner can complete the rental':
                'Sadece araç sahibi kiralamayı tamamlayabilir',
            'You can only view rentals for your own vehicles':
                'Sadece kendi araçlarınızın kiralamalarını görebilirsiniz',

            // Rate limiting
            'ThrottlerException: Too Many Requests':
                'Çok fazla istek gönderdiniz, lütfen biraz bekleyin',

            // Generic
            'Internal server error':
                'Sunucu hatası, lütfen daha sonra tekrar deneyin',
            'Not Found': 'Sayfa bulunamadı',
            Forbidden: 'Bu işlem için yetkiniz yok',
        };

        return translations[message] || message;
    }
}

