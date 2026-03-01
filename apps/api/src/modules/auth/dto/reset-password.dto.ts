import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Şifre sıfırlama token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString({ message: 'Token bir metin olmalı' })
    @IsNotEmpty({ message: 'Token zorunludur' })
    token: string;

    @ApiProperty({
        description: 'Yeni şifre (en az 8 karakter, 1 büyük, 1 küçük, 1 rakam, 1 özel karakter)',
        example: 'NewSecure123!',
    })
    @IsString({ message: 'Şifre bir metin olmalı' })
    @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/,
        {
            message:
                'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli',
        },
    )
    password: string;
}

