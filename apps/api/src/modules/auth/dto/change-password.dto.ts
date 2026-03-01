import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Mevcut şifre',
        example: 'CurrentPass123!',
    })
    @IsString({ message: 'Mevcut şifre metin olmalı' })
    @IsNotEmpty({ message: 'Mevcut şifre zorunludur' })
    currentPassword: string;

    @ApiProperty({
        description: 'Yeni şifre (en az 8 karakter, 1 büyük, 1 küçük, 1 rakam, 1 özel karakter)',
        example: 'NewSecure123!',
    })
    @IsString({ message: 'Yeni şifre metin olmalı' })
    @MinLength(8, { message: 'Yeni şifre en az 8 karakter olmalı' })
    @MaxLength(128, { message: 'Yeni şifre en fazla 128 karakter olabilir' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/,
        {
            message:
                'Yeni şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli',
        },
    )
    newPassword: string;
}
