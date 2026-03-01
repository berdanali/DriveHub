import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class VehicleQueryDto extends PaginationDto {
    @ApiProperty({ enum: VehicleStatus, required: false })
    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;

    @ApiProperty({ example: 50, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiProperty({ example: 200, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiProperty({ example: 'Benzin', required: false, description: 'Yakıt tipi: Benzin, Dizel, Hybrid, Elektrik' })
    @IsOptional()
    @IsString()
    fuelType?: string;

    @ApiProperty({ example: 'Otomatik', required: false, description: 'Vites tipi: Otomatik, Manuel' })
    @IsOptional()
    @IsString()
    transmission?: string;
}
