import {
    IsEmail,
    IsString,
    IsOptional,
    IsEnum,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'ahmet.yilmaz@ornek.com' })
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
    @MaxLength(255, { message: 'E-posta adresi çok uzun' })
    email: string;

    @ApiProperty({ example: 'Guvenli@Sifre123' })
    @IsString({ message: 'Şifre metin olmalı' })
    @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
    @MaxLength(128, { message: 'Şifre en fazla 128 karakter olabilir' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/, {
        message:
            'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli',
    })
    password: string;

    @ApiProperty({ example: 'Ahmet' })
    @IsString({ message: 'Ad metin olmalı' })
    @MinLength(2, { message: 'Ad en az 2 karakter olmalı' })
    @MaxLength(50, { message: 'Ad en fazla 50 karakter olabilir' })
    @Matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, {
        message: 'Ad sadece harf içerebilir',
    })
    firstName: string;

    @ApiProperty({ example: 'Yılmaz' })
    @IsString({ message: 'Soyad metin olmalı' })
    @MinLength(2, { message: 'Soyad en az 2 karakter olmalı' })
    @MaxLength(50, { message: 'Soyad en fazla 50 karakter olabilir' })
    @Matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, {
        message: 'Soyad sadece harf içerebilir',
    })
    lastName: string;

    @ApiProperty({ example: '+905551234567', required: false })
    @IsOptional()
    @IsString({ message: 'Telefon metin olmalı' })
    @Matches(/^\+?[0-9]{10,15}$/, {
        message: 'Geçerli bir telefon numarası girin',
    })
    phone?: string;

    @ApiProperty({
        enum: [RoleType.CUSTOMER, RoleType.VEHICLE_OWNER],
        example: RoleType.CUSTOMER,
        description:
            'Kullanıcı rolü (SUPER_ADMIN sadece yöneticiler tarafından atanabilir)',
    })
    @IsOptional()
    @IsEnum([RoleType.CUSTOMER, RoleType.VEHICLE_OWNER], {
        message: 'Geçersiz rol türü',
    })
    roleType?: RoleType = RoleType.CUSTOMER;
}
