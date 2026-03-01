import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Tüm kullanıcılar (Sadece Admin)' })
    @ApiResponse({ status: 200, description: 'Kullanıcı listesi' })
    async findAll(@Query() pagination: PaginationDto) {
        return this.usersService.findAll(pagination);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Profil bilgileri' })
    @ApiResponse({ status: 200, description: 'Kullanıcı profil bilgileri' })
    async getProfile(@CurrentUser() user: JwtPayload) {
        return this.usersService.getFullProfile(user.sub);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Profil güncelle' })
    @ApiResponse({ status: 200, description: 'Profil güncellendi' })
    async updateProfile(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(user.sub, dto);
    }

    // ==========================================
    // ADRES İŞLEMLERİ
    // ==========================================

    @Get('addresses')
    @ApiOperation({ summary: 'Adres listesi' })
    async getAddresses(@CurrentUser() user: JwtPayload) {
        return this.usersService.getAddresses(user.sub);
    }

    @Post('addresses')
    @ApiOperation({ summary: 'Adres ekle' })
    async addAddress(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            title?: string;
            city: string;
            district: string;
            neighborhood?: string;
            street?: string;
            buildingNo?: string;
            apartmentNo?: string;
            postalCode?: string;
            isDefault?: boolean;
            type?: 'BILLING' | 'DELIVERY';
        },
    ) {
        return this.usersService.addAddress(user.sub, dto);
    }

    @Put('addresses/:id')
    @ApiOperation({ summary: 'Adres güncelle' })
    async updateAddress(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: {
            title?: string;
            city?: string;
            district?: string;
            neighborhood?: string;
            street?: string;
            buildingNo?: string;
            apartmentNo?: string;
            postalCode?: string;
            isDefault?: boolean;
            type?: 'BILLING' | 'DELIVERY';
        },
    ) {
        return this.usersService.updateAddress(user.sub, id, dto);
    }

    @Delete('addresses/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Adres sil' })
    async deleteAddress(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
    ) {
        await this.usersService.deleteAddress(user.sub, id);
        return { message: 'Adres silindi' };
    }

    // ==========================================
    // BİLDİRİM TERCİHLERİ
    // ==========================================

    @Get('notifications/preferences')
    @ApiOperation({ summary: 'Bildirim tercihleri' })
    async getNotificationPreferences(@CurrentUser() user: JwtPayload) {
        return this.usersService.getNotificationPreferences(user.sub);
    }

    @Put('notifications/preferences')
    @ApiOperation({ summary: 'Bildirim tercihlerini güncelle' })
    async updateNotificationPreferences(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            emailRentalUpdates?: boolean;
            emailPriceChanges?: boolean;
            emailPromotions?: boolean;
            emailNewsletter?: boolean;
            smsRentalReminders?: boolean;
            smsSecurityAlerts?: boolean;
        },
    ) {
        return this.usersService.updateNotificationPreferences(user.sub, dto);
    }

    // ==========================================
    // EHLİYET BİLGİLERİ
    // ==========================================

    @Get('driver-license')
    @ApiOperation({ summary: 'Ehliyet bilgileri' })
    async getDriverLicense(@CurrentUser() user: JwtPayload) {
        return this.usersService.getDriverLicense(user.sub);
    }

    @Put('driver-license')
    @ApiOperation({ summary: 'Ehliyet bilgilerini güncelle' })
    async updateDriverLicense(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            licenseNumber?: string;
            licenseClass?: string;
            issueDate?: string;
            expiryDate?: string;
            frontImage?: string;
            backImage?: string;
        },
    ) {
        return this.usersService.updateDriverLicense(user.sub, dto);
    }

    // ==========================================
    // DOĞRULAMA DURUMU
    // ==========================================

    @Get('verification-status')
    @ApiOperation({ summary: 'Doğrulama durumu' })
    async getVerificationStatus(@CurrentUser() user: JwtPayload) {
        return this.usersService.getVerificationStatus(user.sub);
    }

    // ==========================================
    // HESAP İŞLEMLERİ
    // ==========================================

    @Post('deactivate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Hesabı devre dışı bırak' })
    async deactivateAccount(@CurrentUser() user: JwtPayload) {
        await this.usersService.deactivateAccount(user.sub);
        return { message: 'Hesabınız devre dışı bırakıldı' };
    }

    @Delete('account')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Hesabı sil (soft delete)' })
    async deleteAccount(
        @CurrentUser() user: JwtPayload,
        @Body() dto: { password: string },
    ) {
        await this.usersService.deleteAccount(user.sub, dto.password);
        return { message: 'Hesabınız silindi. 30 gün içinde geri alabilirsiniz.' };
    }

    // ==========================================
    // ADMİN İŞLEMLERİ
    // ==========================================

    @Get(':id')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Kullanıcı detay (Sadece Admin)' })
    @ApiResponse({ status: 200, description: 'Kullanıcı detayı' })
    @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/status')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Kullanıcı ban/unban (Sadece Admin)' })
    @ApiResponse({ status: 200, description: 'Kullanıcı durumu güncellendi' })
    async toggleStatus(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.usersService.toggleUserStatus(id, isActive);
    }

    @Delete(':id')
    @Roles(RoleType.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Kullanıcı sil (Sadece Admin)' })
    @ApiResponse({ status: 204, description: 'Kullanıcı silindi' })
    async delete(@Param('id') id: string) {
        await this.usersService.delete(id);
    }
}
