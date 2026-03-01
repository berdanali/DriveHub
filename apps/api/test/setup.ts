/**
 * E2E Test Setup
 * Tüm E2E testleri öncesinde çalışan global yapılandırma
 */
import { PrismaClient } from '@prisma/client';
import { CustomThrottlerGuard } from '../src/common/guards/throttle.guard';

const prisma = new PrismaClient();

// ============================================
// THROTTLER DEVRE DIŞI BIRAK
// overrideGuard APP_GUARD ile kayıtlı guard'lar için çalışmaz.
// Prototype spy ile tüm instance'lar için throttle'ı devre dışı bırakıyoruz.
// ============================================
jest.spyOn(CustomThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

beforeAll(async () => {
    // Veritabanı bağlantısını kur
    await prisma.$connect();
});

afterAll(async () => {
    // Veritabanı bağlantısını kapat
    // NOT: Test verileri silinmez - kullanıcı tercihi doğrultusunda
    // veritabanında inceleme yapılabilmesi için kayıtlar korunur
    await prisma.$disconnect();
});

// Global test zaman aşımı - E2E testleri daha uzun sürebilir
jest.setTimeout(60000);
