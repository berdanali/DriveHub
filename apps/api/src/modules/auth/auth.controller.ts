import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Get,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { TokensDto } from './dto/tokens.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute for registration
    @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
    @ApiResponse({
        status: 201,
        description: 'Kullanıcı başarıyla kaydedildi',
    })
    @ApiResponse({ status: 409, description: 'Bu e-posta adresi zaten kullanılıyor' })
    @ApiResponse({ status: 429, description: 'Çok fazla kayıt denemesi' })
    async register(@Body() dto: RegisterDto): Promise<{ user: { id: string; email: string; firstName: string; lastName: string; role: string }; message: string }> {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 attempts per 15 minutes
    @ApiOperation({ summary: 'Kullanıcı girişi' })
    @ApiResponse({
        status: 200,
        description: 'Giriş başarılı',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Geçersiz e-posta veya şifre' })
    @ApiResponse({ status: 429, description: 'Çok fazla giriş denemesi' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 refresh per minute
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Token yenileme' })
    @ApiResponse({
        status: 200,
        description: 'Token başarıyla yenilendi',
        type: TokensDto,
    })
    @ApiResponse({ status: 401, description: 'Geçersiz refresh token' })
    async refreshTokens(
        @CurrentUser() user: JwtPayload & { refreshToken: string },
    ): Promise<TokensDto> {
        return this.authService.refreshTokens(user.sub, user.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @SkipThrottle()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Çıkış yap' })
    @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
    async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
        await this.authService.logout(user.sub);
        return { message: 'Çıkış başarılı' };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @SkipThrottle()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Mevcut kullanıcı bilgileri' })
    @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri' })
    async getProfile(@CurrentUser() user: JwtPayload) {
        return user;
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
    @ApiOperation({ summary: 'Şifre sıfırlama e-postası gönder' })
    @ApiResponse({ status: 200, description: 'E-posta gönderildi (varsa)' })
    @ApiResponse({ status: 429, description: 'Çok fazla istek' })
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
        await this.authService.forgotPassword(dto.email);
        // Always return success to prevent email enumeration
        return { message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.' };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
    @ApiOperation({ summary: 'Şifre sıfırlama' })
    @ApiResponse({ status: 200, description: 'Şifre başarıyla değiştirildi' })
    @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token' })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        await this.authService.resetPassword(dto.token, dto.password);
        return { message: 'Şifreniz başarıyla değiştirildi.' };
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 requests per minute
    @ApiOperation({ summary: 'E-posta doğrulama' })
    @ApiResponse({ status: 200, description: 'E-posta başarıyla doğrulandı' })
    @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token' })
    async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
        await this.authService.verifyEmail(dto.token);
        return { message: 'E-posta adresiniz başarıyla doğrulandı.' };
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 300000, limit: 2 } }) // 2 requests per 5 minutes
    @ApiOperation({ summary: 'Doğrulama e-postasını tekrar gönder' })
    @ApiResponse({ status: 200, description: 'E-posta gönderildi' })
    async resendVerification(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
        await this.authService.resendVerificationByEmail(dto.email);
        return { message: 'Doğrulama e-postası gönderildi.' };
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 300000, limit: 3 } }) // 3 requests per 5 minutes
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Şifre değiştir (giriş yapmışken)' })
    @ApiResponse({ status: 200, description: 'Şifre başarıyla değiştirildi' })
    @ApiResponse({ status: 400, description: 'Mevcut şifre yanlış' })
    async changePassword(
        @CurrentUser() user: JwtPayload,
        @Body() dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
        return { message: 'Şifreniz başarıyla değiştirildi.' };
    }
}
