import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'Kullanıcının kayıtlı e-posta adresi',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
    @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
    email: string;
}

