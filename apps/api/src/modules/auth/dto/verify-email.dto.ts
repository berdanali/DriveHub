import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({
        description: 'E-posta doğrulama token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString({ message: 'Token bir metin olmalı' })
    @IsNotEmpty({ message: 'Token zorunludur' })
    token: string;
}

