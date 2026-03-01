import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class ContactDto {
    @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Ad Soyad' })
    @IsNotEmpty({ message: 'Ad Soyad zorunludur' })
    @IsString({ message: 'Ad Soyad metin olmalıdır' })
    @MinLength(2, { message: 'Ad Soyad en az 2 karakter olmalıdır' })
    @MaxLength(100, { message: 'Ad Soyad en fazla 100 karakter olabilir' })
    name: string;

    @ApiProperty({ example: 'ahmet@example.com', description: 'E-posta adresi' })
    @IsNotEmpty({ message: 'E-posta zorunludur' })
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
    email: string;

    @ApiProperty({ example: '+905551234567', description: 'Telefon numarası', required: false })
    @IsOptional()
    @IsString({ message: 'Telefon metin olmalıdır' })
    phone?: string;

    @ApiProperty({ example: 'Genel Bilgi', description: 'Konu' })
    @IsNotEmpty({ message: 'Konu zorunludur' })
    @IsString({ message: 'Konu metin olmalıdır' })
    @MinLength(3, { message: 'Konu en az 3 karakter olmalıdır' })
    @MaxLength(200, { message: 'Konu en fazla 200 karakter olabilir' })
    subject: string;

    @ApiProperty({ example: 'Merhaba, araç kiralama hakkında bilgi almak istiyorum.', description: 'Mesaj' })
    @IsNotEmpty({ message: 'Mesaj zorunludur' })
    @IsString({ message: 'Mesaj metin olmalıdır' })
    @MinLength(10, { message: 'Mesaj en az 10 karakter olmalıdır' })
    @MaxLength(2000, { message: 'Mesaj en fazla 2000 karakter olabilir' })
    message: string;
}

