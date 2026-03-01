import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'ahmet.yilmaz@ornek.com' })
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
    @MaxLength(255, { message: 'E-posta adresi çok uzun' })
    email: string;

    @ApiProperty({ example: 'Guvenli@Sifre123' })
    @IsString({ message: 'Şifre metin olmalı' })
    @MinLength(1, { message: 'Şifre zorunludur' })
    @MaxLength(128, { message: 'Şifre çok uzun' })
    password: string;
}
