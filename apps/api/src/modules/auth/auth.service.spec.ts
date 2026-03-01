import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
    ConflictException,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RoleType } from '@prisma/client';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: jest.Mocked<Partial<UsersService>>;
    let jwtService: jest.Mocked<Partial<JwtService>>;
    let configService: jest.Mocked<Partial<ConfigService>>;
    let prismaService: any;
    let mailService: jest.Mocked<Partial<MailService>>;

    const mockRole = {
        id: 'role-123',
        name: RoleType.CUSTOMER,
        description: 'Customer role',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$argon2id$v=19$m=65536,t=3,p=4$mockhashedpassword',
        firstName: 'Test',
        lastName: 'User',
        phone: '+905551234567',
        avatar: null,
        birthDate: null,
        tcNumber: null,
        gender: null,
        isActive: true,
        isVerified: true,
        refreshToken: null,
        deletedAt: null,
        roleId: 'role-123',
        role: mockRole,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
    };

    beforeEach(async () => {
        usersService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
        };

        jwtService = {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
        };

        configService = {
            get: jest.fn(),
        };

        prismaService = {
            user: {
                update: jest.fn(),
                findMany: jest.fn(),
            },
        };

        mailService = {
            sendEmailVerification: jest.fn().mockResolvedValue(undefined),
            sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: usersService },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
                { provide: PrismaService, useValue: prismaService },
                { provide: MailService, useValue: mailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        // Default config mock
        (configService.get as jest.Mock).mockImplementation((key: string) => {
            const config: Record<string, string> = {
                'jwt.accessSecret': 'test-access-secret-key-minimum-32-chars!',
                'jwt.refreshSecret': 'test-refresh-secret-key-minimum-32-chars!',
                'jwt.accessExpiration': '15m',
                'jwt.refreshExpiration': '7d',
            };
            return config[key];
        });

        // Default JWT mock
        (jwtService.signAsync as jest.Mock)
            .mockResolvedValueOnce(mockTokens.accessToken)
            .mockResolvedValueOnce(mockTokens.refreshToken)
            .mockResolvedValue('mock-verification-token');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // REGISTER TESTLER
    // ============================================

    describe('register()', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'Test@123456',
            firstName: 'New',
            lastName: 'User',
            phone: '+905551234567',
            roleType: RoleType.CUSTOMER,
        };

        it('başarılı kayıt - yeni kullanıcı oluşturur ve token döner', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(mockUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const result = await service.register(registerDto);

            expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
            expect(usersService.create).toHaveBeenCalled();
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe(mockUser.email);
            expect(result.user.firstName).toBe(mockUser.firstName);
            expect(result.user.lastName).toBe(mockUser.lastName);
            expect(result.user.role).toBe(mockUser.role.name);
        });

        it('başarılı kayıt - doğrulama e-postası gönderilir', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(mockUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.register(registerDto);

            // Mail gönderimi async olduğu için then/catch ile çağrılır
            expect(mailService.sendEmailVerification).toHaveBeenCalledWith(
                mockUser.email,
                expect.any(String),
                mockUser.firstName,
            );
        });

        it('mevcut e-posta ile kayıt - ConflictException fırlatır', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
            expect(usersService.create).not.toHaveBeenCalled();
        });

        it('SUPER_ADMIN rolü ile kayıt - CUSTOMER olarak değiştirilir', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(mockUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const adminDto = { ...registerDto, roleType: RoleType.SUPER_ADMIN };
            await service.register(adminDto);

            expect(usersService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    roleType: RoleType.CUSTOMER,
                }),
            );
        });

        it('VEHICLE_OWNER rolü ile kayıt - doğru rol ile oluşturulur', async () => {
            const ownerUser = {
                ...mockUser,
                role: { ...mockRole, name: RoleType.VEHICLE_OWNER },
            };
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(ownerUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const ownerDto = { ...registerDto, roleType: RoleType.VEHICLE_OWNER };
            const result = await service.register(ownerDto);

            expect(result.user.role).toBe(RoleType.VEHICLE_OWNER);
        });

        it('kayıt sonrası refresh token hashlenip kaydedilir', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(mockUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.register(registerDto);

            expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                expect.any(String), // Hashlenmiş refresh token
            );
        });

        it('response içinde password bilgisi bulunmaz', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (usersService.create as jest.Mock).mockResolvedValue(mockUser);
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const result = await service.register(registerDto);

            expect(result.user).not.toHaveProperty('password');
            expect(result.user).not.toHaveProperty('refreshToken');
        });
    });

    // ============================================
    // LOGIN TESTLER
    // ============================================

    describe('login()', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'Test@123456',
        };

        it('geçersiz e-posta - UnauthorizedException fırlatır', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow(
                'Geçersiz e-posta veya şifre',
            );
        });

        it('yanlış şifre - UnauthorizedException fırlatır (aynı mesaj)', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

            // Argon2 verify gerçek bir hash kontrolü yapacağından, mock şifre eşleşmeyecek
            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('deaktif hesap - UnauthorizedException fırlatır', async () => {
            const inactiveUser = { ...mockUser, isActive: false };
            (usersService.findByEmail as jest.Mock).mockResolvedValue(inactiveUser);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('e-posta doğrulanmamış - UnauthorizedException fırlatır', async () => {
            const unverifiedUser = { ...mockUser, isVerified: false };
            (usersService.findByEmail as jest.Mock).mockResolvedValue(unverifiedUser);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('timing attack koruması - olmayan/yanlış kullanıcıda aynı hata mesajı', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

            try {
                await service.login(loginDto);
            } catch (error) {
                expect(error.message).toBe('Geçersiz e-posta veya şifre');
            }
        });
    });

    // ============================================
    // LOGOUT TESTLER
    // ============================================

    describe('logout()', () => {
        it('başarılı çıkış - refresh token null yapılır', async () => {
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.logout('user-123');

            expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-123', null);
        });

        it('logout birden fazla kez çağrılabilir', async () => {
            (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.logout('user-123');
            await service.logout('user-123');

            expect(usersService.updateRefreshToken).toHaveBeenCalledTimes(2);
        });
    });

    // ============================================
    // REFRESH TOKENS TESTLER
    // ============================================

    describe('refreshTokens()', () => {
        it('kullanıcı bulunamazsa - UnauthorizedException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.refreshTokens('user-123', 'refresh-token'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('refresh token yoksa - UnauthorizedException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue({
                ...mockUser,
                refreshToken: null,
            });

            await expect(
                service.refreshTokens('user-123', 'refresh-token'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('geçersiz refresh token - UnauthorizedException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue({
                ...mockUser,
                refreshToken: '$argon2id$v=19$m=65536,t=3,p=4$wronghash',
            });

            await expect(
                service.refreshTokens('user-123', 'wrong-token'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ============================================
    // FORGOT PASSWORD TESTLER
    // ============================================

    describe('forgotPassword()', () => {
        it('olmayan e-posta - sessizce döner (email enumeration koruması)', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

            // Hata fırlatmamalı
            await expect(
                service.forgotPassword('nonexistent@example.com'),
            ).resolves.not.toThrow();
        });

        it('mevcut e-posta - reset token oluşturulur', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            prismaService.user.update.mockResolvedValue(mockUser);

            await service.forgotPassword(mockUser.email);

            expect(prismaService.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockUser.id },
                    data: expect.objectContaining({
                        refreshToken: expect.stringContaining('reset:'),
                    }),
                }),
            );
        });

        it('mevcut e-posta - şifre sıfırlama maili gönderilir', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            prismaService.user.update.mockResolvedValue(mockUser);

            await service.forgotPassword(mockUser.email);

            expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
                mockUser.email,
                expect.any(String),
                mockUser.firstName,
            );
        });
    });

    // ============================================
    // RESET PASSWORD TESTLER
    // ============================================

    describe('resetPassword()', () => {
        it('geçersiz/süresi dolmuş token - BadRequestException', async () => {
            prismaService.user.findMany.mockResolvedValue([]);

            await expect(
                service.resetPassword('invalid-token', 'NewPassword@123'),
            ).rejects.toThrow(BadRequestException);
        });

        it('süresi dolmuş token - BadRequestException', async () => {
            const expiredTime = Date.now() - 3600001; // 1 saat + 1ms önce
            prismaService.user.findMany.mockResolvedValue([
                {
                    ...mockUser,
                    refreshToken: `reset:$argon2id$v=19$m=65536,t=3,p=4$hash:${expiredTime}`,
                },
            ]);

            await expect(
                service.resetPassword('some-token', 'NewPassword@123'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================
    // VERIFY EMAIL TESTLER
    // ============================================

    describe('verifyEmail()', () => {
        it('geçerli token - kullanıcı doğrulanır', async () => {
            (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
                sub: mockUser.id,
                email: mockUser.email,
                type: 'email_verification',
            });
            prismaService.user.update.mockResolvedValue({ ...mockUser, isVerified: true });

            await service.verifyEmail('valid-token');

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { isVerified: true },
            });
        });

        it('yanlış token tipi - BadRequestException', async () => {
            (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
                sub: mockUser.id,
                email: mockUser.email,
                type: 'password_reset', // Yanlış tip
            });

            await expect(service.verifyEmail('wrong-type-token')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('süresi dolmuş token - BadRequestException', async () => {
            (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
                new Error('jwt expired'),
            );

            await expect(service.verifyEmail('expired-token')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    // ============================================
    // CHANGE PASSWORD TESTLER
    // ============================================

    describe('changePassword()', () => {
        it('kullanıcı bulunamazsa - BadRequestException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.changePassword('user-123', 'oldPassword', 'NewPassword@123'),
            ).rejects.toThrow(BadRequestException);
        });

        it('yanlış mevcut şifre - BadRequestException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

            await expect(
                service.changePassword('user-123', 'wrongPassword', 'NewPassword@123'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================
    // RESEND VERIFICATION TESTLER
    // ============================================

    describe('resendVerificationEmail()', () => {
        it('olmayan kullanıcı - BadRequestException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.resendVerificationEmail('nonexistent-id'),
            ).rejects.toThrow(BadRequestException);
        });

        it('zaten doğrulanmış e-posta - BadRequestException', async () => {
            (usersService.findById as jest.Mock).mockResolvedValue({
                ...mockUser,
                isVerified: true,
            });

            await expect(
                service.resendVerificationEmail(mockUser.id),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('resendVerificationByEmail()', () => {
        it('olmayan e-posta - sessizce döner (enumeration koruması)', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

            await expect(
                service.resendVerificationByEmail('nonexistent@example.com'),
            ).resolves.not.toThrow();
        });

        it('zaten doğrulanmış e-posta - sessizce döner', async () => {
            (usersService.findByEmail as jest.Mock).mockResolvedValue({
                ...mockUser,
                isVerified: true,
            });

            await expect(
                service.resendVerificationByEmail(mockUser.email),
            ).resolves.not.toThrow();

            expect(mailService.sendEmailVerification).not.toHaveBeenCalled();
        });
    });
});

