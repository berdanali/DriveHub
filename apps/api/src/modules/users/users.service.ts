import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersRepository, UserWithRole } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly prisma: PrismaService,
    ) {}

    async findById(id: string): Promise<UserWithRole | null> {
        return this.usersRepository.findById(id);
    }

    async findByEmail(email: string): Promise<UserWithRole | null> {
        return this.usersRepository.findByEmail(email);
    }

    async create(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        roleType?: RoleType;
    }): Promise<UserWithRole> {
        return this.usersRepository.create({
            ...data,
            roleType: data.roleType || RoleType.CUSTOMER,
        });
    }

    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.usersRepository.updateRefreshToken(id, refreshToken);
    }

    async update(id: string, dto: UpdateUserDto): Promise<UserWithRole> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const updateData: Record<string, unknown> = {};
        if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
        if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.avatar !== undefined) updateData.avatar = dto.avatar;
        if (dto.birthDate !== undefined) updateData.birthDate = new Date(dto.birthDate);
        if (dto.tcNumber !== undefined) updateData.tcNumber = dto.tcNumber;
        if (dto.gender !== undefined) updateData.gender = dto.gender;

        return this.usersRepository.update(id, updateData);
    }

    /**
     * Tam profil bilgileri (adresler, ehliyet, bildirim tercihleri dahil)
     */
    async getFullProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                addresses: { orderBy: { createdAt: 'desc' } },
                driverLicense: true,
                notificationPreference: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        // Hassas bilgileri filtrele
        const { password, refreshToken, ...safeUser } = user;
        return safeUser;
    }

    // ==========================================
    // ADRES İŞLEMLERİ
    // ==========================================

    async getAddresses(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async addAddress(userId: string, data: {
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
    }) {
        // Eğer varsayılan olarak işaretleniyorsa, diğer adresleri varsayılan olmaktan çıkar
        if (data.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        return this.prisma.address.create({
            data: { ...data, userId },
        });
    }

    async updateAddress(userId: string, addressId: string, data: Record<string, unknown>) {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new NotFoundException('Adres bulunamadı');
        }

        if (data.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, id: { not: addressId } },
                data: { isDefault: false },
            });
        }

        return this.prisma.address.update({
            where: { id: addressId },
            data,
        });
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new NotFoundException('Adres bulunamadı');
        }
        await this.prisma.address.delete({ where: { id: addressId } });
    }

    // ==========================================
    // BİLDİRİM TERCİHLERİ
    // ==========================================

    async getNotificationPreferences(userId: string) {
        let prefs = await this.prisma.notificationPreference.findUnique({
            where: { userId },
        });

        // Yoksa varsayılan oluştur
        if (!prefs) {
            prefs = await this.prisma.notificationPreference.create({
                data: { userId },
            });
        }

        return prefs;
    }

    async updateNotificationPreferences(userId: string, data: {
        emailRentalUpdates?: boolean;
        emailPriceChanges?: boolean;
        emailPromotions?: boolean;
        emailNewsletter?: boolean;
        smsRentalReminders?: boolean;
        smsSecurityAlerts?: boolean;
    }) {
        return this.prisma.notificationPreference.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
    }

    // ==========================================
    // EHLİYET BİLGİLERİ
    // ==========================================

    async getDriverLicense(userId: string) {
        return this.prisma.driverLicense.findUnique({
            where: { userId },
        });
    }

    async updateDriverLicense(userId: string, data: {
        licenseNumber?: string;
        licenseClass?: string;
        issueDate?: string;
        expiryDate?: string;
        frontImage?: string;
        backImage?: string;
    }) {
        const updateData: Record<string, unknown> = {};
        if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
        if (data.licenseClass !== undefined) updateData.licenseClass = data.licenseClass;
        if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
        if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
        if (data.frontImage !== undefined) updateData.frontImage = data.frontImage;
        if (data.backImage !== undefined) updateData.backImage = data.backImage;

        // Fotoğraf yüklendiyse durumu PENDING yap
        if (data.frontImage || data.backImage) {
            updateData.verificationStatus = 'PENDING';
        }

        return this.prisma.driverLicense.upsert({
            where: { userId },
            update: updateData,
            create: { userId, ...updateData },
        });
    }

    // ==========================================
    // DOĞRULAMA DURUMU
    // ==========================================

    async getVerificationStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { driverLicense: true },
        });

        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const emailVerified = user.isVerified;
        const phoneVerified = !!user.phone; // Basit kontrol, ileride SMS doğrulama
        const licenseVerified = user.driverLicense?.verificationStatus === 'APPROVED';

        let level = 0;
        if (emailVerified) level = 1;
        if (emailVerified && phoneVerified) level = 2;
        if (emailVerified && phoneVerified && licenseVerified) level = 3;

        return {
            level,
            emailVerified,
            phoneVerified,
            licenseStatus: user.driverLicense?.verificationStatus || 'NOT_UPLOADED',
            licenseVerified,
        };
    }

    // ==========================================
    // HESAP İŞLEMLERİ
    // ==========================================

    async deactivateAccount(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }

    async deleteAccount(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        // Şifre doğrulama
        const isValid = await argon2.verify(user.password, password);
        if (!isValid) {
            throw new BadRequestException('Şifreniz yanlış');
        }

        // Soft delete
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    // ==========================================
    // ADMİN İŞLEMLERİ
    // ==========================================

    async findAll(pagination: PaginationDto): Promise<{
        users: UserWithRole[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, search, sortBy, sortOrder } = pagination;
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null, // Soft-deleted kullanıcıları hariç tut
        };

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
            ];
        }

        const orderBy = sortBy
            ? { [sortBy]: sortOrder || 'asc' }
            : { createdAt: 'desc' as const };

        const { users, total } = await this.usersRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy,
        });

        return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async toggleUserStatus(id: string, isActive: boolean): Promise<UserWithRole> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }
        return this.usersRepository.toggleActive(id, isActive);
    }

    async delete(id: string): Promise<void> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }
        await this.usersRepository.delete(id);
    }
}
