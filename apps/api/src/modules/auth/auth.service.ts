import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RoleType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

    /**
     * Yeni kullanıcı kaydı - Argon2 şifre hashleme ile
     */
    async register(dto: RegisterDto): Promise<{ user: { id: string; email: string; firstName: string; lastName: string; role: string }; message: string }> {
        // Kullanıcı var mı kontrol et
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
        }

        // SUPER_ADMIN kaydını engelle
        if (dto.roleType === RoleType.SUPER_ADMIN) {
            dto.roleType = RoleType.CUSTOMER;
        }

        // Şifreyi hashle (Argon2id)
        const hashedPassword = await this.hashPassword(dto.password);

        // Kullanıcı oluştur
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            roleType: dto.roleType,
        });

        // E-posta doğrulama maili gönder
        const verificationToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
                type: 'email_verification',
            },
            {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: '24h',
            },
        );

        // Mail gönder (async, hatayı engelleme)
        this.mailService.sendEmailVerification(
            user.email,
            verificationToken,
            user.firstName,
        ).catch(err => this.logger.error(`Doğrulama e-postası gönderilemedi: ${err.message}`));

        this.logger.log(`Yeni kullanıcı kaydedildi: ${user.email}`);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
            },
            message: 'Kayıt başarılı. Lütfen e-posta adresinizi doğrulayın.',
        };
    }

    /**
     * E-posta ve şifre ile giriş
     */
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Kullanıcıyı bul
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            // Timing attack'ı önlemek için aynı hata mesajı
            throw new UnauthorizedException('Geçersiz e-posta veya şifre');
        }

        // Şifreyi doğrula
        const isPasswordValid = await this.verifyPassword(
            user.password,
            dto.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Geçersiz e-posta veya şifre');
        }

        // Hesap aktif mi kontrol et
        if (!user.isActive) {
            throw new UnauthorizedException('Hesabınız devre dışı bırakılmış');
        }

        // E-posta doğrulanmış mı kontrol et
        if (!user.isVerified) {
            throw new UnauthorizedException('E-posta adresinizi doğrulamanız gerekmektedir. Lütfen gelen kutunuzu kontrol edin.');
        }

        // Token oluştur
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role.name,
        });

        // Refresh token hashini kaydet
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        this.logger.log(`Kullanıcı giriş yaptı: ${user.email}`);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
            },
            ...tokens,
        };
    }

    /**
     * Refresh token ile access token yenileme
     */
    async refreshTokens(userId: string, refreshToken: string): Promise<TokensDto> {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Erişim reddedildi');
        }

        // Refresh token hashini doğrula
        const isRefreshTokenValid = await this.verifyPassword(
            user.refreshToken,
            refreshToken,
        );
        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Erişim reddedildi');
        }

        // Yeni tokenlar oluştur
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role.name,
        });

        // Yeni refresh token hashini kaydet
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    /**
     * Çıkış - refresh token'ı geçersiz kıl
     */
    async logout(userId: string): Promise<void> {
        await this.usersService.updateRefreshToken(userId, null);
        this.logger.log(`Kullanıcı çıkış yaptı: ${userId}`);
    }

    /**
     * Argon2id ile şifre hashleme (bcrypt'ten daha güvenli)
     */
    private async hashPassword(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id, // GPU/ASIC saldırılarına karşı dayanıklı
            memoryCost: 65536, // 64 MB
            timeCost: 3, // 3 iterasyon
            parallelism: 4, // 4 paralel thread
        });
    }

    /**
     * Şifreyi hash ile doğrula
     */
    private async verifyPassword(
        hash: string,
        password: string,
    ): Promise<boolean> {
        try {
            return await argon2.verify(hash, password);
        } catch {
            return false;
        }
    }

    /**
     * Access ve refresh token oluştur
     */
    private async generateTokens(payload: JwtPayload): Promise<TokensDto> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: this.configService.get<string>('jwt.accessExpiration'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
                expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
        };
    }

    /**
     * Kullanıcının refresh token hashini güncelle
     */
    private async updateRefreshToken(
        userId: string,
        refreshToken: string,
    ): Promise<void> {
        const hashedRefreshToken = await this.hashPassword(refreshToken);
        await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
    }

    /**
     * Şifre sıfırlama e-postası gönder
     */
    async forgotPassword(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email);

        // Güvenlik için kullanıcı yoksa bile hata verme
        if (!user) {
            this.logger.log(`Şifre sıfırlama isteği (kullanıcı bulunamadı): ${email}`);
            return;
        }

        // Token oluştur (1 saat geçerli)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await this.hashPassword(resetToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Token'ı veritabanına kaydet
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                // Refresh token'ı geçici olarak reset token için kullanalım
                // Gerçek projede ayrı bir tablo/alan kullanılmalı
                refreshToken: `reset:${hashedToken}:${expiresAt.getTime()}`,
            },
        });

        // Şifre sıfırlama maili gönder
        this.mailService.sendPasswordReset(
            user.email,
            resetToken,
            user.firstName,
        ).catch(err => this.logger.error(`Şifre sıfırlama e-postası gönderilemedi: ${err.message}`));

        this.logger.log(`Şifre sıfırlama token oluşturuldu: ${user.email}`);
    }

    /**
     * Şifre sıfırlama
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Token ile kullanıcıyı bul
        const users = await this.prisma.user.findMany({
            where: {
                refreshToken: {
                    startsWith: 'reset:',
                },
            },
        });

        let validUser = null;
        for (const user of users) {
            if (!user.refreshToken?.startsWith('reset:')) continue;

            const [, ...rest] = user.refreshToken.split('reset:');
            const resetPart = rest.join('reset:'); // Her şey 'reset:' sonrası
            const lastColonIdx = resetPart.lastIndexOf(':');
            if (lastColonIdx === -1) continue;
            const hashedToken = resetPart.substring(0, lastColonIdx);
            const expiresAtStr = resetPart.substring(lastColonIdx + 1);
            const expiresAt = parseInt(expiresAtStr, 10);

            // Token süresi dolmuş mu?
            if (Date.now() > expiresAt) continue;

            // Token doğru mu?
            const isValid = await this.verifyPassword(hashedToken, token);
            if (isValid) {
                validUser = user;
                break;
            }
        }

        if (!validUser) {
            throw new BadRequestException('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı');
        }

        // Şifreyi güncelle
        const hashedPassword = await this.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: validUser.id },
            data: {
                password: hashedPassword,
                refreshToken: null, // Reset token'ı temizle
            },
        });

        this.logger.log(`Şifre sıfırlandı: ${validUser.email}`);
    }

    /**
     * E-posta doğrulama
     */
    async verifyEmail(token: string): Promise<void> {
        if (!token || token.trim().length === 0) {
            throw new BadRequestException('Doğrulama token zorunludur');
        }

        // Token temizle (URL encoding artıkları vb.)
        const cleanToken = token.trim();

        try {
            // JWT token'ı doğrula
            const secret = this.configService.get<string>('jwt.accessSecret');
            this.logger.debug(`E-posta doğrulama deneniyor, token uzunluğu: ${cleanToken.length}`);

            const payload = await this.jwtService.verifyAsync(cleanToken, {
                secret,
            });

            if (payload.type !== 'email_verification') {
                this.logger.warn(`Geçersiz token tipi: ${payload.type}, beklenen: email_verification`);
                throw new BadRequestException('Geçersiz doğrulama token');
            }

            // Kullanıcı var mı kontrol et
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                this.logger.warn(`E-posta doğrulama: Kullanıcı bulunamadı: ${payload.sub}`);
                throw new BadRequestException('Kullanıcı bulunamadı');
            }

            if (user.isVerified) {
                this.logger.log(`E-posta zaten doğrulanmış: ${payload.email}`);
                return; // Zaten doğrulanmış, başarılı döndür
            }

            // Kullanıcıyı doğrulanmış olarak işaretle
            await this.prisma.user.update({
                where: { id: payload.sub },
                data: { isVerified: true },
            });

            this.logger.log(`E-posta doğrulandı: ${payload.email}`);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`E-posta doğrulama hatası: ${error.message}`, error.stack);
            throw new BadRequestException('Geçersiz veya süresi dolmuş doğrulama bağlantısı');
        }
    }

    /**
     * Şifre değiştir (giriş yapmışken)
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        // Mevcut şifreyi doğrula
        const isCurrentPasswordValid = await this.verifyPassword(user.password, currentPassword);
        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Mevcut şifreniz yanlış');
        }

        // Yeni şifreyi hashle ve güncelle
        const hashedNewPassword = await this.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        this.logger.log(`Şifre değiştirildi: ${user.email}`);
    }

    /**
     * Doğrulama e-postası yeniden gönder
     */
    async resendVerificationEmail(userId: string): Promise<void> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        if (user.isVerified) {
            throw new BadRequestException('E-posta zaten doğrulanmış');
        }

        // Doğrulama token'ı oluştur (24 saat geçerli)
        const verificationToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
                type: 'email_verification',
            },
            {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: '24h',
            },
        );

        // Doğrulama e-postası gönder
        await this.mailService.sendEmailVerification(
            user.email,
            verificationToken,
            user.firstName,
        );

        this.logger.log(`Doğrulama e-postası gönderildi: ${user.email}`);
    }

    /**
     * E-posta ile doğrulama maili gönder (login olmadan)
     */
    async resendVerificationByEmail(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email);

        // Güvenlik için kullanıcı yoksa bile hata verme
        if (!user) {
            this.logger.log(`Doğrulama maili isteği (kullanıcı bulunamadı): ${email}`);
            return;
        }

        if (user.isVerified) {
            // Zaten doğrulanmış, sessizce dön
            return;
        }

        // Doğrulama token'ı oluştur (24 saat geçerli)
        const verificationToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
                type: 'email_verification',
            },
            {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: '24h',
            },
        );

        // Doğrulama e-postası gönder
        await this.mailService.sendEmailVerification(
            user.email,
            verificationToken,
            user.firstName,
        );

        this.logger.log(`Doğrulama e-postası tekrar gönderildi: ${user.email}`);
    }
}
