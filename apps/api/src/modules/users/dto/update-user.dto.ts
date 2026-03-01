import { IsString, IsOptional, MinLength, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({ example: 'Ahmet', required: false })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;

    @ApiProperty({ example: 'Yılmaz', required: false })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName?: string;

    @ApiProperty({ example: '+905551234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiProperty({ example: '1990-01-15', required: false })
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @ApiProperty({ example: '12345678901', required: false })
    @IsOptional()
    @IsString()
    tcNumber?: string;

    @ApiProperty({ example: 'Erkek', required: false })
    @IsOptional()
    @IsString()
    gender?: string;
}
